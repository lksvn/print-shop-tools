import { describe, expect, it } from 'vitest'
import { DADOS_PADRAO, type Dados } from '@pst/dados'
import { custoDasFolhas, faixasComPreco, novoProduto, validarProdutos } from './produtos'

const dados: Dados = {
  ...DADOS_PADRAO,
  producao: { ...DADOS_PADRAO.producao, sangriaMm: 3, espacoMm: 2, margemMaquinaMm: 5 },
  papeis: [{ nome: 'Couchê', precos: { A4: 1.2, A3: 1.8 } }],
}

describe('produtos', () => {
  it('valida e rejeita faixa sem quantidade', () => {
    const p = novoProduto('Couchê')
    expect(validarProdutos([p])).toEqual([p])
    expect(validarProdutos([{ ...p, faixas: [{ quantidade: 0, preco: 1 }] }])).toBeNull()
    expect(validarProdutos({})).toBeNull()
  })

  it('só faixas com preço entram no orçamento, em ordem', () => {
    const p = { ...novoProduto('Couchê'), faixas: [{ quantidade: 500, preco: 90 }, { quantidade: 100, preco: 30 }, { quantidade: 250, preco: 0 }] }
    expect(faixasComPreco(p).map((f) => f.quantidade)).toEqual([100, 500])
  })

  it('custo das folhas: 100 cartões cabem 16 por A3 → 7 folhas a R$ 1,80', () => {
    expect(custoDasFolhas(dados, novoProduto('Couchê'), 100)).toEqual({ folha: 'A3', folhas: 7, custo: 12.6 })
  })

  it('papel sem preço não tem custo', () => {
    expect(custoDasFolhas(dados, novoProduto('Outro'), 100)).toBeUndefined()
  })
})
