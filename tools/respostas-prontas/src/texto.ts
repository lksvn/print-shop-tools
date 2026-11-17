// Regras das respostas prontas, sem tela: campos digitados e respostas de exemplo.

export type Resposta = { id: string; titulo: string; texto: string }

/** Campos que o atendente digita na hora. Os demais vêm dos Cadastros. */
export const CAMPOS_DIGITADOS = ['cliente', 'valor'] as const
export type CampoDigitado = (typeof CAMPOS_DIGITADOS)[number]

/** Quais campos digitados aparecem no texto, na ordem da lista. */
export const camposUsados = (texto: string) => CAMPOS_DIGITADOS.filter((c) => texto.includes(`{${c}}`))

export function respostasPadrao(): Resposta[] {
  return [
    {
      titulo: 'Como enviar o arquivo',
      texto:
        'Olá, {cliente}! Pode mandar o arquivo por aqui mesmo, de preferência em PDF.\n\nPara sair bem impresso:\n• imagens com {dpi} DPI\n• {sangria} mm de sangria se a arte for até a borda\n• textos a pelo menos {margem} mm da borda\n\nAssim que chegar, te passo o orçamento.',
    },
    { titulo: 'Arquivo recebido', texto: 'Recebi o arquivo, {cliente}! Vou conferir e já te passo o orçamento.' },
    {
      titulo: 'Prazo de entrega',
      texto: 'O prazo é de {prazoDias} dias úteis depois da aprovação. Aprovando hoje, fica pronto {prazo}.',
    },
    { titulo: 'Pagamento por Pix', texto: 'O valor ficou em R$ {valor}.\nChave Pix: {pix}\n\nDepois é só mandar o comprovante por aqui.' },
    { titulo: 'Endereço e horário', texto: 'Estamos em {endereco}.\nHorário de atendimento: {horario}.' },
  ].map((r) => ({ id: crypto.randomUUID(), ...r }))
}

/** Valida o que veio do localStorage (pode ter sido editado à mão ou estar corrompido). */
export function validarRespostas(entrada: unknown): Resposta[] | null {
  if (!Array.isArray(entrada)) return null
  const ok = entrada.every(
    (r) => r && typeof r.id === 'string' && typeof r.titulo === 'string' && typeof r.texto === 'string',
  )
  return ok ? entrada.map(({ id, titulo, texto }) => ({ id, titulo, texto })) : null
}
