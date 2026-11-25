// Dados de exemplo só para demonstração: uma gráfica fictícia, preços inventados e pedidos de mentira.
// Sem telefones e sem chave Pix real, para nenhum botão de WhatsApp ou Pix chegar a uma pessoa de verdade.
import { CHAVE_FILA, DADOS_PADRAO, salvarDados, validarDados, type Dados, type Etapa, type Fila, type Pagamento, type Pedido } from '@pst/dados'

const CHAVES = ['pst:dados:v1', CHAVE_FILA, 'pst:respostas-prontas:v1', 'pst:produtos-prontos:v1']
const MARCA = 'pst:exemplo'

export const temDados = () => CHAVES.some((k) => localStorage.getItem(k) !== null)
export const exemploCarregado = () => localStorage.getItem(MARCA) === '1'

const dados: Dados = {
  ...DADOS_PADRAO,
  loja: {
    nome: 'Gráfica Exemplo',
    telefone: '',
    endereco: { cep: '', rua: 'Rua Exemplo', numero: '100', complemento: '', bairro: 'Centro', cidade: 'Curitiba', uf: 'PR' },
    horario: 'Seg a sex, 8h às 18h · Sáb, 8h às 12h',
    prazoDiasUteis: 2,
  },
  // Chave aleatória do exemplo do manual do Banco Central: não existe de verdade.
  pix: { tipo: 'aleatoria', chave: '123e4567-e12b-12d1-a456-426655440000', recebedor: 'Grafica Exemplo' },
  papeis: [
    { nome: 'Couchê 240g', precos: { A5: 1.5, A4: 2.5, A3: 4.5 } },
    { nome: 'Sulfite color 90g', precos: { A5: 0.6, A4: 1, A3: 2 } },
    { nome: 'Sulfite 75g P/B', precos: { A6: 0.15, A5: 0.25, A4: 0.4, A3: 0.8 } },
    { nome: 'Couchê adesivo 150g', precos: { A4: 3, A3: 5.5 } },
    { nome: 'Couchê adesivo com recorte', precos: { A3: 8 } },
  ],
}

const dia = 24 * 60 * 60 * 1000
const haDias = (n: number) => new Date(Date.now() - n * dia).toISOString()
const pago = (valor: number, forma: Pagamento['forma'], dias: number): Pagamento => ({ id: crypto.randomUUID(), valor, forma, em: haDias(dias) })
// Prazo em AAAA-MM-DD no fuso do computador; negativo = já passou.
const prazoEm = (n: number) => {
  const d = new Date(Date.now() + n * dia)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
type Extra = Partial<Pick<Pedido, 'valor' | 'prazo' | 'observacoes' | 'pagamentos'>>
const pedido = (cliente: string, descricao: string, etapa: Etapa, dias: number, extra: Extra = {}): Pedido => ({
  id: crypto.randomUUID(),
  cliente,
  telefone: '',
  descricao,
  pagamentos: [],
  ...extra,
  etapa,
  criadoEm: haDias(dias + 1),
  etapaDesde: haDias(dias),
})

const fila: Fila = {
  diasAlerta: 3,
  ultimoBackup: null,
  pedidos: [
    pedido('Ana (exemplo)', 'Convite de casamento, 80 unidades', 'arquivo', 1, { prazo: prazoEm(6) }),
    pedido('Bruno (exemplo)', '100 cartões de visita, couchê 240g', 'orcamento', 4, { valor: 45 }),
    pedido('Carla (exemplo)', '50 adesivos redondos com recorte', 'aprovado', 0, {
      valor: 64,
      prazo: prazoEm(3),
      observacoes: 'Recorte redondo de 5 cm. Conferir se o logo não encostou na borda.',
      pagamentos: [pago(32, 'pix', 0)],
    }),
    pedido('Diego (exemplo)', 'Cardápio A3, 10 unidades', 'producao', 1, {
      valor: 45,
      prazo: prazoEm(1),
      observacoes: 'Laminação fosca nos dois lados.',
      pagamentos: [pago(45, 'credito', 1)],
    }),
    pedido('Eva (exemplo)', 'Panfleto A5, 500 unidades', 'pronto', 2, { valor: 600, prazo: prazoEm(0), pagamentos: [pago(300, 'pix', 4)] }),
    pedido('Fábio (exemplo)', 'Banner 60×90 cm', 'entregue', 0, { valor: 85, pagamentos: [pago(40, 'dinheiro', 3), pago(45, 'debito', 0)] }),
    pedido('Gabi (exemplo)', '200 tags de roupa, couchê 240g', 'entregue', 2, { valor: 70, pagamentos: [pago(35, 'pix', 5)] }),
  ],
}

// shortcut: formato de tools/produtos-prontos/src/produtos.ts; se mudar, atualizar aqui (a ferramenta avisa se não reconhecer).
const faixas = (lista: [number, number][]) => lista.map(([quantidade, preco]) => ({ quantidade, preco }))
const produtos = [
  { id: crypto.randomUUID(), nome: 'Cartão de visita', larguraMm: 90, alturaMm: 50, papel: 'Couchê 240g', faixas: faixas([[100, 45], [250, 95], [500, 175], [1000, 330]]) },
  { id: crypto.randomUUID(), nome: 'Panfleto A5', larguraMm: 148, alturaMm: 210, papel: 'Sulfite color 90g', faixas: faixas([[100, 130], [500, 600], [1000, 1150]]) },
]

export function carregarExemplo() {
  salvarDados(validarDados(dados))
  localStorage.setItem(CHAVE_FILA, JSON.stringify(fila))
  localStorage.setItem('pst:produtos-prontos:v1', JSON.stringify({ produtos }))
  localStorage.removeItem('pst:respostas-prontas:v1') // as respostas padrão já servem de exemplo
  localStorage.setItem(MARCA, '1')
}

export function apagarExemplo() {
  // A escolha de papéis da Tabela de preços aponta para papéis do exemplo: sai junto.
  for (const k of [...CHAVES, 'pst:tabela-precos:v1', MARCA]) localStorage.removeItem(k)
}
