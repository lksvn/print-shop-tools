import { useId, useMemo, useRef, useState } from 'react'
import type { Endereco as TipoEndereco } from '@pst/dados'
import { buscarCep, Combobox, Input, InputCep, Label } from '@pst/ui'
import { cidadesDe, estados } from '@pst/ui/localidades'
import type { Editar } from './App'

type Props = { endereco: TipoEndereco; editar: Editar }

const opcoesEstado = estados.map((e) => ({ valor: e.code, rotulo: `${e.name} (${e.code})` }))

export function Endereco({ endereco, editar }: Props) {
  const ids = { cep: useId(), rua: useId(), numero: useId(), complemento: useId(), bairro: useId(), cidade: useId(), uf: useId() }
  const numero = useRef<HTMLInputElement>(null)
  const [situacao, setSituacao] = useState('')
  const [buscando, setBuscando] = useState(false)
  const opcoesCidade = useMemo(() => cidadesDe(endereco.uf).map((c) => ({ valor: c.name, rotulo: c.name })), [endereco.uf])

  const mudar = (campo: keyof TipoEndereco, valor: string) =>
    editar((d) => ({ ...d, loja: { ...d.loja, endereco: { ...d.loja.endereco, [campo]: valor } } }))

  async function mudarCep(cep: string) {
    mudar('cep', cep)
    setSituacao('')
    if (cep.length !== 8) return
    setBuscando(true)
    const achado = await buscarCep(cep)
    setBuscando(false)
    if (!achado) return setSituacao('CEP não encontrado. Preencha o endereço à mão.')
    editar((d) => ({ ...d, loja: { ...d.loja, endereco: { ...d.loja.endereco, ...achado } } }))
    setSituacao(achado.rua ? '' : 'CEP da cidade toda: preencha rua e bairro.')
    numero.current?.focus()
  }

  const campo = (k: Exclude<keyof TipoEndereco, 'cep' | 'cidade' | 'uf'>, label: string, classe: string, extra: object = {}) => (
    <div className={`grid gap-1.5 ${classe}`}>
      <Label htmlFor={ids[k]}>{label}</Label>
      <Input id={ids[k]} value={endereco[k]} onChange={(e) => mudar(k, e.target.value)} {...extra} />
    </div>
  )

  return (
    <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-6">
      <legend className="mb-2 text-sm font-semibold">Endereço</legend>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor={ids.cep}>CEP</Label>
        <InputCep id={ids.cep} valor={endereco.cep} aoMudar={mudarCep} aria-describedby={`${ids.cep}-situacao`} />
        <p id={`${ids.cep}-situacao`} role="status" className={`min-h-4 text-xs ${buscando ? 'text-texto-3' : 'text-alerta'}`}>
          {buscando ? 'Buscando…' : situacao}
        </p>
      </div>
      {campo('rua', 'Rua', 'sm:col-span-4', { autoComplete: 'address-line1' })}
      {campo('numero', 'Número', 'sm:col-span-2', { ref: numero })}
      {campo('complemento', 'Complemento', 'sm:col-span-4', { placeholder: 'Sala, loja, bloco…' })}
      {campo('bairro', 'Bairro', 'sm:col-span-2')}
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor={ids.uf}>Estado</Label>
        <Combobox
          id={ids.uf}
          valor={endereco.uf}
          opcoes={opcoesEstado}
          rotuloBusca="Buscar estado"
          aoMudar={(uf) =>
            editar((d) => {
              const e = d.loja.endereco
              const cidadeValida = cidadesDe(uf).some((c) => c.name === e.cidade)
              return { ...d, loja: { ...d.loja, endereco: { ...e, uf, cidade: cidadeValida ? e.cidade : '' } } }
            })
          }
        />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor={ids.cidade}>Cidade</Label>
        <Combobox
          id={ids.cidade}
          valor={endereco.cidade}
          opcoes={opcoesCidade}
          rotuloBusca="Buscar cidade"
          placeholder={endereco.uf ? 'Selecione' : 'Escolha o estado'}
          disabled={!endereco.uf}
          aoMudar={(cidade) => mudar('cidade', cidade)}
        />
      </div>
    </fieldset>
  )
}
