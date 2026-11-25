import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { montar } from '@pst/dados'
import { ancora, gerarMontagem, marcasDeCorte, MM, rotacaoVerso, type Rotacao } from './montagem'

describe('ancora', () => {
  // Gira os 4 cantos da página como a pdf-lib faz (em volta do ponto de desenho) e confere que caem na caixa.
  for (const r of [0, 90, 180, 270] as Rotacao[])
    it(`página girada ${r}° ocupa exatamente a caixa`, () => {
      const [w, h] = [100, 60]
      const caixa = r % 180 ? { x: 10, y: 20, largura: h, altura: w } : { x: 10, y: 20, largura: w, altura: h }
      const p = ancora(caixa, w, h, r)
      const rad = (r * Math.PI) / 180
      const cantos = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ].map(([x, y]) => [p.x + x * Math.cos(rad) - y * Math.sin(rad), p.y + x * Math.sin(rad) + y * Math.cos(rad)])
      const xs = cantos.map((c) => c[0])
      const ys = cantos.map((c) => c[1])
      expect(Math.min(...xs)).toBeCloseTo(caixa.x)
      expect(Math.max(...xs)).toBeCloseTo(caixa.x + caixa.largura)
      expect(Math.min(...ys)).toBeCloseTo(caixa.y)
      expect(Math.max(...ys)).toBeCloseTo(caixa.y + caixa.altura)
    })
})

describe('rotacaoVerso', () => {
  it('em pé: pela lateral não gira, por cima vira de ponta-cabeça', () => {
    expect(rotacaoVerso(false, 'lateral')).toBe(0)
    expect(rotacaoVerso(false, 'cima')).toBe(180)
  })
  it('deitada: o verso gira para o lado oposto da frente ao virar pela lateral', () => {
    expect(rotacaoVerso(true, 'lateral')).toBe(270)
    expect(rotacaoVerso(true, 'cima')).toBe(90)
  })
})

describe('marcasDeCorte', () => {
  it('cortes encostados viram uma marca só, e as marcas ficam fora do bloco', () => {
    const regras = { sangriaMm: 0, espacoMm: 0, margemMaquinaMm: 10 }
    const folha = { largura: 297, altura: 420 }
    const m = montar({ largura: 90, altura: 50 }, folha, regras) // 3 colunas × 8 linhas
    const marcas = marcasDeCorte(m, folha, regras)
    // 4 cortes verticais × (cima + baixo) + 9 horizontais × (esquerda + direita)
    expect(marcas).toHaveLength(26)
    for (const mc of marcas) {
      const dentroX = Math.min(mc.x1, mc.x2) > m.inicio.x && Math.max(mc.x1, mc.x2) < m.inicio.x + 270
      const dentroY = Math.min(mc.y1, mc.y2) > m.inicio.y && Math.max(mc.y1, mc.y2) < m.inicio.y + 400
      expect(dentroX && dentroY).toBe(false)
    }
  })

  it('sem espaço na borda da folha, não desenha marca', () => {
    const regras = { sangriaMm: 0, espacoMm: 0, margemMaquinaMm: 0 }
    const folha = { largura: 100, altura: 100 }
    expect(marcasDeCorte(montar({ largura: 100, altura: 100 }, folha, regras), folha, regras)).toHaveLength(0)
  })
})

async function pdfDeTeste(paginas: [number, number][]) {
  const doc = await PDFDocument.create()
  for (const [w, h] of paginas) doc.addPage([w * MM, h * MM]).drawRectangle({ x: 0, y: 0, width: w * MM, height: h * MM })
  return doc.save()
}

const A3 = { nome: 'A3', larguraMm: 297, alturaMm: 420 }
const regras = { sangriaMm: 3, espacoMm: 2, margemMaquinaMm: 5 }

describe('gerarMontagem', () => {
  it('cartão 9×5 sem sangria no arquivo: 16 por A3, arte deitada, uma página do tamanho da folha', async () => {
    const r = await gerarMontagem(await pdfDeTeste([[90, 50]]), { folha: A3, regras, comSangria: false, frenteVerso: false, virar: 'lateral' })
    expect(r.montagem.porFolha).toBe(16)
    expect(r.montagem.girada).toBe(true)
    const saida = await PDFDocument.load(r.pdf!)
    expect(saida.getPageCount()).toBe(1)
    expect(saida.getPage(0).getWidth() / MM).toBeCloseTo(297)
    expect(saida.getPage(0).getHeight() / MM).toBeCloseTo(420)
  })

  it('arquivo com sangria: a arte final desconta a sangria dos dois lados', async () => {
    const r = await gerarMontagem(await pdfDeTeste([[96, 56]]), { folha: A3, regras, comSangria: true, frenteVerso: false, virar: 'lateral' })
    expect(r.arte.largura).toBeCloseTo(90)
    expect(r.arte.altura).toBeCloseTo(50)
    expect(r.montagem.porFolha).toBe(16)
  })

  it('frente e verso: duas páginas; verso de outro tamanho é apontado', async () => {
    const ok = await gerarMontagem(await pdfDeTeste([[90, 50], [90, 50]]), { folha: A3, regras, comSangria: false, frenteVerso: true, virar: 'lateral' })
    expect((await PDFDocument.load(ok.pdf!)).getPageCount()).toBe(2)
    expect(ok.versoDiferente).toBe(false)
    const torto = await gerarMontagem(await pdfDeTeste([[90, 50], [85, 50]]), { folha: A3, regras, comSangria: false, frenteVerso: true, virar: 'lateral' })
    expect(torto.versoDiferente).toBe(true)
  })

  it('arte maior que a folha: sem PDF', async () => {
    const r = await gerarMontagem(await pdfDeTeste([[500, 700]]), { folha: A3, regras, comSangria: false, frenteVerso: false, virar: 'lateral' })
    expect(r.pdf).toBeNull()
  })
})
