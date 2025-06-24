import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
      ignored: ['**/node_modules/**'],
    },
    proxy: {
      '/api': {
        target: 'https://prospector.ucsmindbite.cloud',
        changeOrigin: true,
        secure: true,
        headers: {
          'Authorization': 'Basic ' + Buffer.from('cid_1a883e3bac7f4b9198633c724a211033:cs_1HJWP03nk/elflvU45bOKT4gWhuORsYBbboXTi9oqYYiHL/Zj6SENP401sxK0Veyfpv7GPW4ysofSGzLGvOVNA==').toString('base64')
        }
      }
    }
  }
})