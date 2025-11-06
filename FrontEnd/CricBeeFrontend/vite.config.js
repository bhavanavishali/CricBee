// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindConfig from './tailwind.config'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [tailwindConfig()],
// })



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy API routes to FastAPI during development to avoid CORS
      '/auth': {
        target: 'http://127.0.0.1:8000', // change if your backend runs elsewhere
        changeOrigin: true,
      },
    },
  },
})