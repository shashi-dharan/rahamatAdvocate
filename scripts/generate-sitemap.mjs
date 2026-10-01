import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const siteUrl = process.env.VITE_SITE_URL || 'https://www.rahmatadvocate.com'

const routes = ['/', '/services', '/contact-us', '/about-us', '/our-blog', '/gallery']
const routeUrls = routes.map((route) => `<url><loc>${siteUrl}${route}</loc></url>`)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routeUrls.join('')}</urlset>`
fs.mkdirSync(path.join(root, 'public'), { recursive: true })
fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), sitemap)