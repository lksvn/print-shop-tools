import { useState } from 'react'
import { Badge, Button, Card, montar, SeletorTema } from '@pst/ui'
import { carregarDados } from '@pst/dados'
import { apagarExemplo, carregarExemplo, exemploCarregado, temDados } from './exemplo'
import './index.css'

type Ferramenta = {
  nome: string
  descricao: string
  caminho: string // pasta da ferramenta dentro de dist/, ex.: "orcamento-pdf/"
  status: 'pronta' | 'planejada' | 'ideia'
}

type Secao = { titulo: string; descricao: string; ferramentas: Ferramenta[] }

const SELO = { planejada: 'Em planejamento', ideia: 'Ideia' }

// Para adicionar uma ferramenta: um item na seção certa + a pasta em tools/.
// Seções na ordem do dia a dia: cliente pede → arquivo vira impressão → pedido anda e é pago → ajustes da loja.
const SECOES: Secao[] = [
  {
    titulo: 'Atendimento',
    descricao: 'Orçar e responder o cliente no WhatsApp.',
    ferramentas: [
      {
        nome: 'Orçamento de PDF',
        descricao: 'Confere tamanho, resolução e outros problemas do arquivo e monta o orçamento para enviar ao cliente.',
        caminho: 'orcamento-pdf/',
        status: 'pronta',
      },
      {
        nome: 'Orçamento rápido',
        descricao: 'Papel, folha e quantidade: o valor e a mensagem saem na hora, sem precisar do arquivo.',
        caminho: 'orcamento-rapido/',
        status: 'pronta',
      },
      {
        nome: 'Produtos prontos',
        descricao: 'Cartão, panfleto e adesivo com preço por quantidade: "100 cartões" e pronto.',
        caminho: 'produtos-prontos/',
        status: 'pronta',
      },
      {
        nome: 'Respostas prontas',
        descricao: 'Mensagens do dia a dia já preenchidas com os dados da loja, para copiar ou enviar no WhatsApp.',
        caminho: 'respostas-prontas/',
        status: 'pronta',
      },
      {
        nome: 'Pix com valor',
        descricao: 'Gera o Pix copia e cola e o QR code com o valor exato do pedido.',
        caminho: 'pix/',
        status: 'pronta',
      },
      {
        nome: 'Tabela de preços para o cliente',
        descricao: 'Tabela gerada dos Cadastros para mandar no WhatsApp ou deixar no balcão.',
        caminho: 'tabela-precos/',
        status: 'pronta',
      },
    ],
  },
  {
    titulo: 'Arquivo e produção',
    descricao: 'Do arquivo do cliente até a folha pronta para imprimir.',
    ferramentas: [
      {
        nome: 'Prova para aprovação',
        descricao: 'Imagem da arte com a marca "PROVA" e o texto pedindo o OK do cliente.',
        caminho: 'prova-aprovacao/',
        status: 'pronta',
      },
      {
        nome: 'Aproveitamento de folha',
        descricao: 'Quantas artes cabem numa folha e quanto sai cada unidade.',
        caminho: 'aproveitamento-folha/',
        status: 'pronta',
      },
      {
        nome: 'Montagem para impressão',
        descricao: 'Coloca as cópias da arte na folha, com marcas de corte, pronta para imprimir.',
        caminho: 'montagem-impressao/',
        status: 'pronta',
      },
      {
        nome: 'Livreto e dobra',
        descricao: 'Quantas folhas um livreto precisa, em que ordem as páginas saem e onde dobrar um folheto.',
        caminho: 'livreto-dobra/',
        status: 'pronta',
      },
      {
        nome: 'Calculadora de resolução',
        descricao: 'Até quantos cm uma imagem imprime bem, e quantos pixels um tamanho precisa.',
        caminho: 'calculadora-resolucao/',
        status: 'pronta',
      },
      {
        nome: 'Gerador de QR code',
        descricao: 'QR de link, WhatsApp ou Wi-Fi em vetor, para colocar na arte.',
        caminho: 'qr-code/',
        status: 'pronta',
      },
    ],
  },
  {
    titulo: 'Pedidos e caixa',
    descricao: 'Acompanhar cada pedido, registrar pagamentos e fechar o dia.',
    ferramentas: [
      {
        nome: 'Fila de pedidos',
        descricao: 'Em que etapa está cada pedido, quem está esperando resposta e quanto falta pagar.',
        caminho: 'fila-pedidos/',
        status: 'pronta',
      },
      {
        nome: 'Ordem de serviço / recibo',
        descricao: 'Folha do pedido para a produção ou recibo para o cliente, a partir da Fila.',
        caminho: 'ordem-servico/',
        status: 'pronta',
      },
      {
        nome: 'Fechamento do dia',
        descricao: 'Quanto entrou no dia, por forma de pagamento, e o que falta cobrar.',
        caminho: 'fechamento-dia/',
        status: 'pronta',
      },
    ],
  },
  {
    titulo: 'Configuração',
    descricao: 'Os dados que todas as ferramentas usam.',
    ferramentas: [
      {
        nome: 'Cadastros da gráfica',
        descricao: 'Dados da loja, Pix, folhas, papéis, preços e regras de produção.',
        caminho: 'cadastros/',
        status: 'pronta',
      },
    ],
  },
]

