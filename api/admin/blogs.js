import { readRequestBody, getSessionUser, isValidOrigin } from '../lib/session-store.js'
import { createBlog, listBlogs } from '../lib/blog-store.js'

export default async function handler(request, response) {
  const origin = request.headers?.origin || request.headers?.referer || ''
  if (origin && !isValidOrigin(origin)) {
    return response.status(403).json({ error: 'Invalid request origin.' })
  }

  const session = getSessionUser(request)
  if (!session) {
    return response.status(401).json({ error: 'Authentication required.' })
  }

  if (request.method === 'GET') {
    const blogs = await listBlogs()
    return response.status(200).json({ blogs })
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const payload = await readRequestBody(request)
    const blog = await createBlog(payload)
    return response.status(201).json({ blog, success: true })
  } catch (error) {
    console.error('[Blog Admin API] Failed to create blog:', error)
    return response.status(500).json({ error: 'Unable to save blog.' })
  }
}
