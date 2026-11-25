import { useId, useMemo, useState } from 'react'
import { carregarDados, precoDe } from '@pst/dados'
import { Card, Input, Label, montar, Select, Topo } from '@pst/ui'
import { DOBRAS, folhaAberta, folhaParaImprimir, ordemDasPaginas, paginasDoLivreto, paineis, RECUO_CARTEIRA_MM, type TipoDobra } from './contas'
import './index.css'

const OUTRO = '__outro'
const inteiro = (v: string) => Math.max(0, Math.floor(Number(v) || 0))
const mm = (v: number) => (Math.round(v * 10) / 10).toLocaleString('pt-BR')

/** Uma página do livreto num quadradinho; página em branco fica tracejada. */
function Pagina({ n, ultima }: { n: number; ultima: number }) {
  const branco = n > ultima
  return (
    <span
      className={`grid h-10 w-9 place-items-center rounded border text-sm tabular-nums ${branco ? 'border-dashed border-borda-forte text-texto-3' : 'border-borda-forte bg-suave'}`}
      title={branco ? 'Página em branco' : undefined}
    >
      {branco ? '–' : n}
    </span>
  )
}

function Livreto() {
  const dados = useMemo(carregarDados, [])
  const papeis = dados.papeis.filter((p) => Object.keys(p.precos).length > 0)
  const [paginas, setPaginas] = useState('12')
  const [fechada, setFechada] = useState(dados.folhas.find((f) => f.nome === 'A5')?.nome ?? dados.folhas[0]?.nome ?? OUTRO)
  const [outra, setOutra] = useState({ largura: '100', altura: '150' })
  const [copias, setCopias] = useState('')
  const [papel, setPapel] = useState(papeis[0]?.nome ?? '')
  const ids = { paginas: useId(), fechada: useId(), largura: useId(), altura: useId(), copias: useId(), papel: useId() }

  const f = dados.folhas.find((x) => x.nome === fechada)
  const medida = f ? { largura: f.larguraMm, altura: f.alturaMm } : { largura: Number(outra.largura) || 0, altura: Number(outra.altura) || 0 }
  const pedidas = inteiro(paginas)
  const { total, emBranco, folhas } = paginasDoLivreto(pedidas)
  const aberta = folhaAberta(medida)
  const imprimir = medida.largura > 0 && medida.altura > 0 ? folhaParaImprimir(aberta, dados.folhas, dados.producao.sangriaMm, dados.producao.margemMaquinaMm) : null
  const qtd = inteiro(copias)
  const totalFolhas = folhas * qtd
  const temPreco = imprimir && precoDe(dados, papel, imprimir.folha.nome) !== undefined
  const link =
    imprimir && qtd > 0 && temPreco ? `../orcamento-rapido/?${new URLSearchParams({ papel, folha: imprimir.folha.nome, quantidade: String(totalFolhas) })}` : null

  return (
    <Card className="grid gap-4">
      <h2 className="text-lg font-semibold">Livreto grampeado</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.paginas}>Páginas (com capa)</Label>
          <Input id={ids.paginas} type="number" min={1} inputMode="numeric" value={paginas} onChange={(e) => setPaginas(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.fechada}>Tamanho fechado</Label>
          <Select id={ids.fechada} value={fechada} onChange={(e) => setFechada(e.target.value)}>
            {dados.folhas.map((x) => (
              <option key={x.nome} value={x.nome}>
                {x.nome} ({x.larguraMm} × {x.alturaMm} mm)
              </option>
            ))}
            <option value={OUTRO}>Outro tamanho</option>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.copias}>Livretos (opcional)</Label>
          <Input id={ids.copias} type="number" min={0} inputMode="numeric" value={copias} onChange={(e) => setCopias(e.target.value)} />
        </div>
      </div>
      {!f && (
        <div className="grid grid-cols-2 gap-4 sm:w-2/3">
          <div className="grid gap-1.5">
            <Label htmlFor={ids.largura}>Largura fechado (mm)</Label>
            <Input id={ids.largura} type="number" min={1} inputMode="decimal" value={outra.largura} onChange={(e) => setOutra({ ...outra, largura: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={ids.altura}>Altura fechado (mm)</Label>
            <Input id={ids.altura} type="number" min={1} inputMode="decimal" value={outra.altura} onChange={(e) => setOutra({ ...outra, altura: e.target.value })} />
          </div>
        </div>
      )}

      {pedidas > 0 && (
        <div className="grid gap-2 rounded-md border border-borda bg-fundo p-4 text-sm">
          <p className="font-semibold">
            {folhas} {folhas === 1 ? 'folha' : 'folhas'} por livreto, impressas frente e verso
            {qtd > 0 && ` · ${totalFolhas} folhas para ${qtd} ${qtd === 1 ? 'livreto' : 'livretos'}`}
          </p>
          {emBranco > 0 && (
            <p className="text-alerta">
              {pedidas} páginas não fecham um livreto: são {total}, com {emBranco} {emBranco === 1 ? 'página' : 'páginas'} em branco no final. Combine com o
              cliente onde elas entram.
            </p>
          )}
          <p>
            Folha aberta: {mm(aberta.largura)} × {mm(aberta.altura)} mm ·{' '}
            {imprimir ? (
              imprimir.refile ? (
                <>imprime em {imprimir.folha.nome} e refila</>
              ) : (
                <>imprime em {imprimir.folha.nome}, sem refile</>
              )
            ) : (
              <span className="text-alerta">maior que todas as folhas cadastradas</span>
            )}
          </p>
        </div>
      )}

      {imprimir && qtd > 0 && papeis.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={ids.papel}>Papel</Label>
            <Select id={ids.papel} value={papel} onChange={(e) => setPapel(e.target.value)}>
              {papeis.map((p) => (
                <option key={p.nome}>{p.nome}</option>
              ))}
            </Select>
          </div>
          {link ? (
            <a
              href={link}
              className="inline-flex h-10 items-center rounded-md bg-tinta px-4 text-sm font-medium text-sobre-tinta hover:bg-tinta-hover sm:h-9"
            >
              Orçar {totalFolhas} {imprimir.folha.nome} no Orçamento rápido
            </a>
          ) : (
            <p className="text-sm text-alerta">Sem preço de {papel} em {imprimir.folha.nome} nos Cadastros.</p>
          )}
        </div>
      )}

      {pedidas > 0 && (
        <div>
          <h3 className="font-medium">Ordem das páginas na impressão</h3>
          <p className="mt-1 text-sm text-texto-3">Folha 1 é a de fora (capa). Cada lado mostra as páginas da esquerda para a direita, com a folha aberta.</p>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2">
            {ordemDasPaginas(total).map((fo, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-borda p-3 text-sm">
                <span className="w-14 font-medium">Folha {i + 1}</span>
                <span className="flex items-center gap-1">
                  <span className="mr-1 text-texto-3">Frente</span>
                  <Pagina n={fo.frente[0]} ultima={pedidas} />
                  <Pagina n={fo.frente[1]} ultima={pedidas} />
                </span>
                <span className="flex items-center gap-1">
                  <span className="mr-1 text-texto-3">Verso</span>
                  <Pagina n={fo.verso[0]} ultima={pedidas} />
                  <Pagina n={fo.verso[1]} ultima={pedidas} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  )
}

function Dobra() {
  const dados = useMemo(carregarDados, [])
  const [tipo, setTipo] = useState<TipoDobra>('carteira')
  const [folha, setFolha] = useState(dados.folhas.find((f) => f.nome === 'A4')?.nome ?? dados.folhas[0]?.nome ?? '')
  const ids = { tipo: useId(), folha: useId() }
  const f = dados.folhas.find((x) => x.nome === folha)
  const p = f ? paineis(tipo, { largura: f.larguraMm, altura: f.alturaMm }) : null
  const comprimento = p ? p.larguras.reduce((s, l) => s + l, 0) : 0

  return (
    <Card className="grid gap-4">
      <h2 className="text-lg font-semibold">Dobra de folheto</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.tipo}>Dobra</Label>
          <Select id={ids.tipo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoDobra)}>
            {Object.entries(DOBRAS).map(([v, nome]) => (
              <option key={v} value={v}>
                {nome}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.folha}>Folha aberta</Label>
          <Select id={ids.folha} value={folha} onChange={(e) => setFolha(e.target.value)}>
            {dados.folhas.map((x) => (
              <option key={x.nome} value={x.nome}>
                {x.nome} ({x.larguraMm} × {x.alturaMm} mm)
              </option>
            ))}
          </Select>
        </div>
      </div>
      {p && (
        <>
          {/* Folha deitada com os painéis na proporção real; as linhas tracejadas são as dobras. */}
          <svg viewBox={`-1 -1 ${comprimento + 2} ${p.altura + 2}`} role="img" aria-label={`Folha ${folha} com ${p.larguras.length} painéis`} className="w-full max-w-lg">
            <rect width={comprimento} height={p.altura} className="fill-superficie stroke-borda-forte" strokeWidth={1} />
            {p.dobras.map((x) => (
              <line key={x} x1={x} x2={x} y1={0} y2={p.altura} className="stroke-tinta" strokeWidth={1} strokeDasharray="4 3" />
            ))}
            {p.larguras.map((l, i) => {
              const x = p.larguras.slice(0, i).reduce((s, v) => s + v, 0) + l / 2
              return (
                <text key={i} x={x} y={p.altura / 2} textAnchor="middle" dominantBaseline="middle" className="fill-texto" fontSize={Math.min(16, l / 6)}>
                  {mm(l)} mm
                </text>
              )
            })}
          </svg>
          <ul className="grid gap-1 text-sm">
            <li>Painéis (da esquerda para a direita): {p.larguras.map((l) => `${mm(l)} mm`).join(' · ')}</li>
            <li>Dobras a {p.dobras.map((d) => `${mm(d)} mm`).join(' e ')} da borda esquerda</li>
            <li>Tamanho dobrado: {mm(Math.max(...p.larguras))} × {mm(p.altura)} mm</li>
            {tipo === 'carteira' && (
              <li className="text-texto-3">O painel da direita é o que dobra para dentro: {RECUO_CARTEIRA_MM} mm mais estreito para não enrugar.</li>
            )}
          </ul>
        </>
      )}
    </Card>
  )
}

function App() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Livreto e dobra</h1>
      <p className="mt-1 text-texto-2">Quantas folhas um livreto precisa e em que ordem as páginas saem; onde dobrar um folheto.</p>
      <div className="mt-6 grid gap-6">
        <Livreto />
        <Dobra />
      </div>
    </main>
  )
}

montar(<App />)
