import { readRequestBody, getSessionUser, isValidOrigin } from '../lib/session-store.js'
import { uploadImageToCloudinary } from '../lib/cloudinary.js'

export default async function handler(request, response) {
  const origin = request.headers?.origin || request.headers?.referer || ''
  if (origin && !isValidOrigin(origin)) {
    return response.status(403).json({ error: 'Invalid request origin.' })
  }

  const session = getSessionUser(request)
  if (!session) {
    return response.status(401).json({ error: 'Authentication required.' })
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const payload = await readRequestBody(request)
    const imageData = typeof payload.imageData === 'string' ? payload.imageData : ''
    const fileName = typeof payload.filename === 'string' ? payload.filename : 'blog-image'

    if (!imageData.startsWith('data:image/')) {
      return response.status(400).json({ error: 'A valid image file is required.' })
    }

    const upload = await uploadImageToCloudinary(imageData, fileName)
    return response.status(200).json({ image: upload })
  } catch (error) {
    console.error('[Blog Admin API] Failed to upload image:', error)
    return response.status(500).json({ error: 'Unable to upload image.' })
  }
}
