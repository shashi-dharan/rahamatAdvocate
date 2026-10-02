import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import PageHero from '../components/PageHero'
import SectionHeading from '../components/SectionHeading'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { dateStyle: 'long' })
}

function BlogPage() {
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true

    fetch('/api/blogs')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load posts')))
      .then((data) => {
        if (!active) return
        setPosts(data.blogs || [])
        setStatus('ready')
      })
      .catch((error) => {
        console.error('[Blog API] Failed to fetch posts:', error)
        if (active) setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHero title="Our Blog" />
      <section className="py-18 md:py-24 bg-white">
        <div className="container-shell">
          <AnimatedSection>
            <SectionHeading
              centered
              eyebrow="Insights"
              title="Latest From Blog"
              description="Articles and explainers designed to help clients understand legal processes more clearly."
            />
          </AnimatedSection>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {status === 'loading' ? <p role="status" className="text-[#545454]">Loading articles...</p> : null}
            {status === 'error' ? (
              <div role="alert" className="text-[#545454]">
                <p>Articles are temporarily unavailable.</p>
                <button type="button" className="mt-3 text-(--primary) font-title" onClick={() => window.location.reload()}>Try again</button>
              </div>
            ) : null}
            {status === 'ready' && posts.length === 0 ? <p className="text-[#545454]">No articles have been published yet.</p> : null}
            {status === 'ready' && posts.map((post, index) => (
              <AnimatedSection key={post.slug} delay={index * 80}>
                <article className="h-full border border-(--line) bg-[#fdfbf8] overflow-hidden">
                  {post.featuredImage?.url ? (
                    <img src={post.featuredImage.url} alt={post.title} className="w-full object-cover" />
                  ) : <div className="aspect-video bg-(--surface)" aria-hidden="true" />}
                  <div className="p-6">
                    <p className="text-sm text-[#787878]">{post.category}</p>
                    <h3 className="font-title text-2xl leading-8">{post.title}</h3>
                    <p className="mt-2 text-sm text-[#787878]">{formatDate(post.publishedAt || post.createdAt)}</p>
                    <p className="mt-4 text-[#545454] leading-7">{post.excerpt}</p>
                    <Link to={`/our-blog/${post.slug}`} className="mt-5 inline-block text-(--primary) font-title">Read more</Link>
                  </div>
                </article>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default BlogPage
