// Monta a tabela papel × folha a partir dos Cadastros e desenha a imagem que vai para o cliente.
import { formatarEndereco, type Dados, type Folha } from '@pst/dados'
import { formatarMoeda, formatarTelefone } from '@pst/ui'

export type Tabela = { folhas: Folha[]; linhas: { papel: string; precos: (number | undefined)[] }[] }

/** Só papéis visíveis com algum preço, e só folhas que algum desses papéis usa. */
export function montarTabela(dados: Dados, ocultos: string[]): Tabela {
  const papeis = dados.papeis.filter((p) => !ocultos.includes(p.nome) && Object.keys(p.precos).length > 0)
  const folhas = dados.folhas.filter((f) => papeis.some((p) => p.precos[f.nome] !== undefined))
  return { folhas, linhas: papeis.map((p) => ({ papel: p.nome, precos: folhas.map((f) => p.precos[f.nome]) })) }
}

/** Linhas do rodapé: contato da loja e data dos preços. Campos vazios ficam de fora. */
export function rodape(dados: Dados, hoje: Date) {
  const { telefone, endereco, horario } = dados.loja
  return [
    telefone && `WhatsApp ${formatarTelefone(telefone)}`,
    formatarEndereco(endereco),
    horario,
    `Preços válidos em ${hoje.toLocaleDateString('pt-BR')}. Valores por folha impressa.`,
  ].filter(Boolean) as string[]
}

// Cores fixas e claras: a imagem vai para o cliente e para a impressora, independente do tema da tela.
const COR = { fundo: '#ffffff', texto: '#1c1c1c', suave: '#666666', faixa: '#f2f4f8', linha: '#d9dde5', destaque: '#284b8c' }
const LARGURA = 1080 // bom para o WhatsApp (não é reduzida) e para uma folha A4 impressa
const MARGEM = 56
const LINHA = 64

/** Desenha a tabela num canvas e devolve um PNG em data URL. */
export function desenharImagem(dados: Dados, tabela: Tabela, hoje: Date) {
  const n = tabela.folhas.length
  const colPreco = Math.min(135, (LARGURA - 2 * MARGEM - 340) / n) // papel com nome longo precisa de espaço
  const colPapel = LARGURA - 2 * MARGEM - colPreco * n
  const linhasRodape = rodape(dados, hoje)
  const topoTabela = 190
  const altura = topoTabela + LINHA * (tabela.linhas.length + 1) + 48 + linhasRodape.length * 36 + MARGEM

  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = altura
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = COR.fundo
  ctx.fillRect(0, 0, LARGURA, altura)
  ctx.textBaseline = 'middle'

  ctx.fillStyle = COR.destaque
  ctx.font = 'bold 46px sans-serif'
  ctx.fillText(dados.loja.nome || 'Tabela de preços', MARGEM, 90, LARGURA - 2 * MARGEM)
  ctx.fillStyle = COR.suave
  ctx.font = '28px sans-serif'
  ctx.fillText(dados.loja.nome ? 'Tabela de preços · impressão por folha (R$)' : 'Impressão por folha (R$)', MARGEM, 140)

  const celula = (texto: string, x: number, y: number, largura: number, alinhar: CanvasTextAlign) => {
    ctx.textAlign = alinhar
    const pad = 16
    ctx.fillText(texto, alinhar === 'right' ? x + largura - pad : x + pad, y + LINHA / 2, largura - 2 * pad)
  }

  // Cabeçalho: nome e medida de cada folha.
  let y = topoTabela
  ctx.fillStyle = COR.destaque
  ctx.fillRect(MARGEM, y, LARGURA - 2 * MARGEM, LINHA)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 26px sans-serif'
  celula('Papel', MARGEM, y, colPapel, 'left')
  tabela.folhas.forEach((f, i) => celula(f.nome, MARGEM + colPapel + i * colPreco, y, colPreco, 'right'))

  ctx.font = '26px sans-serif'
  for (const [i, l] of tabela.linhas.entries()) {
    y += LINHA
    if (i % 2) {
      ctx.fillStyle = COR.faixa
      ctx.fillRect(MARGEM, y, LARGURA - 2 * MARGEM, LINHA)
    }
    ctx.fillStyle = COR.texto
    celula(l.papel, MARGEM, y, colPapel, 'left')
    l.precos.forEach((p, j) => {
      ctx.fillStyle = p === undefined ? COR.suave : COR.texto
      celula(p === undefined ? '—' : formatarMoeda(p), MARGEM + colPapel + j * colPreco, y, colPreco, 'right')
    })
  }
  y += LINHA
  ctx.fillStyle = COR.linha
  ctx.fillRect(MARGEM, y, LARGURA - 2 * MARGEM, 2)

  ctx.textAlign = 'left'
  ctx.fillStyle = COR.suave
  ctx.font = '24px sans-serif'
  linhasRodape.forEach((t, i) => ctx.fillText(t, MARGEM, y + 48 + i * 36, LARGURA - 2 * MARGEM))

  return canvas.toDataURL('image/png')
}
