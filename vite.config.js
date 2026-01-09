import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: ['stock-analyzer-fdkg.onrender.com']
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    open: true,
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        secure: false,
        timeout: 30000, // Increased timeout to 30 seconds
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        onError: (err, req, res) => {
          console.log('Proxy error:', err.message)
          res.statusCode = 500
          res.end('Proxy timeout or connection error')
        }
      }
    }
  }
})
