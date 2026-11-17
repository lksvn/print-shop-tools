// Estados e municípios do IBGE (API de localidades, /api/v1/localidades/municipios?orderBy=nome),
// copiados do projeto mtg-haves em 2026-11-17 (dados obtidos em 2026-11-03), reduzidos a id, nome e UF.
// Atualizar a cópia quando necessário, preservando os ids. Entrada separada (@pst/ui/localidades) para que
// só as ferramentas que usam carreguem os ~270 KB.
import dados from './ibge-localidades.json' with { type: 'json' }

export const estados = [...dados.states].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

const idPorUf = new Map(dados.states.map((e) => [e.code, e.id]))

/** Municípios de uma UF ("SP"), em ordem alfabética. UF desconhecida → lista vazia. */
export function cidadesDe(uf: string) {
  const id = idPorUf.get(uf)
  return dados.cities.filter((c) => c.state === id)
}
