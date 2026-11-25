import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { carregarDados, reais, valoresAutomaticos } from '@pst/dados'
import { BotaoCopiar, BotaoPix, Button, Card, faltando, Input, InputTelefone, Label, linkWhatsapp, montar, preencher, Select, toast, Topo } from '@pst/ui'
import { exportarJson, importarJson, salvar } from '@pst/ui/storage'
import { Editor } from './Editor'
import { CHAVE, faixasComPreco, validarProdutos, type Produto } from './produtos'
import './index.css'

/** Lê os produtos salvos. Dado estragado não é usado nem sobrescrito: a tela pede um backup. */
function carregarProdutos(): { produtos: Produto[]; estragado: boolean } {
  const bruto = localStorage.getItem(CHAVE)
  if (!bruto) return { produtos: [], estragado: false }
  try {
    const produtos = validarProdutos((JSON.parse(bruto) as { produtos?: unknown }).produtos)
    return produtos ? { produtos, estragado: false } : { produtos: [], estragado: true }
  } catch {
    return { produtos: [], estragado: true }
  }
}

function Orcar({ produtos }: { produtos: Produto[] }) {
  const dados = useMemo(carregarDados, [])
  const comPreco = produtos.filter((p) => faixasComPreco(p).length > 0)
  const [id, setId] = useState(comPreco[0]?.id ?? '')
  const [qtd, setQtd] = useState('')
  const [cliente, setCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const ids = { produto: useId(), qtd: useId(), cliente: useId(), telefone: useId() }

  if (comPreco.length === 0) return <p className="text-sm text-texto-2">Cadastre um produto com preço abaixo para orçar.</p>

  const produto = comPreco.find((p) => p.id === id) ?? comPreco[0]
  const faixas = faixasComPreco(produto)
  const faixa = faixas.find((f) => String(f.quantidade) === qtd) ?? faixas[0]
  const mensagem = preencher(dados.modeloOrcamento, {
    ...valoresAutomaticos(dados),
    cliente: cliente.trim(),
    itens: `• ${faixa.quantidade} × ${produto.nome} (${produto.papel}): ${reais(faixa.preco)}`,
    total: reais(faixa.preco),
  })
  const falta = faltando(mensagem)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.produto}>Produto</Label>
          <Select id={ids.produto} value={produto.id} onChange={(e) => setId(e.target.value)}>
            {comPreco.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} · {p.larguraMm}×{p.alturaMm} mm · {p.papel}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.qtd}>Quantidade</Label>
          <Select id={ids.qtd} value={String(faixa.quantidade)} onChange={(e) => setQtd(e.target.value)}>
            {faixas.map((f) => (
              <option key={f.quantidade} value={f.quantidade}>
                {f.quantidade} · {reais(f.preco)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="text-lg">
        {faixa.quantidade} {produto.nome}: <strong className="tabular-nums">{reais(faixa.preco)}</strong>{' '}
        <span className="text-sm text-texto-3">({reais(faixa.preco / faixa.quantidade)} cada)</span>
      </p>
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
          className="inline-flex h-10 items-center rounded-md border border-borda-forte bg-superficie px-4 text-sm font-medium hover:bg-suave sm:h-9"
        >
          Enviar pelo WhatsApp
        </a>
        <BotaoPix valor={faixa.preco} />
      </div>
      {erro && (
        <p role="alert" className="text-sm text-erro">
          {erro}
        </p>
      )}
    </div>
  )
}

function App() {
  const [{ produtos: inicial, estragado }] = useState(carregarProdutos)
  const [produtos, setProdutos] = useState(inicial)
  const [erroArquivo, setErroArquivo] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)

  // Salva a cada mudança; o toast só aparece quando a digitação para, como nos Cadastros.
  const ultimoSalvo = useRef(JSON.stringify(inicial))
  useEffect(() => {
    const atual = JSON.stringify(produtos)
    if (estragado || atual === ultimoSalvo.current) return
    salvar(CHAVE, { produtos })
    ultimoSalvo.current = atual
    const t = setTimeout(() => toast('Produtos salvos'), 900)
    return () => clearTimeout(t)
  }, [produtos, estragado])

  async function importar(f: File | undefined) {
    if (!f) return
    setErroArquivo('')
    try {
      const novos = validarProdutos(((await importarJson(f)) as { produtos?: unknown })?.produtos)
      if (!novos) return setErroArquivo('Arquivo inválido: não é um backup dos produtos.')
      if (confirm(`Substituir os ${produtos.length} produtos atuais pelos ${novos.length} do arquivo?`)) setProdutos(novos)
    } catch {
      setErroArquivo('Arquivo inválido: não é um .json.')
    } finally {
      if (arquivo.current) arquivo.current.value = ''
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Topo />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Produtos prontos</h1>
          <p className="mt-1 text-texto-2">Cartão, panfleto, adesivo com preço fechado por quantidade: "100 cartões" e o orçamento sai.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" disabled={estragado} onClick={() => exportarJson('produtos-prontos.json', { produtos })}>
            Exportar
          </Button>
          <Button variante="secundario" onClick={() => arquivo.current?.click()}>
            Importar
          </Button>
          <input ref={arquivo} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importar(e.target.files?.[0])} />
        </div>
      </div>
      {estragado && (
        <p role="alert" className="mt-4 text-sm text-erro">
          Os produtos salvos neste navegador estão com problema e não foram carregados nem apagados. Importe um backup para continuar.
        </p>
      )}
      {erroArquivo && (
        <p role="alert" className="mt-4 text-sm text-erro">
          {erroArquivo}
        </p>
      )}

      <Card className="mt-6 grid gap-4">
        <h2 className="text-lg font-semibold">Orçar</h2>
        <Orcar produtos={produtos} />
      </Card>

      {!estragado && (
        <Card className="mt-6 grid gap-4">
          <h2 className="text-lg font-semibold">Produtos e preços</h2>
          <Editor produtos={produtos} aoMudar={setProdutos} />
        </Card>
      )}
    </main>
  )
}

montar(<App />)
