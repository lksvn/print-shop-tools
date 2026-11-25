// Contas de resolução: pixels ↔ centímetros para um DPI. Sem tela.
const CM_POR_POLEGADA = 2.54

/** Maior tamanho (cm) que a imagem imprime com aquele DPI. */
export const cmMaximo = (px: number, dpi: number) => (px > 0 && dpi > 0 ? (px / dpi) * CM_POR_POLEGADA : 0)

/** Pixels necessários para imprimir `cm` com aquele DPI (arredonda para cima). */
export const pxNecessarios = (cm: number, dpi: number) => (cm > 0 && dpi > 0 ? Math.ceil((cm / CM_POR_POLEGADA) * dpi) : 0)

/** DPI que a imagem terá se for impressa em `cm`. */
export const dpiEfetivo = (px: number, cm: number) => (px > 0 && cm > 0 ? (px / cm) * CM_POR_POLEGADA : 0)

const cm = (v: number) => (Math.floor(v * 10) / 10).toLocaleString('pt-BR') // para baixo: nunca prometer mais do que dá

export function fraseParaCliente(larguraPx: number, alturaPx: number, dpi: number) {
  if (!larguraPx || !alturaPx) return ''
  return `Sua imagem tem ${larguraPx} × ${alturaPx} pixels. Ela imprime com boa qualidade até ${cm(cmMaximo(larguraPx, dpi))} × ${cm(cmMaximo(alturaPx, dpi))} cm. Maior do que isso, pode sair borrada ou quadriculada.`
}

export { cm as formatarCm }
