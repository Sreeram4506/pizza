import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = `http://localhost:${env.PORT || 5000}`

  return {
    plugins: [react()],
    build: {
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 700
    },
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true
        },
        '/socket.io': {
          target: backendTarget,
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
})
