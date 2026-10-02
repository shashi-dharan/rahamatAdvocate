import { readRequestBody, getSessionUser, isValidOrigin } from '../../lib/session-store.js'
import { getBlogById, updateBlog, deleteBlog } from '../../lib/blog-store.js'

export default async function handler(request, response) {
  const origin = request.headers?.origin || request.headers?.referer || ''
  if (origin && !isValidOrigin(origin)) {
    return response.status(403).json({ error: 'Invalid request origin.' })
  }

  const session = getSessionUser(request)
  if (!session) {
    return response.status(401).json({ error: 'Authentication required.' })
  }

  const blogId = request.query?.id || ''
  if (!blogId) {
    return response.status(400).json({ error: 'Blog id is required.' })
  }

  if (request.method === 'GET') {
    const blog = await getBlogById(blogId)
    if (!blog) {
      return response.status(404).json({ error: 'Blog not found.' })
    }
    return response.status(200).json({ blog })
  }

  if (request.method === 'PUT') {
    try {
      const payload = await readRequestBody(request)
      const blog = await updateBlog(blogId, payload)
      if (!blog) {
        return response.status(404).json({ error: 'Blog not found.' })
      }
      return response.status(200).json({ blog, success: true })
    } catch (error) {
      console.error('[Blog Admin API] Failed to update blog:', error)
      return response.status(500).json({ error: 'Unable to update blog.' })
    }
  }

  if (request.method === 'DELETE') {
    const removed = await deleteBlog(blogId)
    if (!removed) {
      return response.status(404).json({ error: 'Blog not found.' })
    }
    return response.status(200).json({ success: true })
  }

  return response.status(405).json({ error: 'Method not allowed.' })
}
