import crypto from 'node:crypto'

const sessions = new Map()
const failedLogins = new Map()

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://rahmatadvocate.com',
  'https://www.rahmatadvocate.com',
]

export function isValidOrigin(origin) {
  if (!origin) return true
  try {
    const url = new URL(origin)
    if (allowedOrigins.includes(url.origin)) return true
    return process.env.NODE_ENV !== 'production'
      && url.protocol === 'http:'
      && ['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}

export function getClientIp(request) {
  return request.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'local'
}

export function isLoginRateLimited(ip) {
  const record = failedLogins.get(ip)
  if (!record) return false
  return record.count >= 5 && Date.now() - record.firstAttempt < 10 * 60 * 1000
}

export function registerFailedLogin(ip) {
  const current = failedLogins.get(ip) || { count: 0, firstAttempt: Date.now() }
  current.count += 1
  if (current.count === 1) current.firstAttempt = Date.now()
  failedLogins.set(ip, current)
}

export function clearRateLimit(ip) {
  failedLogins.delete(ip)
}

export function createSession(username) {
  const sessionId = crypto.randomBytes(24).toString('hex')
  sessions.set(sessionId, { username, createdAt: Date.now() })
  return sessionId
}

export function getSessionUser(request) {
  const cookieHeader = request.headers.cookie || ''
  const match = cookieHeader.split(';').find((entry) => entry.trim().startsWith('rahmat_session='))
  const sessionId = match ? decodeURIComponent(match.split('=')[1]) : ''
  const session = sessionId ? sessions.get(sessionId) : null
  if (!session) return null

  return { username: session.username }
}

export function destroySession(request) {
  const cookieHeader = request.headers.cookie || ''
  const match = cookieHeader.split(';').find((entry) => entry.trim().startsWith('rahmat_session='))
  if (!match) return
  const sessionId = decodeURIComponent(match.split('=')[1])
  sessions.delete(sessionId)
}

export function getSessionCookieHeader(sessionId, secure = false) {
  return `rahmat_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure ? '; Secure' : ''}`
}

export function clearSessionCookieHeader() {
  return 'rahmat_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

export async function readRequestBody(request) {
  if (!request.body) {
    return {}
  }

  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body)
    } catch {
      return {}
    }
  }

  if (Buffer.isBuffer(request.body)) {
    const text = request.body.toString('utf8')
    try {
      return JSON.parse(text)
    } catch {
      return {}
    }
  }

  if (typeof request.body === 'object') {
    return request.body
  }

  return {}
}
