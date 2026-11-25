// Cadastro dos produtos: nome, tamanho, papel e preço por quantidade, com o custo das folhas como referência.
import { useMemo } from 'react'
import { carregarDados, reais } from '@pst/dados'
import { Button, Input, InputMoeda, Label, Select } from '@pst/ui'
import { custoDasFolhas, novoProduto, type Produto } from './produtos'

const inteiro = (v: string) => Math.max(0, Math.floor(Number(v) || 0))

function EditorProduto({ p, papeis, aoMudar, aoRemover }: { p: Produto; papeis: string[]; aoMudar: (p: Produto) => void; aoRemover: () => void }) {
  const dados = useMemo(carregarDados, [])
  const id = (campo: string) => `${p.id}-${campo}`
  const faixa = (i: number, m: Partial<Produto['faixas'][number]>) => aoMudar({ ...p, faixas: p.faixas.map((f, j) => (j === i ? { ...f, ...m } : f)) })
  return (
    <li className="grid gap-4 border-t border-borda pt-4 first:border-0 first:pt-0">
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem_6rem_12rem]">
        <div className="grid gap-1.5">
          <Label htmlFor={id('nome')}>Produto</Label>
          <Input id={id('nome')} value={p.nome} onChange={(e) => aoMudar({ ...p, nome: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={id('l')}>Largura (mm)</Label>
          <Input id={id('l')} type="number" min={1} value={p.larguraMm || ''} onChange={(e) => aoMudar({ ...p, larguraMm: inteiro(e.target.value) })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={id('a')}>Altura (mm)</Label>
          <Input id={id('a')} type="number" min={1} value={p.alturaMm || ''} onChange={(e) => aoMudar({ ...p, alturaMm: inteiro(e.target.value) })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={id('papel')}>Papel</Label>
          <Select id={id('papel')} value={p.papel} onChange={(e) => aoMudar({ ...p, papel: e.target.value })}>
            {!papeis.includes(p.papel) && <option value={p.papel}>{p.papel || 'Escolha'}</option>}
            {papeis.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </Select>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-texto-3">
            <th className="pb-1 font-medium">Quantidade</th>
            <th className="pb-1 font-medium">Preço total</th>
            <th className="hidden pb-1 font-medium sm:table-cell">Custo das folhas</th>
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {p.faixas.map((f, i) => {
            const custo = custoDasFolhas(dados, p, f.quantidade)
            return (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <Input
                    aria-label={`Quantidade da faixa ${i + 1} de ${p.nome}`}
                    type="number"
                    min={1}
                    className="w-24"
                    value={f.quantidade || ''}
                    onChange={(e) => faixa(i, { quantidade: inteiro(e.target.value) })}
                  />
                </td>
                <td className="py-1 pr-2">
                  <InputMoeda aria-label={`Preço de ${f.quantidade} ${p.nome}`} className="w-32" valor={f.preco || undefined} aoMudar={(v) => faixa(i, { preco: v ?? 0 })} />
                </td>
                <td className="hidden py-1 pr-2 text-texto-3 sm:table-cell">
                  {custo ? `${reais(custo.custo)} (${custo.folhas} ${custo.folha})` : '—'}
                </td>
                <td className="py-1 text-right">
                  <Button
                    variante="fantasma"
                    className="px-2"
                    aria-label={`Remover a faixa de ${f.quantidade}`}
                    onClick={() => aoMudar({ ...p, faixas: p.faixas.filter((_, j) => j !== i) })}
                  >
                    Remover
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-texto-3">Custo das folhas: só o papel impresso, pela mesma conta do Aproveitamento de folha. Não inclui corte, acabamento nem margem.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variante="secundario"
          onClick={() => aoMudar({ ...p, faixas: [...p.faixas, { quantidade: (p.faixas.at(-1)?.quantidade ?? 0) * 2 || 100, preco: 0 }] })}
        >
          Adicionar quantidade
        </Button>
        <Button
          variante="perigo"
          onClick={() => {
            if (confirm(`Apagar o produto "${p.nome}"?`)) aoRemover()
          }}
        >
          Apagar produto
        </Button>
      </div>
    </li>
  )
}

export function Editor({ produtos, aoMudar }: { produtos: Produto[]; aoMudar: (lista: Produto[]) => void }) {
  const papeis = useMemo(() => carregarDados().papeis.map((p) => p.nome), [])
  return (
    <div className="grid gap-4">
      {produtos.length > 0 && (
        <ul className="grid gap-4">
          {produtos.map((p) => (
            <EditorProduto
              key={p.id}
              p={p}
              papeis={papeis}
              aoMudar={(novo) => aoMudar(produtos.map((x) => (x.id === p.id ? novo : x)))}
              aoRemover={() => aoMudar(produtos.filter((x) => x.id !== p.id))}
            />
          ))}
        </ul>
      )}
      <Button className="justify-self-start" onClick={() => aoMudar([...produtos, novoProduto(papeis[0] ?? '')])}>
        Novo produto
      </Button>
    </div>
  )
}
