// Componentes visuais genéricos (estilo shadcn/ui, escritos à mão). Nada de regra de negócio aqui.
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Component, StrictMode, useEffect, useId, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

const variantesBotao = {
  primario: 'bg-tinta text-sobre-tinta hover:bg-tinta-hover',
  secundario: 'border border-borda-forte bg-superficie text-texto hover:bg-suave',
  fantasma: 'text-texto-2 hover:bg-suave',
  perigo: 'text-erro hover:bg-erro-fundo',
}

export function Button({
  variante = 'primario',
  className,
  ...props
}: ComponentProps<'button'> & { variante?: keyof typeof variantesBotao }) {
  return (
    <button
      className={cn(
        'inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variantesBotao[variante],
        className,
      )}
      {...props}
    />
  )
}

const campo =
  'w-full rounded-md border border-borda-forte bg-superficie px-3 text-sm placeholder:text-texto-3 focus-visible:border-tinta'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(campo, 'h-9', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(campo, 'py-2', className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium text-texto-2', className)} {...props} />
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-lg border border-borda bg-superficie p-5', className)} {...props} />
}

const tonsSelo = {
  neutro: 'bg-suave text-texto-2',
  ok: 'bg-ok-fundo text-ok',
  alerta: 'bg-alerta-fundo text-alerta',
  erro: 'bg-erro-fundo text-erro',
}

export type TomSelo = keyof typeof tonsSelo

export function Badge({ tom = 'neutro', className, ...props }: ComponentProps<'span'> & { tom?: TomSelo }) {
  return (
    <span
      className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', tonsSelo[tom], className)}
      {...props}
    />
  )
}

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          'w-full text-left text-sm [&_td]:border-t [&_td]:border-borda [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:font-medium [&_th]:text-texto-3',
          className,
        )}
        {...props}
      />
    </div>
  )
}

// --- Tema claro/escuro. O index.html de cada projeto aplica o tema antes de desenhar (evita piscar branco). ---

type Tema = 'auto' | 'claro' | 'escuro'
const CHAVE_TEMA = 'pst:tema'
const sistemaEscuro = () => matchMedia('(prefers-color-scheme: dark)').matches

function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'escuro' || (tema === 'auto' && sistemaEscuro()))
}

export function SeletorTema({ className }: { className?: string }) {
  const id = useId()
  const [tema, setTema] = useState<Tema>(() => (localStorage.getItem(CHAVE_TEMA) as Tema | null) ?? 'auto')

  useEffect(() => {
    localStorage.setItem(CHAVE_TEMA, tema)
    aplicarTema(tema)
    if (tema !== 'auto') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const mudou = () => aplicarTema('auto')
    mq.addEventListener('change', mudou)
    return () => mq.removeEventListener('change', mudou)
  }, [tema])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Label htmlFor={id}>Tema</Label>
      <select
        id={id}
        value={tema}
        onChange={(e) => setTema(e.target.value as Tema)}
        className={cn(campo, 'h-8 w-auto')}
      >
        <option value="auto">Automático</option>
        <option value="claro">Claro</option>
        <option value="escuro">Escuro</option>
      </select>
    </div>
  )
}

// --- Máscaras. O dado é guardado limpo (só dígitos / número); a máscara é só de exibição. ---

export const soDigitos = (v: string) => v.replace(/\D/g, '')

/** "11987654321" → "(11) 98765-4321"; aceita fixo (10 dígitos) e celular (11). */
export function formatarTelefone(digitos: string) {
  const d = soDigitos(digitos).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  const meio = d.length === 11 ? 7 : 6
  return d.length <= meio ? `(${d.slice(0, 2)}) ${d.slice(2)}` : `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`
}

/** Aplica um molde em que cada "0" é um dígito: aplicarMolde("12345678901", "000.000.000-00"). Para no fim dos dígitos. */
export function aplicarMolde(digitos: string, molde: string) {
  const d = soDigitos(digitos)
  let i = 0
  let saida = ''
  for (const c of molde) {
    if (i >= d.length) break
    saida += c === '0' ? d[i++] : c
  }
  return saida
}
export const formatarCpf = (d: string) => aplicarMolde(d, '000.000.000-00')
export const formatarCnpj = (d: string) => aplicarMolde(d, '00.000.000/0000-00')

