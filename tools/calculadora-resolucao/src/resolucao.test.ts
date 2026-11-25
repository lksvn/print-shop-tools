import { describe, expect, it } from 'vitest'
import { cmMaximo, dpiEfetivo, fraseParaCliente, pxNecessarios } from './resolucao'

describe('resolução', () => {
  it('1200 px a 300 DPI imprime 10,16 cm', () => {
    expect(cmMaximo(1200, 300)).toBeCloseTo(10.16)
    expect(cmMaximo(0, 300)).toBe(0)
  })

  it('banner de 100 cm a 150 DPI precisa de 5906 px', () => {
    expect(pxNecessarios(100, 150)).toBe(5906)
  })

  it('DPI efetivo: 1200 px em 20 cm dá ~152 DPI', () => {
    expect(dpiEfetivo(1200, 20)).toBeCloseTo(152.4)
  })

  it('frase arredonda para baixo', () => {
    expect(fraseParaCliente(1200, 800, 300)).toContain('até 10,1 × 6,7 cm')
    expect(fraseParaCliente(0, 800, 300)).toBe('')
  })
})
