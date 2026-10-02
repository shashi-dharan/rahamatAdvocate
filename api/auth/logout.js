import { clearSessionCookieHeader, destroySession } from '../lib/session-store.js'

export default async function handler(request, response) {
  destroySession(request)
  response.setHeader('Set-Cookie', clearSessionCookieHeader())
  return response.status(200).json({ authenticated: false })
}
