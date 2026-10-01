import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PortableText } from '@portabletext/react'
import AnimatedSection from '../components/AnimatedSection'
import PageHero from '../components/PageHero'
import { getBlogPostBySlug, getRelatedBlogPosts, getSanityImageUrl } from '../lib/sanity'

const portableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="font-title text-2xl text-[#111]">{children}</h2>,
    h3: ({ children }) => <h3 className="font-title text-xl text-[#111]">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-(--primary) pl-5 italic">{children}</blockquote>,
  },
  marks: {
    link: ({ children, value }) => <a href={value?.href} rel="noreferrer">{children}</a>,
  },
  types: {
    image: ({ value }) => {
      const image = getSanityImageUrl(value, { width: 1100 })
      return image ? <img src={image} alt={value.alt || ''} className="my-8 h-auto max-w-full" loading="lazy" /> : null
    },
  },
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { dateStyle: 'long' })
}

function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [status, setStatus] = useState('loading')
  const [loadedSlug, setLoadedSlug] = useState('')
  const [relatedPosts, setRelatedPosts] = useState([])
  const [relatedSlug, setRelatedSlug] = useState('')

  useEffect(() => {
    let active = true
    getBlogPostBySlug(slug)
      .then((result) => {
        if (!active) return
        setPost(result)
        setStatus(result ? 'ready' : 'not-found')
        setLoadedSlug(slug)
      })
      .catch((error) => {
        console.error('[Sanity Blog] Failed to fetch blog post:', error)
        if (!active) return
        setStatus('error')
        setLoadedSlug(slug)
      })

    return () => { active = false }
  }, [slug])

  useEffect(() => {
    if (loadedSlug !== slug || status === 'ready') return
    document.title = status === 'error' ? 'Article Unavailable - RAHMAT ADVOCATE' : 'Article Not Found - RAHMAT ADVOCATE'
  }, [loadedSlug, slug, status])

  useEffect(() => {
    if (!post || post.slug !== slug) return undefined

    const title = post.seo?.metaTitle || post.title
    const description = post.seo?.metaDescription || post.excerpt
    const canonical = `https://www.rahmatadvocate.com/our-blog/${encodeURIComponent(post.slug)}`
    const image = getSanityImageUrl(post.seo?.ogImage || post.featuredImage, { width: 1200 })
    document.title = title

    const metadata = [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:type', 'article'],
      ['property', 'og:url', canonical],
      ['name', 'twitter:card', image ? 'summary_large_image' : 'summary'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
    ]
    document.head.querySelectorAll('[data-blog-seo="true"]').forEach((element) => element.remove())
    if (image) metadata.push(['property', 'og:image', image], ['name', 'twitter:image', image])

    for (const [attribute, name, content] of metadata) {
      const element = document.createElement('meta')
      element.setAttribute(attribute, name)
      element.content = content
      element.dataset.blogSeo = 'true'
      document.head.appendChild(element)
    }

    const canonicalLink = document.createElement('link')
    canonicalLink.rel = 'canonical'
    canonicalLink.href = canonical
    canonicalLink.dataset.blogSeo = 'true'
    document.head.appendChild(canonicalLink)

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
    const jsonLd = document.createElement('script')
    jsonLd.type = 'application/ld+json'
    jsonLd.dataset.blogSeo = 'true'
    jsonLd.textContent = JSON.stringify(structuredData).replace(/</g, '\\u003c')
    document.head.appendChild(jsonLd)

    return () => document.head.querySelectorAll('[data-blog-seo="true"]').forEach((element) => element.remove())
  }, [post, slug])

  useEffect(() => {
    if (!post || post.slug !== slug) return undefined
    let active = true
    getRelatedBlogPosts(post.category, post.slug)
      .then((results) => { if (active) { setRelatedPosts(results); setRelatedSlug(post.slug) } })
      .catch((error) => console.error('[Sanity Blog] Failed to fetch related blog posts:', error))
    return () => { active = false }
  }, [post, slug])

  if (loadedSlug !== slug || status !== 'ready' || !post || post.slug !== slug) {
    const activeStatus = loadedSlug === slug ? status : 'loading'
    const title = activeStatus === 'loading' ? 'Loading Article' : activeStatus === 'error' ? 'Article Unavailable' : 'Article Not Found'
    const message = activeStatus === 'loading' ? 'Loading article...' : activeStatus === 'error' ? 'This article is temporarily unavailable.' : 'The article you requested is unavailable.'
    return <><PageHero title={title} /><section className="py-20 text-center"><div className="container-shell"><p role={activeStatus === 'error' ? 'alert' : 'status'} className="text-[#545454]">{message}</p><Link to="/our-blog" className="mt-6 inline-block btn-primary">Back to Blog</Link></div></section></>
  }

  const publishedDate = formatDate(post.publishedAt || post._createdAt)
  const featuredImage = getSanityImageUrl(post.featuredImage, { width: 1400 })
  return (
    <>
      <PageHero title={post.title} />
      <article className="py-16 md:py-24"><div className="container-shell max-w-4xl"><AnimatedSection>
        {featuredImage ? <img src={featuredImage} alt={post.title} className="w-full max-h-115 object-cover" /> : null}
        <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#787878]"><span>{post.category}</span>{publishedDate ? <span>{publishedDate}</span> : null}</div>
        <h1 className="mt-4 font-title text-3xl md:text-5xl leading-tight">{post.title}</h1>
        <div className="mt-10 prose prose-lg max-w-none text-[#454545] [&_h2]:font-title [&_h2]:text-[#111] [&_h3]:font-title [&_h3]:text-[#111] [&_a]:text-(--primary)"><PortableText value={post.body || []} components={portableTextComponents} /></div>
        <Link to="/our-blog" className="mt-10 inline-block text-(--primary) font-title">Back to Blog</Link>
      </AnimatedSection></div></article>
      {relatedSlug === post.slug && relatedPosts.length ? <section className="py-16 bg-(--surface)"><div className="container-shell"><h2 className="font-title text-2xl">Related Articles</h2><div className="mt-6 grid md:grid-cols-2 gap-6">{relatedPosts.map((related) => <Link key={related.slug} to={`/our-blog/${related.slug}`} className="border border-(--line) bg-white p-6 font-title text-xl">{related.title}</Link>)}</div></div></section> : null}
    </>
  )
}

export default BlogPostPage