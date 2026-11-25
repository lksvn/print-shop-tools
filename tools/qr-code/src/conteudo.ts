// O texto que vai dentro do QR para cada tipo. Sem tela.
import { linkWhatsapp } from '@pst/ui'

export type Tipo = 'link' | 'whatsapp' | 'wifi' | 'texto'

export const TIPOS: Record<Tipo, string> = {
  link: 'Link (site, Instagram, cardápio)',
  whatsapp: 'WhatsApp',
  wifi: 'Wi-Fi',
  texto: 'Texto livre',
}

export type Campos = {
  link: string
  telefone: string
  mensagem: string
  rede: string
  senha: string
  seguranca: 'WPA' | 'WEP' | 'nopass'
  texto: string
}

/** Link sem http:// ganha https:// (o celular não abre "instagram.com/loja" como site). */
export const comProtocolo = (url: string) => {
  const u = url.trim()
  return !u || /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`
}

/** No formato Wi-Fi, \ ; , : e " precisam de \ antes. */
const escaparWifi = (v: string) => v.replace(/([\\;,:"])/g, '\\$1')

export function conteudo(tipo: Tipo, c: Campos) {
  if (tipo === 'link') return comProtocolo(c.link)
  if (tipo === 'whatsapp') return c.telefone.replace(/\D/g, '') ? linkWhatsapp(c.mensagem, c.telefone) : ''
  if (tipo === 'wifi') {
    if (!c.rede.trim()) return ''
    const senha = c.seguranca === 'nopass' ? '' : `P:${escaparWifi(c.senha)};`
    return `WIFI:T:${c.seguranca};S:${escaparWifi(c.rede)};${senha};`
  }
  return c.texto
}

// shortcut: regra prática (módulo de ~0,5 mm, nunca abaixo de 2 cm); trocar pelo número do especialista se ele tiver um.
export const tamanhoMinimoMm = (modulos: number) => Math.max(20, Math.ceil(modulos * 0.5))
