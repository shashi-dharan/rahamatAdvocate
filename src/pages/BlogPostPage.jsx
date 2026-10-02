import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import PageHero from '../components/PageHero'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { dateStyle: 'long' })
}

function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Post not found')))
      .then((data) => {
        if (!active) return
        setPost(data?.blog || null)
        setStatus(data?.blog ? 'ready' : 'not-found')
      })
      .catch((error) => {
        console.error('[Blog API] Failed to fetch blog post:', error)
        if (active) setStatus('error')
      })

    return () => { active = false }
  }, [slug])

  if (status !== 'ready' || !post) {
    const title = status === 'loading' ? 'Loading Article' : status === 'error' ? 'Article Unavailable' : 'Article Not Found'
    const message = status === 'loading' ? 'Loading article...' : status === 'error' ? 'This article is temporarily unavailable.' : 'The article you requested is unavailable.'

    return (
      <>
        <PageHero title={title} />
        <section className="py-20 text-center">
          <div className="container-shell">
            <p role={status === 'error' ? 'alert' : 'status'} className="text-[#545454]">{message}</p>
            <Link to="/our-blog" className="mt-6 inline-block btn-primary">Back to Blog</Link>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHero title={post.title} />
      <article className="py-16 md:py-24">
        <div className="container-shell max-w-4xl">
          <AnimatedSection>
            {post.featuredImage?.url ? <img src={post.featuredImage.url} alt={post.title} className="w-full max-h-115 object-cover" /> : null}
            <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#787878]">
              <span>{post.category}</span>
              {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
            </div>
            <h1 className="mt-4 font-title text-3xl md:text-5xl leading-tight">{post.title}</h1>
            <div className="mt-10 prose prose-lg max-w-none text-[#454545] [&_h2]:font-title [&_h2]:text-[#111] [&_h3]:font-title [&_h3]:text-[#111] [&_a]:text-(--primary)" dangerouslySetInnerHTML={{ __html: post.content || '<p>Content unavailable.</p>' }} />
            <Link to="/our-blog" className="mt-10 inline-block text-(--primary) font-title">Back to Blog</Link>
          </AnimatedSection>
        </div>
      </article>
    </>
  )
}

export default BlogPostPage
