import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Build com caminho relativo: funciona na raiz de um domínio ou numa subpasta (GitHub Pages).
// No desenvolvimento usa /<nome>/, que é o caminho repassado pelo proxy do hub.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? './' : '/aproveitamento-folha/',
  server: { port: 5179, strictPort: true },
  build: { outDir: '../../dist/aproveitamento-folha', emptyOutDir: true },
}))
