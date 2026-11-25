import { describe, expect, it } from 'vitest'
import { folhaAberta, folhaParaImprimir, ordemDasPaginas, paginasDoLivreto, paineis } from './contas'

const FOLHAS = [
  { nome: 'A5', larguraMm: 148, alturaMm: 210 },
  { nome: 'A4', larguraMm: 210, alturaMm: 297 },
  { nome: 'A3', larguraMm: 297, alturaMm: 420 },
]

describe('paginasDoLivreto', () => {
  it('arredonda para múltiplo de 4 e conta as em branco', () => {
    expect(paginasDoLivreto(12)).toEqual({ total: 12, emBranco: 0, folhas: 3 })
    expect(paginasDoLivreto(10)).toEqual({ total: 12, emBranco: 2, folhas: 3 })
    expect(paginasDoLivreto(1)).toEqual({ total: 4, emBranco: 3, folhas: 1 })
  })
})

describe('ordemDasPaginas', () => {
  it('8 páginas: capa com contracapa na folha de fora, miolo na de dentro', () => {
    expect(ordemDasPaginas(8)).toEqual([
      { frente: [8, 1], verso: [2, 7] },
      { frente: [6, 3], verso: [4, 5] },
    ])
  })

  it('cada página aparece uma vez só, e cada lado soma total + 1', () => {
    const total = 24
    const folhas = ordemDasPaginas(total)
    const todas = folhas.flatMap((f) => [...f.frente, ...f.verso]).sort((a, b) => a - b)
    expect(todas).toEqual(Array.from({ length: total }, (_, i) => i + 1))
    for (const f of folhas) {
      expect(f.frente[0] + f.frente[1]).toBe(total + 1)
      expect(f.verso[0] + f.verso[1]).toBe(total + 1)
    }
  })
})

describe('folhaParaImprimir', () => {
  it('livreto A5 abre em A4 e imprime sem refile (aceita 148,5 mm)', () => {
    const r = folhaParaImprimir(folhaAberta({ largura: 148.5, altura: 210 }), FOLHAS, 3, 5)
    expect(r).toEqual({ folha: FOLHAS[1], refile: false })
  })

  it('tamanho fora do padrão vai para a menor folha em que cabe com sangria e margem', () => {
    // 200×200 fechado → 400×200 aberto + 16 mm → 416×216 cabe na A3
    expect(folhaParaImprimir(folhaAberta({ largura: 200, altura: 200 }), FOLHAS, 3, 5)).toEqual({ folha: FOLHAS[2], refile: true })
  })

  it('maior que todas: nenhuma', () => {
    expect(folhaParaImprimir(folhaAberta({ largura: 297, altura: 420 }), FOLHAS, 3, 5)).toBeNull()
  })
})

describe('paineis', () => {
  const A4 = { largura: 210, altura: 297 }
  it('ao meio no lado maior: A4 vira dois A5', () => {
    expect(paineis('meio', A4)).toEqual({ larguras: [148.5, 148.5], altura: 210, dobras: [148.5] })
  })

  it('sanfona: três iguais', () => {
    const p = paineis('sanfona', A4)
    expect(p.larguras.every((l) => Math.abs(l - 99) < 1e-9)).toBe(true)
    expect(p.dobras[0]).toBeCloseTo(99)
    expect(p.dobras[1]).toBeCloseTo(198)
  })

  it('carteira: o painel de dentro é 2 mm menor e tudo soma a folha', () => {
    const p = paineis('carteira', A4)
    expect(p.larguras[0]).toBeCloseTo(p.larguras[2] + 2)
    expect(p.larguras.reduce((s, l) => s + l, 0)).toBeCloseTo(297)
  })
})
