import { removerFolha, renomearFolha, type Dados } from '@pst/dados'
import { Button, Input, InputMoeda, Table } from '@pst/ui'
import type { Editar } from './App'

type Props = { dados: Dados; editar: Editar; avisar: (msg: string) => void }

export function Precos({ dados, editar, avisar }: Props) {
  // Nome só é aplicado ao sair do campo, para não criar folhas com nome vazio ou repetido no meio da digitação.
  function renomear(campo: HTMLInputElement, antigo: string, lista: { nome: string }[], aplicar: (novo: string) => void) {
    const novo = campo.value.trim()
    if (novo === antigo) return
    if (!novo || lista.some((x) => x.nome === novo)) {
      campo.value = antigo
      avisar(novo ? `Já existe "${novo}".` : 'O nome não pode ficar vazio.')
      return
    }
    aplicar(novo)
  }

  function novoNome(base: string, lista: { nome: string }[]) {
    let n = lista.length + 1
    while (lista.some((x) => x.nome === `${base} ${n}`)) n++
    return `${base} ${n}`
  }

  const folha = (i: number, campo: 'larguraMm' | 'alturaMm', valor: string) =>
    editar((d) => ({
      ...d,
      folhas: d.folhas.map((f, j) => (j === i ? { ...f, [campo]: Math.max(0, Number(valor) || 0) } : f)),
    }))

  const preco = (papel: number, nomeFolha: string, valor: number | undefined) =>
    editar((d) => ({
      ...d,
      papeis: d.papeis.map((p, j) => {
        if (j !== papel) return p
        const { [nomeFolha]: _antigo, ...resto } = p.precos
        return { ...p, precos: valor === undefined ? resto : { ...resto, [nomeFolha]: valor } }
      }),
    }))

  return (
    <div className="grid gap-8">
      <div>
        <h3 className="font-medium">Folhas</h3>
        <Table className="mt-2">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Largura (mm)</th>
              <th>Altura (mm)</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {dados.folhas.map((f, i) => (
              <tr key={f.nome}>
                <td>
                  <Input
                    aria-label={`Nome da folha ${f.nome}`}
                    defaultValue={f.nome}
                    onBlur={(e) =>
                      renomear(e.target, f.nome, dados.folhas, (novo) => editar((d) => renomearFolha(d, f.nome, novo)))
                    }
                  />
                </td>
                <td>
                  <Input
                    aria-label={`Largura de ${f.nome}`}
                    type="number"
                    min={0}
                    value={f.larguraMm}
                    onChange={(e) => folha(i, 'larguraMm', e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    aria-label={`Altura de ${f.nome}`}
                    type="number"
                    min={0}
                    value={f.alturaMm}
                    onChange={(e) => folha(i, 'alturaMm', e.target.value)}
                  />
                </td>
                <td className="text-right">
                  <Button
                    variante="perigo"
                    aria-label={`Remover folha ${f.nome}`}
                    onClick={() =>
                      confirm(`Remover a folha ${f.nome} e os preços dela em todos os papéis?`) &&
                      editar((d) => removerFolha(d, f.nome))
                    }
                  >
                    Remover
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Button
          variante="secundario"
          className="mt-3"
          onClick={() =>
            editar((d) => ({ ...d, folhas: [...d.folhas, { nome: novoNome('Folha', d.folhas), larguraMm: 0, alturaMm: 0 }] }))
          }
        >
          Adicionar folha
        </Button>
      </div>

      <div>
        <h3 className="font-medium">Preço por folha (R$)</h3>
        <Table className="mt-2">
          <thead>
            <tr>
              <th>Papel</th>
              {dados.folhas.map((f) => (
                <th key={f.nome}>{f.nome}</th>
              ))}
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {dados.papeis.map((p, i) => (
              <tr key={p.nome}>
                <td className="min-w-48">
                  <Input
                    aria-label={`Nome do papel ${p.nome}`}
                    defaultValue={p.nome}
                    onBlur={(e) =>
                      renomear(e.target, p.nome, dados.papeis, (novo) =>
                        editar((d) => ({ ...d, papeis: d.papeis.map((x, j) => (j === i ? { ...x, nome: novo } : x)) })),
                      )
                    }
                  />
                </td>
                {dados.folhas.map((f) => (
                  <td key={f.nome} className="min-w-24">
                    <InputMoeda
                      aria-label={`Preço de ${p.nome} em ${f.nome}, em reais`}
                      placeholder="—"
                      valor={p.precos[f.nome]}
                      aoMudar={(v) => preco(i, f.nome, v)}
                    />
                  </td>
                ))}
                <td className="text-right">
                  <Button
                    variante="perigo"
                    aria-label={`Remover papel ${p.nome}`}
                    onClick={() =>
                      confirm(`Remover o papel ${p.nome}?`) &&
                      editar((d) => ({ ...d, papeis: d.papeis.filter((_, j) => j !== i) }))
                    }
                  >
                    Remover
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Button
          variante="secundario"
          className="mt-3"
          onClick={() => editar((d) => ({ ...d, papeis: [...d.papeis, { nome: novoNome('Papel', d.papeis), precos: {} }] }))}
        >
          Adicionar papel
        </Button>
      </div>
    </div>
  )
}
