import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function geminiProxy() {
  let apiKey
  return {
    name: 'gemini-proxy',
    configResolved(config) {
      apiKey = config.env.VITE_GEMINI_API_KEY
    },
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'VITE_GEMINI_API_KEY not set in .env' }))
          return
        }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = Buffer.concat(chunks)
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
          const upstream = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          })
          const data = await upstream.text()
          res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
          res.end(data)
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geminiProxy()],
  server: {
    proxy: {
      '/proxy/records': {
        target: 'https://records.onlinecolony.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/records/, '/api/v1'),
      },
      '/proxy/permissions': {
        target: 'https://permissions.onlinecolony.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/permissions/, '/api/v1'),
      },
      '/proxy/scint': {
        target: 'https://sandbox.onlinecolony.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/scint/, '/scint/api/v1'),
      },
    },
  },
})
