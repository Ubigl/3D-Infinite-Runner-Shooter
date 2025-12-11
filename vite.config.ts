import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config for GitHub Pages deployment
export default defineConfig({
  plugins: [react()],
  base: '/3D-Infinite-Runner-Shooter/',  // <-- обязательное значение
  build: {
    outDir: 'dist',
  },
})
