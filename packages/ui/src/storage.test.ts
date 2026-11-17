import { describe, expect, it } from 'vitest'
import { carregar, salvar } from './storage'

function memoria() {
  const dados = new Map<string, string>()
  return { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => void dados.set(k, v) }
}

describe('storage', () => {
  it('devolve o padrão quando não há nada salvo', () => {
    expect(carregar('x', { a: 1 }, memoria())).toEqual({ a: 1 })
  })

  it('salva e carrega, mesclando campos novos do padrão', () => {
    const m = memoria()
    salvar('x', { a: 2 }, m)
    expect(carregar('x', { a: 1, b: 3 }, m)).toEqual({ a: 2, b: 3 })
  })

  it('devolve o padrão quando o JSON salvo está corrompido', () => {
    const m = memoria()
    m.setItem('x', '{quebrado')
    expect(carregar('x', { a: 1 }, m)).toEqual({ a: 1 })
  })
})
