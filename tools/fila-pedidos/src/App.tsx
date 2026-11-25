import { useEffect, useId, useRef, useState } from 'react'
import {
  carregarDados,
  carregarFila,
  CHAVE_FILA,
  diasDesde,
  ETAPAS,
  FORMAS_PAGAMENTO,
  MENSAGEM_ETAPA,
  mover,
  parado,
  precisaBackup,
  reais,
  saldo,
  totalPago,
  validarFila,
  type FormaPagamento,
  type Pagamento,
  type Pedido,
} from '@pst/dados'
import {
  Badge,
  Button,
  Card,
  cn,
  formatarTelefone,
  Input,
  InputMoeda,
  InputTelefone,
  Label,
  linkWhatsapp,
  Modal,
  montar,
  Select,
  somarDiasUteis,
  Textarea,
  toast,
  Topo,
} from '@pst/ui'
import { exportarJson, importarJson, salvar } from '@pst/ui/storage'
import './index.css'

const semAcento = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const dataLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type Rascunho = Pick<Pedido, 'cliente' | 'telefone' | 'descricao' | 'valor' | 'prazo' | 'observacoes' | 'pagamentos'>

/** Pagamentos do pedido: sinal, parcelas, o restante na entrega. A data é a de quando foi lançado. */
function Pagamentos({ lista, valor, aoMudar }: { lista: Pagamento[]; valor?: number; aoMudar: (l: Pagamento[]) => void }) {
  const [novo, setNovo] = useState<number | undefined>()
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const ids = { valor: useId(), forma: useId() }
  const pago = totalPago({ pagamentos: lista } as Pedido)
  const falta = saldo({ valor, pagamentos: lista } as Pedido)
  return (
    <fieldset className="grid gap-2 rounded-md border border-borda p-3">
      <legend className="px-1 text-sm font-medium">Pagamentos</legend>
      {lista.length > 0 && (
        <ul className="grid gap-1 text-sm">
          {lista.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="tabular-nums">
                {reais(p.valor)} · {FORMAS_PAGAMENTO[p.forma]} · {new Date(p.em).toLocaleDateString('pt-BR')}
              </span>
              <Button
                type="button"
                variante="fantasma"
                className="px-2"
                aria-label={`Remover pagamento de ${reais(p.valor)}`}
                onClick={() => aoMudar(lista.filter((x) => x.id !== p.id))}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
      {falta !== undefined && (
        <p className="text-sm text-texto-2">
          Pago {reais(pago)} · {falta > 0 ? `falta ${reais(falta)}` : 'quitado'}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.valor}>Valor recebido</Label>
          <InputMoeda id={ids.valor} className="w-32" valor={novo} aoMudar={setNovo} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.forma}>Forma</Label>
          <Select id={ids.forma} value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento)}>
            {Object.entries(FORMAS_PAGAMENTO).map(([v, nome]) => (
              <option key={v} value={v}>
                {nome}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          variante="secundario"
          disabled={!novo}
          onClick={() => {
            if (!novo) return
            aoMudar([...lista, { id: crypto.randomUUID(), valor: novo, forma, em: new Date().toISOString() }])
            setNovo(undefined)
          }}
        >
          Lançar
        </Button>
      </div>
    </fieldset>
  )
}

function FormPedido({ inicial, aoSalvar }: { inicial: Rascunho; aoSalvar: (r: Rascunho) => void }) {
  const [r, setR] = useState(inicial)
  const [erro, setErro] = useState('')
  const ids = { cliente: useId(), telefone: useId(), descricao: useId(), valor: useId(), prazo: useId(), obs: useId() }
  return (
    <form
      className="grid gap-4 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!r.cliente.trim()) return setErro('Informe o nome do cliente.')
        aoSalvar({ ...r, cliente: r.cliente.trim(), descricao: r.descricao.trim(), observacoes: r.observacoes?.trim() || undefined })
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.cliente}>Cliente</Label>
          <Input id={ids.cliente} data-autofocus value={r.cliente} onChange={(e) => setR({ ...r, cliente: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.telefone}>WhatsApp</Label>
          <InputTelefone id={ids.telefone} valor={r.telefone} aoMudar={(telefone) => setR({ ...r, telefone })} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={ids.descricao}>O que foi pedido</Label>
        <Textarea
          id={ids.descricao}
          rows={3}
          placeholder="Ex.: 100 cartões de visita, couchê 240g"
          value={r.descricao}
          onChange={(e) => setR({ ...r, descricao: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.valor}>Valor (R$, opcional)</Label>
          <InputMoeda id={ids.valor} valor={r.valor} aoMudar={(valor) => setR({ ...r, valor })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.prazo}>Entregar até</Label>
          <Input id={ids.prazo} type="date" value={r.prazo ?? ''} onChange={(e) => setR({ ...r, prazo: e.target.value || undefined })} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={ids.obs}>Observações para a produção (opcional)</Label>
        <Textarea
          id={ids.obs}
          rows={2}
          placeholder="Ex.: laminação fosca, conferir a cor do logo"
          value={r.observacoes ?? ''}
          onChange={(e) => setR({ ...r, observacoes: e.target.value })}
        />
      </div>
      <Pagamentos lista={r.pagamentos} valor={r.valor} aoMudar={(pagamentos) => setR({ ...r, pagamentos })} />
      {erro && (
        <p role="alert" className="text-sm text-erro">
          {erro}
        </p>
      )}
      <Button type="submit" className="justify-self-start">
        Salvar
      </Button>
    </form>
  )
}

/** Pedido novo já vem com o prazo padrão dos Cadastros. */
const novoRascunho = (): Rascunho => ({
  cliente: '',
  telefone: '',
  descricao: '',
  pagamentos: [],
  prazo: dataLocal(somarDiasUteis(new Date(), carregarDados().loja.prazoDiasUteis)),
})

function App() {
  const [{ fila: inicial, estragado }] = useState(carregarFila)
  const [fila, setFila] = useState(inicial)
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Pedido | 'novo' | null>(null)
  const [erroArquivo, setErroArquivo] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  const ids = { busca: useId(), dias: useId() }

  useEffect(() => {
    if (!estragado) salvar(CHAVE_FILA, fila)
  }, [fila, estragado])

  const termo = semAcento(busca.trim())
  const visiveis = termo
    ? fila.pedidos.filter((p) => semAcento(`${p.cliente} ${p.telefone} ${p.descricao}`).includes(termo))
    : fila.pedidos
  const mudarPedidos = (f: (ps: Pedido[]) => Pedido[]) => setFila((atual) => ({ ...atual, pedidos: f(atual.pedidos) }))
  const atrasados = fila.pedidos.filter((p) => parado(p, fila.diasAlerta)).length

  function salvarRascunho(r: Rascunho) {
    if (editando === 'novo') {
      const agora = new Date().toISOString()
      mudarPedidos((ps) => [...ps, { id: crypto.randomUUID(), ...r, etapa: 'arquivo', criadoEm: agora, etapaDesde: agora }])
      toast('Pedido criado')
    } else if (editando) {
      mudarPedidos((ps) => ps.map((p) => (p.id === editando.id ? { ...p, ...r } : p)))
      toast('Pedido salvo')
    }
    setEditando(null)
  }

  function exportar() {
    const comBackup = { ...fila, ultimoBackup: new Date().toISOString() }
    exportarJson('fila-pedidos.json', comBackup)
    setFila(comBackup)
  }

  async function importar(f: File | undefined) {
    if (!f) return
    setErroArquivo('')
    try {
      const nova = validarFila(await importarJson(f))
      if (!nova) return setErroArquivo('Arquivo inválido: não é um backup da fila de pedidos.')
      if (confirm(`Substituir os ${fila.pedidos.length} pedidos atuais pelos ${nova.pedidos.length} do arquivo?`)) {
        setFila(nova)
        toast('Pedidos importados')
      }
    } catch {
      setErroArquivo('Arquivo inválido: não é um .json.')
    } finally {
      if (arquivo.current) arquivo.current.value = ''
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <Topo />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Fila de pedidos</h1>
          <p className="mt-1 text-texto-2">Em que etapa está cada pedido e quem está esperando.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditando('novo')} disabled={estragado}>
            Novo pedido
          </Button>
          <Button variante="secundario" onClick={exportar} disabled={estragado}>
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

      {estragado && (
        <p role="alert" className="mt-4 text-sm text-erro">
          Os pedidos salvos neste navegador estão com problema e não foram carregados nem apagados. Importe um backup para
          continuar.
        </p>
      )}
      {erroArquivo && (
        <p role="alert" className="mt-4 text-sm text-erro">
          {erroArquivo}
        </p>
      )}
      {precisaBackup(fila) && (
        <p className="mt-4 text-sm text-alerta">
          {fila.ultimoBackup
            ? `Último backup há ${diasDesde(fila.ultimoBackup)} dias.`
            : 'Os pedidos ainda não têm backup.'}{' '}
          Os pedidos ficam só neste navegador:{' '}
          <button type="button" onClick={exportar} className="cursor-pointer underline">
            exportar agora
          </button>
          .
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="grid flex-1 gap-1.5 sm:max-w-72">
          <Label htmlFor={ids.busca}>Buscar</Label>
          <Input
            id={ids.busca}
            type="search"
            placeholder="Nome, telefone ou pedido"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.dias}>Avisar parado após (dias)</Label>
          <Input
            id={ids.dias}
            type="number"
            min={1}
            className="w-24"
            value={fila.diasAlerta}
            onChange={(e) => setFila({ ...fila, diasAlerta: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
          />
        </div>
        {atrasados > 0 && <p className="pb-2 text-sm text-alerta">{atrasados} parado(s) há muito tempo</p>}
      </div>

      {/* Celular: etapas uma embaixo da outra. Computador: colunas lado a lado, rolando para o lado se faltar espaço. */}
      <div className="mt-6 grid gap-4 md:auto-cols-[16rem] md:grid-flow-col md:overflow-x-auto md:pb-2">
        {ETAPAS.map((etapa, i) => {
          const lista = visiveis.filter((p) => p.etapa === etapa.id)
          return (
            <section key={etapa.id} aria-labelledby={`etapa-${etapa.id}`} className="grid content-start gap-2">
              <h2 id={`etapa-${etapa.id}`} className="flex items-center justify-between text-sm font-semibold">
                {etapa.nome} <Badge>{lista.length}</Badge>
              </h2>
              {lista.map((p) => {
                const dias = diasDesde(p.etapaDesde)
                const atrasado = parado(p, fila.diasAlerta)
                return (
                  <Card key={p.id} className={cn('grid gap-2 p-3 text-sm', atrasado && 'border-alerta')}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{p.cliente}</p>
                      {p.valor !== undefined && <span className="tabular-nums">{reais(p.valor)}</span>}
                    </div>
                    {p.descricao && <p className="whitespace-pre-wrap text-texto-2">{p.descricao}</p>}
                    {(p.pagamentos.length > 0 || p.prazo) && (
                      <p className="text-xs text-texto-2">
                        {[
                          p.prazo && `Entregar até ${new Date(`${p.prazo}T12:00`).toLocaleDateString('pt-BR')}`,
                          p.pagamentos.length > 0 && (saldo(p) === 0 ? 'Quitado' : `Pago ${reais(totalPago(p))}${saldo(p) ? `, falta ${reais(saldo(p)!)}` : ''}`),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    <p className={cn('text-xs', atrasado ? 'text-alerta' : 'text-texto-3')}>
                      {dias === 0 ? 'Entrou hoje nesta etapa' : `Há ${dias} ${dias === 1 ? 'dia' : 'dias'} nesta etapa`}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variante="secundario"
                        className="px-3"
                        disabled={i === 0}
                        aria-label={`Voltar ${p.cliente} para ${ETAPAS[i - 1]?.nome}`}
                        onClick={() => mudarPedidos((ps) => ps.map((x) => (x.id === p.id ? mover(x, -1) : x)))}
                      >
                        ←
                      </Button>
                      <Button
                        variante="secundario"
                        className="px-3"
                        disabled={i === ETAPAS.length - 1}
                        aria-label={`Avançar ${p.cliente} para ${ETAPAS[i + 1]?.nome}`}
                        onClick={() => mudarPedidos((ps) => ps.map((x) => (x.id === p.id ? mover(x, 1) : x)))}
                      >
                        →
                      </Button>
                      {p.telefone && (
                        <a
                          href={linkWhatsapp(MENSAGEM_ETAPA[p.etapa](p.cliente), p.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={formatarTelefone(p.telefone)}
                          className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-tinta hover:bg-suave sm:h-9"
                        >
                          WhatsApp
                        </a>
                      )}
                      <Button variante="fantasma" className="px-3" onClick={() => setEditando(p)}>
                        Editar
                      </Button>
                      <a
                        href={`../ordem-servico/?pedido=${p.id}`}
                        aria-label={`Ordem de serviço ou recibo de ${p.cliente}`}
                        className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-tinta hover:bg-suave sm:h-9"
                      >
                        OS
                      </a>
                      <Button
                        variante="perigo"
                        className="px-3"
                        aria-label={`Apagar pedido de ${p.cliente}`}
                        onClick={() => {
                          if (!confirm(`Apagar o pedido de ${p.cliente}?`)) return
                          mudarPedidos((ps) => ps.filter((x) => x.id !== p.id))
                          toast('Pedido apagado')
                        }}
                      >
                        Apagar
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </section>
          )
        })}
      </div>

      <Modal
        aberto={editando !== null}
        aoFechar={() => setEditando(null)}
        titulo={editando === 'novo' ? 'Novo pedido' : 'Editar pedido'}
        className="w-[min(36rem,95vw)]"
      >
        {editando && (
          <FormPedido
            key={editando === 'novo' ? 'novo' : editando.id}
            inicial={editando === 'novo' ? novoRascunho() : editando}
            aoSalvar={salvarRascunho}
          />
        )}
      </Modal>
    </main>
  )
}

montar(<App />)
