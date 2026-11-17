import { useId, useMemo, useState } from 'react'
import { calcularOrcamento, carregarDados, precoDe, valoresAutomaticos, type ItemOrcamento } from '@pst/dados'
import {
  BotaoCopiar,
  Button,
  Card,
  faltando,
  formatarMoeda,
  Input,
  InputTelefone,
  Label,
  linkWhatsapp,
  montar,
  preencher,
  Topo,
} from '@pst/ui'
import './index.css'

type Item = ItemOrcamento & { id: string }

const reais = (v: number) => `R$ ${formatarMoeda(v)}`
const select = 'h-9 w-full rounded-md border border-borda-forte bg-superficie px-2 text-sm'

function App() {
  const dados = useMemo(carregarDados, [])
  const papeis = dados.papeis.filter((p) => Object.keys(p.precos).length > 0)
  // Folhas na ordem dos Cadastros, só as que têm preço para o papel.
  const folhasDe = (papel: string) => dados.folhas.filter((f) => precoDe(dados, papel, f.nome) !== undefined).map((f) => f.nome)

  const novoItem = (): Item => {
    const papel = papeis[0]?.nome ?? ''
    return { id: crypto.randomUUID(), papel, folha: folhasDe(papel)[0] ?? '', quantidade: 1 }
  }

  const [itens, setItens] = useState<Item[]>(() => [novoItem()])
  const [cliente, setCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const ids = { cliente: useId(), telefone: useId() }

  const mudar = (id: string, mudanca: Partial<Item>) => setItens((lista) => lista.map((i) => (i.id === id ? { ...i, ...mudanca } : i)))

  const { linhas, total, semPreco } = calcularOrcamento(dados, itens)
  const textoItens = linhas
    .filter((l) => l.subtotal !== undefined && l.quantidade > 0)
    .map((l) => `• ${l.quantidade} × ${l.folha} ${l.papel} (${reais(l.unitario!)} cada): ${reais(l.subtotal!)}`)
    .join('\n')
  const mensagem = preencher(dados.modeloOrcamento, {
    ...valoresAutomaticos(dados),
    cliente: cliente.trim(),
    itens: textoItens,
    total: reais(total),
  })
  const falta = faltando(mensagem)

  if (!papeis.length) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <Topo />
        <h1 className="mt-3 text-2xl font-semibold">Orçamento rápido</h1>
        <Card className="mt-6">
          <p role="alert" className="text-alerta">
            Nenhum papel tem preço cadastrado.{' '}
            <a href="../cadastros/#precos" className="underline">
              Cadastrar preços
            </a>
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Orçamento rápido</h1>
      <p className="mt-1 text-texto-2">Papel, folha e quantidade: o valor e a mensagem saem na hora.</p>

      <Card className="mt-6">
        <h2 className="sr-only">Itens</h2>
        <ul className="grid gap-3">
          {linhas.map((l, n) => {
            const item = itens[n]
            return (
              <li key={item.id} className="grid items-end gap-3 sm:grid-cols-[1fr_7rem_6rem_7rem_auto]">
                <div className="grid gap-1.5">
                  <Label htmlFor={`${item.id}-papel`}>Papel</Label>
                  <select
                    id={`${item.id}-papel`}
                    className={select}
                    value={item.papel}
                    onChange={(e) => {
                      const folhas = folhasDe(e.target.value)
                      // Mantém a folha se ela existir no papel novo; senão, a primeira disponível.
                      mudar(item.id, { papel: e.target.value, folha: folhas.includes(item.folha) ? item.folha : (folhas[0] ?? '') })
                    }}
                  >
                    {papeis.map((p) => (
                      <option key={p.nome}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${item.id}-folha`}>Folha</Label>
                  <select
                    id={`${item.id}-folha`}
                    className={select}
                    value={item.folha}
                    onChange={(e) => mudar(item.id, { folha: e.target.value })}
                  >
                    {folhasDe(item.papel).map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${item.id}-qtd`}>Quantidade</Label>
                  <Input
                    id={`${item.id}-qtd`}
                    type="number"
                    min={1}
                    value={item.quantidade || ''}
                    onChange={(e) => mudar(item.id, { quantidade: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  />
                </div>
                <div className="grid gap-1.5 text-right">
                  <span className="text-xs text-texto-3">{l.unitario !== undefined && `${reais(l.unitario)} cada`}</span>
                  <span className="flex h-9 items-center justify-end font-medium tabular-nums">
                    {l.subtotal !== undefined ? reais(l.subtotal) : '—'}
                  </span>
                </div>
                <Button
                  variante="perigo"
                  aria-label={`Remover item ${n + 1}`}
                  disabled={itens.length === 1}
                  onClick={() => setItens((lista) => lista.filter((i) => i.id !== item.id))}
                >
                  Remover
                </Button>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-borda pt-4">
          <Button variante="secundario" onClick={() => setItens((lista) => [...lista, novoItem()])}>
            Adicionar item
          </Button>
          <p className="text-lg">
            Total: <strong className="tabular-nums">{reais(total)}</strong>
          </p>
        </div>
        {semPreco.length > 0 && (
          <p role="alert" className="mt-2 text-sm text-alerta">
            Algum item ficou sem preço e não entrou no total.
          </p>
        )}
      </Card>

      <Card className="mt-6 grid gap-4">
        <h2 className="font-semibold">Mensagem para o cliente</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={ids.cliente}>Nome do cliente</Label>
            <Input id={ids.cliente} value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={ids.telefone}>WhatsApp do cliente (opcional)</Label>
            <InputTelefone id={ids.telefone} valor={telefone} aoMudar={setTelefone} />
          </div>
        </div>

        <p className="rounded-md border border-borda bg-fundo p-4 text-sm whitespace-pre-wrap">{mensagem}</p>
        {falta.length > 0 && (
          <p className="text-sm text-alerta">
            Falta preencher: {falta.join(', ')}.{' '}
            {falta.some((f) => f !== '{cliente}') && (
              <a href="../cadastros/" className="underline">
                Completar nos Cadastros
              </a>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <BotaoCopiar texto={mensagem} aoFalhar={() => setErro('Não foi possível copiar. Selecione o texto e copie com Ctrl+C.')} />
          <a
            href={linkWhatsapp(mensagem, telefone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-md border border-borda-forte bg-superficie px-4 text-sm font-medium hover:bg-suave"
          >
            Enviar pelo WhatsApp
          </a>
          {total > 0 && (
            <a
              href={`../pix/?valor=${total.toFixed(2)}`}
              className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-tinta hover:bg-suave"
            >
              Gerar Pix de {reais(total)}
            </a>
          )}
        </div>
        {erro && (
          <p role="alert" className="text-sm text-erro">
            {erro}
          </p>
        )}
      </Card>
    </main>
  )
}

montar(<App />)
