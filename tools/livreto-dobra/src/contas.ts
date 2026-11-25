// Contas do livreto (grampeado no meio) e das dobras de folheto. Sem tela.
import type { Folha } from '@pst/dados'

type Medida = { largura: number; altura: number } // mm

const FOLGA_MM = 1 // arredondamento de programas de design (ex.: A5 com 148,5 mm)

/** Páginas arredondadas para múltiplo de 4 (cada folha dobrada tem 4 páginas) e quantas ficam em branco. */
export function paginasDoLivreto(paginas: number) {
  const total = Math.max(4, Math.ceil(paginas / 4) * 4)
  return { total, emBranco: total - Math.max(0, paginas), folhas: total / 4 }
}

/**
 * Ordem das páginas em cada folha, de fora para dentro: a folha 1 leva a capa e a contracapa.
 * Cada lado tem [esquerda, direita] olhando a folha aberta.
 */
export function ordemDasPaginas(total: number) {
  const folhas: { frente: [number, number]; verso: [number, number] }[] = []
  for (let i = 0; i < total / 4; i++)
    folhas.push({ frente: [total - 2 * i, 2 * i + 1], verso: [2 * i + 2, total - 2 * i - 1] })
  return folhas
}

/** Folha aberta = duas páginas lado a lado. */
export const folhaAberta = (fechada: Medida): Medida => ({ largura: fechada.largura * 2, altura: fechada.altura })

const lados = (largura: number, altura: number) => [largura, altura].sort((x, y) => x - y)

const cabe = (a: Medida, f: Folha, extra: number) => {
  const [am, aM] = lados(a.largura, a.altura)
  const [fm, fM] = lados(f.larguraMm, f.alturaMm)
  return am + extra <= fm + FOLGA_MM && aM + extra <= fM + FOLGA_MM
}

const mesmoTamanho = (a: Medida, f: Folha) => {
  const [am, aM] = lados(a.largura, a.altura)
  const [fm, fM] = lados(f.larguraMm, f.alturaMm)
  return Math.abs(am - fm) <= FOLGA_MM && Math.abs(aM - fM) <= FOLGA_MM
}

/**
 * Em que folha cadastrada imprimir a folha aberta.
 * Primeiro uma do mesmo tamanho (imprime sem refile); se não houver, a menor em que cabe com sangria e margem (imprime e refila).
 */
export function folhaParaImprimir(aberta: Medida, folhas: Folha[], sangriaMm: number, margemMaquinaMm: number) {
  const porArea = [...folhas].sort((a, b) => a.larguraMm * a.alturaMm - b.larguraMm * b.alturaMm)
  const exata = porArea.find((f) => mesmoTamanho(aberta, f))
  if (exata) return { folha: exata, refile: false }
  const maior = porArea.find((f) => cabe(aberta, f, 2 * (sangriaMm + margemMaquinaMm)))
  return maior ? { folha: maior, refile: true } : null
}

export type TipoDobra = 'meio' | 'sanfona' | 'carteira'

export const DOBRAS: Record<TipoDobra, string> = {
  meio: 'Ao meio (2 painéis)',
  sanfona: 'Em 3, sanfona (zigue-zague)',
  carteira: 'Em 3, carteira (um painel dobra para dentro)',
}

// shortcut: 2 mm a menos no painel que dobra para dentro, valor comum; esperar a pergunta 3 do especialista.
export const RECUO_CARTEIRA_MM = 2

/** Larguras dos painéis da esquerda para a direita, dobrando no lado maior da folha. */
export function paineis(tipo: TipoDobra, folha: Medida) {
  const comprimento = Math.max(folha.largura, folha.altura)
  const altura = Math.min(folha.largura, folha.altura)
  let larguras: number[]
  if (tipo === 'meio') larguras = [comprimento / 2, comprimento / 2]
  else if (tipo === 'sanfona') larguras = [comprimento / 3, comprimento / 3, comprimento / 3]
  else {
    // dois painéis iguais e o de dentro mais estreito: 2a + (a - recuo) = comprimento
    const a = (comprimento + RECUO_CARTEIRA_MM) / 3
    larguras = [a, a, a - RECUO_CARTEIRA_MM]
  }
  // Dobras medidas a partir da borda esquerda.
  const dobras = larguras.slice(0, -1).map((_, i) => larguras.slice(0, i + 1).reduce((s, l) => s + l, 0))
  return { larguras, altura, dobras }
}