/** Troca {campo} pelo valor. Campo sem valor fica visível como {campo}, para o atendente notar antes de enviar. */
export function preencher(texto: string, valores: Record<string, string>) {
  return texto.replace(/\{(\w+)\}/g, (marca, campo: string) => valores[campo] || marca)
}

/** Campos {x} que ainda aparecem no texto, sem repetir. */
export const faltando = (texto: string) => [...new Set(texto.match(/\{\w+\}/g) ?? [])]

/** Soma dias úteis (sem sábado e domingo). shortcut: ignora feriados; cadastrar feriados se o prazo errar em véspera de feriado. */
export function somarDiasUteis(inicio: Date, dias: number) {
  const data = new Date(inicio)
  let faltam = dias
  while (faltam > 0) {
    data.setDate(data.getDate() + 1)
    if (data.getDay() !== 0 && data.getDay() !== 6) faltam--
  }
  return data
}

const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
/** "quinta-feira, 19/11" */
export const formatarData = (data: Date) => diaSemana.format(data)

const moeda = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const formatarMoeda = (valor: number) => moeda.format(valor)

/** Digitação estilo caixa: cada dígito entra pela direita nos centavos ("150" → 1,50).
 *  Apagar até zerar vira undefined (com backspace não dá para esvaziar "0,00" de outro jeito). */
export function lerMoeda(texto: string): number | undefined {
  const d = soDigitos(texto).replace(/^0+/, '').slice(0, 9)
  return d ? Number(d) / 100 : undefined
}

export function InputTelefone({
  valor,
  aoMudar,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & { valor: string; aoMudar: (digitos: string) => void }) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      placeholder="(00) 00000-0000"
      value={formatarTelefone(valor)}
      onChange={(e) => aoMudar(soDigitos(e.target.value).slice(0, 11))}
      {...props}
    />
  )
}

export function InputMoeda({
  valor,
  aoMudar,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  valor: number | undefined
  aoMudar: (valor: number | undefined) => void
}) {
  return (
    <Input
      inputMode="numeric"
      className={cn('text-right tabular-nums', className)}
      value={valor === undefined ? '' : formatarMoeda(valor)}
      onChange={(e) => aoMudar(lerMoeda(e.target.value))}
      {...props}
    />
  )
}

/** "01001000" → "01001-000" */
export function formatarCep(digitos: string) {
  const d = soDigitos(digitos).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function InputCep({
  valor,
  aoMudar,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & { valor: string; aoMudar: (digitos: string) => void }) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="postal-code"
      placeholder="00000-000"
      value={formatarCep(valor)}
      onChange={(e) => aoMudar(soDigitos(e.target.value).slice(0, 8))}
      {...props}
    />
  )
}

export type EnderecoCep = { rua: string; bairro: string; cidade: string; uf: string }

/** Busca o endereço na ViaCEP (pública, sem chave). Devolve null se o CEP não existe ou a busca falha. */
export async function buscarCep(cep: string, fetchFn: typeof fetch = fetch): Promise<EnderecoCep | null> {
  const d = soDigitos(cep)
  if (d.length !== 8) return null
  try {
    const r = await fetchFn(`https://viacep.com.br/ws/${d}/json/`)
    if (!r.ok) return null
    const j = (await r.json()) as Record<string, unknown>
    if (j.erro) return null
    const t = (v: unknown) => (typeof v === 'string' ? v : '') // resposta de fora: só aceita texto
    return { rua: t(j.logradouro), bairro: t(j.bairro), cidade: t(j.localidade), uf: t(j.uf) }
  } catch {
    return null
  }
}

// --- Select com busca (padrão "Combobox" do shadcn: Popover + cmdk). Baseado no LocationSelect do mtg-haves. ---

export type Opcao = { valor: string; rotulo: string }

