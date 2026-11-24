// Dados de exemplo só para demonstração: uma gráfica fictícia, preços inventados e pedidos de mentira.
// Sem telefones e sem chave Pix real, para nenhum botão de WhatsApp ou Pix chegar a uma pessoa de verdade.
import { DADOS_PADRAO, salvarDados, validarDados, type Dados } from '@pst/dados'

const CHAVES = ['pst:dados:v1', 'pst:fila-pedidos:v1', 'pst:respostas-prontas:v1']
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
// shortcut: o formato da fila é o de tools/fila-pedidos/src/pedidos.ts; se ele mudar, atualizar aqui (a fila avisa se não reconhecer).
const pedido = (cliente: string, descricao: string, etapa: string, dias: number, valor?: number) => ({
  id: crypto.randomUUID(),
  cliente,
  telefone: '',
  descricao,
  valor,
  etapa,
  criadoEm: haDias(dias + 1),
  etapaDesde: haDias(dias),
})

const fila = {
  diasAlerta: 3,
  ultimoBackup: null,
  pedidos: [
    pedido('Ana (exemplo)', 'Convite de casamento, 80 unidades', 'arquivo', 1),
    pedido('Bruno (exemplo)', '100 cartões de visita, couchê 240g', 'orcamento', 4, 31.5),
    pedido('Carla (exemplo)', '50 adesivos redondos com recorte', 'aprovado', 0, 64),
    pedido('Diego (exemplo)', 'Cardápio A3, 10 unidades', 'producao', 1, 45),
    pedido('Eva (exemplo)', 'Panfleto A5, 500 unidades', 'pronto', 2, 300),
  ],
}

export function carregarExemplo() {
  salvarDados(validarDados(dados))
  localStorage.setItem('pst:fila-pedidos:v1', JSON.stringify(fila))
  localStorage.removeItem('pst:respostas-prontas:v1') // as respostas padrão já servem de exemplo
  localStorage.setItem(MARCA, '1')
}

export function apagarExemplo() {
  for (const k of [...CHAVES, MARCA]) localStorage.removeItem(k)
}
