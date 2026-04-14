import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    include: ['laravel-echo', 'pusher-js']
  },
  build: {
    rollupOptions: {
      external: ['laravel-echo', 'pusher-js']
    }
  }
})