import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path needed for GitHub Pages if the repo is not at the root domain
  // Change './' to '/repo-name/' if you experience issues with assets
  base: './', 
  build: {
    outDir: 'dist',
  }
})