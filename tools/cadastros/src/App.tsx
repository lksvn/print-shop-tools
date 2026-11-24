import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { carregarDados, DADOS_PADRAO, salvarDados, validarDados, type Dados, type TipoChavePix } from '@pst/dados'
import { Button, Card, formatarCnpj, formatarCpf, Input, InputTelefone, Label, montar, Select, soDigitos, Textarea, toast, Topo } from '@pst/ui'
import { exportarJson, importarJson } from '@pst/ui/storage'
import { Endereco } from './Endereco'
import { Precos } from './Precos'
import './index.css'

export type Editar = (mudar: (d: Dados) => Dados) => void

function Campo({ label, ajuda, ...props }: ComponentProps<'input'> & { label: string; ajuda?: string }) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {ajuda && <p className="text-xs text-texto-3">{ajuda}</p>}
    </div>
  )
}

function Secao({ id, titulo, descricao, children }: { id: string; titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-6">
      <Card>
        <h2 id={`${id}-titulo`} className="text-lg font-semibold">
          {titulo}
        </h2>
        <p className="mt-0.5 mb-4 text-sm text-texto-2">{descricao}</p>
        {children}
      </Card>
    </section>
  )
}

/** Campo da chave com a máscara do tipo escolhido. CPF, CNPJ e telefone ficam salvos só com dígitos. */
function ChavePix({ id, tipo, valor, aoMudar }: { id: string; tipo: TipoChavePix; valor: string; aoMudar: (v: string) => void }) {
  if (tipo === 'telefone') return <InputTelefone id={id} valor={valor} aoMudar={aoMudar} />
  if (tipo === 'cpf' || tipo === 'cnpj') {
    const [formatar, max, molde] = tipo === 'cpf' ? [formatarCpf, 11, '000.000.000-00'] : [formatarCnpj, 14, '00.000.000/0000-00']
    return (
      <Input
        id={id}
        inputMode="numeric"
        placeholder={molde}
        value={formatar(valor)}
        onChange={(e) => aoMudar(soDigitos(e.target.value).slice(0, max))}
      />
    )
  }
  return (
    <Input
      id={id}
      type={tipo === 'email' ? 'email' : 'text'}
      disabled={!tipo}
      placeholder={tipo ? undefined : 'Escolha o tipo'}
      value={valor}
      onChange={(e) => aoMudar(e.target.value.trim())}
    />
  )
}

const numero = (v: string) => Math.max(0, Number(v) || 0)

