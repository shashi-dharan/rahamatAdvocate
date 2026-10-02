import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHero from '../components/PageHero'

function PostBlogLoginPage() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('checking')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        let active = true

        fetch('/api/auth/session', { credentials: 'same-origin' })
            .then(async (response) => {
                if (!response.ok) {
                    if (active) setStatus('login')
                    return
                }

                const payload = await response.json().catch(() => ({ authenticated: false }))
                if (!active) return

                if (payload.authenticated) {
                    navigate('/post-blog/dashboard', { replace: true })
                    return
                }

                setStatus('login')
            })
            .catch(() => {
                if (active) setStatus('login')
            })

        return () => { active = false }
    }, [navigate])

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setStatus('submitting')

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            const payload = await response.json().catch(() => ({ error: 'Invalid login credentials.' }))

            if (!response.ok || !payload.authenticated) {
                setError(payload.error || 'Invalid login credentials.')
                setStatus('login')
                return
            }

            navigate('/post-blog/dashboard', { replace: true })
        } catch {
            setError('Invalid login credentials.')
            setStatus('login')
        }
    }

    if (status === 'checking') {
        return (
            <>
                <PageHero title="Client Login" />
                <section className="py-16">
                    <div className="container-shell max-w-xl text-[#545454]">Checking session...</div>
                </section>
            </>
        )
    }

    return (
        <>
            <PageHero title="Client Login" />
            <section className="py-16 md:py-20">
                <div className="container-shell max-w-xl">
                    <div className="border border-(--line) bg-[#fdfbf8] p-6 md:p-10 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-semibold text-[#111] mb-2">Username / Email</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    className="w-full border border-[#d5c8ba] bg-white px-4 py-3 outline-none focus:border-(--primary)"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-[#111] mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className="w-full border border-[#d5c8ba] bg-white px-4 py-3 pr-12 outline-none focus:border-(--primary)"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-(--primary)"
                                        onClick={() => setShowPassword((current) => !current)}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            {error ? (
                                <p className="text-sm text-[#b42318]" role="alert">
                                    {error}
                                </p>
                            ) : null}

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="btn-primary w-full justify-center disabled:opacity-70"
                            >
                                {status === 'submitting' ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <div className="mt-6 text-sm text-[#545454]">
                            <Link to="/" className="text-(--primary) font-title">Back to home</Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default PostBlogLoginPage
