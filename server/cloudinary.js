import process from 'node:process'
import { v2 as cloudinary } from 'cloudinary'

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
)

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export async function uploadImageToCloudinary(dataUrl, fileName = 'blog-image') {
  if (!isConfigured) {
    return { url: dataUrl, publicId: `local-dev-${Date.now()}`, alt: fileName }
  }

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: 'rahmat-advocate/blog',
    public_id: `${Date.now()}-${fileName}`.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase(),
  })

  return { url: result.secure_url, publicId: result.public_id, alt: fileName }
}

export async function deleteCloudinaryAsset(publicId) {
  if (!publicId || !isConfigured) return false
  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch {
    return false
  }
}