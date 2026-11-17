// Pix "copia e cola" estático no padrão BR Code do Banco Central (EMV QRCPS-MPM).
// Manual: https://www.bcb.gov.br/estabilidadefinanceira/pix (Manual de Padrões para Iniciação do Pix).
import type { TipoChavePix } from '@pst/dados'

// Só ASCII imprimível: o tamanho de cada campo do código é contado em bytes.
const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\x20-\x7E]/g, '')

/** Campo EMV: id (2) + tamanho (2) + valor. */
function campo(id: string, valor: string) {
  return id + String(valor.length).padStart(2, '0') + valor
}

/** CRC16-CCITT-FALSE (polinômio 0x1021, início 0xFFFF), exigido no campo 63. */
export function crc16(texto: string) {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Chave no formato que o Pix espera: CPF/CNPJ só dígitos, telefone +55DDDNÚMERO, e-mail e aleatória em minúsculas. */
export function normalizarChave(tipo: TipoChavePix, chave: string) {
  const digitos = chave.replace(/\D/g, '')
  if (tipo === 'cpf' || tipo === 'cnpj') return digitos
  if (tipo === 'telefone') return `+55${digitos}`
  return chave.trim().toLowerCase()
}

/** Confere a chave antes de gerar o código. Devolve a mensagem de erro ou ''. */
export function problemaNaChave(tipo: TipoChavePix, chave: string) {
  const d = chave.replace(/\D/g, '')
  if (!tipo) return 'Escolha o tipo da chave Pix nos Cadastros.'
  if (!chave.trim()) return 'Preencha a chave Pix nos Cadastros.'
  if (tipo === 'cpf' && d.length !== 11) return 'O CPF da chave Pix precisa ter 11 dígitos.'
  if (tipo === 'cnpj' && d.length !== 14) return 'O CNPJ da chave Pix precisa ter 14 dígitos.'
  if (tipo === 'telefone' && (d.length < 10 || d.length > 11)) return 'O telefone da chave Pix precisa ter DDD + número.'
  if (tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave.trim())) return 'O e-mail da chave Pix parece incompleto.'
  if (tipo === 'aleatoria' && !/^[0-9a-f-]{32,36}$/i.test(chave.trim())) return 'A chave aleatória parece incompleta.'
  return ''
}

/** Identificador do pedido (txid): só letras e números, até 25. Vazio vira "***" (padrão do Pix estático). */
export const limparIdentificador = (id: string) => semAcento(id).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'

type Entrada = {
  tipo: TipoChavePix
  chave: string
  recebedor: string
  cidade: string
  valor?: number // sem valor, o cliente digita no app do banco
  identificador?: string
}

export function gerarPix({ tipo, chave, recebedor, cidade, valor, identificador = '' }: Entrada) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', normalizarChave(tipo, chave))
  const corpo =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor ? campo('54', valor.toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', semAcento(recebedor).trim().slice(0, 25)) +
    campo('60', semAcento(cidade).trim().slice(0, 15)) +
    campo('62', campo('05', limparIdentificador(identificador))) +
    '6304'
  return corpo + crc16(corpo)
}
