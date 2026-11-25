import { describe, expect, it } from 'vitest'
import type { Pedido } from '@pst/dados'
import { dataBr, fraseRecibo, numeroDoPedido } from './os'

const pedido = (m: Partial<Pedido> = {}): Pedido => ({
  id: '3f2a9c1e-0000-4000-8000-000000000000',
  cliente: 'Ana',
  telefone: '',
  descricao: '100 cartões',
  valor: 100,
  pagamentos: [],
  etapa: 'aprovado',
  criadoEm: '2026-11-24T12:00:00Z',
  etapaDesde: '2026-11-24T12:00:00Z',
  ...m,
})
const pag = (valor: number) => ({ id: 'x', valor, forma: 'pix' as const, em: '2026-11-24T12:00:00Z' })

describe('ordem de serviço', () => {
  it('número curto', () => {
    expect(numeroDoPedido('3f2a9c1e-0000')).toBe('3F2A9C')
  })

  it('data só com dia não volta um dia por causa do fuso', () => {
    expect(dataBr('2026-11-30')).toBe('30/11/2026')
  })

  it('recibo com sinal, quitado, sem valor combinado e sem pagamento', () => {
    expect(fraseRecibo(pedido({ pagamentos: [pag(40)] }))).toBe('Recebemos de Ana a quantia de R$ 40,00, referente a: 100 cartões. Falta pagar R$ 60,00.')
    expect(fraseRecibo(pedido({ pagamentos: [pag(100)] }))).toContain('Pedido quitado.')
    expect(fraseRecibo(pedido({ valor: undefined, pagamentos: [pag(10)] }))).toBe('Recebemos de Ana a quantia de R$ 10,00, referente a: 100 cartões.')
    expect(fraseRecibo(pedido())).toBe('')
  })
})
