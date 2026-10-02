export function getSanityImageUrl(source, { width, height } = {}) {
  if (typeof source === 'string') return source
  const value = source?.url || source?.src || source?.asset?.url || ''
  if (!value) return ''

  try {
    const url = new URL(value, window.location.origin)
    if (width) url.searchParams.set('w', String(width))
    if (height) url.searchParams.set('h', String(height))
    return url.toString()
  } catch {
    return value
  }
}

export function getBlogPosts() {
  return fetch('/api/blogs')
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to fetch blog posts.')))
    .then((data) => data.blogs || [])
}

export function getBlogPostBySlug(slug) {
  if (!slug) return Promise.resolve(null)
  return fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`)
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to fetch blog post.')))
    .then((data) => data.blog || null)
}

export function getRelatedBlogPosts() {
  return Promise.resolve([])
}

export const isSanityConfigured = false
