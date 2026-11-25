import { describe, expect, it } from 'vitest'
import type { Pedido } from '@pst/dados'
import { diaLocal, fechamento } from './fechamento'

// Datas montadas no fuso local, para o teste valer em qualquer computador.
const em = (dia: number, hora: number) => new Date(2026, 10, dia, hora).toISOString()
const pag = (valor: number, forma: 'pix' | 'dinheiro', dia: number, hora = 10) => ({ id: crypto.randomUUID(), valor, forma, em: em(dia, hora) })
const pedido = (m: Partial<Pedido>): Pedido => ({
  id: crypto.randomUUID(),
  cliente: 'Ana',
  telefone: '',
  descricao: '',
  pagamentos: [],
  etapa: 'producao',
  criadoEm: em(20, 9),
  etapaDesde: em(20, 9),
  ...m,
})

describe('fechamento', () => {
  const fila = {
    diasAlerta: 3,
    ultimoBackup: null,
    pedidos: [
      pedido({ valor: 100, pagamentos: [pag(40, 'pix', 24), pag(60.1, 'dinheiro', 25, 22)] }),
      pedido({ valor: 50, etapa: 'entregue', etapaDesde: em(25, 16), pagamentos: [pag(20.2, 'pix', 25)] }),
      pedido({ valor: 30, etapa: 'entregue', etapaDesde: em(22, 16), pagamentos: [pag(30, 'pix', 22)] }),
    ],
  }

  it('soma só os pagamentos do dia, por forma, incluindo o das 22h', () => {
    const f = fechamento(fila, '2026-11-25')
    expect(f.total).toBe(80.3)
    expect(f.porForma.pix).toBe(20.2)
    expect(f.porForma.dinheiro).toBe(60.1)
    expect(f.recebimentos).toHaveLength(2)
  })

  it('entregues no dia e entregues com saldo em aberto', () => {
    const f = fechamento(fila, '2026-11-25')
    expect(f.entregues).toHaveLength(1)
    expect(f.aCobrar.map((p) => p.valor)).toEqual([50])
  })

  it('dia local', () => {
    expect(diaLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
