import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  // Dev server: proxy /api requests to the local backend
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // Expose VITE_API_URL to the app at build time
  // In Railway: set VITE_API_URL=https://<your-backend>.up.railway.app
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL ?? 'http://localhost:8000'),
  },
})

