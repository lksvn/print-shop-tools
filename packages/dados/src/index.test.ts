import { describe, expect, it } from 'vitest'
import { calcularOrcamento, DADOS_PADRAO, ENDERECO_VAZIO, valoresAutomaticos, formatarEndereco, removerFolha, renomearFolha, validarDados } from './index'

describe('validarDados', () => {
  it('aceita os dados padrão', () => {
    expect(validarDados(DADOS_PADRAO)).toEqual(DADOS_PADRAO)
  })

  it('descarta campos desconhecidos', () => {
    const r = validarDados({ ...DADOS_PADRAO, extra: 1 }) as Record<string, unknown>
    expect(r.extra).toBeUndefined()
  })

  it('rejeita preço negativo com mensagem que aponta o campo', () => {
    const ruim = { ...DADOS_PADRAO, papeis: [{ nome: 'X', precos: { A4: -1 } }] }
    expect(() => validarDados(ruim)).toThrow('papeis[0].precos.A4')
  })

  it('rejeita arquivo que não é objeto', () => {
    expect(() => validarDados([])).toThrow('dados')
    expect(() => validarDados(null)).toThrow('dados')
  })
})

describe('folhas', () => {
  const dados = { ...DADOS_PADRAO, papeis: [{ nome: 'Couchê', precos: { A4: 2, A3: 4 } }] }

  it('renomear leva os preços junto', () => {
    const r = renomearFolha(dados, 'A4', 'A4 retrato')
    expect(r.folhas.map((f) => f.nome)).toContain('A4 retrato')
    expect(r.papeis[0].precos).toEqual({ 'A4 retrato': 2, A3: 4 })
  })

  it('remover apaga os preços daquela folha', () => {
    const r = removerFolha(dados, 'A3')
    expect(r.folhas.some((f) => f.nome === 'A3')).toBe(false)
    expect(r.papeis[0].precos).toEqual({ A4: 2 })
  })
})

describe('endereço', () => {
  it('converte o formato antigo (texto) sem perder o conteúdo', () => {
    const antigo = { ...DADOS_PADRAO, loja: { ...DADOS_PADRAO.loja, endereco: 'Rua A, 10' } }
    expect(validarDados(antigo).loja.endereco).toEqual({ ...ENDERECO_VAZIO, rua: 'Rua A, 10' })
  })

  it('formata numa linha, pulando partes vazias', () => {
    const e = { cep: '01001000', rua: 'Praça da Sé', numero: '10', complemento: '', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' }
    expect(formatarEndereco(e)).toBe('Praça da Sé, 10 – Sé, São Paulo/SP')
    expect(formatarEndereco(ENDERECO_VAZIO)).toBe('')
  })
})

describe('pix', () => {
  it('dados antigos sem tipo de chave continuam válidos', () => {
    const { tipo: _tipo, ...semTipo } = DADOS_PADRAO.pix
    expect(validarDados({ ...DADOS_PADRAO, pix: semTipo }).pix.tipo).toBe('')
  })
  it('dados antigos com cidade no Pix continuam válidos (a cidade passa a vir do endereço)', () => {
    const antigo = { ...DADOS_PADRAO, pix: { ...DADOS_PADRAO.pix, cidade: 'Curitiba' } }
    expect(validarDados(antigo).pix).toEqual(DADOS_PADRAO.pix)
  })
  it('rejeita tipo desconhecido', () => {
    expect(() => validarDados({ ...DADOS_PADRAO, pix: { ...DADOS_PADRAO.pix, tipo: 'pis' } })).toThrow('pix.tipo')
  })
})

describe('valoresAutomaticos', () => {
  it('monta o prazo em dias úteis a partir de hoje', () => {
    expect(valoresAutomaticos(DADOS_PADRAO, new Date('2026-11-17T12:00:00')).prazo).toBe('quinta-feira, 19/11')
  })
})

describe('orçamento', () => {
  const dados = {
    ...DADOS_PADRAO,
    papeis: [
      { nome: 'Couchê', precos: { A4: 1.5, A3: 3 } },
      { nome: 'Adesivo', precos: { A3: 4.1 } },
    ],
  }

  it('soma os itens com o preço de cada papel na folha', () => {
    const r = calcularOrcamento(dados, [
      { papel: 'Couchê', folha: 'A4', quantidade: 50 },
      { papel: 'Adesivo', folha: 'A3', quantidade: 3 },
    ])
    expect(r.linhas.map((l) => l.subtotal)).toEqual([75, 12.3])
    expect(r.total).toBe(87.3)
    expect(r.semPreco).toEqual([])
  })

  it('arredonda em centavos (sem 0,1 + 0,2)', () => {
    const d = { ...dados, papeis: [{ nome: 'X', precos: { A4: 0.1 } }] }
    expect(calcularOrcamento(d, [{ papel: 'X', folha: 'A4', quantidade: 3 }]).total).toBe(0.3)
  })

  it('item sem preço fica fora do total e é avisado', () => {
    const r = calcularOrcamento(dados, [{ papel: 'Adesivo', folha: 'A4', quantidade: 10 }])
    expect(r.total).toBe(0)
    expect(r.semPreco).toHaveLength(1)
  })
})
