import { getDatabase } from './mongodb.js'

const memoryStore = new Map()

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeFeaturedImage(image, title) {
  if (typeof image === 'string') {
    return image ? { url: image, alt: title || 'Blog image' } : null
  }

  return image && typeof image === 'object' && typeof image.url === 'string' ? image : null
}

export function normalizeBlogInput(input = {}) {
  const title = String(input.title || '').trim()
  const slug = slugify(input.slug || title) || 'untitled-post'
  const excerpt = String(input.excerpt || '').trim()
  const content = String(input.content || '').trim()
  const status = input.status === 'published' ? 'published' : 'draft'
  const category = String(input.category || 'General').trim()
  const featuredImage = normalizeFeaturedImage(input.featuredImage, title)

  return {
    title,
    slug,
    excerpt,
    content,
    category,
    status,
    featuredImage,
  }
}

export function formatBlogRecord(record = {}) {
  return {
    _id: record._id ? String(record._id) : undefined,
    title: record.title || '',
    slug: record.slug || '',
    excerpt: record.excerpt || '',
    content: record.content || '',
    category: record.category || 'General',
    featuredImage: normalizeFeaturedImage(record.featuredImage, record.title),
    status: record.status || 'draft',
    publishedAt: record.publishedAt ? new Date(record.publishedAt).toISOString() : null,
    createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : new Date().toISOString(),
    author: record.author || 'Rahmat Advocates',
  }
}

function normalizePublicationDate(value, fallback) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

async function ensureMemorySeed() {
  if (memoryStore.size > 0) {
    return
  }

  const fallbackPost = {
    _id: 'local-demo-post',
    title: 'First legal consultation',
    slug: 'first-legal-consultation',
    excerpt: 'A practical guide to the first legal consultation and what to bring to your meeting.',
    content: '<h2>What to expect</h2><p>Prepare your facts, documents and questions before the first meeting.</p>',
    category: 'Legal Guidance',
    featuredImage: null,
    status: 'published',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: 'Rahmat Advocates',
  }

  memoryStore.set(fallbackPost.slug, fallbackPost)
}

export async function listBlogs() {
  const db = await getDatabase()

  if (!db) {
    await ensureMemorySeed()
    return [...memoryStore.values()].sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt)).map(formatBlogRecord)
  }

  const collection = db.collection('blogs')
  const docs = await collection.find({}).sort({ publishedAt: -1, createdAt: -1 }).toArray()
  return docs.map(formatBlogRecord)
}

export async function getPublishedBlogs() {
  const db = await getDatabase()

  if (!db) {
    await ensureMemorySeed()
    return [...memoryStore.values()]
      .filter((item) => item.status === 'published')
      .sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt))
      .map(formatBlogRecord)
  }

  const collection = db.collection('blogs')
  const docs = await collection.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 }).toArray()
  return docs.map(formatBlogRecord)
}

export async function getBlogBySlug(slug) {
  const db = await getDatabase()

  if (!db) {
    await ensureMemorySeed()
    const match = [...memoryStore.values()].find((item) => item.slug === slug && item.status === 'published')
    return match ? formatBlogRecord(match) : null
  }

  const collection = db.collection('blogs')
  const match = await collection.findOne({ slug, status: 'published' })
  return match ? formatBlogRecord(match) : null
}

export async function getBlogById(id) {
  const db = await getDatabase()

  if (!db) {
    await ensureMemorySeed()
    const match = [...memoryStore.values()].find((item) => String(item._id) === String(id))
    return match ? formatBlogRecord(match) : null
  }

  const collection = db.collection('blogs')
  const match = await collection.findOne({ _id: id })
  return match ? formatBlogRecord(match) : null
}

export async function createBlog(input) {
  const normalized = normalizeBlogInput(input)
  const now = new Date().toISOString()
  const blogRecord = {
    _id: input._id || `blog-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    ...normalized,
    createdAt: now,
    updatedAt: now,
    publishedAt: normalized.status === 'published' ? normalizePublicationDate(input.publishedAt, now) : null,
    author: 'Rahmat Advocates',
  }

  const db = await getDatabase()
  if (!db) {
    memoryStore.set(blogRecord.slug, blogRecord)
    return formatBlogRecord(blogRecord)
  }

  const collection = db.collection('blogs')
  const existing = await collection.findOne({ slug: blogRecord.slug })
  if (existing) {
    blogRecord.slug = `${blogRecord.slug}-${Date.now()}`
  }

  await collection.insertOne(blogRecord)
  return formatBlogRecord(blogRecord)
}

export async function updateBlog(id, input) {
  const existing = await getBlogById(id)
  if (!existing) {
    return null
  }

  const normalized = normalizeBlogInput({ ...existing, ...input })
  const now = new Date().toISOString()
  const updated = {
    ...existing,
    ...normalized,
    updatedAt: now,
    publishedAt: normalized.status === 'published' ? normalizePublicationDate(input.publishedAt, existing.publishedAt || now) : null,
  }

  const db = await getDatabase()
  if (!db) {
    memoryStore.set(String(existing._id), updated)
    return formatBlogRecord(updated)
  }

  const collection = db.collection('blogs')
  await collection.updateOne({ _id: id }, { $set: updated })
  return formatBlogRecord(updated)
}

export async function deleteBlog(id) {
  const db = await getDatabase()

  if (!db) {
    const found = [...memoryStore.keys()].find((key) => String(memoryStore.get(key)._id) === String(id))
    if (found) {
      memoryStore.delete(found)
      return true
    }
    return false
  }

  const collection = db.collection('blogs')
  const result = await collection.deleteOne({ _id: id })
  return result.deletedCount > 0
}
