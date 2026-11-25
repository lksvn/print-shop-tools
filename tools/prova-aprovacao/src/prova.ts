// Gera as imagens de prova: desenha cada página (PDF) ou a imagem, aplica a marca "PROVA" e um rodapé.
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import urlDoWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = urlDoWorker

export const LADO_MAIOR_PX = 1600 // bom para conferir no celular, ruim para imprimir: é o que se quer de uma prova
export const MAX_PAGINAS = 30 // shortcut: limite fixo para não travar o navegador com PDF enorme; virar aviso + escolha de páginas se aparecer caso real
export const MARCA = 'PROVA – não imprimir'

const pontosParaMm = (pt: number) => (pt * 25.4) / 72

/** Escala para o lado maior da página ficar com `ladoMaior` px. */
export const escalaPara = (largura: number, altura: number, ladoMaior = LADO_MAIOR_PX) => ladoMaior / Math.max(largura, altura)

export function rodape(p: { loja: string; data: string; larguraMm?: number; alturaMm?: number; pagina: number; total: number }) {
  return [
    p.loja,
    `Prova de ${p.data}`,
    p.larguraMm && p.alturaMm ? `${Math.round(p.larguraMm)} × ${Math.round(p.alturaMm)} mm` : '',
    p.total > 1 ? `Pág. ${p.pagina} de ${p.total}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

// shortcut: texto fixo até o especialista responder a pergunta 2; depois pode vir das Respostas prontas.
export function mensagemProva(cliente: string, total: number) {
  const saudacao = cliente.trim() ? `Olá, ${cliente.trim()}!` : 'Olá!'
  const qual = total > 1 ? `as ${total} imagens da prova` : 'a imagem da prova'
  return (
    `${saudacao} Segue ${qual} do seu pedido.\n` +
    'Confira com atenção textos, números de telefone, cores e posição.\n' +
    'Se estiver tudo certo, responda *OK* para aprovar a impressão. Se precisar mudar algo, é só avisar.'
  )
}

export function nomeDaProva(arquivo: string, pagina: number, total: number) {
  const base =
    arquivo
      .normalize('NFD')
      .replace(/\p{M}/gu, '') // tira acentos: "Cartão" → "Cartao"
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w-]+/g, '-')
      .replace(/^-|-$/g, '') || 'arte'
  return `prova-${base}${total > 1 ? `-p${pagina}` : ''}.jpg`
}

export type Pagina = { canvas: HTMLCanvasElement; larguraMm?: number; alturaMm?: number }

function canvasBranco(largura: number, altura: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(largura)
  canvas.height = Math.round(altura)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return { canvas, ctx }
}

/** Desenha as páginas do PDF ou a imagem em canvas. Lança erro se o arquivo não abrir. */
export async function lerArquivo(arquivo: File, aoProgredir: (n: number, total: number) => void): Promise<{ paginas: Pagina[]; cortado: boolean }> {
  if (!arquivo.type.startsWith('image/')) {
    const tarefa = getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) })
    try {
      const pdf = await tarefa.promise
      const total = Math.min(pdf.numPages, MAX_PAGINAS)
      const paginas: Pagina[] = []
      for (let n = 1; n <= total; n++) {
        aoProgredir(n, total)
        const pagina = await pdf.getPage(n)
        const base = pagina.getViewport({ scale: 1 })
        const viewport = pagina.getViewport({ scale: escalaPara(base.width, base.height) })
        const { canvas, ctx } = canvasBranco(viewport.width, viewport.height)
        await pagina.render({ canvas, canvasContext: ctx, viewport }).promise
        paginas.push({ canvas, larguraMm: pontosParaMm(base.width), alturaMm: pontosParaMm(base.height) })
        pagina.cleanup()
      }
      return { paginas, cortado: pdf.numPages > MAX_PAGINAS }
    } finally {
      await tarefa.destroy()
    }
  }
  const imagem = await createImageBitmap(arquivo)
  const escala = Math.min(1, escalaPara(imagem.width, imagem.height)) // imagem pequena não é ampliada
  const { canvas, ctx } = canvasBranco(imagem.width * escala, imagem.height * escala)
  ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height)
  imagem.close()
  return { paginas: [{ canvas }], cortado: false } // imagem não tem medida em mm confiável
}

/** Nova imagem: a arte com a marca repetida na diagonal e uma faixa de rodapé embaixo (fora da arte). */
export function aplicarMarca(arte: HTMLCanvasElement, textoRodape: string) {
  const { width: w, height: h } = arte
  const faixa = Math.max(32, Math.round(Math.max(w, h) * 0.03))
  const { canvas, ctx } = canvasBranco(w, h + faixa)
  ctx.drawImage(arte, 0, 0)

  const fonte = Math.round(Math.max(w, h) / 20)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.clip()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-Math.PI / 6)
  ctx.font = `bold ${fonte}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = Math.max(1, fonte / 24)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)' // contorno claro: a marca aparece também em arte escura
  ctx.fillStyle = 'rgba(200,30,30,0.3)'
  const diagonal = Math.hypot(w, h)
  const passoX = ctx.measureText(MARCA).width + fonte * 2
  for (let y = -diagonal / 2, linha = 0; y <= diagonal / 2; y += fonte * 4, linha++)
    for (let x = -diagonal / 2 + (linha % 2) * (passoX / 2); x <= diagonal / 2; x += passoX) {
      ctx.strokeText(MARCA, x, y)
      ctx.fillText(MARCA, x, y)
    }
  ctx.restore()

  ctx.fillStyle = '#f1f1f1'
  ctx.fillRect(0, h, w, faixa)
  ctx.fillStyle = '#333'
  ctx.font = `${Math.round(faixa * 0.42)}px sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText(textoRodape, faixa * 0.4, h + faixa / 2, w - faixa * 0.8)
  return canvas
}

export const paraBlob = (canvas: HTMLCanvasElement, tipo: 'image/jpeg' | 'image/png') =>
  new Promise<Blob>((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error('canvas vazio'))), tipo, 0.85))