function App() {
  const [dados, setDados] = useState(carregarDados)
  const [aviso, setAviso] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  const idMensagem = useId()
  const idTelefone = useId()
  const idTipoPix = useId()
  const idChavePix = useId()

  // Salva a cada mudança; o toast só aparece quando a digitação para por ~1 s, para não piscar a cada letra.
  const ultimoSalvo = useRef(JSON.stringify(dados))
  useEffect(() => {
    const atual = JSON.stringify(dados)
    if (atual === ultimoSalvo.current) return
    salvarDados(dados)
    ultimoSalvo.current = atual
    const t = setTimeout(() => toast('Cadastros salvos'), 900)
    return () => clearTimeout(t)
  }, [dados])

  const editar: Editar = (mudar) => setDados((d) => mudar(d))
  const loja = (campo: Exclude<keyof Dados['loja'], 'endereco'>, valor: string | number) =>
    editar((d) => ({ ...d, loja: { ...d.loja, [campo]: valor } }))
  const pix = (campo: keyof Dados['pix'], valor: string) => editar((d) => ({ ...d, pix: { ...d.pix, [campo]: valor } }))
  const producao = (campo: keyof Dados['producao'], valor: string) =>
    editar((d) => ({ ...d, producao: { ...d.producao, [campo]: numero(valor) } }))

  async function importar(f: File | undefined) {
    if (!f) return
    try {
      const novos = validarDados(await importarJson(f))
      if (confirm('Substituir todos os cadastros pelos dados deste arquivo?')) {
        setDados(novos)
      }
    } catch (e) {
      setAviso(e instanceof SyntaxError ? 'Arquivo inválido: não é um .json.' : (e as Error).message)
    } finally {
      if (arquivo.current) arquivo.current.value = ''
    }
  }

  function restaurar() {
    if (confirm('Voltar todos os cadastros para o padrão? Os dados atuais serão perdidos. Exporte antes se quiser guardar.')) {
      setDados(DADOS_PADRAO)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Topo />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cadastros da gráfica</h1>
          <p className="mt-1 text-texto-2">Usados por todas as ferramentas. As mudanças são salvas sozinhas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" onClick={() => exportarJson('cadastros-grafica.json', dados)}>
            Exportar
          </Button>
          <Button variante="secundario" onClick={() => arquivo.current?.click()}>
            Importar
          </Button>
          <input
            ref={arquivo}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => importar(e.target.files?.[0])}
          />
        </div>
      </div>
      <p role="status" className="mt-3 min-h-5 text-sm text-erro">
        {aviso}
      </p>

      <nav aria-label="Seções" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {[
          ['loja', 'Loja'],
          ['pix', 'Pix'],
          ['precos', 'Folhas e preços'],
          ['producao', 'Produção'],
          ['mensagem', 'Mensagem de orçamento'],
        ].map(([id, nome]) => (
          <a key={id} href={`#${id}`} className="text-tinta hover:underline">
            {nome}
          </a>
        ))}
      </nav>

      <div className="mt-6 grid gap-6">
        <Secao id="loja" titulo="Loja" descricao="Aparece nas mensagens enviadas aos clientes.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nome da gráfica" value={dados.loja.nome} onChange={(e) => loja('nome', e.target.value)} />
            <div className="grid gap-1.5">
              <Label htmlFor={idTelefone}>Telefone / WhatsApp</Label>
              <InputTelefone id={idTelefone} valor={dados.loja.telefone} aoMudar={(v) => loja('telefone', v)} />
            </div>
            <Campo
              label="Horário de atendimento"
              placeholder="Seg a sex, 8h às 18h"
              value={dados.loja.horario}
              onChange={(e) => loja('horario', e.target.value)}
            />
            <Campo
              label="Prazo padrão (dias úteis)"
              type="number"
              min={0}
              value={dados.loja.prazoDiasUteis}
              onChange={(e) => loja('prazoDiasUteis', numero(e.target.value))}
            />
            <Endereco endereco={dados.loja.endereco} editar={editar} />
          </div>
        </Secao>

        <Secao id="pix" titulo="Pix" descricao="Usados para gerar o Pix copia e cola e o QR code. A cidade vem do endereço da loja.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor={idTipoPix}>Tipo da chave</Label>
              <Select
                id={idTipoPix}
                value={dados.pix.tipo}
                // Cada tipo tem um formato; trocar o tipo limpa a chave para não misturar.
                onChange={(e) => editar((d) => ({ ...d, pix: { ...d.pix, tipo: e.target.value as TipoChavePix, chave: '' } }))}
              >
                <option value="">Escolha</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="telefone">Telefone</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Chave aleatória</option>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={idChavePix}>Chave Pix</Label>
              <ChavePix id={idChavePix} tipo={dados.pix.tipo} valor={dados.pix.chave} aoMudar={(v) => pix('chave', v)} />
            </div>
            <Campo
              label="Nome do recebedor"
              ajuda="Como está no banco. Até 25 letras."
              maxLength={25}
              value={dados.pix.recebedor}
              onChange={(e) => pix('recebedor', e.target.value)}
            />
          </div>
        </Secao>

        <Secao
          id="precos"
          titulo="Folhas e preços"
          descricao="Preço de cada papel em cada folha. Deixe vazio quando o papel não existe naquela folha."
        >
          <Precos dados={dados} editar={editar} avisar={setAviso} />
        </Secao>

        <Secao id="producao" titulo="Produção" descricao="Limites para os avisos do arquivo e medidas da montagem na folha.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo
              label="Sangria (mm)"
              type="number"
              min={0}
              step={0.5}
              value={dados.producao.sangriaMm}
              onChange={(e) => producao('sangriaMm', e.target.value)}
            />
            <Campo
              label="Margem de segurança (mm)"
              type="number"
              min={0}
              step={0.5}
              value={dados.producao.margemMm}
              onChange={(e) => producao('margemMm', e.target.value)}
            />
            <Campo
              label="Resolução mínima (DPI)"
              type="number"
              min={0}
              value={dados.producao.dpi}
              onChange={(e) => producao('dpi', e.target.value)}
            />
            <Campo
              label="Fonte mínima (pt)"
              type="number"
              min={0}
              value={dados.producao.fontePt}
              onChange={(e) => producao('fontePt', e.target.value)}
            />
            <Campo
              label="Espaço entre artes (mm)"
              ajuda="Na montagem de várias artes na folha."
              type="number"
              min={0}
              step={0.5}
              value={dados.producao.espacoMm}
              onChange={(e) => producao('espacoMm', e.target.value)}
            />
            <Campo
              label="Margem da máquina (mm)"
              ajuda="Borda da folha que não imprime."
              type="number"
              min={0}
              step={0.5}
              value={dados.producao.margemMaquinaMm}
              onChange={(e) => producao('margemMaquinaMm', e.target.value)}
            />
          </div>
        </Secao>

        <Secao id="mensagem" titulo="Mensagem de orçamento" descricao="Modelo usado pelas ferramentas de orçamento.">
          <Label htmlFor={idMensagem}>Modelo</Label>
          <Textarea
            id={idMensagem}
            rows={8}
            className="mt-1.5 font-mono"
            value={dados.modeloOrcamento}
            onChange={(e) => editar((d) => ({ ...d, modeloOrcamento: e.target.value }))}
          />
          <p className="mt-1.5 text-xs text-texto-3">
            Campos: {'{cliente}'} {'{itens}'} {'{total}'} {'{prazo}'} {'{loja}'}
          </p>
        </Secao>

        <div>
          <Button variante="perigo" onClick={restaurar}>
            Restaurar padrão
          </Button>
        </div>
      </div>
    </main>
  )
}

montar(<App />)
