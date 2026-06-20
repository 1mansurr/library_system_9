import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth':   'http://localhost:8081',
      '/api/users':  'http://localhost:8081',
      '/api/books':  'http://localhost:8082',
      '/api/copies': 'http://localhost:8082',
      '/api/loans':  'http://localhost:8083',
    },
  },
})
