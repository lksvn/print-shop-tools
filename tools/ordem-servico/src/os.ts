// Textos da ordem de serviço e do recibo. Sem tela.
import { reais, saldo, totalPago, type Pedido } from '@pst/dados'

/** Número curto para falar e escrever à mão: 6 primeiros caracteres do id, em maiúsculas. */
export const numeroDoPedido = (id: string) => id.replace(/-/g, '').slice(0, 6).toUpperCase()

export const dataBr = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString('pt-BR')

/** Frase do recibo: o que foi pago até agora, por quem e referente a quê. */
export function fraseRecibo(p: Pedido) {
  const pago = totalPago(p)
  if (pago === 0) return ''
  const falta = saldo(p)
  const quitacao = falta === undefined ? '' : falta > 0 ? ` Falta pagar ${reais(falta)}.` : ' Pedido quitado.'
  return `Recebemos de ${p.cliente} a quantia de ${reais(pago)}, referente a: ${p.descricao || 'pedido'}.${quitacao}`
}
