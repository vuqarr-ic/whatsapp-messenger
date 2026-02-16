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
  },
  build: {
    // Оптимизация для мобильных устройств
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Разбиваем код на меньшие чанки для лучшей загрузки на мобильных
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'webrtc-vendor': ['simple-peer']
        },
        // Оптимизация имен файлов
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Минификация для уменьшения размера (используем esbuild по умолчанию, быстрее)
    minify: 'esbuild', // esbuild быстрее и работает без дополнительных зависимостей
    // Для terser раскомментируйте и установите: npm install -D terser
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: false,
    //     drop_debugger: true
    //   }
    // }
  }
})
