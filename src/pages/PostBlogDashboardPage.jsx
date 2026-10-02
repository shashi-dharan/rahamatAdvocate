import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHero from '../components/PageHero'

function PostBlogDashboardPage() {
    const navigate = useNavigate()
    const [blogs, setBlogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

        const loadBlogs = async () => {
            try {
                const sessionResponse = await fetch('/api/auth?action=session', { credentials: 'same-origin' })
                if (!sessionResponse.ok) {
                    navigate('/post-blog', { replace: true })
                    return
                }

                const session = await sessionResponse.json().catch(() => ({ authenticated: false }))
                if (!session.authenticated) {
                    navigate('/post-blog', { replace: true })
                    return
                }

                const response = await fetch('/api/admin?resource=blogs', { credentials: 'same-origin' })
                const payload = await response.json().catch(() => ({ blogs: [] }))
                if (!response.ok) throw new Error(payload.error || 'Unable to load blogs.')
                if (active) setBlogs(payload.blogs || [])
            } catch (loadError) {
                if (active) setError(loadError.message || 'Unable to load blogs.')
            } finally {
                if (active) setLoading(false)
            }
        }

        loadBlogs()
        return () => { active = false }
    }, [navigate])

    const deleteBlog = async (blog) => {
        if (!window.confirm(`Delete "${blog.title}"?`)) return

        try {
            const response = await fetch(`/api/admin?resource=blogs&id=${encodeURIComponent(blog._id)}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            })
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) throw new Error(payload.error || 'Unable to delete blog.')
            setBlogs((current) => current.filter((item) => item._id !== blog._id))
        } catch (deleteError) {
            setError(deleteError.message || 'Unable to delete blog.')
        }
    }

    const logout = async () => {
        await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'same-origin' }).catch(() => { })
        navigate('/post-blog', { replace: true })
    }

    return (
        <>
            <PageHero title="Blog Dashboard" />
            <section className="py-16 md:py-20">
                <div className="container-shell">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="font-title text-2xl text-[#111]">Manage Blogs</h2>
                        <div className="flex items-center gap-4">
                            <Link to="/post-blog/new" className="btn-primary">Create Blog</Link>
                            <button type="button" onClick={logout} className="text-(--primary) font-title">Log out</button>
                        </div>
                    </div>

                    {error ? <p role="alert" className="mb-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
                    {loading ? <p className="text-[#545454]">Loading blogs...</p> : null}
                    {!loading && blogs.length === 0 ? <p className="text-[#545454]">No blogs yet.</p> : null}

                    {!loading && blogs.length > 0 ? (
                        <div className="overflow-x-auto border border-(--line)">
                            <table className="w-full min-w-[640px] text-left">
                                <thead className="bg-[#fdfbf8] text-sm text-[#545454]">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Title</th>
                                        <th className="px-4 py-3 font-semibold">Category</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Updated</th>
                                        <th className="px-4 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--line)">
                                    {blogs.map((blog) => (
                                        <tr key={blog._id}>
                                            <td className="px-4 py-3 font-medium text-[#111]">{blog.title}</td>
                                            <td className="px-4 py-3 text-[#545454]">{blog.category}</td>
                                            <td className="px-4 py-3 capitalize text-[#545454]">{blog.status}</td>
                                            <td className="px-4 py-3 text-[#545454]">{new Date(blog.updatedAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-4">
                                                    <Link to={`/post-blog/edit/${blog._id}`} className="text-(--primary) font-title">Edit</Link>
                                                    <button type="button" onClick={() => deleteBlog(blog)} className="text-red-700">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
            </section>
        </>
    )
}

export default PostBlogDashboardPage
