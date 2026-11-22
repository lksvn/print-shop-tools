import { useEffect, useId, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { carregarDados } from '@pst/dados'
import { BotaoCopiar, Card, cn, formatarMoeda, Input, InputMoeda, InputTelefone, Label, linkWhatsapp, montar, Topo } from '@pst/ui'
import { gerarPix, problemaNaChave } from './brcode'
import './index.css'

// Aberta dentro de outra ferramenta (modal do BotaoPix): sem topo nem título.
const embutido = new URLSearchParams(location.search).has('embutido')

/** Valor vindo de outra ferramenta: ../pix/?valor=123.45 */
function valorDaUrl() {
  const v = Number(new URLSearchParams(location.search).get('valor'))
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : undefined
}

function App() {
  const dados = useMemo(carregarDados, [])
  const [valor, setValor] = useState(valorDaUrl)
  const [identificador, setIdentificador] = useState('')
  const [telefone, setTelefone] = useState('')
  const [qr, setQr] = useState('')
  const [erro, setErro] = useState('')
  const ids = { valor: useId(), identificador: useId(), telefone: useId() }

  const { pix } = dados
  const cidade = dados.loja.endereco.cidade
  const problema =
    problemaNaChave(pix.tipo, pix.chave) ||
    (!pix.recebedor.trim() ? 'Preencha o nome do recebedor nos Cadastros.' : '') ||
    (!cidade.trim() ? 'Preencha a cidade do endereço da loja nos Cadastros.' : '')
  const codigo = problema ? '' : gerarPix({ ...pix, cidade, valor, identificador })

  useEffect(() => {
    if (!codigo) return setQr('')
    let atual = true
    QRCode.toDataURL(codigo, { margin: 2, width: 512, errorCorrectionLevel: 'M' })
      .then((url) => atual && setQr(url))
      .catch(() => atual && setErro('Não foi possível desenhar o QR code. O copia e cola continua valendo.'))
    return () => {
      atual = false
    }
  }, [codigo])

  const mensagem = `${valor ? `Segue o Pix de R$ ${formatarMoeda(valor)}` : 'Segue o Pix'}. É só copiar o código abaixo e colar no app do banco, em "Pix copia e cola":`

  return (
    <main className={embutido ? 'p-4' : 'mx-auto max-w-4xl px-5 py-10'}>
      {!embutido && (
        <>
          <Topo />
          <h1 className="mt-3 text-2xl font-semibold">Pix com valor</h1>
          <p className="mt-1 text-texto-2">O cliente paga o valor exato, sem digitar chave nem valor.</p>
        </>
      )}

      {problema ? (
        <Card className={embutido ? '' : 'mt-6'}>
          <p role="alert" className="text-alerta">
            {problema}{' '}
            <a href={cidade.trim() ? '../cadastros/#pix' : '../cadastros/#loja'} className="underline">
              Abrir Cadastros
            </a>
          </p>
        </Card>
      ) : (
        <div className={cn('grid gap-6 md:grid-cols-[1fr_18rem]', !embutido && 'mt-6')}>
          <Card className="grid content-start gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={ids.valor}>Valor (R$)</Label>
                <InputMoeda id={ids.valor} valor={valor} aoMudar={setValor} placeholder="Cliente digita" autoFocus={!embutido} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={ids.identificador}>Identificação (opcional)</Label>
                <Input
                  id={ids.identificador}
                  maxLength={25}
                  placeholder="Ex.: PED123"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-texto-3">
              A identificação aparece no extrato e ajuda a achar o pagamento. Só letras e números.
            </p>

            <div className="grid gap-1.5">
              <Label htmlFor="codigo">Pix copia e cola</Label>
              <textarea
                id="codigo"
                readOnly
                rows={4}
                value={codigo}
                onFocus={(e) => e.target.select()}
                className="w-full resize-none rounded-md border border-borda bg-fundo p-3 font-mono text-base break-all sm:text-xs"
              />
            </div>

            <div className="grid gap-1.5 sm:max-w-64">
              <Label htmlFor={ids.telefone}>WhatsApp do cliente (opcional)</Label>
              <InputTelefone id={ids.telefone} valor={telefone} aoMudar={setTelefone} />
            </div>

            <div className="flex flex-wrap gap-2">
              <BotaoCopiar texto={codigo} aoFalhar={() => setErro('Não foi possível copiar. Clique no código e copie com Ctrl+C.')} />
              <a
                href={linkWhatsapp(`${mensagem}\n\n${codigo}`, telefone)}
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
          </Card>

          {/* No celular o QR vem primeiro: é o que o cliente usa no balcão. */}
          <Card className="order-first grid content-start justify-items-center gap-2 text-center md:order-none">
            {/* QR sempre em fundo branco: leitores de celular falham com QR claro sobre escuro. */}
            {qr && (
              <img
                src={qr}
                width={240}
                height={240}
                alt={`QR code do Pix${valor ? ` de R$ ${formatarMoeda(valor)}` : ''}`}
                className="rounded bg-white"
              />
            )}
            <p className="text-sm font-medium">{valor ? `R$ ${formatarMoeda(valor)}` : 'Valor livre'}</p>
            <p className="text-xs text-texto-3">
              {pix.recebedor} · {cidade}
            </p>
          </Card>
        </div>
      )}
    </main>
  )
}

montar(<App />)
