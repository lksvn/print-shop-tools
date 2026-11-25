import { describe, expect, it } from 'vitest'
import { DADOS_PADRAO, type Dados } from '@pst/dados'
import { montarTabela, rodape } from './tabela'

const dados: Dados = {
  ...DADOS_PADRAO,
  folhas: [
    { nome: 'A5', larguraMm: 148, alturaMm: 210 },
    { nome: 'A4', larguraMm: 210, alturaMm: 297 },
    { nome: 'A3', larguraMm: 297, alturaMm: 420 },
  ],
  papeis: [
    { nome: 'Couchê', precos: { A4: 2.5, A3: 4.5 } },
    { nome: 'Sulfite', precos: { A5: 0.25, A4: 0.4 } },
    { nome: 'Sem preço', precos: {} },
  ],
}

describe('montarTabela', () => {
  it('papéis sem preço saem; célula sem preço fica undefined', () => {
    const t = montarTabela(dados, [])
    expect(t.folhas.map((f) => f.nome)).toEqual(['A5', 'A4', 'A3'])
    expect(t.linhas).toEqual([
      { papel: 'Couchê', precos: [undefined, 2.5, 4.5] },
      { papel: 'Sulfite', precos: [0.25, 0.4, undefined] },
    ])
  })

  it('papel oculto some, e a folha que só ele usava também', () => {
    const t = montarTabela(dados, ['Sulfite'])
    expect(t.folhas.map((f) => f.nome)).toEqual(['A4', 'A3'])
    expect(t.linhas).toEqual([{ papel: 'Couchê', precos: [2.5, 4.5] }])
  })
})

describe('rodape', () => {
  it('pula campos vazios da loja e sempre traz a data', () => {
    const linhas = rodape(DADOS_PADRAO, new Date(2026, 10, 25))
    expect(linhas).toEqual(['Preços válidos em 25/11/2026. Valores por folha impressa.'])
  })
})
