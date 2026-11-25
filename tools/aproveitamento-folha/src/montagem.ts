// Quantas artes cabem numa folha e quanto custa cada uma. Sem tela: só conta.
import { montar, precoDe, type Dados, type Folha, type Medida, type Montagem } from '@pst/dados'

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
