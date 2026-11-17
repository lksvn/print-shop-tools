import { describe, expect, it } from 'vitest'
import { buscarCep, faltando, formatarCep, formatarCnpj, formatarCpf, preencher, somarDiasUteis, formatarMoeda, formatarTelefone, lerMoeda } from './index'

describe('formatarTelefone', () => {
  it.each([
    ['', ''],
    ['1', '(1'],
    ['119', '(11) 9'],
    ['1132654', '(11) 3265-4'],
    ['1132654321', '(11) 3265-4321'],
    ['11987654321', '(11) 98765-4321'],
    ['(11) 98765-43219999', '(11) 98765-4321'],
  ])('%s → %s', (entrada, saida) => expect(formatarTelefone(entrada)).toBe(saida))
})

describe('moeda', () => {
  it('digitação entra pelos centavos', () => {
    expect(lerMoeda('1')).toBe(0.01)
    expect(lerMoeda('0,015')).toBe(0.15)
    expect(lerMoeda('1,500')).toBe(15)
  })
  it('apagar tudo vira vazio (papel indisponível)', () => {
    expect(lerMoeda('')).toBeUndefined()
    expect(lerMoeda('0,0')).toBeUndefined()
  })
  it('formata em pt-BR', () => {
    expect(formatarMoeda(1234.5)).toBe('1.234,50')
  })
})

describe('cep', () => {
  it('formata com hífen', () => {
    expect(formatarCep('0100')).toBe('0100')
    expect(formatarCep('01001000999')).toBe('01001-000')
  })

  const resposta = (corpo: unknown, ok = true) => (async () => ({ ok, json: async () => corpo })) as unknown as typeof fetch

  it('converte a resposta da ViaCEP', async () => {
    const r = await buscarCep(
      '01001-000',
      resposta({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP', extra: 1 }),
    )
    expect(r).toEqual({ rua: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' })
  })

  it('devolve null para CEP inexistente, erro de rede ou CEP incompleto', async () => {
    expect(await buscarCep('99999999', resposta({ erro: 'true' }))).toBeNull()
    expect(await buscarCep('01001000', resposta({}, false))).toBeNull()
    expect(await buscarCep('01001000', (async () => { throw new Error('offline') }) as unknown as typeof fetch)).toBeNull()
    expect(await buscarCep('0100', resposta({}))).toBeNull()
  })
})

describe('localidades', async () => {
  const { cidadesDe, estados } = await import('./localidades')
  it('27 estados em ordem alfabética', () => {
    expect(estados).toHaveLength(27)
    expect(estados[0].name).toBe('Acre')
  })
  it('cidades por UF', () => {
    expect(cidadesDe('SP').some((c) => c.name === 'São Paulo')).toBe(true)
    expect(cidadesDe('SP').every((c) => c.state === 35)).toBe(true)
    expect(cidadesDe('XX')).toEqual([])
  })
})

describe('cpf e cnpj', () => {
  it('formatam enquanto digita', () => {
    expect(formatarCpf('1234')).toBe('123.4')
    expect(formatarCpf('12345678901')).toBe('123.456.789-01')
    expect(formatarCnpj('12345678000199')).toBe('12.345.678/0001-99')
    expect(formatarCnpj('123456780001999999')).toBe('12.345.678/0001-99')
  })
})

const dia = (iso: string) => new Date(`${iso}T12:00:00`)
const iso = (d: Date) => d.toLocaleDateString('sv-SE')

describe('somarDiasUteis', () => {
  it('pula o fim de semana', () => {
    expect(iso(somarDiasUteis(dia('2026-11-20'), 1))).toBe('2026-11-23') // sexta + 1 → segunda
    expect(iso(somarDiasUteis(dia('2026-11-21'), 1))).toBe('2026-11-23') // sábado + 1 → segunda
    expect(iso(somarDiasUteis(dia('2026-11-17'), 2))).toBe('2026-11-19') // terça + 2 → quinta
  })
  it('vira o mês', () => {
    expect(iso(somarDiasUteis(dia('2026-11-27'), 2))).toBe('2026-12-01')
  })
  it('zero dias é hoje', () => {
    expect(iso(somarDiasUteis(dia('2026-11-17'), 0))).toBe('2026-11-17')
  })
})

describe('preencher', () => {
  it('troca os campos conhecidos e deixa visível o que falta', () => {
    expect(preencher('Olá, {cliente}! Total: R$ {valor}', { cliente: 'Ana' })).toBe('Olá, Ana! Total: R$ {valor}')
  })
  it('lista o que falta preencher, sem repetir', () => {
    expect(faltando('{a} {b} {a}')).toEqual(['{a}', '{b}'])
  })
})
