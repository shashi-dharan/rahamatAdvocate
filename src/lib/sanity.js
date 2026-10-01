import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID?.trim()
const dataset = import.meta.env.VITE_SANITY_DATASET?.trim()
const isConfigured = Boolean(projectId && dataset)
const client = isConfigured
  ? createClient({ projectId, dataset, apiVersion: '2025-02-19', useCdn: true, perspective: 'published' })
  : null
const imageBuilder = client ? createImageUrlBuilder(client) : null
const queryCache = new Map()

const postFields = `
  _id,
  _createdAt,
  _updatedAt,
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  featuredImage { ..., asset->{_id, url, metadata{dimensions, lqip}} },
  body[]{..., _type == "image" => { ..., asset->{_id, url, metadata{dimensions, lqip}} }},
  seo { metaTitle, metaDescription, ogImage { ..., asset->{_id, url, metadata{dimensions, lqip}} } }
`

const blogPostsQuery = `*[
  _type == "blogPost" &&
  !(_id in path("drafts.**")) &&
  defined(slug.current)
] | order(publishedAt desc, _createdAt desc) [0...100] { ${postFields} }`

const blogPostBySlugQuery = `*[
  _type == "blogPost" &&
  !(_id in path("drafts.**")) &&
  slug.current == $slug
][0] { ${postFields} }`

const relatedBlogPostsQuery = `*[
  _type == "blogPost" &&
  !(_id in path("drafts.**")) &&
  category == $category &&
  slug.current != $currentSlug
] | order(publishedAt desc) [0...3] { ${postFields} }`

function fetchCached(key, query, params = {}) {
  if (!client) {
    return Promise.reject(new Error('Sanity is not configured.'))
  }

  const cached = queryCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise
  }

  const promise = client.fetch(query, params).catch((error) => {
    queryCache.delete(key)
    throw error
  })
  queryCache.set(key, { expiresAt: Date.now() + 60_000, promise })
  return promise
}

export function getBlogPosts() {
  return fetchCached('blog-posts', blogPostsQuery)
}

export function getBlogPostBySlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
    return Promise.resolve(null)
  }

  return fetchCached(`blog-post:${slug}`, blogPostBySlugQuery, { slug })
}

export function getRelatedBlogPosts(category, currentSlug) {
  if (!category || !currentSlug) {
    return Promise.resolve([])
  }

  return fetchCached(`related:${category}:${currentSlug}`, relatedBlogPostsQuery, {
    category,
    currentSlug,
  })
}

export function getSanityImageUrl(source, { width, height } = {}) {
  if (!imageBuilder || !source?.asset) {
    return ''
  }

  try {
    let builder = imageBuilder.image(source).auto('format').fit('max')
    if (width) builder = builder.width(width)
    if (height) builder = builder.height(height)
    return builder.url()
  } catch (error) {
    console.error('[Sanity Blog] Failed to build image URL:', error)
    return ''
  }
}

export { isConfigured as isSanityConfigured }