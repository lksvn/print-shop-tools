import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Button, Input, Label, Textarea } from '@pst/ui'
import { CAMPOS_AUTOMATICOS } from '@pst/dados'
import { CAMPOS_DIGITADOS, type Resposta } from './texto'

const CAMPOS: [string, string][] = [
  ['cliente', 'nome do cliente (digitado)'],
  ['valor', 'valor (digitado)'],
  ...Object.entries(CAMPOS_AUTOMATICOS),
]

type Props = {
  resposta: Resposta
  aoSalvar: (r: Resposta) => void
  aoCancelar: () => void
  aoApagar: () => void
}

export function Editor({ resposta, aoSalvar, aoCancelar, aoApagar }: Props) {
  const [titulo, setTitulo] = useState(resposta.titulo)
  const [texto, setTexto] = useState(resposta.texto)
  const [erro, setErro] = useState('')
  const area = useRef<HTMLTextAreaElement>(null)
  const cursor = useRef<number | null>(null)
  const ids = { titulo: useId(), texto: useId() }

  // Insere o campo onde está o cursor, como um atalho para não digitar as chaves.
  function inserir(campo: string) {
    const el = area.current
    const marca = `{${campo}}`
    const [ini, fim] = el ? [el.selectionStart, el.selectionEnd] : [texto.length, texto.length]
    cursor.current = ini + marca.length
    setTexto(texto.slice(0, ini) + marca + texto.slice(fim))
  }

  // Depois que o texto novo está na tela, volta o foco e põe o cursor logo após o campo inserido.
  useLayoutEffect(() => {
    if (cursor.current === null || !area.current) return
    area.current.focus()
    area.current.setSelectionRange(cursor.current, cursor.current)
    cursor.current = null
  }, [texto])

  function salvar() {
    if (!titulo.trim()) return setErro('Dê um título para a resposta.')
    if (!texto.trim()) return setErro('O texto não pode ficar vazio.')
    aoSalvar({ ...resposta, titulo: titulo.trim(), texto })
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor={ids.titulo}>Título</Label>
        <Input id={ids.titulo} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={ids.texto}>Texto</Label>
        <Textarea id={ids.texto} ref={area} rows={10} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-medium text-texto-2">Inserir campo</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CAMPOS.map(([campo, descricao]) => (
            <button
              key={campo}
              type="button"
              title={descricao}
              aria-label={`Inserir ${descricao}`}
              onClick={() => inserir(campo)}
              className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-xs hover:bg-suave ${
                (CAMPOS_DIGITADOS as readonly string[]).includes(campo) ? 'border-tinta text-tinta' : 'border-borda text-texto-2'
              }`}
            >
              {`{${campo}}`}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-texto-3">
          Em destaque: digitados na hora. Os outros vêm dos Cadastros.
        </p>
      </div>
      {erro && (
        <p role="alert" className="text-sm text-erro">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={salvar}>Salvar</Button>
        <Button variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Button>
        <Button
          variante="perigo"
          className="ml-auto"
          onClick={() => confirm(`Apagar a resposta "${resposta.titulo}"?`) && aoApagar()}
        >
          Apagar
        </Button>
      </div>
    </div>
  )
}
