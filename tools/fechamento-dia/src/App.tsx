import { useId, useMemo, useState } from 'react'
import { carregarDados, carregarFila, FORMAS_PAGAMENTO, reais, saldo, type FormaPagamento } from '@pst/dados'
import { Button, Card, Input, Label, montar, Topo } from '@pst/ui'
import { diaLocal, fechamento } from './fechamento'
import './index.css'

const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function App() {
  const { fila, estragado } = useMemo(() => carregarFila(), [])
  const loja = useMemo(() => carregarDados().loja.nome, [])
  const [dia, setDia] = useState(diaLocal(new Date()))
  const idDia = useId()
  const f = fechamento(fila, dia)
  const formas = (Object.keys(FORMAS_PAGAMENTO) as FormaPagamento[]).filter((x) => f.porForma[x] > 0)
  const diaBr = new Date(`${dia}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 print:max-w-none print:p-0">
      <div className="print:hidden">
        <Topo />
        <h1 className="mt-3 text-2xl font-semibold">Fechamento do dia</h1>
        <p className="mt-1 text-texto-2">Quanto entrou no dia, por forma de pagamento, a partir dos pagamentos lançados na Fila de pedidos.</p>
      </div>
      <p className="hidden text-lg font-semibold print:block">
        Fechamento {loja && `· ${loja} `}· {diaBr}
      </p>

      {estragado && (
        <p role="alert" className="mt-6 text-sm text-erro">
          Os pedidos salvos estão com problema. Abra a <a href="../fila-pedidos/" className="underline">Fila de pedidos</a> para importar um backup.
        </p>
      )}

      <Card className="mt-6 flex flex-wrap items-end gap-4 print:hidden">
        <div className="grid gap-1.5">
          <Label htmlFor={idDia}>Dia</Label>
          <Input id={idDia} type="date" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} />
        </div>
        <Button variante="secundario" onClick={() => print()}>
          Imprimir
        </Button>
        <p className="w-full text-sm text-texto-3 sm:w-auto">Só entra o que foi lançado em "Pagamentos" no pedido da Fila.</p>
      </Card>

      <Card className="mt-6 grid gap-3 print:border-0 print:p-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Recebido</h2>
          <p className="text-2xl font-semibold tabular-nums">{reais(f.total)}</p>
        </div>
        {formas.length > 0 ? (
          <ul className="grid gap-1 text-sm">
            {formas.map((x) => (
              <li key={x} className="flex justify-between border-b border-borda py-1">
                <span>{FORMAS_PAGAMENTO[x]}</span>
                <span className="tabular-nums">{reais(f.porForma[x])}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-texto-2">Nenhum pagamento lançado neste dia.</p>
        )}
      </Card>

      {f.recebimentos.length > 0 && (
        <Card className="mt-6 grid gap-2 print:border-0 print:p-0">
          <h2 className="font-semibold">Pagamentos do dia</h2>
          <ul className="grid text-sm">
            {f.recebimentos.map(({ pedido, pagamento }) => (
              <li key={pagamento.id} className="grid grid-cols-[3.5rem_1fr_auto] gap-2 border-b border-borda py-1.5">
                <span className="tabular-nums text-texto-3">{hora(pagamento.em)}</span>
                <span>
                  {pedido.cliente} <span className="text-texto-3">· {FORMAS_PAGAMENTO[pagamento.forma]}</span>
                </span>
                <span className="tabular-nums">{reais(pagamento.valor)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-6 grid gap-2 print:border-0 print:p-0">
        <h2 className="font-semibold">Entregues no dia ({f.entregues.length})</h2>
        {f.entregues.length > 0 ? (
          <ul className="grid text-sm">
            {f.entregues.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-borda py-1.5">
                <span>
                  {p.cliente} <span className="text-texto-3">· {p.descricao}</span>
                </span>
                {p.valor !== undefined && <span className="tabular-nums">{reais(p.valor)}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-texto-2">Nenhum pedido marcado como entregue neste dia.</p>
        )}
      </Card>

      {f.aCobrar.length > 0 && (
        <Card className="mt-6 grid gap-2 border-alerta print:border-0 print:p-0">
          <h2 className="font-semibold text-alerta">Entregues com valor a receber</h2>
          <ul className="grid text-sm">
            {f.aCobrar.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-borda py-1.5">
                <span>
                  {p.cliente} <span className="text-texto-3">· {p.descricao}</span>
                </span>
                <span className="tabular-nums">falta {reais(saldo(p)!)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  )
}

montar(<App />)
