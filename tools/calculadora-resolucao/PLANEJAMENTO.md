# Calculadora de resolução

## Objetivo

Responder na hora perguntas como "essa foto de 1200 px imprime até quantos cm?" ou "para um banner de 1 m, de quantos pixels preciso?". Ajuda a explicar ao cliente por que a imagem vai sair borrada.

## Status

v1 pronta (2026-11-25).

## Features (v1)

- [x] Pixels → tamanho máximo em cm no DPI escolhido (padrão: DPI dos Cadastros), sempre arredondado para baixo.
- [x] A mesma conta em 300 e 150 DPI, com selo boa / aceitável de longe / baixa.
- [x] Ler os pixels de uma imagem escolhida, sem digitar.
- [x] Tamanho em cm → pixels necessários, e o DPI que a imagem atual teria nesse tamanho.
- [x] Frase pronta para copiar e mandar ao cliente.

## Futuras features

- DPI diferente por produto (banner aceita menos), se o especialista confirmar.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Banner e placa grande aceitam DPI menor? Quanto? | (mesma pergunta da rodada 2 do Orçamento de PDF) |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | Ferramenta própria, e não aba do Orçamento de PDF | Serve para foto e imagem solta, sem PDF |

## Notas técnicas

- `src/resolucao.ts`: cm = px ÷ DPI × 2,54 e o inverso, puras e testadas em `resolucao.test.ts`.
- Pixels da imagem com `createImageBitmap`, sem biblioteca. Lê `producao.dpi` dos Cadastros.
- Só calcula, sem dados próprios: não precisa de exportar/importar.
