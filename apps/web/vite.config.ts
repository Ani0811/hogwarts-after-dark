import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Base path for GitHub Pages deployment.
  // Set VITE_BASE_PATH in CI to '/hogwarts-after-dark/' for GitHub Pages.
  base: process.env.VITE_BASE_PATH ?? '/',
  build: {
    outDir: 'dist',
    sourcemap: false, // No sourcemaps in production build
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1', // Never bind to 0.0.0.0 in dev either
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})

