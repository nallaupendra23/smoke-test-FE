import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const authApiTarget = 'http://localhost:8000'
const appApiTarget = 'http://localhost:8003'

const proxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('error', (_err, _req, res) => {
      const message = `${serviceName} is unavailable at ${target}. Start the backend server and try again.`
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
      }
      res.end(JSON.stringify({ detail: message }))
    })
  },
})

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api/auth': proxyOptions(authApiTarget, 'Auth API'),
      '/api/restaurant': proxyOptions(authApiTarget, 'Restaurant API'),
      '/api': proxyOptions(appApiTarget, 'App API'),
    },
  },
})
