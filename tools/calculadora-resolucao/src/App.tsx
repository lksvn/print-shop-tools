import { useId, useMemo, useState } from 'react'
import { carregarDados } from '@pst/dados'
import { Badge, BotaoCopiar, Card, cn, Input, Label, montar, Topo } from '@pst/ui'
import { cmMaximo, dpiEfetivo, formatarCm, fraseParaCliente, pxNecessarios } from './resolucao'
import './index.css'

const numero = (v: string) => Math.max(0, Number(v.replace(',', '.')) || 0)

function App() {
  const dados = useMemo(carregarDados, [])
  const dpiPadrao = dados.producao.dpi
  const [dpi, setDpi] = useState(String(dpiPadrao))
  const [px, setPx] = useState({ largura: '', altura: '' })
  const [nomeImagem, setNomeImagem] = useState('')
  const [erro, setErro] = useState('')
  const [erroCopia, setErroCopia] = useState('')
  const [alvo, setAlvo] = useState({ largura: '', altura: '' })
  const ids = { arquivo: useId(), dpi: useId(), pxL: useId(), pxA: useId(), cmL: useId(), cmA: useId() }

  async function lerImagem(f: File | undefined) {
    if (!f) return
    setErro('')
    try {
      const img = await createImageBitmap(f)
      setPx({ largura: String(img.width), altura: String(img.height) })
      setNomeImagem(f.name)
      img.close()
    } catch {
      setErro('Não deu para ler esta imagem. Use PNG, JPG ou WebP, ou digite os pixels.')
    }
  }

  const d = numero(dpi)
  const [pl, pa] = [Math.floor(numero(px.largura)), Math.floor(numero(px.altura))]
  const [cl, ca] = [numero(alvo.largura), numero(alvo.altura)]
  const frase = fraseParaCliente(pl, pa, d)
  // DPI que a imagem atual teria no tamanho pedido: o pior dos dois lados.
  const dpiNoAlvo = pl && pa && cl && ca ? Math.min(dpiEfetivo(pl, cl), dpiEfetivo(pa, ca)) : 0

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Calculadora de resolução</h1>
      <p className="mt-1 text-texto-2">Até quantos centímetros uma imagem imprime bem, e de quantos pixels um tamanho precisa.</p>

      <Card className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
          <div className="grid gap-1.5">
            <Label htmlFor={ids.pxL}>Largura (px)</Label>
            <Input id={ids.pxL} type="number" min={0} inputMode="numeric" value={px.largura} onChange={(e) => setPx({ ...px, largura: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={ids.pxA}>Altura (px)</Label>
            <Input id={ids.pxA} type="number" min={0} inputMode="numeric" value={px.altura} onChange={(e) => setPx({ ...px, altura: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={ids.dpi}>DPI</Label>
            <Input id={ids.dpi} type="number" min={1} inputMode="numeric" value={dpi} onChange={(e) => setDpi(e.target.value)} />
          </div>
        </div>
        <div>
          <label
            htmlFor={ids.arquivo}
            className="inline-flex h-10 cursor-pointer items-center rounded-md border border-borda-forte bg-superficie px-4 text-sm font-medium hover:bg-suave has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-tinta sm:h-9"
          >
            {nomeImagem ? `${nomeImagem} · trocar imagem` : 'Ler pixels de uma imagem'}
            <input id={ids.arquivo} type="file" accept="image/*" className="sr-only" onChange={(e) => lerImagem(e.target.files?.[0])} />
          </label>
          {erro && (
            <p role="alert" className="mt-2 text-sm text-erro">
              {erro}
            </p>
          )}
        </div>

        {pl > 0 && pa > 0 && (
          <>
            <ul className="grid gap-2 text-sm">
              {[...new Set([d, 300, 150])].filter((x) => x > 0).map((x) => (
                <li key={x} className={cn('flex flex-wrap items-center gap-2', x === d && 'font-semibold')}>
                  <span className="w-20 tabular-nums">{x} DPI</span>
                  <span className="tabular-nums">
                    até {formatarCm(cmMaximo(pl, x))} × {formatarCm(cmMaximo(pa, x))} cm
                  </span>
                  {x >= dpiPadrao ? <Badge tom="ok">boa</Badge> : x < 150 ? <Badge tom="erro">baixa</Badge> : <Badge tom="alerta">aceitável de longe</Badge>}
                </li>
              ))}
            </ul>
            <p className="rounded-md border border-borda bg-fundo p-4 text-sm">{frase}</p>
            <div>
              <BotaoCopiar texto={frase} variante="secundario" aoFalhar={() => setErroCopia('O navegador não deixou copiar. Selecione o texto e copie à mão.')}>
                Copiar frase para o cliente
              </BotaoCopiar>
              {erroCopia && (
                <p role="alert" className="mt-2 text-sm text-erro">
                  {erroCopia}
                </p>
              )}
            </div>
          </>
        )}
      </Card>

      <Card className="mt-6 grid gap-4">
        <h2 className="font-semibold">Quero imprimir em…</h2>
        <div className="grid grid-cols-2 gap-4 sm:w-2/3">
          <div className="grid gap-1.5">
            <Label htmlFor={ids.cmL}>Largura (cm)</Label>
            <Input id={ids.cmL} inputMode="decimal" value={alvo.largura} onChange={(e) => setAlvo({ ...alvo, largura: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={ids.cmA}>Altura (cm)</Label>
            <Input id={ids.cmA} inputMode="decimal" value={alvo.altura} onChange={(e) => setAlvo({ ...alvo, altura: e.target.value })} />
          </div>
        </div>
        {cl > 0 && ca > 0 && d > 0 && (
          <p className="text-sm">
            Precisa de pelo menos{' '}
            <strong className="tabular-nums">
              {pxNecessarios(cl, d)} × {pxNecessarios(ca, d)} px
            </strong>{' '}
            a {d} DPI.
            {dpiNoAlvo > 0 && (
              <span className={cn('block mt-1', dpiNoAlvo >= dpiPadrao ? 'text-ok' : dpiNoAlvo >= 150 ? 'text-alerta' : 'text-erro')}>
                A imagem de {pl} × {pa} px nesse tamanho fica com {Math.floor(dpiNoAlvo)} DPI.
              </span>
            )}
          </p>
        )}
      </Card>
    </main>
  )
}

montar(<App />)
