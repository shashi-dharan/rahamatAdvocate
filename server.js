import { createServer } from 'node:http'
import { URL } from 'node:url'

import loginHandler from './api/auth/login.js'
import logoutHandler from './api/auth/logout.js'
import sessionHandler from './api/auth/session.js'
import blogHandler from './api/blog.js'
import blogListHandler from './api/blogs.js'
import blogDetailHandler from './api/blogs/[slug].js'
import adminBlogsHandler from './api/admin/blogs.js'
import adminBlogByIdHandler from './api/admin/blogs/[id].js'
import uploadHandler from './api/admin/upload.js'

const apiRoutes = {
  '/api/auth/login': loginHandler,
  '/api/auth/logout': logoutHandler,
  '/api/auth/session': sessionHandler,
  '/api/blog': blogHandler,
  '/api/blogs': blogListHandler,
  '/api/upload-image': uploadHandler,
  '/api/admin/blogs': adminBlogsHandler,
  '/api/admin/upload': uploadHandler,
}

function applyResponseHelpers(response) {
  response.status = (code) => {
    response.statusCode = code
    return response
  }

  response.json = (payload) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(payload))
    return response
  }

  response.send = (payload) => {
    if (typeof payload === 'string') {
      response.setHeader('Content-Type', 'text/plain; charset=utf-8')
      response.end(payload)
      return response
    }

    if (payload instanceof Buffer) {
      response.setHeader('Content-Type', 'application/octet-stream')
      response.end(payload)
      return response
    }

    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(payload))
    return response
  }

  return response
}

const server = createServer(async (request, response) => {
  applyResponseHelpers(response)

  if (['POST', 'PUT', 'PATCH'].includes(request.method || '')) {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString('utf8')
    try {
      request.body = body ? JSON.parse(body) : {}
    } catch {
      request.body = {}
    }
  }

  const requestUrl = new URL(request.url ?? '/', 'http://localhost:3001')
  let routeHandler = apiRoutes[requestUrl.pathname]
  const pathname = requestUrl.pathname || '/'

  if (!routeHandler && pathname.startsWith('/api/blogs/')) {
    routeHandler = blogDetailHandler
  }

  if (!routeHandler && pathname.startsWith('/api/admin/blogs/')) {
    routeHandler = adminBlogByIdHandler
  }

  if (!routeHandler) {
    response.status(404).json({ error: 'Not found' })
    return
  }

  request.query = Object.fromEntries(requestUrl.searchParams.entries())
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'api' && segments[1] === 'blogs' && segments[2]) {
    request.query.slug = segments[2]
  }
  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'blogs' && segments[3]) {
    request.query.id = segments[3]
  }

  try {
    await routeHandler(request, response)
  } catch (error) {
    console.error('[Local API]', error)
    response.status(500).json({ error: 'Unable to process request.' })
  }
})

server.listen(3001, '0.0.0.0', () => {
  console.log('Local API server running on http://localhost:3001')
})
