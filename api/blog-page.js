const baseUrl = 'https://www.rahmatadvocate.com'
const query = '*[_type == "blogPost" && !(_id in path("drafts.**")) && slug.current == $slug][0]{title, excerpt, publishedAt, _createdAt, _updatedAt, "slug": slug.current, seo{metaTitle, metaDescription, ogImage{asset->{url}}}, featuredImage{asset->{url}}}'

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
  const slug = typeof request.query.slug === 'string' ? request.query.slug : ''
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)
  const projectId = process.env.VITE_SANITY_PROJECT_ID
  const dataset = process.env.VITE_SANITY_DATASET
  try {
    const shellResponse = await fetch(baseUrl)
    if (!shellResponse.ok) throw new Error('Website shell unavailable')
    let html = await shellResponse.text()

    if (validSlug && projectId && /^[a-z0-9]+$/.test(projectId) && dataset && /^[a-z0-9_-]+$/.test(dataset)) {
      try {
        const endpoint = `https://${projectId}.apicdn.sanity.io/v2025-02-19/data/query/${encodeURIComponent(dataset)}?query=${encodeURIComponent(query)}&$slug=${encodeURIComponent(JSON.stringify(slug))}`
        const postResponse = await fetch(endpoint, { headers: { Accept: 'application/json' } })
        if (postResponse.ok) {
          const result = await postResponse.json()
          const post = result.result
          if (post) {
          const title = post.seo?.metaTitle || post.title
          const description = post.seo?.metaDescription || post.excerpt
          const image = post.seo?.ogImage?.asset?.url || post.featuredImage?.asset?.url
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
            description,
            image: image ? [image] : undefined,
            datePublished: post.publishedAt || post._createdAt || undefined,
            dateModified: post._updatedAt || post.publishedAt || post._createdAt || undefined,
            publisher: { '@type': 'Organization', name: 'Rahmat Advocate' },
            mainEntityOfPage: canonical,
          }
          const jsonLd = `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`
            html = html.replace('</head>', `${jsonLd}</head>`)
          }
        }
      } catch {
        // Keep the React route available when Sanity is temporarily unreachable.
      }
    }

    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    response.status(200).send(html)
  } catch {
    response.redirect(302, `${baseUrl}/`)
  }
}