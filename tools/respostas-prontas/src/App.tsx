import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { carregarDados, valoresAutomaticos } from '@pst/dados'
import { BotaoCopiar, Button, Card, cn, faltando, formatarMoeda, Input, InputMoeda, InputTelefone, Label, linkWhatsapp, montar, preencher, toast, Topo } from '@pst/ui'
import { carregar, exportarJson, importarJson, salvar } from '@pst/ui/storage'
import { Editor } from './Editor'
import { camposUsados, respostasPadrao, validarRespostas, type Resposta } from './texto'
import './index.css'

const CHAVE = 'pst:respostas-prontas:v1'
const semAcento = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

function carregarRespostas() {
  const salvo = carregar(CHAVE, { respostas: null as unknown })
  return validarRespostas(salvo.respostas) ?? respostasPadrao()
}

function App() {
  const [respostas, setRespostas] = useState(carregarRespostas)
  const [selecionada, setSelecionada] = useState(respostas[0]?.id ?? '')
  const [editando, setEditando] = useState(false)
  const [busca, setBusca] = useState('')
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState<number | undefined>()
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [erroArquivo, setErroArquivo] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  const dados = useMemo(carregarDados, [])
  const ids = { busca: useId(), cliente: useId(), valor: useId(), telefone: useId() }

  useEffect(() => salvar(CHAVE, { respostas }), [respostas])

  const termo = semAcento(busca.trim())
  const lista = termo ? respostas.filter((r) => semAcento(`${r.titulo} ${r.texto}`).includes(termo)) : respostas
  const atual = respostas.find((r) => r.id === selecionada)

  const texto = atual
    ? preencher(atual.texto, {
        ...valoresAutomaticos(dados),
        cliente: cliente.trim(),
        valor: valor === undefined ? '' : formatarMoeda(valor),
      })
    : ''
  const falta = faltando(texto)
  const usados = atual ? camposUsados(atual.texto) : []

  function escolher(id: string) {
    setSelecionada(id)
    setEditando(false)
    setErro('')
  }

  // No celular a resposta fica abaixo da lista: rola até ela ao tocar num título.
  function escolherNaLista(id: string) {
    escolher(id)
    if (matchMedia('(max-width: 767px)').matches)
      requestAnimationFrame(() => document.getElementById('resposta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function nova() {
    const r: Resposta = { id: crypto.randomUUID(), titulo: 'Nova resposta', texto: '' }
    setRespostas((rs) => [...rs, r])
    setSelecionada(r.id)
    setEditando(true)
  }

  async function importar(f: File | undefined) {
    if (!f) return
    setErroArquivo('')
    try {
      const novas = validarRespostas(((await importarJson(f)) as { respostas?: unknown })?.respostas)
      if (!novas?.length) return setErroArquivo('Arquivo inválido: não é um arquivo de respostas prontas.')
      if (confirm(`Substituir as ${respostas.length} respostas atuais pelas ${novas.length} do arquivo?`)) {
        setRespostas(novas)
        toast('Respostas importadas')
        escolher(novas[0]?.id ?? '')
      }
    } catch {
      setErroArquivo('Arquivo inválido: não é um .json.')
    } finally {
      if (arquivo.current) arquivo.current.value = ''
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Topo />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Respostas prontas</h1>
          <p className="mt-1 text-texto-2">Mensagens do dia a dia, já com os dados da gráfica.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" onClick={() => exportarJson('respostas-prontas.json', { respostas })}>
            Exportar
          </Button>
          <Button variante="secundario" onClick={() => arquivo.current?.click()}>
            Importar
          </Button>
          <input
            ref={arquivo}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => importar(e.target.files?.[0])}
          />
        </div>
      </div>
      {erroArquivo && (
        <p role="alert" className="mt-3 text-sm text-erro">
          {erroArquivo}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[17rem_1fr]">
        <nav aria-label="Respostas" className="grid content-start gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={ids.busca} className="sr-only">
              Buscar resposta
            </Label>
            <Input id={ids.busca} type="search" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <ul className="grid gap-1">
            {lista.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  aria-current={r.id === selecionada ? 'true' : undefined}
                  onClick={() => escolherNaLista(r.id)}
                  className={cn(
                    'w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm hover:bg-suave sm:py-2',
                    r.id === selecionada && 'bg-suave font-medium text-tinta',
                  )}
                >
                  {r.titulo}
                </button>
              </li>
            ))}
            {!lista.length && <li className="px-3 py-2 text-sm text-texto-3">Nenhuma resposta encontrada.</li>}
          </ul>
          <Button variante="secundario" onClick={nova}>
            Nova resposta
          </Button>
        </nav>

        {atual && (
          <Card id="resposta" className="scroll-mt-4">
            {editando ? (
              <Editor
                key={atual.id}
                resposta={atual}
                aoSalvar={(r) => {
                  toast('Resposta salva')
                  setRespostas((rs) => rs.map((x) => (x.id === r.id ? r : x)))
                  setEditando(false)
                }}
                aoCancelar={() => {
                  // Resposta nova que nunca foi salva some ao cancelar.
                  if (!atual.texto) {
                    setRespostas((rs) => rs.filter((x) => x.id !== atual.id))
                    escolher(respostas.find((x) => x.id !== atual.id)?.id ?? '')
                  } else setEditando(false)
                }}
                aoApagar={() => {
                  toast('Resposta apagada')
                  const resto = respostas.filter((x) => x.id !== atual.id)
                  setRespostas(resto)
                  escolher(resto[0]?.id ?? '')
                }}
              />
            ) : (
              <div className="grid gap-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold">{atual.titulo}</h2>
                  <Button variante="fantasma" onClick={() => setEditando(true)}>
                    Editar
                  </Button>
                </div>

                {usados.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {usados.includes('cliente') && (
                      <div className="grid gap-1.5">
                        <Label htmlFor={ids.cliente}>Nome do cliente</Label>
                        <Input id={ids.cliente} value={cliente} onChange={(e) => setCliente(e.target.value)} />
                      </div>
                    )}
                    {usados.includes('valor') && (
                      <div className="grid gap-1.5">
                        <Label htmlFor={ids.valor}>Valor (R$)</Label>
                        <InputMoeda id={ids.valor} valor={valor} aoMudar={setValor} />
                      </div>
                    )}
                  </div>
                )}

                <p className="rounded-md border border-borda bg-fundo p-4 text-sm whitespace-pre-wrap">{texto}</p>

                {falta.length > 0 && (
                  <p className="text-sm text-alerta">
                    Falta preencher: {falta.join(', ')}.{' '}
                    {falta.some((f) => f !== '{cliente}' && f !== '{valor}') && (
                      <a href="../cadastros/" className="underline">
                        Completar nos Cadastros
                      </a>
                    )}
                  </p>
                )}

                <div className="grid gap-1.5 sm:max-w-64">
                  <Label htmlFor={ids.telefone}>WhatsApp do cliente (opcional)</Label>
                  <InputTelefone id={ids.telefone} valor={telefone} aoMudar={setTelefone} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <BotaoCopiar texto={texto} aoFalhar={() => setErro('Não foi possível copiar. Selecione o texto e copie com Ctrl+C.')} />
                  <a
                    href={linkWhatsapp(texto, telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center rounded-md border border-borda-forte bg-superficie px-4 text-sm font-medium hover:bg-suave sm:h-9"
                  >
                    Enviar pelo WhatsApp
                  </a>
                </div>
                {erro && (
                  <p role="alert" className="text-sm text-erro">
                    {erro}
                  </p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  )
}

montar(<App />)
