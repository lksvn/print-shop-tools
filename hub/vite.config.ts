import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Porta de desenvolvimento de cada ferramenta. Nova ferramenta = nova linha aqui.
const PORTAS: Record<string, number> = {
  cadastros: 5175,
  'respostas-prontas': 5176,
  'orcamento-rapido': 5177,
  pix: 5178,
}

// O hub é construído primeiro e limpa dist/; cada ferramenta grava em dist/<nome>/ depois.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    // Tudo pelo mesmo endereço no desenvolvimento, como em produção: o localStorage é compartilhado.
    proxy: Object.fromEntries(
      Object.entries(PORTAS).map(([nome, porta]) => [`/${nome}/`, { target: `http://localhost:${porta}`, ws: true }]),
    ),
  },
  build: { outDir: '../dist', emptyOutDir: true },
})
