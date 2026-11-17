import { describe, expect, it } from 'vitest'
import { camposUsados, respostasPadrao, validarRespostas } from './texto'

describe('campos digitados', () => {
  it('detecta os usados no texto', () => {
    expect(camposUsados('R$ {valor} para {cliente}')).toEqual(['cliente', 'valor'])
    expect(camposUsados('{loja}')).toEqual([])
  })
})

describe('respostas', () => {
  it('padrão tem ids únicos e passa na validação', () => {
    const r = respostasPadrao()
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length)
    expect(validarRespostas(r)).toEqual(r)
  })
  it('rejeita dado corrompido', () => {
    expect(validarRespostas({})).toBeNull()
    expect(validarRespostas([{ id: 1 }])).toBeNull()
  })
})
