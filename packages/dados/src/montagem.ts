// Quantas artes cabem numa folha e onde fica cada uma. Usada pelo Aproveitamento de folha e pela Montagem para impressão.
export type Medida = { largura: number; altura: number } // mm
export type Regras = { sangriaMm: number; espacoMm: number; margemMaquinaMm: number }

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
