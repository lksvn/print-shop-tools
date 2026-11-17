// Único ponto de acesso a dados salvos. Quando houver servidor, só este arquivo muda.

type Armazenamento = Pick<Storage, 'getItem' | 'setItem'>

export function carregar<T extends object>(chave: string, padrao: T, armazenamento: Armazenamento = localStorage): T {
  try {
    const bruto = armazenamento.getItem(chave)
    // Mescla com o padrão para que campos novos da config apareçam em dados antigos.
    return bruto ? { ...padrao, ...JSON.parse(bruto) } : padrao
  } catch {
    return padrao
  }
}

export function salvar(chave: string, valor: unknown, armazenamento: Armazenamento = localStorage) {
  armazenamento.setItem(chave, JSON.stringify(valor))
}

export function exportarJson(nomeArquivo: string, valor: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(valor, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}

/** Lê um .json escolhido pelo usuário. Quem chama deve validar o conteúdo. */
export async function importarJson(arquivo: File): Promise<unknown> {
  return JSON.parse(await arquivo.text())
}