const semAcento = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function Combobox({
  id,
  valor,
  opcoes,
  aoMudar,
  rotuloBusca,
  placeholder = 'Selecione',
  disabled,
  className,
}: {
  id?: string
  valor: string
  opcoes: Opcao[]
  aoMudar: (valor: string) => void
  rotuloBusca: string // ex.: "Buscar cidade"
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const termo = semAcento(busca.trim())
  const filtradas = termo ? opcoes.filter((o) => semAcento(o.rotulo).includes(termo)) : opcoes
  const atual = opcoes.find((o) => o.valor === valor)

  return (
    <Popover.Root
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir)
        if (abrir) setBusca('')
      }}
    >
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={aberto}
          disabled={disabled}
          className={cn(campo, 'flex h-9 items-center justify-between gap-2 text-left disabled:opacity-50', className)}
        >
          <span className={cn('truncate', !atual && 'text-texto-3')}>{atual?.rotulo ?? (valor || placeholder)}</span>
          <span aria-hidden className="text-texto-3">▾</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 w-(--radix-popover-trigger-width) min-w-56 rounded-md border border-borda bg-superficie p-1 shadow-lg"
        >
          <Command shouldFilter={false} label={rotuloBusca}>
            <Command.Input
              value={busca}
              onValueChange={setBusca}
              aria-label={rotuloBusca}
              placeholder={rotuloBusca}
              className={cn(campo, 'mb-1 h-8')}
            />
            <Command.List className="max-h-64 overflow-y-auto">
              <Command.Empty className="px-2 py-1.5 text-sm text-texto-3">Nenhum resultado.</Command.Empty>
              {filtradas.map((o) => (
                <Command.Item
                  key={o.valor}
                  value={o.valor}
                  onSelect={() => {
                    aoMudar(o.valor)
                    setAberto(false)
                  }}
                  className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm data-[selected=true]:bg-suave"
                >
                  {o.rotulo}
                  {o.valor === valor && <span aria-hidden>✓</span>}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// --- Estrutura comum das ferramentas ---

class LimiteDeErro extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }
  static getDerivedStateFromError() {
    return { falhou: true }
  }
  render() {
    return this.state.falhou ? (
      <p className="p-10 text-center">Algo deu errado. Recarregue a página.</p>
    ) : (
      this.props.children
    )
  }
}

// --- Toast: aviso curto no canto da tela para feedback simples ("Resposta salva"). Some sozinho em 2,5 s. ---

type ItemToast = { id: number; texto: string }
let toasts: ItemToast[] = []
let proximoId = 0
const ouvintes = new Set<() => void>()
const avisarOuvintes = () => ouvintes.forEach((f) => f())

export function toast(texto: string) {
  const item = { id: ++proximoId, texto }
  // O mesmo texto repetido substitui o anterior (ex.: salvando várias vezes seguidas) e no máximo 3 na tela.
  toasts = [...toasts.filter((t) => t.texto !== texto).slice(-2), item]
  avisarOuvintes()
  setTimeout(() => {
    toasts = toasts.filter((t) => t !== item)
    avisarOuvintes()
  }, 2500)
}

function Toasts() {
  const lista = useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => toasts,
  )
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 grid justify-items-end gap-2">
      {lista.map((t) => (
        <div key={t.id} className="rounded-md border border-borda bg-superficie px-4 py-2 text-sm shadow-lg">
          {t.texto}
        </div>
      ))}
    </div>
  )
}

/** Desenha a ferramenta no #root, com limite de erro (um erro mostra aviso em vez de tela branca) e área de toasts. */
export function montar(app: ReactNode) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LimiteDeErro>{app}</LimiteDeErro>
      <Toasts />
    </StrictMode>,
  )
}

/** Barra do topo das ferramentas: voltar ao hub + tema. */
export function Topo() {
  return (
    <div className="flex items-center justify-between gap-4">
      <a href="../" className="text-sm text-tinta hover:underline">
        ← Ferramentas
      </a>
      <SeletorTema />
    </div>
  )
}

/** Link wa.me com mensagem. Telefone opcional (só dígitos, DDD + número); sem ele o WhatsApp pede o contato. */
export function linkWhatsapp(texto: string, telefone = '') {
  const d = soDigitos(telefone)
  return `https://wa.me/${d ? `55${d}` : ''}?text=${encodeURIComponent(texto)}`
}

/** Botão que copia um texto e mostra "Copiado!" por 2 s. Se o navegador bloquear, chama aoFalhar. */
export function BotaoCopiar({
  texto,
  aoFalhar,
  children = 'Copiar',
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick'> & { texto: string; aoFalhar?: () => void }) {
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])

  return (
    <Button
      {...props}
      onClick={() =>
        navigator.clipboard.writeText(texto).then(
          () => setCopiado(true),
          () => aoFalhar?.(),
        )
      }
    >
      <span aria-live="polite">{copiado ? 'Copiado!' : children}</span>
    </Button>
  )
}
