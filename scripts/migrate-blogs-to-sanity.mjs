import { createReadStream, readdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { createClient } from '@sanity/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDirectory = path.join(root, 'src', 'content', 'blog')
const publicDirectory = path.join(root, 'public')
const projectId = process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
  throw new Error('Set VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, and SANITY_API_TOKEN in this terminal before migration.')
}

const client = createClient({ projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false })

function textBlock(text, style = 'normal') {
  return {
    _type: 'block',
    _key: randomUUID(),
    style,
    children: [{ _type: 'span', _key: randomUUID(), text, marks: [] }],
    markDefs: [],
  }
}

function markdownToPortableText(markdown) {
  const blocks = []
  const lines = markdown.split(/\r?\n/)
  let paragraph = []

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(textBlock(paragraph.join(' ')))
    paragraph = []
  }

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      blocks.push(textBlock(heading[2], heading[1].length === 3 ? 'h3' : 'h2'))
      continue
    }

    const listItem = line.match(/^\s*([-*]|\d+\.)\s+(.+)$/)
    if (listItem) {
      flushParagraph()
      blocks.push({
        ...textBlock(listItem[2]),
        listItem: /^\d/.test(listItem[1]) ? 'number' : 'bullet',
        level: 1,
      })
      continue
    }

    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      blocks.push(textBlock(quote[1], 'blockquote'))
      continue
    }

    paragraph.push(line.trim())
  }

  flushParagraph()
  return blocks
}

async function migratePost(fileName) {
  const source = await import('node:fs/promises').then(({ readFile }) => readFile(path.join(contentDirectory, fileName), 'utf8'))
  const { data, content } = matter(source)
  const slug = data.slug || fileName.replace(/\.md$/i, '')
  const documentId = `blogPost-${slug}`
  const imagePath = path.resolve(publicDirectory, String(data.featuredImage || '').replace(/^[/\\]+/, ''))
  if (!imagePath.startsWith(`${publicDirectory}${path.sep}`)) {
    throw new Error(`Unsafe or missing featured image path for ${slug}.`)
  }

  const targetDocumentId = data.draft === true ? `drafts.${documentId}` : documentId
  const existing = await client.getDocument(targetDocumentId)
  let imageAssetId = existing?.featuredImage?.asset?._ref
  if (!imageAssetId) {
    const asset = await client.assets.upload('image', createReadStream(imagePath), {
      filename: path.basename(imagePath),
    })
    imageAssetId = asset._id
  }

  const publishedAt = data.publishedAt ? new Date(`${data.publishedAt}T00:00:00.000Z`).toISOString() : undefined
  const post = {
    _id: targetDocumentId,
    _type: 'blogPost',
    title: data.title,
    slug: { _type: 'slug', current: slug },
    excerpt: data.excerpt,
    featuredImage: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } },
    category: data.category,
    ...(publishedAt ? { publishedAt } : {}),
    body: markdownToPortableText(content),
    seo: {
      ...(data.seoTitle ? { metaTitle: data.seoTitle } : {}),
      ...(data.seoDescription ? { metaDescription: data.seoDescription } : {}),
    },
  }

  await client.createOrReplace(post)
  console.log(`Migrated ${slug}${data.draft === true ? ' as a draft' : ' as published'}.`)
}

for (const fileName of readdirSync(contentDirectory).filter((name) => name.endsWith('.md')).sort()) {
  await migratePost(fileName)
}

console.log('Migration complete. Source Markdown files and local images were not changed.')