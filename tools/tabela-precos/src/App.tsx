import { useEffect, useMemo, useState } from 'react'
import { carregarDados } from '@pst/dados'
import { Button, Card, montar, Topo } from '@pst/ui'
import { carregar, salvar } from '@pst/ui/storage'
import { desenharImagem, montarTabela } from './tabela'
import './index.css'

const CHAVE = 'pst:tabela-precos:v1'

// Guarda os ocultos (e não os visíveis) para um papel novo nos Cadastros já aparecer na tabela.
function carregarOcultos(): string[] {
  const { ocultos } = carregar(CHAVE, { ocultos: [] as unknown })
  return Array.isArray(ocultos) ? ocultos.filter((o): o is string => typeof o === 'string') : []
}

function App() {
  const dados = useMemo(carregarDados, [])
  const comPreco = dados.papeis.filter((p) => Object.keys(p.precos).length > 0)
  const [ocultos, setOcultos] = useState(carregarOcultos)
  useEffect(() => salvar(CHAVE, { ocultos }), [ocultos])

  const tabela = montarTabela(dados, ocultos)
  const imagem = useMemo(() => (tabela.linhas.length ? desenharImagem(dados, tabela, new Date()) : ''), [dados, ocultos])
  const nomeArquivo = `tabela-de-precos-${new Date().toISOString().slice(0, 10)}.png`

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 print:max-w-none print:p-0">
      <div className="print:hidden">
        <Topo />
        <h1 className="mt-3 text-2xl font-semibold">Tabela de preços</h1>
        <p className="mt-1 text-texto-2">
          Gerada dos preços dos Cadastros, para mandar no WhatsApp ou imprimir para o balcão. Mudou o preço nos Cadastros, a
          tabela muda junto.
        </p>
      </div>

      {comPreco.length === 0 ? (
        <Card className="mt-6">
          <p role="alert" className="text-alerta">
            Nenhum papel tem preço cadastrado.{' '}
            <a href="../cadastros/#precos" className="underline">
              Cadastrar preços
            </a>
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr] md:items-start print:mt-0 print:block">
          <Card className="grid gap-4 print:hidden">
            <fieldset className="grid gap-2">
              <legend className="mb-2 font-semibold">Papéis na tabela</legend>
              {comPreco.map((p) => (
                <label key={p.nome} className="flex min-h-10 items-center gap-3 text-sm sm:min-h-0">
                  <input
                    type="checkbox"
                    className="size-4 accent-tinta"
                    checked={!ocultos.includes(p.nome)}
                    onChange={(e) =>
                      setOcultos((o) => (e.target.checked ? o.filter((n) => n !== p.nome) : [...o, p.nome]))
                    }
                  />
                  {p.nome}
                </label>
              ))}
            </fieldset>
            <p className="text-sm text-texto-3">
              Contato e endereço vêm dos{' '}
              <a href="../cadastros/" className="text-tinta underline">
                Cadastros
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              {imagem && (
                <a
                  href={imagem}
                  download={nomeArquivo}
                  className="inline-flex h-10 items-center rounded-md bg-tinta px-4 text-sm font-medium text-sobre-tinta hover:bg-tinta-hover sm:h-9"
                >
                  Baixar imagem
                </a>
              )}
              <Button variante="secundario" disabled={!imagem} onClick={() => print()}>
                Imprimir
              </Button>
            </div>
          </Card>

          {imagem ? (
            // A mesma imagem serve de prévia, de download e de impressão: o que se vê é o que sai.
            <img
              src={imagem}
              alt={`Tabela de preços com ${tabela.linhas.length} papéis e ${tabela.folhas.length} tamanhos de folha`}
              className="w-full rounded-lg border border-borda print:rounded-none print:border-0"
            />
          ) : (
            <Card>
              <p className="text-alerta">Marque ao menos um papel para montar a tabela.</p>
            </Card>
          )}
        </div>
      )}
    </main>
  )
}

montar(<App />)
