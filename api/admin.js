import { uploadImageToCloudinary } from '../server/cloudinary.js'
import { createBlog, deleteBlog, getBlogById, listBlogs, updateBlog } from '../server/blog-store.js'
import { getSessionUser, isValidOrigin, readRequestBody } from '../server/session-store.js'
import {
  getQueryValue,
  HttpError,
  sendApiError,
  validateBlogId,
  validateBlogPayload,
} from '../server/http.js'

export default async function handler(request, response) {
  try {
    const origin = request.headers?.origin || request.headers?.referer || ''
    if (origin && !isValidOrigin(origin)) throw new HttpError(403, 'Invalid request origin.')
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
      throw new HttpError(405, 'Method not allowed.')
    }

    const session = await getSessionUser(request)
    if (!session) throw new HttpError(401, 'Authentication required.')

    const resource = getQueryValue(request, 'resource')
    if (resource === 'upload') {
      if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed.')
      const payload = await readRequestBody(request)
      if (typeof payload.imageData !== 'string' || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(payload.imageData)) {
        throw new HttpError(400, 'A valid image file is required.')
      }
      const fileName = typeof payload.filename === 'string' && payload.filename.trim()
        ? payload.filename.trim().slice(0, 180)
        : 'blog-image'
      const image = await uploadImageToCloudinary(payload.imageData, fileName)
      return response.status(200).json({ image })
    }

    if (resource !== 'blogs') throw new HttpError(404, 'Admin resource not found.')
    const idParam = getQueryValue(request, 'id')
    const id = idParam === undefined ? '' : validateBlogId(idParam)

    if (request.method === 'GET') {
      if (!id) return response.status(200).json({ blogs: await listBlogs() })
      const blog = await getBlogById(id)
      if (!blog) throw new HttpError(404, 'Blog not found.')
      return response.status(200).json({ blog })
    }

    if (request.method === 'POST') {
      if (id) throw new HttpError(400, 'A blog id is not allowed when creating a blog.')
      const payload = validateBlogPayload(await readRequestBody(request))
      const blog = await createBlog(payload)
      return response.status(201).json({ blog, success: true })
    }

    if (!id) throw new HttpError(400, 'Blog id is required.')
    if (request.method === 'PUT') {
      const payload = validateBlogPayload(await readRequestBody(request))
      const blog = await updateBlog(id, payload)
      if (!blog) throw new HttpError(404, 'Blog not found.')
      return response.status(200).json({ blog, success: true })
    }

    const removed = await deleteBlog(id)
    if (!removed) throw new HttpError(404, 'Blog not found.')
    return response.status(200).json({ success: true })
  } catch (error) {
    return sendApiError(response, error, 'Unable to process admin request.')
  }
}