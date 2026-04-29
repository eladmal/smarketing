import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Expose env vars to the bundle (VITE_ prefix required)
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000/api/v1'),
  },
  server: {
    port: 5173,
    proxy: {
      // In dev: proxy /api → backend so you can use relative URLs
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui:     ['lucide-react', 'react-hot-toast'],
        },
      },
    },
  },
})
