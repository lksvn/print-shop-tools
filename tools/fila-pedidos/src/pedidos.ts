// Regras da fila de pedidos, sem tela: etapas, validação do que é salvo e dias parado.

export const ETAPAS = [
  { id: 'arquivo', nome: 'Aguardando arquivo' },
  { id: 'orcamento', nome: 'Orçamento enviado' },
  { id: 'aprovado', nome: 'Aprovado / pago' },
  { id: 'producao', nome: 'Em produção' },
  { id: 'pronto', nome: 'Pronto' },
  { id: 'entregue', nome: 'Entregue' },
] as const
export type Etapa = (typeof ETAPAS)[number]['id']

export type Pedido = {
  id: string
  cliente: string
  telefone: string // só dígitos
  descricao: string
  valor?: number
  etapa: Etapa
  criadoEm: string // ISO
  etapaDesde: string // ISO: quando entrou na etapa atual
}

export type Fila = { pedidos: Pedido[]; diasAlerta: number; ultimoBackup: string | null }
export const FILA_PADRAO: Fila = { pedidos: [], diasAlerta: 3, ultimoBackup: null }

const DIA = 24 * 60 * 60 * 1000
export const diasDesde = (iso: string, agora = new Date()) => Math.floor((agora.getTime() - new Date(iso).getTime()) / DIA)

/** Parado demais: passou do limite numa etapa que ainda depende de alguém agir (entregue não conta). */
export const parado = (p: Pedido, diasAlerta: number, agora = new Date()) =>
  p.etapa !== 'entregue' && diasDesde(p.etapaDesde, agora) >= diasAlerta

export function mover(p: Pedido, direcao: -1 | 1, agora = new Date()): Pedido {
  const i = ETAPAS.findIndex((e) => e.id === p.etapa) + direcao
  if (i < 0 || i >= ETAPAS.length) return p
  return { ...p, etapa: ETAPAS[i].id, etapaDesde: agora.toISOString() }
}

/** Backup velho: há pedidos e nunca exportou, ou exportou há mais de 7 dias. */
export const precisaBackup = (f: Fila, agora = new Date()) =>
  f.pedidos.length > 0 && (!f.ultimoBackup || diasDesde(f.ultimoBackup, agora) > 7)

const etapaValida = (v: unknown): v is Etapa => ETAPAS.some((e) => e.id === v)
const dataValida = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

/** Valida o que veio do localStorage ou de um .json importado. Devolve null se algo estiver errado. */
export function validarFila(entrada: unknown): Fila | null {
  if (typeof entrada !== 'object' || entrada === null) return null
  const f = entrada as Record<string, unknown>
  if (!Array.isArray(f.pedidos)) return null
  const pedidos: Pedido[] = []
  for (const p of f.pedidos as Record<string, unknown>[]) {
    if (!p || typeof p.id !== 'string' || typeof p.cliente !== 'string' || typeof p.descricao !== 'string') return null
    if (!etapaValida(p.etapa) || !dataValida(p.criadoEm) || !dataValida(p.etapaDesde)) return null
    if (p.valor !== undefined && (typeof p.valor !== 'number' || !(p.valor >= 0))) return null
    pedidos.push({
      id: p.id,
      cliente: p.cliente,
      telefone: typeof p.telefone === 'string' ? p.telefone.replace(/\D/g, '') : '',
      descricao: p.descricao,
      valor: p.valor as number | undefined,
      etapa: p.etapa,
      criadoEm: p.criadoEm,
      etapaDesde: p.etapaDesde,
    })
  }
  const diasAlerta = typeof f.diasAlerta === 'number' && f.diasAlerta >= 1 ? Math.floor(f.diasAlerta) : FILA_PADRAO.diasAlerta
  const ultimoBackup = dataValida(f.ultimoBackup) ? f.ultimoBackup : null
  return { pedidos, diasAlerta, ultimoBackup }
}

/** Mensagem curta para o cliente em cada etapa (abre no WhatsApp; o atendente ajusta antes de enviar). */
export const MENSAGEM: Record<Etapa, (cliente: string) => string> = {
  arquivo: (c) => `Olá, ${c}! Pode mandar o arquivo por aqui, de preferência em PDF.`,
  orcamento: (c) => `Olá, ${c}! Conseguiu ver o orçamento? Qualquer dúvida, é só chamar.`,
  aprovado: (c) => `Olá, ${c}! Pedido aprovado, já vamos para a produção.`,
  producao: (c) => `Olá, ${c}! Seu pedido está em produção.`,
  pronto: (c) => `Olá, ${c}! Seu pedido está pronto para retirar.`,
  entregue: (c) => `Olá, ${c}! Obrigado pela preferência.`,
}
