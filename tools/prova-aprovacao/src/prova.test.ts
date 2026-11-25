import { describe, expect, it, vi } from 'vitest'

vi.mock('pdfjs-dist', () => ({ getDocument: vi.fn(), GlobalWorkerOptions: {} }))
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }))
const { escalaPara, mensagemProva, nomeDaProva, rodape } = await import('./prova')

describe('prova', () => {
  it('escala pelo lado maior, em retrato ou paisagem', () => {
    expect(escalaPara(595, 842, 1600) * 842).toBeCloseTo(1600)
    expect(escalaPara(842, 595, 1600) * 842).toBeCloseTo(1600)
  })

  it('rodapé com medida e página só quando faz sentido', () => {
    expect(rodape({ loja: 'Gráfica X', data: '25/11/2026', larguraMm: 210.2, alturaMm: 297, pagina: 1, total: 2 })).toBe(
      'Gráfica X · Prova de 25/11/2026 · 210 × 297 mm · Pág. 1 de 2',
    )
    expect(rodape({ loja: '', data: '25/11/2026', pagina: 1, total: 1 })).toBe('Prova de 25/11/2026')
  })

  it('mensagem com e sem nome do cliente', () => {
    expect(mensagemProva(' Ana ', 1)).toMatch(/^Olá, Ana! Segue a imagem da prova/)
    expect(mensagemProva('', 3)).toMatch(/^Olá! Segue as 3 imagens da prova/)
    expect(mensagemProva('', 1)).toContain('responda *OK*')
  })

  it('nome do arquivo sem acentos nem espaços', () => {
    expect(nomeDaProva('Cartão Ana.pdf', 2, 2)).toBe('prova-Cartao-Ana-p2.jpg')
    expect(nomeDaProva('.pdf', 1, 1)).toBe('prova-arte.jpg')
  })
})
