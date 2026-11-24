import { describe, expect, it } from 'vitest'
import { DADOS_PADRAO } from '@pst/dados'
import { montar, opcoesPorFolha } from './montagem'

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

describe('opcoesPorFolha', () => {
  const dados = {
    ...DADOS_PADRAO,
    producao: { ...DADOS_PADRAO.producao, sangriaMm: 0, espacoMm: 0, margemMaquinaMm: 0 },
    papeis: [{ nome: 'Couchê', precos: { A4: 1.2, A3: 1.8 } }],
  }

  it('calcula folhas, total e unidade; a mais barata fica marcada', () => {
    const { opcoes, melhor } = opcoesPorFolha(dados, cartao, 100, 'Couchê')
    const a4 = opcoes.find((o) => o.folha.nome === 'A4')!
    const a3 = opcoes.find((o) => o.folha.nome === 'A3')!
    expect([a4.montagem.porFolha, a4.folhas, a4.total]).toEqual([12, 9, 10.8]) // deitado: 4 × 3 por A4
    expect([a3.montagem.porFolha, a3.folhas, a3.total]).toEqual([24, 5, 9])
    expect(opcoes[melhor].folha.nome).toBe('A3')
    expect(a3.unitario).toBe(0.09)
  })

  it('folha sem preço para o papel fica sem total e não é escolhida', () => {
    const { opcoes, melhor } = opcoesPorFolha(dados, cartao, 100, 'Couchê')
    expect(opcoes.find((o) => o.folha.nome === 'A6')!.total).toBeUndefined()
    expect(melhor).toBeGreaterThanOrEqual(0)
  })
})
