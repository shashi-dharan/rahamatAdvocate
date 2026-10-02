import { getBlogBySlug, getPublishedBlogs } from '../server/blog-store.js'
import { getQueryValue, HttpError, sendApiError, validateSlug } from '../server/http.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' })

  try {
    const slug = getQueryValue(request, 'slug')
    if (slug !== undefined) {
      const blog = await getBlogBySlug(validateSlug(slug))
      if (!blog) throw new HttpError(404, 'Blog post not found.')
      return response.status(200).json({ blog })
    }

    const blogs = await getPublishedBlogs()
    return response.status(200).json({ blogs })
  } catch (error) {
    return sendApiError(response, error, 'Unable to load blog posts right now.')
  }
}
