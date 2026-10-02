import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHero from '../components/PageHero'

const categoryOptions = ['NRI', 'Property', 'Criminal Law', 'Family Law', 'Corporate Law', 'Other']

function toDateInputValue(value) {
    const date = value ? new Date(value) : new Date()
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function slugify(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 96) || 'blog-post'
}

function PostBlogEditorPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const editorRef = useRef(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [category, setCategory] = useState('NRI')
    const [publishDate, setPublishDate] = useState(() => toDateInputValue())
    const [excerpt, setExcerpt] = useState('')
    const [content, setContent] = useState('')
    const [featuredImagePreview, setFeaturedImagePreview] = useState('')
    const [featuredImageName, setFeaturedImageName] = useState('')
    const [featuredImageData, setFeaturedImageData] = useState('')

    useEffect(() => {
        let active = true

        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth?action=session', { credentials: 'same-origin' })
                if (!response.ok) {
                    if (active) navigate('/post-blog', { replace: true })
                    return
                }

                const payload = await response.json().catch(() => ({ authenticated: false }))
                if (!payload.authenticated) {
                    if (active) navigate('/post-blog', { replace: true })
                    return
                }

                if (!id) {
                    if (active) setLoading(false)
                    return
                }

                const postResponse = await fetch(`/api/admin?resource=blogs&id=${encodeURIComponent(id)}`, { credentials: 'same-origin' })
                if (postResponse.ok) {
                    const data = await postResponse.json().catch(() => ({ blog: null }))
                    if (data.blog && active) {
                        setTitle(data.blog.title || '')
                        setSlug(data.blog.slug || '')
                        setCategory(data.blog.category || 'NRI')
                        setPublishDate(toDateInputValue(data.blog.publishedAt || data.blog.createdAt))
                        setExcerpt(data.blog.excerpt || '')
                        setContent(data.blog.content || '')
                        if (data.blog.featuredImage?.url) {
                            setFeaturedImagePreview(data.blog.featuredImage.url)
                            setFeaturedImageName(data.blog.featuredImage.alt || data.blog.title || 'blog-image')
                        }
                    }
                }
            } catch {
                if (active) navigate('/post-blog', { replace: true })
            } finally {
                if (active) setLoading(false)
            }
        }

        checkAuth()
        return () => { active = false }
    }, [id, navigate])

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const response = await fetch('/api/admin?resource=upload', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageData: String(reader.result || ''), filename: file.name }),
                })

                const payload = await response.json().catch(() => ({ image: null }))
                if (!response.ok || !payload.image?.url) {
                    setError(payload.error || 'Unable to upload image.')
                    return
                }

                setFeaturedImagePreview(payload.image.url)
                setFeaturedImageName(file.name)
                setFeaturedImageData(payload.image.url)
            } catch {
                setError('Unable to upload image. Please try again.')
            }
        }
        reader.readAsDataURL(file)
    }

    const saveBlog = async (status) => {
        const content = editorRef.current?.innerHTML || ''
        const payload = {
            title: title.trim(),
            slug: slugify(slug || title),
            category,
            publishedAt: publishDate ? new Date(`${publishDate}T12:00:00`).toISOString() : '',
            excerpt: excerpt.trim(),
            content,
            featuredImage: featuredImageData || (featuredImagePreview ? { url: featuredImagePreview, alt: featuredImageName || title || 'Blog image' } : null),
            status,
        }

        if (!payload.title) return setError('Blog title is required.')
        if (!publishDate) return setError('Blog date is required.')
        if (!payload.excerpt) return setError('Short description is required.')
        if (!payload.content.trim()) return setError('Article content is required.')
        if (!payload.featuredImage) return setError('A featured image is required.')

        try {
            setSaving(true)
            setError('')

            const url = id
                ? `/api/admin?resource=blogs&id=${encodeURIComponent(id)}`
                : '/api/admin?resource=blogs'
            const response = await fetch(url, {
                method: id ? 'PUT' : 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await response.json().catch(() => ({ error: 'Unable to save blog.' }))
            if (!response.ok) {
                setError(data.error || 'Unable to save blog.')
                return
            }

            navigate('/post-blog/dashboard?published=1', { replace: true })
        } catch {
            setError('Unable to save blog. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <>
                <PageHero title="Blog Editor" />
                <section className="py-16"><div className="container-shell text-[#545454]">Loading editor...</div></section>
            </>
        )
    }

    return (
        <>
            <PageHero title={id ? 'Edit Blog' : 'Create Blog'} />
            <section className="py-16 md:py-20">
                <div className="container-shell max-w-5xl">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <Link to="/post-blog/dashboard" className="text-(--primary) font-title">Back to dashboard</Link>
                    </div>

                    <div className="space-y-6 border border-(--line) bg-[#fdfbf8] p-6 md:p-8">
                        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-[#111]">Title</label>
                                <input
                                    value={title}
                                    onChange={(event) => {
                                        setTitle(event.target.value)
                                        if (!slug) setSlug(slugify(event.target.value))
                                    }}
                                    className="w-full border border-[#d5c8ba] bg-white px-4 py-3 outline-none focus:border-(--primary)"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#111]">Slug</label>
                                <input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className="w-full border border-[#d5c8ba] bg-white px-4 py-3 outline-none focus:border-(--primary)" />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#111]">Category</label>
                                <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full border border-[#d5c8ba] bg-white px-4 py-3 outline-none focus:border-(--primary)">
                                    {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="publish-date" className="mb-2 block text-sm font-semibold text-[#111]">Publication date</label>
                                <input id="publish-date" type="date" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} required className="w-full border border-[#d5c8ba] bg-white px-4 py-3 outline-none focus:border-(--primary)" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-[#111]">Short description</label>
                                <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={3} className="w-full border border-[#d5c8ba] bg-white px-4 py-3 outline-none focus:border-(--primary)" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-[#111]">Featured image</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border border-[#d5c8ba] bg-white px-4 py-3" />
                                {featuredImagePreview ? <img src={featuredImagePreview} alt={featuredImageName || title || 'Blog image'} className="mt-4 max-h-72 w-full object-cover" /> : null}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-[#111]">Content</label>
                                <div ref={editorRef} contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: content }} className="min-h-80 w-full border border-[#d5c8ba] bg-white p-4 outline-none focus:border-(--primary)" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => saveBlog('draft')} disabled={saving} className="inline-flex items-center justify-center border border-(--line) px-5 py-3 font-title text-[#111] disabled:opacity-70">
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button type="button" onClick={() => saveBlog('published')} disabled={saving} className="btn-primary">
                                {saving ? 'Publishing...' : 'Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default PostBlogEditorPage
