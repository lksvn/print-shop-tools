import { describe, expect, it } from 'vitest'
import { DADOS_PADRAO } from '@pst/dados'
import { avisosDaPagina, enquadrar, itensDoOrcamento, pontosParaMm, type MedidasPagina } from './analise'

const folhas = DADOS_PADRAO.folhas // A6, A5, A4, A3
const nome = (l: number, a: number, sangria = 3) => enquadrar(l, a, folhas, sangria).folha?.nome ?? null

describe('enquadrar', () => {
  it('exemplos do especialista', () => {
    expect(nome(200, 200)).toBe('A4')
    expect(nome(230, 230)).toBe('A3')
  })
  it('A4 em pé, deitado e com sangria continua A4', () => {
    expect(nome(210, 297)).toBe('A4')
    expect(nome(297, 210)).toBe('A4')
    expect(nome(216, 303)).toBe('A4')
    expect(enquadrar(216, 303, folhas, 3).comSangria).toBe(true)
    expect(enquadrar(210, 297, folhas, 3).comSangria).toBe(false)
  })
  it('arte pequena vai para a menor folha', () => {
    expect(nome(90, 50)).toBe('A6')
    expect(nome(148, 210)).toBe('A5')
  })
  it('23×5 cm cabe deitada na A4 (pendente de confirmação do especialista)', () => {
    expect(nome(230, 50)).toBe('A4')
  })
  it('maior que A3 fica fora da tabela', () => {
    expect(nome(500, 700)).toBeNull()
  })
  it('converte pontos para mm', () => {
    expect(pontosParaMm(595.28)).toBeCloseTo(210, 0)
  })
})

const pagina = (m: Partial<MedidasPagina> = {}): MedidasPagina => ({
  numero: 1,
  larguraMm: 210,
  alturaMm: 297,
  menorDpi: null,
  menorFontePt: null,
  menorDistanciaTextoMm: null,
  tocaBorda: false,
  fontesNaoIncorporadas: [],
  ...m,
})
const producao = DADOS_PADRAO.producao // sangria 3, margem 5, dpi 300, fonte 10
const textos = (m: Partial<MedidasPagina>, sangria = false) =>
  avisosDaPagina(pagina(m), { folha: folhas[2], comSangria: sangria }, producao).map((a) => a.texto)

describe('avisosDaPagina', () => {
  it('página limpa não tem aviso', () => {
    expect(textos({ menorDpi: 300, menorFontePt: 10, menorDistanciaTextoMm: 12 })).toEqual([])
  })
  it('DPI baixo, texto pequeno e fonte não incorporada', () => {
    const t = textos({ menorDpi: 96, menorFontePt: 6, fontesNaoIncorporadas: ['Arial'] })
    expect(t.join(' ')).toMatch(/96 DPI/)
    expect(t.join(' ')).toMatch(/6 pt/)
    expect(t.join(' ')).toMatch(/Arial/)
  })
  it('margem é contada a partir do corte quando o arquivo tem sangria', () => {
    expect(textos({ menorDistanciaTextoMm: 7 }, true).join(' ')).toMatch(/4 mm do corte/)
    expect(textos({ menorDistanciaTextoMm: 7 }, false)).toEqual([])
  })
  it('arte até a borda sem sangria avisa; com sangria não', () => {
    expect(textos({ tocaBorda: true }).join(' ')).toMatch(/sangria/)
    expect(textos({ tocaBorda: true }, true)).toEqual([])
  })
})

describe('itensDoOrcamento', () => {
  it('agrupa páginas por folha e multiplica pelas cópias, ignorando as fora da tabela', () => {
    expect(itensDoOrcamento(['A4', 'A4', 'A3', null], 'Couchê', 10)).toEqual([
      { papel: 'Couchê', folha: 'A4', quantidade: 20 },
      { papel: 'Couchê', folha: 'A3', quantidade: 10 },
    ])
  })
})
