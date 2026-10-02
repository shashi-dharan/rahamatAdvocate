import { getBlogBySlug } from '../server/blog-store.js'
import { getQueryValue, HttpError, validateSlug } from '../server/http.js'

const baseUrl = 'https://www.rahmatadvocate.com'

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function upsertTag(html, selector, tag) {
  const expression = new RegExp(`<${selector}[^>]*>`, 'i')
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `${tag}</head>`)
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).send('Method not allowed.')
  }

  let slug
  try {
    slug = validateSlug(getQueryValue(request, 'slug') || '')
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 400
    return response.status(statusCode).send(error.message || 'Invalid blog slug.')
  }

  try {
    const shellResponse = await fetch(baseUrl)
    if (!shellResponse.ok) throw new Error('Website shell unavailable')

    let html = await shellResponse.text()
    const post = await getBlogBySlug(slug)
    if (!post) {
      response.setHeader('Content-Type', 'text/plain; charset=utf-8')
      return response.status(404).send('Blog post not found.')
    }

    {
      const title = post.title
      const description = post.excerpt
      const image = post.featuredImage?.url || ''
      const canonical = `${baseUrl}/our-blog/${encodeURIComponent(post.slug)}`
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
      html = upsertTag(html, 'meta[^>]*name="description"', `<meta name="description" content="${escapeHtml(description)}">`)
      const tags = [
        ['property', 'og:title', title],
        ['property', 'og:description', description],
        ['property', 'og:type', 'article'],
        ['property', 'og:url', canonical],
        ['name', 'twitter:card', image ? 'summary_large_image' : 'summary'],
        ['name', 'twitter:title', title],
        ['name', 'twitter:description', description],
      ]

      if (image) tags.push(['property', 'og:image', image], ['name', 'twitter:image', image])

      for (const [attribute, name, content] of tags) {
        const selector = `meta[^>]*${attribute}="${name}"`
        html = upsertTag(html, selector, `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}">`)
      }

      const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}">`
      html = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html)
        ? html.replace(/<link[^>]*rel=["']canonical["'][^>]*>/i, canonicalTag)
        : html.replace('</head>', `${canonicalTag}</head>`)

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: image ? [image] : undefined,
        datePublished: post.publishedAt || undefined,
        dateModified: post.updatedAt || post.publishedAt || undefined,
        publisher: { '@type': 'Organization', name: 'Rahmat Advocate' },
        mainEntityOfPage: canonical,
      }
      const jsonLd = `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`
      html = html.replace('</head>', `${jsonLd}</head>`)
    }

    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    response.status(200).send(html)
  } catch (error) {
    console.error('[Blog Page] Unable to render crawler page:', error)
    response.status(500).send('Unable to load blog page.')
  }
}