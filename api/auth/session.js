import { getSessionUser, isValidOrigin } from '../lib/session-store.js'

export default async function handler(request, response) {
  const origin = request.headers?.origin || request.headers?.referer || ''
  if (origin && !isValidOrigin(origin)) {
    return response.status(403).json({ authenticated: false, error: 'Invalid request origin.' })
  }

  const session = getSessionUser(request)
  if (!session) {
    return response.status(401).json({ authenticated: false })
  }

  return response.status(200).json({
    authenticated: true,
    user: session.username,
  })
}
