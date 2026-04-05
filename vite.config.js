import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5070',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5070',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5070',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor_react: ['react', 'react-dom', 'react-router-dom'],
          vendor_ui: ['framer-motion', 'lucide-react', 'react-hot-toast'],
          vendor_charts: ['recharts'],
          vendor_utils: ['socket.io-client', 'i18next', 'react-i18next']
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})
