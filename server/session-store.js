import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { getDatabase } from './mongodb.js'
import { HttpError } from './http.js'

const memorySessions = new Map()
const failedLogins = new Map()
const sessionDurationMs = 24 * 60 * 60 * 1000
let sessionCollectionPromise = null

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
    const vercelHosts = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
      .filter(Boolean)
      .map((host) => `https://${host}`)
    if (vercelHosts.includes(url.origin)) return true
    return process.env.NODE_ENV !== 'production'
      && url.protocol === 'http:'
      && ['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}

export function getClientIp(request) {
  return request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 'local'
}

export function isLoginRateLimited(ip) {
  const record = failedLogins.get(ip)
  return Boolean(record && record.count >= 5 && Date.now() - record.firstAttempt < 10 * 60 * 1000)
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

async function getSessionCollection() {
  const db = await getDatabase()
  if (!db) {
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      throw new Error('MongoDB is required for production sessions.')
    }
    return null
  }

  if (!sessionCollectionPromise) {
    const collection = db.collection('sessions')
    sessionCollectionPromise = collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      .then(() => collection)
      .catch((error) => {
        sessionCollectionPromise = null
        throw error
      })
  }
  return sessionCollectionPromise
}

export async function createSession(username) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + sessionDurationMs)
  const collection = await getSessionCollection()
  if (collection) {
    await collection.insertOne({ _id: sessionId, username, createdAt, expiresAt })
  } else {
    memorySessions.set(sessionId, { username, expiresAt })
  }
  return sessionId
}

function getSessionId(request) {
  const cookie = request.headers?.cookie || ''
  const value = cookie.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith('rahmat_session='))
  if (!value) return ''
  try {
    const sessionId = decodeURIComponent(value.slice('rahmat_session='.length))
    return /^[a-f0-9]{64}$/.test(sessionId) ? sessionId : ''
  } catch {
    return ''
  }
}

export async function getSessionUser(request) {
  const sessionId = getSessionId(request)
  if (!sessionId) return null
  const collection = await getSessionCollection()
  if (!collection) {
    const session = memorySessions.get(sessionId)
    if (!session || session.expiresAt <= new Date()) {
      memorySessions.delete(sessionId)
      return null
    }
    return { username: session.username }
  }

  const session = await collection.findOne({ _id: sessionId, expiresAt: { $gt: new Date() } })
  return session ? { username: session.username } : null
}

export async function destroySession(request) {
  const sessionId = getSessionId(request)
  if (!sessionId) return
  const collection = await getSessionCollection()
  if (collection) await collection.deleteOne({ _id: sessionId })
  else memorySessions.delete(sessionId)
}

export function getSessionCookieHeader(sessionId, secure = false) {
  return `rahmat_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure ? '; Secure' : ''}`
}

export function clearSessionCookieHeader() {
  return 'rahmat_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

export async function readRequestBody(request) {
  let body = request.body
  if (body === undefined || body === null || body === '') return {}
  if (Buffer.isBuffer(body)) body = body.toString('utf8')
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      throw new HttpError(400, 'Request body must be valid JSON.')
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object.')
  }
  return body
}