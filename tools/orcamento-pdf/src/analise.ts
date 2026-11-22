// Regras do orçamento de PDF, sem tela e sem pdf.js: enquadramento, avisos e itens do orçamento.
import type { Dados, Folha, ItemOrcamento } from '@pst/dados'

export const pontosParaMm = (pt: number) => (pt * 25.4) / 72

/** O que o leitor de PDF mede em cada página (tudo em mm, pt ou px, sem regra de negócio). */
export type MedidasPagina = {
  numero: number
  larguraMm: number
  alturaMm: number
  menorDpi: number | null // pior imagem da página; null = sem imagens
  menorFontePt: number | null // menor texto; null = sem texto
  menorDistanciaTextoMm: number | null // texto mais perto da borda da página
  tocaBorda: boolean // tem desenho encostando na borda (arte que vai até o corte)
  fontesNaoIncorporadas: string[]
}

export type Enquadramento = { folha: Folha | null; comSangria: boolean }

const FOLGA_MM = 1 // arredondamento de programas de design (ex.: A4 exportado com 210,2 mm)

/**
 * Menor folha cadastrada em que a página cabe, podendo girar.
 * shortcut: gira a arte (23×5 cm cabe deitada na A4); trocar se o especialista disser que não pode (rodada 2, pergunta 1).
 * A página pode ter a sangria em volta (A4 + 3 mm de cada lado continua A4); nesse caso comSangria = true.
 */
export function enquadrar(larguraMm: number, alturaMm: number, folhas: Folha[], sangriaMm: number): Enquadramento {
  const [menor, maior] = [larguraMm, alturaMm].sort((a, b) => a - b)
  const porArea = [...folhas].sort((a, b) => a.larguraMm * a.alturaMm - b.larguraMm * b.alturaMm)
  const extra = 2 * sangriaMm + FOLGA_MM
  for (const folha of porArea) {
    const [fMenor, fMaior] = [folha.larguraMm, folha.alturaMm].sort((a, b) => a - b)
    if (menor <= fMenor + extra && maior <= fMaior + extra) {
      const comSangria =
        sangriaMm > 0 && Math.abs(menor - (fMenor + 2 * sangriaMm)) <= FOLGA_MM && Math.abs(maior - (fMaior + 2 * sangriaMm)) <= FOLGA_MM
      return { folha, comSangria }
    }
  }
  return { folha: null, comSangria: false }
}

/** 6,5 (vírgula e no máximo 1 casa) */
const num = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export type Aviso = { texto: string; nivel: 'alerta' | 'info' }

export function avisosDaPagina(p: MedidasPagina, e: Enquadramento, producao: Dados['producao']): Aviso[] {
  const avisos: Aviso[] = []
  if (!e.folha) avisos.push({ nivel: 'alerta', texto: 'Maior que todas as folhas cadastradas: orçar à parte.' })
  if (p.menorDpi !== null && p.menorDpi < producao.dpi)
    avisos.push({ nivel: 'alerta', texto: `Imagem com ${Math.round(p.menorDpi)} DPI (mínimo ${producao.dpi}). Conferir a qualidade.` })
  if (p.menorFontePt !== null && p.menorFontePt < producao.fontePt - 0.25)
    avisos.push({ nivel: 'alerta', texto: `Texto com ${num(p.menorFontePt)} pt (mínimo ${producao.fontePt}).` })
  // Com sangria no arquivo, a borda de corte fica sangriaMm para dentro.
  const corte = e.comSangria ? producao.sangriaMm : 0
  if (p.menorDistanciaTextoMm !== null && p.menorDistanciaTextoMm - corte < producao.margemMm)
    avisos.push({
      nivel: 'alerta',
      texto: `Texto a ${num(Math.max(0, p.menorDistanciaTextoMm - corte))} mm do corte (margem de segurança: ${producao.margemMm} mm).`,
    })
  if (p.tocaBorda && !e.comSangria && producao.sangriaMm > 0)
    avisos.push({ nivel: 'alerta', texto: `A arte vai até a borda, mas o arquivo não tem ${producao.sangriaMm} mm de sangria.` })
  if (p.fontesNaoIncorporadas.length)
    avisos.push({ nivel: 'alerta', texto: `Fonte não incorporada: ${p.fontesNaoIncorporadas.join(', ')}. Pode sair com outra fonte.` })
  return avisos
}

/** Junta as páginas por folha para o orçamento: quantidade = páginas daquela folha × cópias. */
export function itensDoOrcamento(folhasDasPaginas: (string | null)[], papel: string, copias: number): ItemOrcamento[] {
  const porFolha = new Map<string, number>()
  for (const f of folhasDasPaginas) if (f) porFolha.set(f, (porFolha.get(f) ?? 0) + 1)
  return [...porFolha].map(([folha, paginas]) => ({ papel, folha, quantidade: paginas * copias }))
}
