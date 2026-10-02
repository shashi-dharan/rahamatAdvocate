import bcrypt from 'bcryptjs'

import {
  clearRateLimit,
  createSession,
  getClientIp,
  getSessionCookieHeader,
  isLoginRateLimited,
  isValidOrigin,
  readRequestBody,
  registerFailedLogin,
} from '../lib/session-store.js'

export default async function handler(request, response) {
  const origin = request.headers?.origin || request.headers?.referer || ''
  if (origin && !isValidOrigin(origin)) {
    return response.status(403).json({ error: 'Invalid request origin.' })
  }

  const ip = getClientIp(request)
  if (isLoginRateLimited(ip)) {
    return response.status(429).json({ error: 'Invalid login credentials.' })
  }

  const payload = await readRequestBody(request)
  const username = String(payload.username || '').trim().toLowerCase()
  const password = String(payload.password || '')
  const expectedUsername = (process.env.BLOG_ADMIN_USERNAME || '').trim().toLowerCase()
  const passwordHash = process.env.BLOG_ADMIN_PASSWORD_HASH || ''

  if (!expectedUsername || !passwordHash) {
    console.error('[Auth] Missing BLOG_ADMIN_USERNAME or BLOG_ADMIN_PASSWORD_HASH')
    return response.status(500).json({ error: 'Invalid login credentials.' })
  }

  const validCredentials = username === expectedUsername && password && (await bcrypt.compare(password, passwordHash))

  if (!validCredentials) {
    registerFailedLogin(ip)
    return response.status(401).json({ error: 'Invalid login credentials.' })
  }

  clearRateLimit(ip)
  const secureCookie = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  const sessionId = createSession(expectedUsername)
  response.setHeader('Set-Cookie', getSessionCookieHeader(sessionId, secureCookie))

  return response.status(200).json({
    authenticated: true,
    user: expectedUsername,
  })
}
