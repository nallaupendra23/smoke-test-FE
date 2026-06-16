import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const port = Number(process.env.PORT || 5174)

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function proxyTarget(url) {
  if (url.startsWith('/api/auth') || url.startsWith('/api/restaurant')) {
    return 'http://127.0.0.1:8000'
  }
  if (url.startsWith('/api')) {
    return 'http://127.0.0.1:8003'
  }
  return null
}

function proxy(req, res, target) {
  const targetUrl = new URL(req.url, target)
  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: { ...req.headers, host: targetUrl.host },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ detail: `Backend unavailable at ${target}` }))
  })

  req.pipe(proxyReq)
}

function serve(req, res) {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)

  const target = proxyTarget(req.url || '/')
  if (target) {
    proxy(req, res, target)
    return
  }

  const urlPath = decodeURIComponent(new URL(req.url || '/', `http://${req.headers.host}`).pathname)
  const requested = path.normalize(urlPath === '/' ? '/index.html' : urlPath)
  let filePath = path.join(distDir, requested)

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html')
  }

  const ext = path.extname(filePath)
  const { size } = fs.statSync(filePath)
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Content-Length': size,
    'Cache-Control': 'no-store',
  })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  fs.createReadStream(filePath).pipe(res)
}

for (const host of ['127.0.0.1', '::1']) {
  http.createServer(serve).listen(port, host, () => {
    console.log(`RingAI frontend serving at http://${host === '::1' ? 'localhost' : host}:${port}`)
  })
}
