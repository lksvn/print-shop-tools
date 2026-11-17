// Dados da gráfica usados por 2 ou mais ferramentas. Só a ferramenta Cadastros edita; as outras só leem.
// Um objeto Dados = uma empresa (na fase multi-empresa vira uma linha por empresa_id).
import { formatarData, formatarTelefone, somarDiasUteis } from '@pst/ui'
import { carregar, salvar } from '@pst/ui/storage'

export type Endereco = {
  cep: string // só dígitos
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export const TIPOS_CHAVE_PIX = ['cpf', 'cnpj', 'telefone', 'email', 'aleatoria'] as const
export type TipoChavePix = (typeof TIPOS_CHAVE_PIX)[number] | '' // '' = ainda não escolhido (dados antigos)

export type Folha = { nome: string; larguraMm: number; alturaMm: number }
export type Papel = { nome: string; precos: Record<string, number> } // chave = nome da folha; ausente = indisponível

export type Dados = {
  loja: { nome: string; telefone: string; endereco: Endereco; horario: string; prazoDiasUteis: number }
  pix: { tipo: TipoChavePix; chave: string; recebedor: string } // cidade do Pix = cidade do endereço
  folhas: Folha[]
  papeis: Papel[]
  producao: { sangriaMm: number; margemMm: number; dpi: number; fontePt: number }
  modeloOrcamento: string
}

export const CHAVE_DADOS = 'pst:dados:v1'

export const ENDERECO_VAZIO: Endereco = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' }

export const DADOS_PADRAO: Dados = {
  loja: { nome: '', telefone: '', endereco: ENDERECO_VAZIO, horario: '', prazoDiasUteis: 2 },
  pix: { tipo: '', chave: '', recebedor: '' },
  folhas: [
    { nome: 'A6', larguraMm: 105, alturaMm: 148 },
    { nome: 'A5', larguraMm: 148, alturaMm: 210 },
    { nome: 'A4', larguraMm: 210, alturaMm: 297 },
    { nome: 'A3', larguraMm: 297, alturaMm: 420 },
  ],
  papeis: ['Couchê 240g', 'Sulfite color 90g', 'Sulfite 75g P/B', 'Couchê adesivo 150g', 'Couchê adesivo com recorte'].map(
    (nome) => ({ nome, precos: {} }),
  ),
  producao: { sangriaMm: 3, margemMm: 5, dpi: 300, fontePt: 10 },
  modeloOrcamento: 'Olá, {cliente}! Segue o orçamento:\n\n{itens}\n\nTotal: {total}\nPrazo: {prazo}\n\n{loja}',
}

export function carregarDados(): Dados {
  const salvo = carregar(CHAVE_DADOS, DADOS_PADRAO)
  try {
    return validarDados(salvo)
  } catch {
    return DADOS_PADRAO // shortcut: dado salvo inválido volta ao padrão sem apagar a chave; só sobrescreve quando o usuário salvar
  }
}

export function salvarDados(dados: Dados) {
  salvar(CHAVE_DADOS, validarDados(dados))
}

// --- validação: usada ao carregar e ao importar um .json (fronteira de confiança) ---

function erro(campo: string, esperado: string): never {
  throw new Error(`Arquivo inválido: "${campo}" deveria ser ${esperado}.`)
}
function obj(v: unknown, campo: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) erro(campo, 'um objeto')
  return v as Record<string, unknown>
}
function texto(v: unknown, campo: string): string {
  if (typeof v !== 'string') erro(campo, 'um texto')
  return v
}
function numero(v: unknown, campo: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) erro(campo, 'um número maior ou igual a zero')
  return v
}
function lista(v: unknown, campo: string): unknown[] {
  if (!Array.isArray(v)) erro(campo, 'uma lista')
  return v
}

function endereco(v: unknown): Endereco {
  // Formato antigo (até 2026-11-17): endereço num texto só. Vai inteiro para "rua", sem perder nada.
  if (typeof v === 'string') return { ...ENDERECO_VAZIO, rua: v }
  const e = obj(v, 'loja.endereco')
  const campo = (k: keyof Endereco) => texto(e[k], `loja.endereco.${k}`)
  return {
    cep: campo('cep'),
    rua: campo('rua'),
    numero: campo('numero'),
    complemento: campo('complemento'),
    bairro: campo('bairro'),
    cidade: campo('cidade'),
    uf: campo('uf'),
  }
}

/** "Rua X, 123, sala 2 – Centro, São Paulo/SP" — para mensagens. Partes vazias somem. */
export function formatarEndereco(e: Endereco) {
  const linha1 = [e.rua, e.numero, e.complemento].filter(Boolean).join(', ')
  const cidade = [e.cidade, e.uf].filter(Boolean).join('/')
  return [linha1, [e.bairro, cidade].filter(Boolean).join(', ')].filter(Boolean).join(' – ')
}

function tipoChave(v: unknown): TipoChavePix {
  if (v === undefined) return '' // formato antigo, sem tipo
  if (v === '' || TIPOS_CHAVE_PIX.includes(v as never)) return v as TipoChavePix
  erro('pix.tipo', `um destes: ${TIPOS_CHAVE_PIX.join(', ')}`)
}

