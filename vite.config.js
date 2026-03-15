import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/proxy/records': {
        target: 'https://records.onlinecolony.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/records/, '/api/v1'),
      },
      '/proxy/scint': {
        target: 'https://sandbox.onlinecolony.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/scint/, '/scint/api/v1'),
      },
    },
  },
})
