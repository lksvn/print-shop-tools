// Pedidos da Fila, sem tela: etapas, pagamentos, validação do que é salvo e dias parado.
// Ficam em @pst/dados porque três ferramentas leem os pedidos: Fila (edita), Ordem de serviço e Fechamento do dia (só leem).

export const CHAVE_FILA = 'pst:fila-pedidos:v1'

export const ETAPAS = [
  { id: 'arquivo', nome: 'Aguardando arquivo' },
  { id: 'orcamento', nome: 'Orçamento enviado' },
  { id: 'aprovado', nome: 'Aprovado / pago' },
  { id: 'producao', nome: 'Em produção' },
  { id: 'pronto', nome: 'Pronto' },
  { id: 'entregue', nome: 'Entregue' },
] as const
export type Etapa = (typeof ETAPAS)[number]['id']

// shortcut: formas comuns no balcão; confirmar com o especialista (pergunta 2 do Fechamento do dia).
export const FORMAS_PAGAMENTO = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Cartão de débito', credito: 'Cartão de crédito', outro: 'Outro' } as const
export type FormaPagamento = keyof typeof FORMAS_PAGAMENTO

export type Pagamento = { id: string; valor: number; forma: FormaPagamento; em: string /* ISO */ }

export type Pedido = {
  id: string
  cliente: string
  telefone: string // só dígitos
  descricao: string
  valor?: number
  prazo?: string // AAAA-MM-DD, data combinada para entregar
  observacoes?: string // para a produção (acabamento, cuidado com a cor…)
  pagamentos: Pagamento[]
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

const centavos = (v: number) => Math.round(v * 100) / 100
export const totalPago = (p: Pedido) => centavos(p.pagamentos.reduce((s, x) => s + x.valor, 0))
/** Quanto falta receber; sem valor combinado, não dá para saber (undefined). Nunca negativo. */
export const saldo = (p: Pedido) => (p.valor === undefined ? undefined : Math.max(0, centavos(p.valor - totalPago(p))))

/** Backup velho: há pedidos e nunca exportou, ou exportou há mais de 7 dias. */
export const precisaBackup = (f: Fila, agora = new Date()) =>
  f.pedidos.length > 0 && (!f.ultimoBackup || diasDesde(f.ultimoBackup, agora) > 7)

const etapaValida = (v: unknown): v is Etapa => ETAPAS.some((e) => e.id === v)
const dataValida = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const textoOpcional = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined)

function validarPagamentos(v: unknown): Pagamento[] | null {
  if (v === undefined) return [] // pedidos de antes dos pagamentos
  if (!Array.isArray(v)) return null
  const lista: Pagamento[] = []
  for (const x of v as Record<string, unknown>[]) {
    if (!x || typeof x.id !== 'string' || typeof x.valor !== 'number' || !(x.valor > 0) || !dataValida(x.em)) return null
    if (typeof x.forma !== 'string' || !(x.forma in FORMAS_PAGAMENTO)) return null
    lista.push({ id: x.id, valor: x.valor, forma: x.forma as FormaPagamento, em: x.em })
  }
  return lista
}

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
    const pagamentos = validarPagamentos(p.pagamentos)
    if (!pagamentos) return null
    pedidos.push({
      id: p.id,
      cliente: p.cliente,
      telefone: typeof p.telefone === 'string' ? p.telefone.replace(/\D/g, '') : '',
      descricao: p.descricao,
      valor: p.valor as number | undefined,
      prazo: typeof p.prazo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.prazo) ? p.prazo : undefined,
      observacoes: textoOpcional(p.observacoes),
      pagamentos,
      etapa: p.etapa,
      criadoEm: p.criadoEm,
      etapaDesde: p.etapaDesde,
    })
  }
  const diasAlerta = typeof f.diasAlerta === 'number' && f.diasAlerta >= 1 ? Math.floor(f.diasAlerta) : FILA_PADRAO.diasAlerta
  const ultimoBackup = dataValida(f.ultimoBackup) ? f.ultimoBackup : null
  return { pedidos, diasAlerta, ultimoBackup }
}

/** Lê a fila salva. Se o dado salvo estiver estragado, `estragado` avisa quem edita para não sobrescrever. */
export function carregarFila(armazenamento: Pick<Storage, 'getItem'> = localStorage): { fila: Fila; estragado: boolean } {
  const bruto = armazenamento.getItem(CHAVE_FILA)
  if (!bruto) return { fila: FILA_PADRAO, estragado: false }
  try {
    const fila = validarFila(JSON.parse(bruto))
    return fila ? { fila, estragado: false } : { fila: FILA_PADRAO, estragado: true }
  } catch {
    return { fila: FILA_PADRAO, estragado: true }
  }
}

/** Mensagem curta para o cliente em cada etapa (abre no WhatsApp; o atendente ajusta antes de enviar). */
export const MENSAGEM_ETAPA: Record<Etapa, (cliente: string) => string> = {
  arquivo: (c) => `Olá, ${c}! Pode mandar o arquivo por aqui, de preferência em PDF.`,
  orcamento: (c) => `Olá, ${c}! Conseguiu ver o orçamento? Qualquer dúvida, é só chamar.`,
  aprovado: (c) => `Olá, ${c}! Pedido aprovado, já vamos para a produção.`,
  producao: (c) => `Olá, ${c}! Seu pedido está em produção.`,
  pronto: (c) => `Olá, ${c}! Seu pedido está pronto para retirar.`,
  entregue: (c) => `Olá, ${c}! Obrigado pela preferência.`,
}
