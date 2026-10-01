const siteUrl = 'https://www.rahmatadvocate.com'
const routes = ['/', '/services', '/contact-us', '/about-us', '/our-blog', '/gallery']
const query = '*[_type == "blogPost" && !(_id in path("drafts.**")) && defined(slug.current)] | order(publishedAt desc) { "slug": slug.current, publishedAt }'

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
  const projectId = process.env.VITE_SANITY_PROJECT_ID
  const dataset = process.env.VITE_SANITY_DATASET

  if (projectId && /^[a-z0-9]+$/.test(projectId) && dataset && /^[a-z0-9_-]+$/.test(dataset)) {
    try {
      const endpoint = `https://${projectId}.apicdn.sanity.io/v2025-02-19/data/query/${encodeURIComponent(dataset)}?query=${encodeURIComponent(query)}`
      const result = await fetch(endpoint, { headers: { Accept: 'application/json' } })
      if (result.ok) {
        const data = await result.json()
        for (const post of data.result || []) {
          if (!post.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(post.slug)) continue
          const lastModified = post.publishedAt && !Number.isNaN(Date.parse(post.publishedAt))
            ? new Date(post.publishedAt).toISOString()
            : undefined
          urls.push(makeUrl(`${siteUrl}/our-blog/${encodeURIComponent(post.slug)}`, lastModified))
        }
      }
    } catch {
      // Keep core website URLs available when Sanity is temporarily unreachable.
    }
  }

  response.setHeader('Content-Type', 'application/xml; charset=utf-8')
  response.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
  response.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`)
}