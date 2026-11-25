import { useEffect, useId, useState } from 'react'
import QRCode from 'qrcode'
import { Card, Input, InputTelefone, Label, montar, Select, Textarea, Topo } from '@pst/ui'
import { conteudo, tamanhoMinimoMm, TIPOS, type Campos, type Tipo } from './conteudo'
import './index.css'

type Gerado = { svg: string; png: string; modulos: number }

function App() {
  const [tipo, setTipo] = useState<Tipo>('link')
  const [c, setC] = useState<Campos>({ link: '', telefone: '', mensagem: 'Olá! Vim pelo QR code.', rede: '', senha: '', seguranca: 'WPA', texto: '' })
  const [gerado, setGerado] = useState<Gerado | null>(null)
  const [erro, setErro] = useState('')
  const ids = { tipo: useId(), a: useId(), b: useId(), c: useId() }
  const campo = (k: keyof Campos) => (e: { target: { value: string } }) => setC({ ...c, [k]: e.target.value })
  const texto = conteudo(tipo, c)

  useEffect(() => {
    if (!texto) return setGerado(null)
    let ativo = true
    const svg = QRCode.toString(texto, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' })
    const png = QRCode.toDataURL(texto, { margin: 4, width: 1024, errorCorrectionLevel: 'M' })
    Promise.all([svg, png]).then(
      ([s, p]) => {
        if (!ativo) return
        setGerado({ svg: s, png: p, modulos: QRCode.create(texto, { errorCorrectionLevel: 'M' }).modules.size })
        setErro('')
      },
      () => ativo && setErro('Texto longo demais para um QR code.'),
    )
    return () => {
      ativo = false
    }
  }, [texto])

  const urlSvg = gerado ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(gerado.svg)}` : ''

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Topo />
      <h1 className="mt-3 text-2xl font-semibold">Gerador de QR code</h1>
      <p className="mt-1 text-texto-2">Para pôr no cartão, no cardápio ou no adesivo. O SVG é vetor: imprime nítido em qualquer tamanho.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_18rem] md:items-start">
        <Card className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={ids.tipo}>Tipo</Label>
            <Select id={ids.tipo} value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
              {Object.entries(TIPOS).map(([v, nome]) => (
                <option key={v} value={v}>
                  {nome}
                </option>
              ))}
            </Select>
          </div>

          {tipo === 'link' && (
            <div className="grid gap-1.5">
              <Label htmlFor={ids.a}>Endereço</Label>
              <Input id={ids.a} inputMode="url" placeholder="instagram.com/sualoja" value={c.link} onChange={campo('link')} />
            </div>
          )}
          {tipo === 'whatsapp' && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor={ids.a}>Número</Label>
                <InputTelefone id={ids.a} valor={c.telefone} aoMudar={(v) => setC({ ...c, telefone: v })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={ids.b}>Mensagem que já vem escrita</Label>
                <Textarea id={ids.b} rows={2} value={c.mensagem} onChange={campo('mensagem')} />
              </div>
            </>
          )}
          {tipo === 'wifi' && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor={ids.a}>Nome da rede</Label>
                <Input id={ids.a} value={c.rede} onChange={campo('rede')} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={ids.c}>Segurança</Label>
                <Select id={ids.c} value={c.seguranca} onChange={campo('seguranca')}>
                  <option value="WPA">Com senha (WPA/WPA2, a mais comum)</option>
                  <option value="WEP">Com senha (WEP, roteador antigo)</option>
                  <option value="nopass">Rede aberta, sem senha</option>
                </Select>
              </div>
              {c.seguranca !== 'nopass' && (
                <div className="grid gap-1.5">
                  <Label htmlFor={ids.b}>Senha</Label>
                  <Input id={ids.b} value={c.senha} onChange={campo('senha')} autoComplete="off" />
                  <p className="text-sm text-texto-3">A senha não é salva: some ao fechar a página.</p>
                </div>
              )}
            </>
          )}
          {tipo === 'texto' && (
            <div className="grid gap-1.5">
              <Label htmlFor={ids.a}>Texto</Label>
              <Textarea id={ids.a} rows={4} value={c.texto} onChange={campo('texto')} />
            </div>
          )}

          {texto && (
            <p className="text-sm break-all text-texto-3">
              O celular vai ler: <span className="text-texto-2">{texto}</span>
            </p>
          )}
          {erro && (
            <p role="alert" className="text-sm text-erro">
              {erro}
            </p>
          )}
        </Card>

        <Card className="grid gap-3">
          {gerado && !erro ? (
            <>
              <img src={gerado.png} alt={`QR code com: ${texto}`} className="w-full rounded bg-white" />
              <p className="text-sm text-texto-2">Imprimir com pelo menos {(tamanhoMinimoMm(gerado.modulos) / 10).toLocaleString('pt-BR')} cm de lado. Teste com o celular antes de imprimir.</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={urlSvg}
                  download="qr-code.svg"
                  className="inline-flex h-10 items-center rounded-md bg-tinta px-4 text-sm font-medium text-sobre-tinta hover:bg-tinta-hover sm:h-9"
                >
                  Baixar SVG
                </a>
                <a
                  href={gerado.png}
                  download="qr-code.png"
                  className="inline-flex h-10 items-center rounded-md border border-borda-forte bg-superficie px-4 text-sm font-medium hover:bg-suave sm:h-9"
                >
                  Baixar PNG
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-texto-3">Preencha ao lado para ver o QR code.</p>
          )}
        </Card>
      </div>
    </main>
  )
}

montar(<App />)
