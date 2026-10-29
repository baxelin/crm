import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': API_URL,
      '/uploads': API_URL,
    },
  },
})