/** Confere o formato e devolve só os campos conhecidos. Lança Error com mensagem em português. */
export function validarDados(entrada: unknown): Dados {
  const d = obj(entrada, 'dados')
  const loja = obj(d.loja, 'loja')
  const pix = obj(d.pix, 'pix')
  const producao = obj(d.producao, 'producao')
  return {
    loja: {
      nome: texto(loja.nome, 'loja.nome'),
      telefone: texto(loja.telefone, 'loja.telefone'),
      endereco: endereco(loja.endereco),
      horario: texto(loja.horario, 'loja.horario'),
      prazoDiasUteis: numero(loja.prazoDiasUteis, 'loja.prazoDiasUteis'),
    },
    pix: {
      tipo: tipoChave(pix.tipo),
      chave: texto(pix.chave, 'pix.chave'),
      recebedor: texto(pix.recebedor, 'pix.recebedor'),
    },
    folhas: lista(d.folhas, 'folhas').map((f, i) => {
      const o = obj(f, `folhas[${i}]`)
      return {
        nome: texto(o.nome, `folhas[${i}].nome`),
        larguraMm: numero(o.larguraMm, `folhas[${i}].larguraMm`),
        alturaMm: numero(o.alturaMm, `folhas[${i}].alturaMm`),
      }
    }),
    papeis: lista(d.papeis, 'papeis').map((p, i) => {
      const o = obj(p, `papeis[${i}]`)
      const precos = obj(o.precos, `papeis[${i}].precos`)
      return {
        nome: texto(o.nome, `papeis[${i}].nome`),
        precos: Object.fromEntries(
          Object.entries(precos).map(([folha, v]) => [folha, numero(v, `papeis[${i}].precos.${folha}`)]),
        ),
      }
    }),
    producao: {
      sangriaMm: numero(producao.sangriaMm, 'producao.sangriaMm'),
      margemMm: numero(producao.margemMm, 'producao.margemMm'),
      dpi: numero(producao.dpi, 'producao.dpi'),
      fontePt: numero(producao.fontePt, 'producao.fontePt'),
    },
    modeloOrcamento: texto(d.modeloOrcamento, 'modeloOrcamento'),
  }
}

/** Renomeia uma folha mantendo os preços dos papéis ligados a ela. */
export function renomearFolha(dados: Dados, antigo: string, novo: string): Dados {
  return {
    ...dados,
    folhas: dados.folhas.map((f) => (f.nome === antigo ? { ...f, nome: novo } : f)),
    papeis: dados.papeis.map((p) => {
      if (!(antigo in p.precos)) return p
      const { [antigo]: preco, ...resto } = p.precos
      return { ...p, precos: { ...resto, [novo]: preco } }
    }),
  }
}

/** Remove uma folha e os preços dela em todos os papéis. */
export function removerFolha(dados: Dados, nome: string): Dados {
  return {
    ...dados,
    folhas: dados.folhas.filter((f) => f.nome !== nome),
    papeis: dados.papeis.map((p) => {
      const { [nome]: _removido, ...resto } = p.precos
      return { ...p, precos: resto }
    }),
  }
}

// --- Campos de mensagem que vêm dos Cadastros ({loja}, {prazo}…), usados por respostas e orçamentos ---

export const CAMPOS_AUTOMATICOS = {
  loja: 'nome da gráfica',
  telefone: 'telefone da gráfica',
  endereco: 'endereço',
  horario: 'horário',
  pix: 'chave Pix',
  prazo: 'data de entrega (hoje + prazo)',
  prazoDias: 'prazo em dias úteis',
  sangria: 'sangria (mm)',
  margem: 'margem de segurança (mm)',
  dpi: 'resolução mínima',
} as const

export function valoresAutomaticos(dados: Dados, hoje = new Date()): Record<keyof typeof CAMPOS_AUTOMATICOS, string> {
  return {
    loja: dados.loja.nome,
    telefone: formatarTelefone(dados.loja.telefone),
    endereco: formatarEndereco(dados.loja.endereco),
    horario: dados.loja.horario,
    pix: dados.pix.chave,
    prazo: formatarData(somarDiasUteis(hoje, dados.loja.prazoDiasUteis)),
    prazoDias: String(dados.loja.prazoDiasUteis),
    sangria: String(dados.producao.sangriaMm),
    margem: String(dados.producao.margemMm),
    dpi: String(dados.producao.dpi),
  }
}

// --- Preços: a mesma conta para todos os orçamentos (rápido e de PDF) ---

export type ItemOrcamento = { papel: string; folha: string; quantidade: number }

/** Preço de um papel numa folha. undefined = papel não existe nessa folha (ou não cadastrado). */
export const precoDe = (dados: Dados, papel: string, folha: string): number | undefined =>
  dados.papeis.find((p) => p.nome === papel)?.precos[folha]

const centavos = (v: number) => Math.round(v * 100) / 100

/** Subtotal de cada item e total. Itens sem preço ficam fora do total e voltam em semPreco. */
export function calcularOrcamento(dados: Dados, itens: ItemOrcamento[]) {
  const linhas = itens.map((item) => {
    const unitario = precoDe(dados, item.papel, item.folha)
    return { ...item, unitario, subtotal: unitario === undefined ? undefined : centavos(unitario * item.quantidade) }
  })
  return {
    linhas,
    total: centavos(linhas.reduce((soma, l) => soma + (l.subtotal ?? 0), 0)),
    semPreco: linhas.filter((l) => l.unitario === undefined),
  }
}