/** Cartão de uma ferramenta: pronta vira link; planejada ou ideia aparece apagada, com selo. */
function Cartao({ f }: { f: Ferramenta }) {
  if (f.status !== 'pronta')
    return (
      <Card className="h-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-texto-2">{f.nome}</h3>
          <Badge>{SELO[f.status]}</Badge>
        </div>
        <p className="mt-1 text-sm text-texto-2">{f.descricao}</p>
      </Card>
    )
  return (
    <a href={f.caminho} className="block h-full rounded-lg">
      <Card className="h-full transition-colors hover:border-tinta">
        <h3 className="font-medium text-tinta">{f.nome}</h3>
        <p className="mt-1 text-sm text-texto-2">{f.descricao}</p>
      </Card>
    </a>
  )
}

function Exemplo() {
  const [carregado, setCarregado] = useState(exemploCarregado)
  const [vazio] = useState(() => !temDados())
  if (!vazio && !carregado) return null
  return (
    <Card className="mt-6 flex flex-wrap items-center justify-between gap-3">
      {carregado ? (
        <>
          <p className="text-sm text-texto-2">Você está vendo dados de exemplo: uma gráfica fictícia, com preços e pedidos inventados.</p>
          <Button
            variante="secundario"
            onClick={() => {
              if (!confirm('Apagar os dados de exemplo (cadastros, respostas, pedidos e produtos)?')) return
              apagarExemplo()
              setCarregado(false)
              location.reload()
            }}
          >
            Apagar exemplo
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-texto-2">Primeira vez aqui? Veja as ferramentas funcionando com uma gráfica de exemplo.</p>
          <Button
            onClick={() => {
              carregarExemplo()
              location.reload()
            }}
          >
            Carregar exemplo
          </Button>
        </>
      )}
    </Card>
  )
}

function App() {
  const nome = carregarDados().loja.nome
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{nome ? `Ferramentas · ${nome}` : 'Ferramentas da gráfica'}</h1>
        <SeletorTema />
      </div>
      <p className="mt-1 text-texto-2">Atalhos para o atendimento do dia a dia.</p>
      <Exemplo />

      {SECOES.map((secao) => {
        const id = `secao-${secao.titulo.toLowerCase().replace(/\W+/g, '-')}`
        return (
          <section key={secao.titulo} aria-labelledby={id} className="mt-10">
            <h2 id={id} className="text-lg font-semibold">
              {secao.titulo}
            </h2>
            <p className="mt-0.5 text-sm text-texto-3">{secao.descricao}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {secao.ferramentas.map((f) => (
                <li key={f.caminho}>
                  <Cartao f={f} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </main>
  )
}

montar(<App />)
