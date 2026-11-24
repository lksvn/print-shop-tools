import { useId, useMemo, useState } from 'react'
import { carregarDados, reais, type Dados } from '@pst/dados'
import { Badge, Card, cn, Input, Label, montar as montarApp, Select, Topo } from '@pst/ui'
import { opcoesPorFolha, type Opcao } from './montagem'
import './index.css'

const inteiro = (v: string) => Math.max(0, Math.floor(Number(v) || 0))

/** Desenho da folha: margem da máquina tracejada, sangria clara e a arte por cima. Medidas em mm. */
function Desenho({ opcao, producao }: { opcao: Opcao; producao: Dados['producao'] }) {
  const { folha, montagem: m } = opcao
  const [w, h] = [folha.larguraMm, folha.alturaMm]
  const { margemMaquinaMm: margem, espacoMm: espaco, sangriaMm: sangria } = producao
  const celulas = []
  for (let l = 0; l < m.linhas; l++)
    for (let c = 0; c < m.colunas; c++) {
      const x = m.inicio.x + c * (m.celula.largura + espaco)
      const y = m.inicio.y + l * (m.celula.altura + espaco)
      celulas.push(
        <g key={`${l}-${c}`}>
          <rect x={x} y={y} width={m.celula.largura} height={m.celula.altura} className="fill-tinta/15" />
          <rect
            x={x + sangria}
            y={y + sangria}
            width={m.celula.largura - 2 * sangria}
            height={m.celula.altura - 2 * sangria}
            className="fill-tinta/40 stroke-tinta"
            strokeWidth={0.5}
          />
        </g>,
      )
    }
  return (
    <svg
      viewBox={`-2 -2 ${w + 4} ${h + 4}`}
      role="img"
      aria-label={`${m.porFolha} artes numa folha ${folha.nome}${m.girada ? ', com a arte deitada' : ''}`}
      className="mx-auto max-h-[60vh] w-full max-w-sm"
    >
      <rect width={w} height={h} className="fill-white stroke-borda-forte" strokeWidth={1} />
      {margem > 0 && (
        <rect
          x={margem}
          y={margem}
          width={w - 2 * margem}
          height={h - 2 * margem}
          className="fill-none stroke-texto-3"
          strokeWidth={0.5}
          strokeDasharray="3 2"
        />
      )}
      {celulas}
    </svg>
  )
}

function App() {
  const dados = useMemo(carregarDados, [])
  const papeis = dados.papeis.filter((p) => Object.keys(p.precos).length > 0)
  const [largura, setLargura] = useState(90)
  const [altura, setAltura] = useState(50)
  const [quantidade, setQuantidade] = useState(100)
  const [papel, setPapel] = useState(papeis[0]?.nome ?? '')
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const ids = { largura: useId(), altura: useId(), quantidade: useId(), papel: useId() }

  const { opcoes, melhor } = opcoesPorFolha(dados, { largura, altura }, quantidade, papel)
  const atual =
    opcoes.find((o) => o.folha.nome === escolhida && o.montagem.porFolha > 0) ??
    opcoes[melhor] ??
    opcoes.filter((o) => o.montagem.porFolha > 0).at(-1)

  const p = dados.producao
  const linkRapido =
    atual?.total !== undefined
      ? `../orcamento-rapido/?${new URLSearchParams({ papel, folha: atual.folha.nome, quantidade: String(atual.folhas) })}`
      : null

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Aproveitamento de folha</h1>
      <p className="mt-1 text-texto-2">Quantas artes cabem em cada folha e quanto sai cada unidade.</p>

      <Card className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.largura}>Largura da arte (mm)</Label>
          <Input id={ids.largura} type="number" min={1} value={largura || ''} onChange={(e) => setLargura(inteiro(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.altura}>Altura da arte (mm)</Label>
          <Input id={ids.altura} type="number" min={1} value={altura || ''} onChange={(e) => setAltura(inteiro(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.quantidade}>Quantidade</Label>
          <Input
            id={ids.quantidade}
            type="number"
            min={1}
            value={quantidade || ''}
            onChange={(e) => setQuantidade(inteiro(e.target.value))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.papel}>Papel</Label>
          {papeis.length ? (
            <Select id={ids.papel} value={papel} onChange={(e) => setPapel(e.target.value)}>
              {papeis.map((pp) => (
                <option key={pp.nome}>{pp.nome}</option>
              ))}
            </Select>
          ) : (
            <a href="../cadastros/#precos" className="flex h-10 items-center text-sm text-alerta underline sm:h-9">
              Cadastrar preços
            </a>
          )}
        </div>
        <p className="text-xs text-texto-3 sm:col-span-4">
          Sangria {p.sangriaMm} mm em volta de cada arte, {p.espacoMm} mm entre artes e {p.margemMaquinaMm} mm de margem da
          máquina.{' '}
          <a href="../cadastros/#producao" className="underline">
            Mudar nos Cadastros
          </a>
        </p>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_20rem]">
        <Card>
          <h2 className="font-semibold">Por folha</h2>
          <ul className="mt-3 grid gap-2">
            {opcoes.map((o, i) => {
              const cabe = o.montagem.porFolha > 0
              const selecionada = o === atual
              return (
                <li key={o.folha.nome}>
                  <button
                    type="button"
                    disabled={!cabe}
                    aria-pressed={selecionada}
                    onClick={() => setEscolhida(o.folha.nome)}
                    className={cn(
                      'grid w-full cursor-pointer grid-cols-[3.5rem_1fr_auto] items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm disabled:cursor-default disabled:opacity-60',
                      selecionada ? 'border-tinta bg-suave' : 'border-borda hover:bg-suave',
                    )}
                  >
                    <span className="font-medium">{o.folha.nome}</span>
                    <span className="text-texto-2">
                      {cabe ? (
                        <>
                          {o.montagem.porFolha} por folha · {o.folhas} {o.folhas === 1 ? 'folha' : 'folhas'}
                        </>
                      ) : (
                        'não cabe'
                      )}
                    </span>
                    <span className="text-right tabular-nums">
                      {o.total !== undefined ? (
                        <>
                          <span className="block font-medium">{reais(o.total)}</span>
                          <span className="block text-xs text-texto-3">{reais(o.unitario!)} cada</span>
                        </>
                      ) : (
                        cabe && <span className="text-xs text-texto-3">sem preço</span>
                      )}
                    </span>
                    {i === melhor && (
                      <span className="col-span-3">
                        <Badge tom="ok">Mais barato</Badge>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="grid content-start gap-3">
          {atual ? (
            <>
              <h2 className="font-semibold">
                {atual.montagem.porFolha} na {atual.folha.nome}
                {atual.montagem.girada && <span className="ml-2 text-sm font-normal text-texto-3">arte deitada</span>}
              </h2>
              <Desenho opcao={atual} producao={p} />
              {linkRapido && (
                <a
                  href={linkRapido}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-tinta px-4 text-sm font-medium text-sobre-tinta hover:bg-tinta-hover sm:h-9"
                >
                  Orçar {atual.folhas} {atual.folha.nome} no Orçamento rápido
                </a>
              )}
            </>
          ) : (
            <p role="alert" className="text-sm text-alerta">
              A arte não cabe em nenhuma folha cadastrada.
            </p>
          )}
        </Card>
      </div>
    </main>
  )
}

montarApp(<App />)
