import { Badge, Card, montar, SeletorTema } from '@pst/ui'
import { carregarDados } from '@pst/dados'
import './index.css'

type Ferramenta = {
  nome: string
  descricao: string
  caminho: string // pasta da ferramenta dentro de dist/, ex.: "orcamento-pdf/"
  status: 'pronta' | 'planejada' | 'ideia'
}

const SELO = { planejada: 'Em planejamento', ideia: 'Ideia' }

// Para adicionar uma ferramenta: um item aqui + a pasta em tools/.
const FERRAMENTAS: Ferramenta[] = [
  {
    nome: 'Cadastros da gráfica',
    descricao: 'Dados da loja, Pix, folhas, papéis e preços usados por todas as ferramentas.',
    caminho: 'cadastros/',
    status: 'pronta',
  },
  {
    nome: 'Orçamento de PDF',
    descricao: 'Confere tamanho, resolução e outros problemas do arquivo e monta o orçamento para enviar ao cliente.',
    caminho: 'orcamento-pdf/',
    status: 'pronta',
  },
  {
    nome: 'Respostas prontas',
    descricao: 'Mensagens do dia a dia já preenchidas com os dados da loja, para copiar ou enviar no WhatsApp.',
    caminho: 'respostas-prontas/',
    status: 'pronta',
  },
  {
    nome: 'Orçamento rápido',
    descricao: 'Papel, folha e quantidade: o valor e a mensagem saem na hora, sem precisar do arquivo.',
    caminho: 'orcamento-rapido/',
    status: 'pronta',
  },
  {
    nome: 'Pix com valor',
    descricao: 'Gera o Pix copia e cola e o QR code com o valor exato do pedido.',
    caminho: 'pix/',
    status: 'pronta',
  },
  {
    nome: 'Aproveitamento de folha',
    descricao: 'Quantas artes cabem numa folha e quanto sai cada unidade.',
    caminho: 'aproveitamento-folha/',
    status: 'ideia',
  },
  {
    nome: 'Fila de pedidos',
    descricao: 'Em que etapa está cada pedido e quais clientes estão esperando resposta.',
    caminho: 'fila-pedidos/',
    status: 'ideia',
  },
]

function App() {
  const nome = carregarDados().loja.nome
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{nome ? `Ferramentas · ${nome}` : 'Ferramentas da gráfica'}</h1>
        <SeletorTema />
      </div>
      <p className="mt-1 text-texto-2">Atalhos para o atendimento do dia a dia.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {FERRAMENTAS.map((f) => (
          <li key={f.caminho}>
            {f.status === 'pronta' ? (
              <a href={f.caminho} className="block rounded-lg">
                <Card className="h-full transition-colors hover:border-tinta">
                  <h2 className="font-medium text-tinta">{f.nome}</h2>
                  <p className="mt-1 text-sm text-texto-2">{f.descricao}</p>
                </Card>
              </a>
            ) : (
              <Card className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium text-texto-2">{f.nome}</h2>
                  <Badge>{SELO[f.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-texto-2">{f.descricao}</p>
              </Card>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}

montar(<App />)
