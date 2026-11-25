import { useId, useMemo, useState, type ReactNode } from 'react'
import { carregarDados, carregarFila, ETAPAS, formatarEndereco, FORMAS_PAGAMENTO, reais, saldo, totalPago, type Pedido } from '@pst/dados'
import { Button, Card, cn, formatarTelefone, Label, montar, Select, Topo } from '@pst/ui'
import { dataBr, fraseRecibo, numeroDoPedido } from './os'
import './index.css'

type Modelo = 'os' | 'recibo'

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 border-b border-[#ddd] py-1.5">
      <span className="text-[#666]">{rotulo}</span>
      <span>{children}</span>
    </div>
  )
}

/** A folha em si. Cores fixas e claras: é papel, sai igual na tela escura e na impressora. */
function Folha({ pedido: p, modelo }: { pedido: Pedido; modelo: Modelo }) {
  const { loja } = useMemo(carregarDados, [])
  const contato = [loja.telefone && formatarTelefone(loja.telefone), formatarEndereco(loja.endereco)].filter(Boolean).join(' · ')
  const falta = saldo(p)
  return (
    <article className="rounded-lg bg-[#fff] p-6 text-sm text-[#1c1c1c] shadow-sm sm:p-10 print:rounded-none print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#1c1c1c] pb-4">
        <div>
          <p className="text-lg font-bold">{loja.nome || 'Gráfica'}</p>
          {contato && <p className="text-[#555]">{contato}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{modelo === 'os' ? 'Ordem de serviço' : 'Recibo'}</p>
          <p className="tabular-nums">nº {numeroDoPedido(p.id)}</p>
          <p className="text-[#555]">Pedido de {dataBr(p.criadoEm)}</p>
        </div>
      </header>

      <section className="mt-4">
        <Linha rotulo="Cliente">{p.cliente}</Linha>
        {p.telefone && <Linha rotulo="WhatsApp">{formatarTelefone(p.telefone)}</Linha>}
        <Linha rotulo="Pedido">
          <span className="whitespace-pre-wrap">{p.descricao || '—'}</span>
        </Linha>
        {p.valor !== undefined && <Linha rotulo="Valor">{reais(p.valor)}</Linha>}
        {modelo === 'os' && (
          <>
            {p.prazo && <Linha rotulo="Entregar até">{dataBr(p.prazo)}</Linha>}
            <Linha rotulo="Etapa">{ETAPAS.find((e) => e.id === p.etapa)?.nome}</Linha>
            {p.pagamentos.length > 0 && (
              <Linha rotulo="Pagamento">
                {falta === 0 ? 'Quitado' : `Pago ${reais(totalPago(p))}${falta ? ` · falta ${reais(falta)}` : ''}`}
              </Linha>
            )}
          </>
        )}
      </section>

      {modelo === 'os' ? (
        <>
          <section className="mt-6">
            <p className="font-semibold">Observações para a produção</p>
            <p className="mt-1 min-h-16 rounded border border-[#ccc] p-2 whitespace-pre-wrap">{p.observacoes ?? ''}</p>
          </section>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 print:grid-cols-2">
            <p className="border-t border-[#1c1c1c] pt-1 text-[#555]">Conferido por</p>
            <p className="border-t border-[#1c1c1c] pt-1 text-[#555]">Retirado por / data</p>
          </div>
        </>
      ) : (
        <>
          {p.pagamentos.length > 0 && (
            <table className="mt-6 w-full text-left">
              <thead>
                <tr className="border-b border-[#1c1c1c]">
                  <th className="py-1.5 font-semibold">Data</th>
                  <th className="py-1.5 font-semibold">Forma</th>
                  <th className="py-1.5 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {p.pagamentos.map((x) => (
                  <tr key={x.id} className="border-b border-[#ddd]">
                    <td className="py-1.5">{dataBr(x.em)}</td>
                    <td className="py-1.5">{FORMAS_PAGAMENTO[x.forma]}</td>
                    <td className="py-1.5 text-right tabular-nums">{reais(x.valor)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-1.5" colSpan={2}>
                    Total pago
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{reais(totalPago(p))}</td>
                </tr>
              </tbody>
            </table>
          )}
          <p className="mt-6">{fraseRecibo(p)}</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 print:grid-cols-2">
            <p className="text-[#555]">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="border-t border-[#1c1c1c] pt-1 text-[#555]">{loja.nome || 'Assinatura'}</p>
          </div>
        </>
      )}
    </article>
  )
}

function App() {
  const { fila, estragado } = useMemo(() => carregarFila(), [])
  const doLink = new URLSearchParams(location.search).get('pedido') ?? ''
  const [id, setId] = useState(fila.pedidos.some((p) => p.id === doLink) ? doLink : '')
  const [modelo, setModelo] = useState<Modelo>('os')
  const ids = { pedido: useId(), modelo: useId() }
  const pedido = fila.pedidos.find((p) => p.id === id)
  const semRecibo = modelo === 'recibo' && pedido && pedido.pagamentos.length === 0
  // Mais recentes primeiro: é quase sempre o pedido de agora.
  const lista = [...fila.pedidos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 print:max-w-none print:p-0">
      <div className="print:hidden">
        <Topo />
        <h1 className="mt-3 text-2xl font-semibold">Ordem de serviço / recibo</h1>
        <p className="mt-1 text-texto-2">A folha do pedido para a produção, ou o recibo para o cliente, a partir da Fila de pedidos.</p>

        {estragado ? (
          <p role="alert" className="mt-6 text-sm text-erro">
            Os pedidos salvos estão com problema. Abra a <a href="../fila-pedidos/" className="underline">Fila de pedidos</a> para importar um backup.
          </p>
        ) : fila.pedidos.length === 0 ? (
          <Card className="mt-6">
            <p className="text-texto-2">
              Nenhum pedido ainda. Cadastre na <a href="../fila-pedidos/" className="text-tinta underline">Fila de pedidos</a>.
            </p>
          </Card>
        ) : (
          <Card className="mt-6 grid gap-4 sm:grid-cols-[1fr_12rem] sm:items-end">
            <div className="grid gap-1.5">
              <Label htmlFor={ids.pedido}>Pedido</Label>
              <Select id={ids.pedido} value={id} onChange={(e) => setId(e.target.value)}>
                <option value="">Escolha um pedido</option>
                {lista.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cliente} · {p.descricao.slice(0, 40) || 'sem descrição'} ({dataBr(p.criadoEm)})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={ids.modelo}>Modelo</Label>
              <Select id={ids.modelo} value={modelo} onChange={(e) => setModelo(e.target.value as Modelo)}>
                <option value="os">Ordem de serviço</option>
                <option value="recibo">Recibo</option>
              </Select>
            </div>
            {pedido && (
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <Button onClick={() => print()} disabled={!!semRecibo}>
                  Imprimir ou salvar PDF
                </Button>
                <p className={cn('text-sm', semRecibo ? 'text-alerta' : 'text-texto-3')}>
                  {semRecibo
                    ? 'Este pedido não tem pagamento lançado. Lance na Fila (Editar → Pagamentos) para gerar o recibo.'
                    : 'Para mandar no WhatsApp, escolha "Salvar como PDF" na janela de impressão.'}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>

      {pedido && !semRecibo && (
        <div className="mt-6 print:mt-0">
          <Folha pedido={pedido} modelo={modelo} />
        </div>
      )}
    </main>
  )
}

montar(<App />)
