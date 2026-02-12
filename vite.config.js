import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { global: true, Buffer: true }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
})
