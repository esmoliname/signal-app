import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/highlight.js')) return 'highlight'
          if (id.includes('node_modules/marked')) return 'marked'
          if (id.includes('node_modules/dompurify')) return 'dompurify'
          if (id.includes('node_modules')) return 'vendor'
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  }
})
