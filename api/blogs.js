import { getPublishedBlogs } from './lib/blog-store.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const blogs = await getPublishedBlogs()
    return response.status(200).json({ blogs })
  } catch (error) {
    console.error('[Blog API] Unable to fetch published posts:', error)
    return response.status(500).json({ error: 'Unable to load blog posts right now.' })
  }
}
