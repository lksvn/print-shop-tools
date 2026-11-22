// Lê o PDF no navegador com pdf.js e devolve as medidas de cada página. O arquivo não sai do computador.
import { getDocument, GlobalWorkerOptions, OPS, type PDFPageProxy } from 'pdfjs-dist'
import urlDoWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { pontosParaMm, type MedidasPagina } from './analise'

GlobalWorkerOptions.workerSrc = urlDoWorker

type Matriz = [number, number, number, number, number, number]
const multiplicar = (m: Matriz, n: Matriz): Matriz => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]

/** Pior DPI entre as imagens: pixels da imagem ÷ tamanho em que ela é desenhada (em polegadas). */
async function dpiEFontes(pagina: PDFPageProxy) {
  const { fnArray, argsArray } = await pagina.getOperatorList()
  let atual: Matriz = [1, 0, 0, 1, 0, 0]
  const pilha: Matriz[] = []
  let menorDpi: number | null = null
  const fontes = new Set<string>()

  fnArray.forEach((fn, i) => {
    const args = argsArray[i]
    if (fn === OPS.save) pilha.push(atual)
    else if (fn === OPS.restore) atual = pilha.pop() ?? atual
    else if (fn === OPS.transform) atual = multiplicar(atual, args as Matriz)
    else if (fn === OPS.paintFormXObjectBegin) {
      pilha.push(atual)
      if (args[0]) atual = multiplicar(atual, args[0] as Matriz)
    } else if (fn === OPS.paintFormXObjectEnd) atual = pilha.pop() ?? atual
    else if (fn === OPS.setFont) fontes.add(args[0] as string)
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      // shortcut: ignora imagens agrupadas pelo pdf.js (paintImageXObjectRepeat / grupos inline), raras em arquivos de cliente.
      const [px, py] = fn === OPS.paintImageXObject ? [args[1], args[2]] : [args[0].width, args[0].height]
      const larguraPol = Math.hypot(atual[0], atual[1]) / 72
      const alturaPol = Math.hypot(atual[2], atual[3]) / 72
      if (larguraPol > 0 && alturaPol > 0) {
        const dpi = Math.min(px / larguraPol, py / alturaPol)
        menorDpi = menorDpi === null ? dpi : Math.min(menorDpi, dpi)
      }
    }
  })

  // Depois do getOperatorList, as fontes usadas ficam em commonObjs; missingFile = não veio dentro do PDF.
  const naoIncorporadas = [...fontes]
    .map((id) => (pagina.commonObjs.has(id) ? pagina.commonObjs.get(id) : null))
    .filter((f) => f?.missingFile)
    .map((f) => String(f.name || f.fallbackName || 'sem nome').replace(/^[A-Z]{6}\+/, ''))
  return { menorDpi, fontesNaoIncorporadas: [...new Set(naoIncorporadas)] }
}

/** Menor texto (pt) e menor distância de um texto até a borda da página (mm). */
async function textos(pagina: PDFPageProxy) {
  const [x0, y0, x1, y1] = pagina.view
  const { items } = await pagina.getTextContent()
  let menorFontePt: number | null = null
  let menorDistancia: number | null = null
  for (const item of items) {
    if (!('str' in item) || !item.str.trim()) continue
    const [, , c, d, x, y] = item.transform
    const tamanho = Math.hypot(c, d)
    menorFontePt = menorFontePt === null ? tamanho : Math.min(menorFontePt, tamanho)
    // shortcut: considera texto horizontal; texto girado pode medir a distância errada.
    const distancia = Math.min(x - x0, x1 - (x + item.width), y - y0, y1 - (y + item.height))
    menorDistancia = menorDistancia === null ? distancia : Math.min(menorDistancia, distancia)
  }
  return { menorFontePt, menorDistanciaTextoMm: menorDistancia === null ? null : Math.max(0, pontosParaMm(menorDistancia)) }
}

/** Desenha a página pequena e vê se há algo não branco na faixa de 1 mm da borda (arte que vai até o corte). */
async function tocaBorda(pagina: PDFPageProxy) {
  const viewport = pagina.getViewport({ scale: 1 }) // 1 px = 1 pt ≈ 0,35 mm
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await pagina.render({ canvas, canvasContext: ctx, viewport }).promise
  const faixa = 3 // px ≈ 1 mm
  const { width: w, height: h } = canvas
  const pixels = ctx.getImageData(0, 0, w, h).data
  const naoBranco = (x: number, y: number) => {
    const i = (y * w + x) * 4
    return pixels[i] < 240 || pixels[i + 1] < 240 || pixels[i + 2] < 240
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (x >= faixa && x < w - faixa && y >= faixa && y < h - faixa) x = w - faixa // pula o miolo
      if (naoBranco(x, y)) return true
    }
  return false
}

export async function lerPdf(arquivo: File, aoProgredir: (pagina: number, total: number) => void): Promise<MedidasPagina[]> {
  // fontExtraProperties: traz o nome real da fonte (ex.: Helvetica) para o aviso de fonte não incorporada.
  const tarefa = getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()), fontExtraProperties: true })
  const pdf = await tarefa.promise
  const paginas: MedidasPagina[] = []
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      aoProgredir(n, pdf.numPages)
      const pagina = await pdf.getPage(n)
      const viewport = pagina.getViewport({ scale: 1 }) // já considera a rotação da página
      paginas.push({
        numero: n,
        larguraMm: pontosParaMm(viewport.width),
        alturaMm: pontosParaMm(viewport.height),
        ...(await dpiEFontes(pagina)),
        ...(await textos(pagina)),
        tocaBorda: await tocaBorda(pagina),
      })
      pagina.cleanup()
    }
  } finally {
    await tarefa.destroy()
  }
  return paginas
}
