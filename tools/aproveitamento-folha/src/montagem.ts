// Quantas artes cabem numa folha e quanto custa cada uma. Sem tela: só conta.
import { precoDe, type Dados, type Folha } from '@pst/dados'

type Medida = { largura: number; altura: number } // mm
type Regras = { sangriaMm: number; espacoMm: number; margemMaquinaMm: number }

export type Montagem = {
  colunas: number
  linhas: number
  porFolha: number
  girada: boolean // arte deitada em relação ao que foi digitado
  celula: Medida // arte + sangria em volta
  inicio: { x: number; y: number } // canto da primeira arte (bloco centralizado na área útil)
}

/** Quantas cabem numa direção: n células e n-1 espaços dentro da área útil. */
const cabem = (util: number, celula: number, espaco: number) => (celula > 0 && util >= celula ? Math.floor((util + espaco) / (celula + espaco)) : 0)

/** Testa a arte em pé e deitada (girar a folha dá no mesmo) e fica com a que cabe mais. Empate: sem girar. */
export function montar(arte: Medida, folha: Medida, r: Regras): Montagem {
  const util = { largura: folha.largura - 2 * r.margemMaquinaMm, altura: folha.altura - 2 * r.margemMaquinaMm }
  const opcoes = [false, true].map((girada) => {
    const celula = girada
      ? { largura: arte.altura + 2 * r.sangriaMm, altura: arte.largura + 2 * r.sangriaMm }
      : { largura: arte.largura + 2 * r.sangriaMm, altura: arte.altura + 2 * r.sangriaMm }
    const colunas = cabem(util.largura, celula.largura, r.espacoMm)
    const linhas = cabem(util.altura, celula.altura, r.espacoMm)
    const bloco = (n: number, c: number) => n * c + Math.max(0, n - 1) * r.espacoMm
    return {
      colunas,
      linhas,
      porFolha: colunas * linhas,
      girada,
      celula,
      inicio: {
        x: r.margemMaquinaMm + (util.largura - bloco(colunas, celula.largura)) / 2,
        y: r.margemMaquinaMm + (util.altura - bloco(linhas, celula.altura)) / 2,
      },
    }
  })
  return opcoes[1].porFolha > opcoes[0].porFolha ? opcoes[1] : opcoes[0]
}

export type Opcao = {
  folha: Folha
  montagem: Montagem
  folhas: number // folhas necessárias para a quantidade
  precoFolha?: number
  total?: number
  unitario?: number
}

const centavos = (v: number) => Math.round(v * 100) / 100

/** Uma opção por folha cadastrada; a mais barata vem marcada pelo índice. */
export function opcoesPorFolha(dados: Dados, arte: Medida, quantidade: number, papel: string) {
  const opcoes: Opcao[] = dados.folhas.map((folha) => {
    const montagem = montar(arte, { largura: folha.larguraMm, altura: folha.alturaMm }, dados.producao)
    const folhas = montagem.porFolha > 0 && quantidade > 0 ? Math.ceil(quantidade / montagem.porFolha) : 0
    const precoFolha = precoDe(dados, papel, folha.nome)
    const total = precoFolha !== undefined && folhas > 0 ? centavos(precoFolha * folhas) : undefined
    return { folha, montagem, folhas, precoFolha, total, unitario: total !== undefined ? total / quantidade : undefined }
  })
  // Mais barata pelo total; empate fica com a folha menor.
  let melhor = -1
  opcoes.forEach((o, i) => {
    if (o.total === undefined) return
    if (melhor < 0 || o.total < opcoes[melhor].total! || (o.total === opcoes[melhor].total && area(o.folha) < area(opcoes[melhor].folha)))
      melhor = i
  })
  return { opcoes, melhor }
}

const area = (f: Folha) => f.larguraMm * f.alturaMm
