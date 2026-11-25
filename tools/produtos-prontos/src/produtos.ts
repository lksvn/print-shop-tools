// Produtos com preço fechado por quantidade (100 cartões, 500 panfletos…). Sem tela.
import { montar, precoDe, type Dados } from '@pst/dados'

export const CHAVE = 'pst:produtos-prontos:v1'

export type Faixa = { quantidade: number; preco: number } // preço total daquela quantidade
export type Produto = { id: string; nome: string; larguraMm: number; alturaMm: number; papel: string; faixas: Faixa[] }

/** Produto novo já vem como cartão de visita com as quantidades mais comuns e preço zerado. */
export const novoProduto = (papel: string): Produto => ({
  id: crypto.randomUUID(),
  nome: 'Cartão de visita',
  larguraMm: 90,
  alturaMm: 50,
  papel,
  faixas: [100, 250, 500, 1000].map((quantidade) => ({ quantidade, preco: 0 })),
})

const numero = (v: unknown, min: number) => typeof v === 'number' && Number.isFinite(v) && v >= min

/** Valida o que veio do localStorage ou de um .json importado. Devolve null se algo estiver errado. */
export function validarProdutos(entrada: unknown): Produto[] | null {
  if (!Array.isArray(entrada)) return null
  const lista: Produto[] = []
  for (const p of entrada as Record<string, unknown>[]) {
    if (!p || typeof p.id !== 'string' || typeof p.nome !== 'string' || typeof p.papel !== 'string') return null
    if (!numero(p.larguraMm, 0) || !numero(p.alturaMm, 0) || !Array.isArray(p.faixas)) return null
    const faixas: Faixa[] = []
    for (const f of p.faixas as Record<string, unknown>[]) {
      if (!f || !numero(f.quantidade, 1) || !numero(f.preco, 0)) return null
      faixas.push({ quantidade: Math.floor(f.quantidade as number), preco: f.preco as number })
    }
    lista.push({ id: p.id, nome: p.nome, larguraMm: p.larguraMm as number, alturaMm: p.alturaMm as number, papel: p.papel, faixas })
  }
  return lista
}

/** Faixas com preço, em ordem de quantidade: são as opções do orçamento. */
export const faixasComPreco = (p: Produto) => p.faixas.filter((f) => f.preco > 0).sort((a, b) => a.quantidade - b.quantidade)

/**
 * Custo só das folhas para fazer `quantidade` unidades, na folha mais barata (mesma conta do Aproveitamento).
 * Serve de piso para o preço: não inclui corte, acabamento nem margem.
 */
export function custoDasFolhas(dados: Dados, p: Produto, quantidade: number) {
  let melhor: { folha: string; folhas: number; custo: number } | undefined
  for (const f of dados.folhas) {
    const preco = precoDe(dados, p.papel, f.nome)
    if (preco === undefined || quantidade < 1) continue
    const m = montar({ largura: p.larguraMm, altura: p.alturaMm }, { largura: f.larguraMm, altura: f.alturaMm }, dados.producao)
    if (m.porFolha === 0) continue
    const folhas = Math.ceil(quantidade / m.porFolha)
    const custo = Math.round(folhas * preco * 100) / 100
    if (!melhor || custo < melhor.custo) melhor = { folha: f.nome, folhas, custo }
  }
  return melhor
}
