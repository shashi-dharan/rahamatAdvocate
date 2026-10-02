export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

export function getQueryValue(request, key) {
  const value = request.query?.[key]
  if (value === undefined) return undefined
  if (Array.isArray(value) || typeof value !== 'string') {
    throw new HttpError(400, `Invalid ${key}.`)
  }
  return value
}

export function validateSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) {
    throw new HttpError(400, 'Invalid blog slug.')
  }
  return slug
}

export function validateBlogId(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    throw new HttpError(400, 'Invalid blog id.')
  }
  return id
}

export function validateBlogPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'A blog object is required.')
  }
  if (typeof payload.title !== 'string' || !payload.title.trim()) {
    throw new HttpError(400, 'Blog title is required.')
  }
  for (const field of ['slug', 'excerpt', 'content', 'category']) {
    if (payload[field] !== undefined && typeof payload[field] !== 'string') {
      throw new HttpError(400, `Invalid ${field}.`)
    }
  }
  if (payload.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
    throw new HttpError(400, 'Invalid blog slug.')
  }
  if (payload.status !== undefined && !['draft', 'published'].includes(payload.status)) {
    throw new HttpError(400, 'Invalid blog status.')
  }
  if (payload.publishedAt !== undefined && typeof payload.publishedAt !== 'string') {
    throw new HttpError(400, 'Invalid publication date.')
  }
  const image = payload.featuredImage
  if (image !== null && image !== undefined && typeof image !== 'string'
    && (!image || typeof image !== 'object' || typeof image.url !== 'string')) {
    throw new HttpError(400, 'Invalid featured image.')
  }
  if (typeof image === 'string' && image && !/^https?:\/\//i.test(image) && !image.startsWith('data:image/')) {
    throw new HttpError(400, 'Invalid featured image URL.')
  }
  if (image && typeof image === 'object' && !/^https?:\/\//i.test(image.url) && !image.url.startsWith('data:image/')) {
    throw new HttpError(400, 'Invalid featured image URL.')
  }
  return payload
}

export function sendApiError(response, error, fallbackMessage) {
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ error: error.message })
  }
  console.error('[API]', error)
  return response.status(500).json({ error: fallbackMessage || 'Unable to process request.' })
}