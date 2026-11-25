import { describe, expect, it } from 'vitest'
import { carregarFila, diasDesde, FILA_PADRAO, mover, parado, precisaBackup, saldo, totalPago, validarFila, type Pedido } from './pedidos'

const agora = new Date('2026-11-24T12:00:00Z')
const pedido = (m: Partial<Pedido> = {}): Pedido => ({
  id: 'a',
  cliente: 'Ana',
  telefone: '41999998888',
  descricao: '100 cartões',
  pagamentos: [],
  etapa: 'orcamento',
  criadoEm: '2026-11-20T12:00:00Z',
  etapaDesde: '2026-11-20T12:00:00Z',
  ...m,
})

describe('dias parado', () => {
  it('conta dias inteiros', () => {
    expect(diasDesde('2026-11-20T12:00:00Z', agora)).toBe(4)
    expect(diasDesde('2026-11-24T08:00:00Z', agora)).toBe(0)
  })
  it('avisa a partir do limite, menos para entregue', () => {
    expect(parado(pedido(), 3, agora)).toBe(true)
    expect(parado(pedido(), 5, agora)).toBe(false)
    expect(parado(pedido({ etapa: 'entregue' }), 1, agora)).toBe(false)
  })
})

describe('mover', () => {
  it('avança e volta uma etapa e zera o tempo parado', () => {
    const p = mover(pedido(), 1, agora)
    expect(p.etapa).toBe('aprovado')
    expect(p.etapaDesde).toBe(agora.toISOString())
    expect(mover(pedido(), -1, agora).etapa).toBe('arquivo')
  })
  it('não passa das pontas', () => {
    expect(mover(pedido({ etapa: 'arquivo' }), -1, agora).etapa).toBe('arquivo')
    expect(mover(pedido({ etapa: 'entregue' }), 1, agora).etapa).toBe('entregue')
  })
})

describe('backup', () => {
  it('pede backup com pedidos e sem exportar há mais de 7 dias', () => {
    expect(precisaBackup(FILA_PADRAO, agora)).toBe(false)
    expect(precisaBackup({ ...FILA_PADRAO, pedidos: [pedido()] }, agora)).toBe(true)
    expect(precisaBackup({ ...FILA_PADRAO, pedidos: [pedido()], ultimoBackup: '2026-11-20T12:00:00Z' }, agora)).toBe(false)
    expect(precisaBackup({ ...FILA_PADRAO, pedidos: [pedido()], ultimoBackup: '2026-11-10T12:00:00Z' }, agora)).toBe(true)
  })
})

describe('validarFila', () => {
  it('aceita fila válida e limpa o telefone', () => {
    const f = validarFila({ pedidos: [pedido({ telefone: '(41) 99999-8888' })], diasAlerta: 2, ultimoBackup: null })
    expect(f?.pedidos[0].telefone).toBe('41999998888')
    expect(f?.diasAlerta).toBe(2)
  })
  it('rejeita etapa desconhecida, data inválida ou valor negativo', () => {
    expect(validarFila({ pedidos: [pedido({ etapa: 'x' as never })] })).toBeNull()
    expect(validarFila({ pedidos: [pedido({ criadoEm: 'ontem' })] })).toBeNull()
    expect(validarFila({ pedidos: [pedido({ valor: -1 })] })).toBeNull()
    expect(validarFila({ respostas: [] })).toBeNull()
  })
})

describe('pagamentos', () => {
  const pag = (valor: number, forma = 'pix') => ({ id: crypto.randomUUID(), valor, forma, em: '2026-11-24T10:00:00Z' })

  it('pedido antigo, sem pagamentos, continua válido', () => {
    const { pagamentos, ...antigo } = pedido()
    expect(pagamentos).toEqual([])
    expect(validarFila({ pedidos: [antigo] })?.pedidos[0].pagamentos).toEqual([])
  })

  it('rejeita pagamento zerado, sem data ou com forma desconhecida', () => {
    expect(validarFila({ pedidos: [pedido({ pagamentos: [pag(0)] as never })] })).toBeNull()
    expect(validarFila({ pedidos: [pedido({ pagamentos: [{ ...pag(10), em: 'ontem' }] as never })] })).toBeNull()
    expect(validarFila({ pedidos: [pedido({ pagamentos: [pag(10, 'cheque')] as never })] })).toBeNull()
  })

  it('soma o pago e calcula o saldo sem ficar negativo', () => {
    const p = validarFila({ pedidos: [pedido({ valor: 100, pagamentos: [pag(30.1), pag(20.2, 'dinheiro')] as never })] })!.pedidos[0]
    expect(totalPago(p)).toBe(50.3)
    expect(saldo(p)).toBe(49.7)
    expect(saldo({ ...p, valor: 40 })).toBe(0)
    expect(saldo({ ...p, valor: undefined })).toBeUndefined()
  })

  it('prazo só no formato de data e observação vazia some', () => {
    const p = validarFila({ pedidos: [pedido({ prazo: '2026-11-30', observacoes: '  ' })] })!.pedidos[0]
    expect(p.prazo).toBe('2026-11-30')
    expect(p.observacoes).toBeUndefined()
    expect(validarFila({ pedidos: [pedido({ prazo: 'amanhã' })] })!.pedidos[0].prazo).toBeUndefined()
  })
})

describe('carregarFila', () => {
  const de = (v: string | null) => ({ getItem: () => v })
  it('vazio é fila nova; estragado avisa sem perder nada', () => {
    expect(carregarFila(de(null))).toEqual({ fila: FILA_PADRAO, estragado: false })
    expect(carregarFila(de('{')).estragado).toBe(true)
    expect(carregarFila(de('{"pedidos":"x"}')).estragado).toBe(true)
  })
})
