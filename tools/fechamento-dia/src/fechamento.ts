// Soma do dia a partir dos pagamentos lançados na Fila. Sem tela.
import { FORMAS_PAGAMENTO, saldo, type Fila, type FormaPagamento, type Pagamento, type Pedido } from '@pst/dados'

/** AAAA-MM-DD no fuso do computador (um pagamento às 22h não pode cair no dia seguinte). */
export const diaLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const centavos = (v: number) => Math.round(v * 100) / 100

export function fechamento(fila: Fila, dia: string) {
  const recebimentos: { pedido: Pedido; pagamento: Pagamento }[] = []
  for (const pedido of fila.pedidos)
    for (const pagamento of pedido.pagamentos) if (diaLocal(new Date(pagamento.em)) === dia) recebimentos.push({ pedido, pagamento })
  recebimentos.sort((a, b) => a.pagamento.em.localeCompare(b.pagamento.em))

  const porForma = Object.fromEntries(Object.keys(FORMAS_PAGAMENTO).map((f) => [f, 0])) as Record<FormaPagamento, number>
  for (const { pagamento } of recebimentos) porForma[pagamento.forma] = centavos(porForma[pagamento.forma] + pagamento.valor)
  const total = centavos(recebimentos.reduce((s, r) => s + r.pagamento.valor, 0))

  const entregues = fila.pedidos.filter((p) => p.etapa === 'entregue' && diaLocal(new Date(p.etapaDesde)) === dia)
  // A cobrar: qualquer pedido já entregue que ainda tem saldo, de qualquer dia (dinheiro que saiu pela porta).
  const aCobrar = fila.pedidos.filter((p) => p.etapa === 'entregue' && (saldo(p) ?? 0) > 0)
  return { recebimentos, porForma, total, entregues, aCobrar }
}
