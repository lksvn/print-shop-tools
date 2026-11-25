// Monta a folha para impressão: copia a página da arte (em vetor) em cada posição e desenha as marcas de corte.
// Sem tela: roda no navegador e no Node (testes), só com pdf-lib.
import { cmyk, degrees, PDFDocument, type PDFPage } from 'pdf-lib'
import { montar, type Folha, type Montagem } from '@pst/dados'

export const MM = 72 / 25.4 // pontos por mm
export type Rotacao = 0 | 90 | 180 | 270 // anti-horário, como no drawPage da pdf-lib
export type Virar = 'lateral' | 'cima' // por qual borda a folha vira no frente e verso
type Caixa = { x: number; y: number; largura: number; altura: number }
type Regras = { sangriaMm: number; espacoMm: number; margemMaquinaMm: number }

// shortcut: estilo das marcas provisório até a pergunta 2 do especialista (comprimento e distância da arte).
const MARCA_DISTANCIA_MM = 1
const MARCA_COMPRIMENTO_MM = 5

const normalizar = (graus: number) => ((((graus % 360) + 360) % 360) as Rotacao)

/**
 * Onde ancorar a página (largura × altura sem girar) para que, girada, ela ocupe exatamente a caixa.
 * A pdf-lib gira em volta do ponto de desenho, então o ponto muda conforme a rotação.
 */
export function ancora(caixa: Caixa, largura: number, altura: number, rotacao: Rotacao) {
  if (rotacao === 90) return { x: caixa.x + altura, y: caixa.y }
  if (rotacao === 180) return { x: caixa.x + largura, y: caixa.y + altura }
  if (rotacao === 270) return { x: caixa.x, y: caixa.y + largura }
  return { x: caixa.x, y: caixa.y }
}

/**
 * Rotação do verso para ele cair de cabeça para cima atrás da frente.
 * Virando pela lateral, esquerda e direita trocam; virando por cima, cima e baixo trocam.
 */
export function rotacaoVerso(girada: boolean, virar: Virar): Rotacao {
  if (virar === 'lateral') return girada ? 270 : 0
  return girada ? 90 : 180
}

type Segmento = { x1: number; y1: number; x2: number; y2: number } // mm, origem no canto de cima à esquerda

/** Marcas de corte só fora do bloco de artes, uma por linha de corte, sem entrar na sangria de ninguém. */
export function marcasDeCorte(m: Montagem, folha: { largura: number; altura: number }, r: Regras): Segmento[] {
  const arte = { largura: m.celula.largura - 2 * r.sangriaMm, altura: m.celula.altura - 2 * r.sangriaMm }
  const cortes = (inicio: number, n: number, celula: number, tamanho: number) => {
    const posicoes = new Set<number>()
    for (let i = 0; i < n; i++) {
      const a = inicio + i * (celula + r.espacoMm) + r.sangriaMm
      posicoes.add(Math.round(a * 1000) / 1000)
      posicoes.add(Math.round((a + tamanho) * 1000) / 1000) // corte encostado no vizinho vira uma marca só
    }
    return [...posicoes]
  }
  const bloco = {
    esquerda: m.inicio.x,
    topo: m.inicio.y,
    direita: m.inicio.x + m.colunas * m.celula.largura + (m.colunas - 1) * r.espacoMm,
    base: m.inicio.y + m.linhas * m.celula.altura + (m.linhas - 1) * r.espacoMm,
  }
  // Trecho de `de` até `ate`, cortado na borda da folha; trecho curto demais não vale a pena.
  const trecho = (de: number, ate: number, limite: number) => {
    const [a, b] = [Math.max(0, Math.min(de, ate)), Math.min(limite, Math.max(de, ate))]
    return b - a >= 1 ? [a, b] : null
  }
  const d = MARCA_DISTANCIA_MM
  const c = MARCA_COMPRIMENTO_MM
  const marcas: Segmento[] = []
  for (const x of cortes(m.inicio.x, m.colunas, m.celula.largura, arte.largura)) {
    for (const t of [trecho(bloco.topo - d, bloco.topo - d - c, folha.altura), trecho(bloco.base + d, bloco.base + d + c, folha.altura)])
      if (t) marcas.push({ x1: x, y1: t[0], x2: x, y2: t[1] })
  }
  for (const y of cortes(m.inicio.y, m.linhas, m.celula.altura, arte.altura)) {
    for (const t of [trecho(bloco.esquerda - d, bloco.esquerda - d - c, folha.largura), trecho(bloco.direita + d, bloco.direita + d + c, folha.largura)])
      if (t) marcas.push({ x1: t[0], y1: y, x2: t[1], y2: y })
  }
  return marcas
}

