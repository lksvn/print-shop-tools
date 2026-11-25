import { describe, expect, it } from 'vitest'
import { montar } from './montagem'

const A3 = { largura: 297, altura: 420 }
const cartao = { largura: 90, altura: 50 }
const semNada = { sangriaMm: 0, espacoMm: 0, margemMaquinaMm: 0 }

describe('montar', () => {
  it('cartão 9×5 numa A3 sem sangria, espaço ou margem: 24', () => {
    const m = montar(cartao, A3, semNada)
    expect(m.porFolha).toBe(24)
    expect([m.colunas, m.linhas]).toEqual([3, 8])
    expect(m.girada).toBe(false)
  })

  it('com sangria 3, espaço 2 e margem 5 a arte deitada rende mais: 16', () => {
    // em pé: célula 96×56 → 2 × 7 = 14; deitada: 56×96 → 4 × 4 = 16
    const m = montar(cartao, A3, { sangriaMm: 3, espacoMm: 2, margemMaquinaMm: 5 })
    expect(m.porFolha).toBe(16)
    expect(m.girada).toBe(true)
  })

  it('arte maior que a folha não cabe', () => {
    expect(montar({ largura: 500, altura: 700 }, A3, semNada).porFolha).toBe(0)
  })

  it('bloco fica centralizado na folha', () => {
    const m = montar({ largura: 100, altura: 100 }, { largura: 210, altura: 297 }, semNada)
    expect(m.inicio.x).toBe(5) // 2 colunas de 100 em 210
    expect(m.inicio.y).toBeCloseTo(48.5) // 2 linhas de 100 em 297
  })
})
