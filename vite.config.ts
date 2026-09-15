import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this project from https://<user>.github.io/Skintec/
export default defineConfig({
  base: '/Skintec/',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
})