export type Opcoes = {
  folha: Folha
  regras: Regras
  comSangria: boolean // o PDF já vem com a sangria dos Cadastros em volta da arte
  frenteVerso: boolean // página 2 é o verso
  virar: Virar
}

/** Tamanho visível da página em pt (CropBox, já considerando a rotação da página). */
function tamanhoVisivel(p: PDFPage) {
  const { width, height } = p.getCropBox()
  return p.getRotation().angle % 180 ? { largura: height, altura: width } : { largura: width, altura: height }
}

/** Gera o PDF montado: uma página por lado, do tamanho da folha. */
export async function gerarMontagem(bytes: Uint8Array, o: Opcoes) {
  const origem = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const saida = await PDFDocument.create()
  const folha = { largura: o.folha.larguraMm, altura: o.folha.alturaMm }
  const s = o.regras.sangriaMm
  const recuo = o.comSangria ? 0 : s // sem sangria no arquivo, a arte fica no miolo da célula e a sangria fica branca

  const medida = (p: PDFPage) => {
    const v = tamanhoVisivel(p)
    return { largura: v.largura / MM - (o.comSangria ? 2 * s : 0), altura: v.altura / MM - (o.comSangria ? 2 * s : 0) }
  }
  const paginas = origem.getPageCount()
  const frente = origem.getPage(0)
  const arte = medida(frente)
  const verso = paginas > 1 ? medida(origem.getPage(1)) : null
  // Verso com medida diferente da frente (mais de 1 mm) não casaria no corte.
  const versoDiferente = !!verso && (Math.abs(verso.largura - arte.largura) > 1 || Math.abs(verso.altura - arte.altura) > 1)
  const m = montar(arte, folha, o.regras)
  const info = { montagem: m, arte, paginas, versoDiferente }
  if (m.porFolha === 0) return { ...info, pdf: null }

  const lados: { pagina: PDFPage; rotacao: Rotacao }[] = [{ pagina: frente, rotacao: m.girada ? 90 : 0 }]
  if (o.frenteVerso && origem.getPageCount() > 1) lados.push({ pagina: origem.getPage(1), rotacao: rotacaoVerso(m.girada, o.virar) })

  for (const [i, lado] of lados.entries()) {
    const crop = lado.pagina.getCropBox()
    const forma = await saida.embedPage(lado.pagina, { left: crop.x, bottom: crop.y, right: crop.x + crop.width, top: crop.y + crop.height })
    const pagina = saida.addPage([folha.largura * MM, folha.altura * MM])
    // /Rotate da página é horário; a rotação de desenho é anti-horária.
    const rotacao = normalizar(lado.rotacao - lado.pagina.getRotation().angle)
    // O grid é centralizado na folha, então ao virar a folha cada verso cai atrás de uma frente.
    for (let l = 0; l < m.linhas; l++)
      for (let c = 0; c < m.colunas; c++) {
        const x = m.inicio.x + c * (m.celula.largura + o.regras.espacoMm) + recuo
        const yTopo = m.inicio.y + l * (m.celula.altura + o.regras.espacoMm) + recuo
        const caixa = { largura: m.celula.largura - 2 * recuo, altura: m.celula.altura - 2 * recuo }
        const pdfCaixa = { x: x * MM, y: (folha.altura - yTopo - caixa.altura) * MM, largura: caixa.largura * MM, altura: caixa.altura * MM }
        const p = ancora(pdfCaixa, forma.width, forma.height, rotacao)
        pagina.drawPage(forma, { x: p.x, y: p.y, rotate: degrees(rotacao) })
      }
    if (i === 0)
      for (const mc of marcasDeCorte(m, folha, o.regras))
        pagina.drawLine({
          start: { x: mc.x1 * MM, y: (folha.altura - mc.y1) * MM },
          end: { x: mc.x2 * MM, y: (folha.altura - mc.y2) * MM },
          thickness: 0.5,
          color: cmyk(0, 0, 0, 1), // preto puro: marca em 4 cores borra se o registro da máquina variar
        })
  }
  return { ...info, pdf: await saida.save() }
}
