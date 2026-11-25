import { describe, expect, it } from 'vitest'
import { comProtocolo, conteudo, tamanhoMinimoMm, type Campos } from './conteudo'

const vazio: Campos = { link: '', telefone: '', mensagem: '', rede: '', senha: '', seguranca: 'WPA', texto: '' }

describe('conteudo', () => {
  it('link ganha https só quando não tem protocolo', () => {
    expect(comProtocolo('instagram.com/loja')).toBe('https://instagram.com/loja')
    expect(comProtocolo('http://a.com')).toBe('http://a.com')
    expect(comProtocolo('mailto:x@y.com')).toBe('mailto:x@y.com')
    expect(comProtocolo('  ')).toBe('')
  })

  it('WhatsApp vira link wa.me com 55 e mensagem', () => {
    expect(conteudo('whatsapp', { ...vazio, telefone: '(41) 99999-0000', mensagem: 'Oi' })).toBe('https://wa.me/5541999990000?text=Oi')
    expect(conteudo('whatsapp', vazio)).toBe('')
  })

  it('Wi-Fi escapa caracteres especiais e aceita rede aberta', () => {
    expect(conteudo('wifi', { ...vazio, rede: 'Loja;1', senha: 'a:b' })).toBe('WIFI:T:WPA;S:Loja\\;1;P:a\\:b;;')
    expect(conteudo('wifi', { ...vazio, rede: 'Aberta', seguranca: 'nopass' })).toBe('WIFI:T:nopass;S:Aberta;;')
    expect(conteudo('wifi', vazio)).toBe('')
  })

  it('tamanho mínimo nunca abaixo de 2 cm', () => {
    expect(tamanhoMinimoMm(21)).toBe(20)
    expect(tamanhoMinimoMm(57)).toBe(29)
  })
})
