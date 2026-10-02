import bcrypt from 'bcryptjs'
import {
  clearRateLimit,
  clearSessionCookieHeader,
  createSession,
  destroySession,
  getClientIp,
  getSessionCookieHeader,
  getSessionUser,
  isLoginRateLimited,
  isValidOrigin,
  readRequestBody,
  registerFailedLogin,
} from '../server/session-store.js'
import { getQueryValue, HttpError, sendApiError } from '../server/http.js'

const methodsByAction = { login: 'POST', logout: 'POST', session: 'GET' }

export default async function handler(request, response) {
  try {
    const action = getQueryValue(request, 'action')
    if (!action) throw new HttpError(400, 'An auth action is required.')
    if (!Object.hasOwn(methodsByAction, action)) throw new HttpError(404, 'Auth action not found.')
    if (request.method !== methodsByAction[action]) throw new HttpError(405, 'Method not allowed.')

    const origin = request.headers?.origin || request.headers?.referer || ''
    if (origin && !isValidOrigin(origin)) throw new HttpError(403, 'Invalid request origin.')

    if (action === 'session') {
      const session = await getSessionUser(request)
      if (!session) return response.status(401).json({ authenticated: false })
      return response.status(200).json({ authenticated: true, user: session.username })
    }

    if (action === 'logout') {
      await destroySession(request)
      response.setHeader('Set-Cookie', clearSessionCookieHeader())
      return response.status(200).json({ authenticated: false })
    }

    const ip = getClientIp(request)
    if (isLoginRateLimited(ip)) return response.status(429).json({ error: 'Invalid login credentials.' })

    const payload = await readRequestBody(request)
    if (typeof payload.username !== 'string' || typeof payload.password !== 'string'
      || !payload.username.trim() || !payload.password) {
      throw new HttpError(400, 'Username and password are required.')
    }

    const username = payload.username.trim().toLowerCase()
    const expectedUsername = (process.env.BLOG_ADMIN_USERNAME || '').trim().toLowerCase()
    const passwordHash = process.env.BLOG_ADMIN_PASSWORD_HASH || ''
    if (!expectedUsername || !passwordHash) {
      console.error('[Auth] Missing admin credentials configuration.')
      return response.status(500).json({ error: 'Login is not configured.' })
    }

    const validCredentials = username === expectedUsername && await bcrypt.compare(payload.password, passwordHash)
    if (!validCredentials) {
      registerFailedLogin(ip)
      return response.status(401).json({ error: 'Invalid login credentials.' })
    }

    clearRateLimit(ip)
    const secureCookie = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const sessionId = await createSession(expectedUsername)
    response.setHeader('Set-Cookie', getSessionCookieHeader(sessionId, secureCookie))
    return response.status(200).json({ authenticated: true, user: expectedUsername })
  } catch (error) {
    return sendApiError(response, error, 'Unable to process authentication request.')
  }
}