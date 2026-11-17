import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/orcamento-rapido/',
  server: { port: 5177, strictPort: true },
  build: { outDir: '../../dist/orcamento-rapido', emptyOutDir: true },
})
