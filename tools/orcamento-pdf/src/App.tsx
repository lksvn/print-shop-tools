import { useId, useMemo, useState } from 'react'
import { calcularOrcamento, carregarDados, reais, textoDosItens, valoresAutomaticos } from '@pst/dados'
import {
  Badge,
  BotaoCopiar,
  BotaoPix,
  Card,
  cn,
  faltando,
  Input,
  InputTelefone,
  Label,
  Select,
  linkWhatsapp,
  montar,
  preencher,
  Topo,
} from '@pst/ui'
import { avisosDaPagina, enquadrar, itensDoOrcamento, type MedidasPagina } from './analise'
import { lerPdf } from './lerPdf'
import './index.css'

const mm = (v: number) => Math.round(v)

function App() {
  const dados = useMemo(carregarDados, [])
  const papeis = dados.papeis.filter((p) => Object.keys(p.precos).length > 0)

  const [arquivo, setArquivo] = useState('')
  const [paginas, setPaginas] = useState<MedidasPagina[]>([])
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const [papel, setPapel] = useState(papeis[0]?.nome ?? '')
  const [copias, setCopias] = useState(1)
  const [cliente, setCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erroCopia, setErroCopia] = useState('')
  const ids = { arquivo: useId(), papel: useId(), copias: useId(), cliente: useId(), telefone: useId() }

  async function abrir(f: File | undefined) {
    if (!f) return
    setErro('')
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf'))
      return setErro('Envie um arquivo PDF. Em Word ou PowerPoint a fonte pode ser trocada sem ninguém perceber.')
    setArquivo(f.name)
    setPaginas([])
    try {
      setPaginas(await lerPdf(f, (n, total) => setProgresso(`Lendo página ${n} de ${total}…`)))
    } catch {
      setErro('Não foi possível ler este PDF. Ele pode estar protegido por senha ou corrompido.')
      setArquivo('')
    } finally {
      setProgresso('')
    }
  }

  const analise = paginas.map((p) => {
    const enq = enquadrar(p.larguraMm, p.alturaMm, dados.folhas, dados.producao.sangriaMm)
    return { ...p, enq, avisos: avisosDaPagina(p, enq, dados.producao) }
  })
  const { linhas, total, semPreco } = calcularOrcamento(
    dados,
    itensDoOrcamento(
      analise.map((a) => a.enq.folha?.nome ?? null),
      papel,
      copias,
    ),
  )
  const foraDaTabela = analise.filter((a) => !a.enq.folha).length
  const comAviso = analise.filter((a) => a.avisos.length).length
  const mensagem = preencher(dados.modeloOrcamento, {
    ...valoresAutomaticos(dados),
    cliente: cliente.trim(),
    itens: textoDosItens(linhas),
    total: reais(total),
  })
  const falta = faltando(mensagem)

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Orçamento de PDF</h1>
      <p className="mt-1 text-texto-2">
        Solte o PDF do cliente: a ferramenta mede cada página, aponta problemas de impressão e calcula o valor. O arquivo
        não sai deste computador.
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
        <span className="font-medium">{progresso || (arquivo ? `${arquivo} · trocar arquivo` : 'Arraste o PDF aqui ou clique para escolher')}</span>
        <span className="mt-1 text-sm text-texto-3">Só PDF.</span>
        <input id={ids.arquivo} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => abrir(e.target.files?.[0])} />
      </label>
      {erro && (
        <p role="alert" className="mt-3 text-sm text-erro">
          {erro}
        </p>
      )}

      {analise.length > 0 && (
        <>
          <Card className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">
                {analise.length} {analise.length === 1 ? 'página' : 'páginas'}
              </h2>
              <p className={cn('text-sm', comAviso ? 'text-alerta' : 'text-ok')}>
                {comAviso ? `${comAviso} com aviso para conferir` : 'Nenhum problema encontrado'}
              </p>
            </div>
            {/* Lista em vez de tabela: no celular cada página vira um bloco (medida e folha em cima, avisos embaixo). */}
            <div className="mt-3 hidden gap-3 px-1 pb-2 text-sm font-medium text-texto-3 sm:grid sm:grid-cols-[3rem_7rem_9rem_1fr]">
              <span>Pág.</span>
              <span>Medida (mm)</span>
              <span>Folha</span>
              <span>Avisos</span>
            </div>
            <ul className="mt-3 text-sm sm:mt-0">
              {analise.map((a) => (
                <li key={a.numero} className="grid gap-2 border-t border-borda px-1 py-3 sm:grid-cols-[3rem_7rem_9rem_1fr] sm:gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:contents">
                    <span className="font-medium tabular-nums">
                      <span className="sm:hidden">Pág. </span>
                      {a.numero}
                    </span>
                    <span className="tabular-nums">
                      {mm(a.larguraMm)} × {mm(a.alturaMm)}
                      <span className="sm:hidden"> mm</span>
                    </span>
                    <span>
                      {a.enq.folha ? (
                        <>
                          {a.enq.folha.nome}
                          {a.enq.comSangria && <span className="ml-1 text-xs text-texto-3">com sangria</span>}
                        </>
                      ) : (
                        <Badge tom="erro">Fora da tabela</Badge>
                      )}
                    </span>
                  </div>
                  {a.avisos.length ? (
                    <ul className="grid gap-1">
                      {a.avisos.map((av) => (
                        <li key={av.texto} className="text-alerta">
                          {av.texto}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>
                      <Badge tom="ok">OK</Badge>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="mt-6 grid gap-4">
            <h2 className="font-semibold">Orçamento</h2>
            {papeis.length === 0 ? (
              <p role="alert" className="text-alerta">
                Nenhum papel tem preço cadastrado.{' '}
                <a href="../cadastros/#precos" className="underline">
                  Cadastrar preços
                </a>
              </p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                  <div className="grid gap-1.5">
                    <Label htmlFor={ids.papel}>Papel</Label>
                    <Select id={ids.papel} value={papel} onChange={(e) => setPapel(e.target.value)}>
                      {papeis.map((p) => (
                        <option key={p.nome}>{p.nome}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={ids.copias}>Cópias</Label>
                    <Input
                      id={ids.copias}
                      type="number"
                      min={1}
                      value={copias || ''}
                      onChange={(e) => setCopias(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    />
                  </div>
                </div>
                <ul className="grid gap-1 text-sm">
                  {linhas.map((l) => (
                    <li key={l.folha} className="flex justify-between gap-4 tabular-nums">
                      <span>
                        {l.quantidade} × {l.folha} {l.papel}
                      </span>
                      <span>{l.subtotal !== undefined ? reais(l.subtotal) : 'sem preço'}</span>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-borda pt-3 text-right text-lg">
                  Total: <strong className="tabular-nums">{reais(total)}</strong>
                </p>
                {(semPreco.length > 0 || foraDaTabela > 0) && (
                  <ul role="alert" className="grid gap-1 text-sm text-alerta">
                    {semPreco.map((l) => (
                      <li key={l.folha}>
                        {l.papel} não tem preço em {l.folha}: essas páginas ficaram fora do total.
                      </li>
                    ))}
                    {foraDaTabela > 0 && <li>{foraDaTabela} página(s) maior(es) que as folhas cadastradas: orçar à parte.</li>}
                  </ul>
                )}
              </>
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
              <BotaoCopiar
                texto={mensagem}
                aoFalhar={() => setErroCopia('Não foi possível copiar. Selecione o texto e copie com Ctrl+C.')}
              />
              <a
                href={linkWhatsapp(mensagem, telefone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-md border border-borda-forte bg-superficie px-4 text-sm font-medium hover:bg-suave sm:h-9"
              >
                Enviar pelo WhatsApp
              </a>
              {total > 0 && <BotaoPix valor={total} />}
            </div>
            {erroCopia && (
              <p role="alert" className="text-sm text-erro">
                {erroCopia}
              </p>
            )}
          </Card>
        </>
      )}
    </main>
  )
}

montar(<App />)
