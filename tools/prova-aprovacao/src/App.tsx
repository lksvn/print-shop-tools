import { useEffect, useId, useMemo, useState } from 'react'
import { carregarDados } from '@pst/dados'
import { BotaoCopiar, Button, Card, cn, Input, InputTelefone, Label, linkWhatsapp, montar, Topo } from '@pst/ui'
import { aplicarMarca, lerArquivo, MAX_PAGINAS, mensagemProva, nomeDaProva, paraBlob, rodape } from './prova'
import './index.css'

type Prova = { canvas: HTMLCanvasElement; url: string; nome: string; numero: number }

const TIPOS = 'application/pdf,.pdf,image/png,image/jpeg'

function baixar(p: Prova) {
  const a = document.createElement('a')
  a.href = p.url
  a.download = p.nome
  a.click()
}

/** Copia a imagem para colar direto no WhatsApp Web (Ctrl+V). Só PNG é aceito pela área de transferência. */
function BotaoCopiarImagem({ prova, aoFalhar }: { prova: Prova; aoFalhar: () => void }) {
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])
  return (
    <Button
      variante="secundario"
      aria-label={`Copiar imagem da página ${prova.numero}`}
      onClick={() =>
        navigator.clipboard
          // A promessa vai dentro do ClipboardItem para o Safari aceitar a cópia depois do clique.
          .write([new ClipboardItem({ 'image/png': paraBlob(prova.canvas, 'image/png') })])
          .then(() => setCopiado(true), aoFalhar)
      }
    >
      <span aria-live="polite">{copiado ? 'Copiado!' : 'Copiar imagem'}</span>
    </Button>
  )
}

function App() {
  const dados = useMemo(carregarDados, [])
  const [arquivo, setArquivo] = useState('')
  const [provas, setProvas] = useState<Prova[]>([])
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [erroCopia, setErroCopia] = useState('')
  const [erroImagem, setErroImagem] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const [cliente, setCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const ids = { arquivo: useId(), cliente: useId(), telefone: useId() }

  // Libera a memória das imagens antigas ao trocar de arquivo ou sair.
  useEffect(() => () => provas.forEach((p) => URL.revokeObjectURL(p.url)), [provas])

  async function abrir(f: File | undefined) {
    if (!f) return
    setErro('')
    setAviso('')
    setErroCopia('')
    setErroImagem('')
    const ehPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    if (!ehPdf && !['image/png', 'image/jpeg'].includes(f.type)) return setErro('Envie um PDF, PNG ou JPG.')
    setArquivo(f.name)
    setProvas([])
    try {
      const { paginas, cortado } = await lerArquivo(f, (n, total) => setProgresso(`Preparando página ${n} de ${total}…`))
      const data = new Date().toLocaleDateString('pt-BR')
      const novas: Prova[] = []
      for (const [i, p] of paginas.entries()) {
        const texto = rodape({ loja: dados.loja.nome, data, larguraMm: p.larguraMm, alturaMm: p.alturaMm, pagina: i + 1, total: paginas.length })
        const canvas = aplicarMarca(p.canvas, texto)
        const url = URL.createObjectURL(await paraBlob(canvas, 'image/jpeg'))
        novas.push({ canvas, url, nome: nomeDaProva(f.name, i + 1, paginas.length), numero: i + 1 })
      }
      setProvas(novas)
      if (cortado) setAviso(`O arquivo tem mais de ${MAX_PAGINAS} páginas: a prova mostra só as ${MAX_PAGINAS} primeiras.`)
    } catch {
      setErro('Não foi possível abrir este arquivo. Ele pode estar protegido por senha ou corrompido.')
      setArquivo('')
    } finally {
      setProgresso('')
    }
  }

  const mensagem = mensagemProva(cliente, provas.length)

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Prova para aprovação</h1>
      <p className="mt-1 text-texto-2">
        Solte a arte do cliente: sai uma imagem com a marca "PROVA" para mandar no WhatsApp e pedir o OK antes de imprimir. O
        arquivo não sai deste computador.
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
        <span className="font-medium">{progresso || (arquivo ? `${arquivo} · trocar arquivo` : 'Arraste a arte aqui ou clique para escolher')}</span>
        <span className="mt-1 text-sm text-texto-3">PDF, PNG ou JPG.</span>
        <input id={ids.arquivo} type="file" accept={TIPOS} className="sr-only" onChange={(e) => abrir(e.target.files?.[0])} />
      </label>
      {erro && (
        <p role="alert" className="mt-3 text-sm text-erro">
          {erro}
        </p>
      )}
      {aviso && <p className="mt-3 text-sm text-alerta">{aviso}</p>}

      {provas.length > 0 && (
        <>
          <Card className="mt-6 grid gap-4">
            <h2 className="font-semibold">Mensagem para o cliente</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={ids.cliente}>Nome do cliente (opcional)</Label>
                <Input id={ids.cliente} value={cliente} onChange={(e) => setCliente(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={ids.telefone}>WhatsApp do cliente (opcional)</Label>
                <InputTelefone id={ids.telefone} valor={telefone} aoMudar={setTelefone} />
              </div>
            </div>
            <p className="rounded-md border border-borda bg-fundo p-4 text-sm whitespace-pre-wrap">{mensagem}</p>
            <div className="flex flex-wrap gap-2">
              <BotaoCopiar texto={mensagem} aoFalhar={() => setErroCopia('O navegador não deixou copiar. Selecione o texto e copie à mão.')}>
                Copiar mensagem
              </BotaoCopiar>
              <a
                href={linkWhatsapp(mensagem, telefone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-md border border-borda-forte bg-superficie px-4 text-sm font-medium hover:bg-suave sm:h-9"
              >
                Abrir no WhatsApp
              </a>
            </div>
            <p className="text-sm text-texto-3">
              No WhatsApp, anexe as imagens antes de mandar a mensagem. No WhatsApp Web dá para usar "Copiar imagem" e colar com Ctrl+V.
            </p>
            {erroCopia && (
              <p role="alert" className="text-sm text-erro">
                {erroCopia}
              </p>
            )}
          </Card>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">
              {provas.length} {provas.length === 1 ? 'imagem' : 'imagens'}
            </h2>
            {provas.length > 1 && (
              <Button variante="secundario" onClick={() => provas.forEach(baixar)}>
                Baixar todas
              </Button>
            )}
          </div>
          {erroImagem && (
            <p role="alert" className="mt-2 text-sm text-erro">
              {erroImagem}
            </p>
          )}
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {provas.map((p) => (
              <li key={p.url}>
                <Card className="grid gap-3">
                  <img src={p.url} alt={`Prova da página ${p.numero}`} className="w-full rounded border border-borda" />
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={p.url}
                      download={p.nome}
                      className="inline-flex h-10 items-center rounded-md bg-tinta px-4 text-sm font-medium text-sobre-tinta hover:bg-tinta-hover sm:h-9"
                    >
                      Baixar{provas.length > 1 ? ` página ${p.numero}` : ''}
                    </a>
                    <BotaoCopiarImagem
                      prova={p}
                      aoFalhar={() => setErroImagem('O navegador não deixou copiar a imagem. Use "Baixar" e anexe no WhatsApp.')}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

montar(<App />)
