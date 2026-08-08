import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Dev proxy for /api. Uses the backend URL from client/.env (VITE_API_URL)
        // when set, otherwise the local backend on :5000.
        '/api': env.VITE_API_URL || 'http://localhost:5000',
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts')) return 'charts'
            if (id.includes('node_modules/react')) return 'vendor'
            if (id.includes('node_modules/react-router')) return 'vendor'
            return undefined
          },
        },
      },
    },
  }
})
