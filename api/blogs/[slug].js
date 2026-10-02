import { getBlogBySlug } from '../lib/blog-store.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  const slug = typeof request.query?.slug === 'string' ? request.query.slug : ''
  if (!slug) {
    return response.status(404).json({ error: 'Blog post not found.' })
  }

  try {
    const blog = await getBlogBySlug(slug)
    if (!blog) {
      return response.status(404).json({ error: 'Blog post not found.' })
    }

    return response.status(200).json({ blog })
  } catch (error) {
    console.error('[Blog API] Unable to fetch post by slug:', error)
    return response.status(500).json({ error: 'Unable to load blog post.' })
  }
}
