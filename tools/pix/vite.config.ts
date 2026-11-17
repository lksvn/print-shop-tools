import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/pix/',
  server: { port: 5178, strictPort: true },
  build: { outDir: '../../dist/pix', emptyOutDir: true },
})
