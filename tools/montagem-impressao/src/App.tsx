import { useEffect, useId, useMemo, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import urlDoWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { carregarDados } from '@pst/dados'
import { Card, cn, Input, Label, montar, Select, Topo } from '@pst/ui'
import { gerarMontagem, type Virar } from './montagem'
import './index.css'

GlobalWorkerOptions.workerSrc = urlDoWorker

type Resultado = Awaited<ReturnType<typeof gerarMontagem>>
const mm = (v: number) => Math.round(v * 10) / 10

/** Desenha cada página do PDF gerado como imagem, para conferir antes de baixar. */
async function previas(pdf: Uint8Array) {
  const tarefa = getDocument({ data: pdf.slice() }) // pdf.js toma posse do buffer: vai uma cópia
  try {
    const doc = await tarefa.promise
    const imagens: string[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n)
      const base = pagina.getViewport({ scale: 1 })
      const viewport = pagina.getViewport({ scale: 900 / Math.max(base.width, base.height) })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await pagina.render({ canvas, canvasContext: ctx, viewport }).promise
      imagens.push(canvas.toDataURL('image/png'))
    }
    return imagens
  } finally {
    await tarefa.destroy()
  }
}

function App() {
  const dados = useMemo(carregarDados, [])
  const maiorFolha = [...dados.folhas].sort((a, b) => b.larguraMm * b.alturaMm - a.larguraMm * a.alturaMm)[0]
  const [arquivo, setArquivo] = useState<{ nome: string; bytes: Uint8Array } | null>(null)
  const [folha, setFolha] = useState(maiorFolha?.nome ?? '')
  const [comSangria, setComSangria] = useState(false)
  const [frenteVerso, setFrenteVerso] = useState(true)
  const [virar, setVirar] = useState<Virar>('lateral')
  const [quantidade, setQuantidade] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [imagens, setImagens] = useState<string[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const ids = { arquivo: useId(), folha: useId(), sangria: useId(), fv: useId(), virar: useId(), qtd: useId() }

  async function abrir(f: File | undefined) {
    if (!f) return
    setErro('')
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return setErro('Envie a arte em PDF.')
    setArquivo({ nome: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })
  }

  // Refaz a montagem a cada mudança de opção. `ativo` descarta respostas atrasadas de uma opção anterior.
  useEffect(() => {
    const f = dados.folhas.find((x) => x.nome === folha)
    if (!arquivo || !f) return
    let ativo = true
    setCarregando(true)
    gerarMontagem(arquivo.bytes, { folha: f, regras: dados.producao, comSangria, frenteVerso, virar })
      .then(async (r) => {
        const imgs = r.pdf ? await previas(r.pdf) : []
        if (!ativo) return
        setResultado(r)
        setImagens(imgs)
        setErro('')
      })
      .catch(() => {
        if (!ativo) return
        setResultado(null)
        setImagens([])
        setErro('Não foi possível ler este PDF. Ele pode estar protegido por senha ou corrompido.')
      })
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [arquivo, folha, comSangria, frenteVerso, virar, dados])

  const urlPdf = useMemo(() => (resultado?.pdf ? URL.createObjectURL(new Blob([resultado.pdf.slice()], { type: 'application/pdf' })) : ''), [resultado])
  useEffect(() => () => URL.revokeObjectURL(urlPdf), [urlPdf])

  const m = resultado?.montagem
  const qtd = Math.max(0, Math.floor(Number(quantidade) || 0))
  const nomeSaida = arquivo ? `montagem-${arquivo.nome.replace(/\.pdf$/i, '')}-${folha}.pdf` : ''
  const temVerso = (resultado?.paginas ?? 0) > 1
  const s = dados.producao.sangriaMm

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Montagem para impressão</h1>
      <p className="mt-1 text-texto-2">
        Solte a arte (ex.: um cartão 9×5) e escolha a folha: sai um PDF com as cópias posicionadas e as marcas de corte, pronto
        para imprimir. A arte continua em vetor.
      </p>

      <label
        htmlFor={ids.arquivo}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          abrir(e.dataTransfer.files[0])
        }}
        className={cn(
          'mt-6 grid cursor-pointer place-items-center rounded-lg border-2 border-dashed border-borda-forte bg-superficie px-6 py-10 text-center hover:border-tinta has-[:focus-visible]:border-tinta',
          arrastando && 'border-tinta bg-suave',
        )}
      >
        <span className="font-medium">{arquivo ? `${arquivo.nome} · trocar arquivo` : 'Arraste a arte aqui ou clique para escolher'}</span>
        <span className="mt-1 text-sm text-texto-3">PDF com uma página por arte. Frente e verso: página 1 é a frente, página 2 o verso.</span>
        <input id={ids.arquivo} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => abrir(e.target.files?.[0])} />
      </label>
      {erro && (
        <p role="alert" className="mt-3 text-sm text-erro">
          {erro}
        </p>
      )}

      {arquivo && (
        <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr] md:items-start">
          <Card className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={ids.folha}>Folha</Label>
              <Select id={ids.folha} value={folha} onChange={(e) => setFolha(e.target.value)}>
                {dados.folhas.map((f) => (
                  <option key={f.nome} value={f.nome}>
                    {f.nome} ({f.larguraMm} × {f.alturaMm} mm)
                  </option>
                ))}
              </Select>
            </div>
            <label htmlFor={ids.sangria} className="flex items-start gap-3 text-sm">
              <input id={ids.sangria} type="checkbox" className="mt-0.5 size-4 accent-tinta" checked={comSangria} onChange={(e) => setComSangria(e.target.checked)} />
              <span>
                O PDF já tem sangria de {s} mm
                <span className="block text-texto-3">Desmarcado: a arte é usada no tamanho final e a sangria fica em branco.</span>
              </span>
            </label>
            {temVerso && (
              <>
                <label htmlFor={ids.fv} className="flex items-start gap-3 text-sm">
                  <input id={ids.fv} type="checkbox" className="mt-0.5 size-4 accent-tinta" checked={frenteVerso} onChange={(e) => setFrenteVerso(e.target.checked)} />
                  <span>Frente e verso (página 2 é o verso)</span>
                </label>
                {frenteVerso && (
                  <div className="grid gap-1.5">
                    <Label htmlFor={ids.virar}>A folha vira pela</Label>
                    <Select id={ids.virar} value={virar} onChange={(e) => setVirar(e.target.value as Virar)}>
                      <option value="lateral">Lateral (esquerda/direita)</option>
                      <option value="cima">Borda de cima</option>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor={ids.qtd}>Quantidade (opcional)</Label>
              <Input id={ids.qtd} type="number" min={0} inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <p className="text-sm text-texto-3">
              Sangria, espaço entre artes e margem da máquina vêm dos{' '}
              <a href="../cadastros/" className="text-tinta underline">
                Cadastros
              </a>{' '}
              ({s} / {dados.producao.espacoMm} / {dados.producao.margemMaquinaMm} mm).
            </p>
          </Card>

          <div className="grid gap-4" aria-busy={carregando}>
            {resultado && m && (
              <Card className="grid gap-2">
                {m.porFolha > 0 ? (
                  <>
                    <p className="font-semibold">
                      {m.porFolha} por folha {folha}{' '}
                      <span className="font-normal text-texto-2">
                        ({m.colunas} × {m.linhas}
                        {m.girada ? ', arte deitada' : ''})
                      </span>
                    </p>
                    <p className="text-sm text-texto-2">
                      Arte final: {mm(resultado.arte.largura)} × {mm(resultado.arte.altura)} mm
                      {qtd > 0 && ` · ${qtd} unidades = ${Math.ceil(qtd / m.porFolha)} ${Math.ceil(qtd / m.porFolha) === 1 ? 'folha' : 'folhas'}${frenteVerso && temVerso ? ' (frente e verso)' : ''}`}
                    </p>
                  </>
                ) : (
                  <p role="alert" className="text-alerta">
                    A arte ({mm(resultado.arte.largura)} × {mm(resultado.arte.altura)} mm) não cabe na folha {folha}. Escolha uma folha maior.
                  </p>
                )}
                {resultado.versoDiferente && frenteVerso && (
                  <p className="text-sm text-alerta">A página 2 tem medida diferente da página 1: o verso pode não casar com a frente no corte.</p>
                )}
                {resultado.paginas > 2 && <p className="text-sm text-alerta">O PDF tem {resultado.paginas} páginas: só as 2 primeiras entram na montagem.</p>}
                {urlPdf && (
                  <a
                    href={urlPdf}
                    download={nomeSaida}
                    className="mt-2 inline-flex h-10 w-fit items-center rounded-md bg-tinta px-4 text-sm font-medium text-sobre-tinta hover:bg-tinta-hover sm:h-9"
                  >
                    Baixar PDF montado
                  </a>
                )}
              </Card>
            )}
            {carregando && <p className="text-sm text-texto-3">Montando…</p>}
            {imagens.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2">
                {imagens.map((src, i) => (
                  <li key={i} className="grid gap-2">
                    <span className="text-sm font-medium">{i === 0 ? 'Frente' : 'Verso'}</span>
                    <img src={src} alt={`${i === 0 ? 'Frente' : 'Verso'} da folha ${folha} com ${m?.porFolha} cópias`} className="w-full rounded border border-borda" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

montar(<App />)
