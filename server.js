import { createServer } from 'node:http'
import { Buffer } from 'node:buffer'
import { URL } from 'node:url'

import authHandler from './api/auth.js'
import blogsHandler from './api/blogs.js'
import adminHandler from './api/admin.js'
import sitemapHandler from './api/sitemap.js'
import blogPageHandler from './api/blog-page.js'

const apiRoutes = {
  '/api/auth': authHandler,
  '/api/blogs': blogsHandler,
  '/api/admin': adminHandler,
  '/api/sitemap': sitemapHandler,
  '/api/blog-page': blogPageHandler,
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
      if (!response.hasHeader('Content-Type')) {
        response.setHeader('Content-Type', 'text/plain; charset=utf-8')
      }
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
    request.body = body
  }

  const requestUrl = new URL(request.url ?? '/', 'http://localhost:3001')
  let routeHandler = apiRoutes[requestUrl.pathname]
  if (!routeHandler) {
    response.status(404).json({ error: 'Not found' })
    return
  }

  request.query = Object.fromEntries(requestUrl.searchParams.entries())
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
