import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://pizzabackend-qzi1.onrender.com',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://pizzabackend-qzi1.onrender.com',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'https://pizzabackend-qzi1.onrender.com',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
