import { getPublishedBlogs } from './lib/blog-store.js'

const siteUrl = 'https://www.rahmatadvocate.com'
const routes = ['/', '/services', '/contact-us', '/about-us', '/our-blog', '/gallery']

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character])
}

function makeUrl(location, lastModified) {
  const lastmod = lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ''
  return `<url><loc>${escapeXml(location)}</loc>${lastmod}</url>`
}

export default async function handler(request, response) {
  const urls = routes.map((route) => makeUrl(`${siteUrl}${route}`))

  try {
    const blogs = await getPublishedBlogs()
    for (const post of blogs) {
      if (!post.slug) continue
      const lastModified = post.publishedAt || post.updatedAt || post.createdAt
      urls.push(makeUrl(`${siteUrl}/our-blog/${encodeURIComponent(post.slug)}`, lastModified))
    }
  } catch {
    // Fall back to the website root routes when the database is not configured.
  }

  response.setHeader('Content-Type', 'application/xml; charset=utf-8')
  response.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
  response.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`)
}