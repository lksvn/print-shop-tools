import { describe, expect, it } from 'vitest'
import { crc16, gerarPix, limparIdentificador, normalizarChave, problemaNaChave } from './brcode'

describe('crc16', () => {
  it('bate com o valor de referência do CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
})

describe('gerarPix', () => {
  it('reproduz o exemplo do manual do Banco Central', () => {
    const codigo = gerarPix({
      tipo: 'aleatoria',
      chave: '123e4567-e12b-12d1-a456-426655440000',
      recebedor: 'Fulano de Tal',
      cidade: 'BRASILIA',
    })
    expect(codigo).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    )
  })

  it('inclui o valor com 2 casas e remove acentos', () => {
    const codigo = gerarPix({ tipo: 'cpf', chave: '123.456.789-01', recebedor: 'Gráfica São João', cidade: 'São Paulo', valor: 15.5 })
    expect(codigo).toContain('540515.50')
    expect(codigo).toContain('5916Grafica Sao Joao')
    expect(codigo).toContain('6009Sao Paulo')
    expect(codigo).toContain('011112345678901')
    expect(crc16(codigo.slice(0, -4))).toBe(codigo.slice(-4))
  })
})

describe('chave', () => {
  it('normaliza por tipo', () => {
    expect(normalizarChave('telefone', '11987654321')).toBe('+5511987654321')
    expect(normalizarChave('cnpj', '12.345.678/0001-99')).toBe('12345678000199')
    expect(normalizarChave('email', ' Contato@Grafica.com ')).toBe('contato@grafica.com')
  })
  it('aponta chave incompleta', () => {
    expect(problemaNaChave('', 'x')).toContain('tipo')
    expect(problemaNaChave('cpf', '123')).toContain('11 dígitos')
    expect(problemaNaChave('email', 'a@b')).toContain('e-mail')
    expect(problemaNaChave('cpf', '12345678901')).toBe('')
  })
  it('identificador só com letras e números', () => {
    expect(limparIdentificador('Pedido #12 – Ana')).toBe('Pedido12Ana')
    expect(limparIdentificador('')).toBe('***')
  })
})
