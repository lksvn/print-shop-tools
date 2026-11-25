import { describe, expect, it } from 'vitest'
import { DADOS_PADRAO } from '@pst/dados'
import { opcoesPorFolha } from './montagem'

const cartao = { largura: 90, altura: 50 }

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
