# Montagem para impressão

## Objetivo

O cliente manda um cartão 9×5 e a ferramenta devolve a folha A3 pronta para imprimir, com as cópias posicionadas e marcas de corte. Hoje isso é feito à mão no Corel ou no Illustrator, arte por arte.

## Status

v1 pronta (2026-11-25). Estilo das marcas, borda de virar e espaço entre artes são provisórios até as perguntas 2 a 4.

## Features (v1)

- [x] Abrir o PDF da arte (página 1 = frente; página 2 = verso, se houver).
- [x] Escolher a folha (padrão: a maior cadastrada); a disposição (colunas × linhas, girada ou não) é a mesma conta do Aproveitamento de folha.
- [x] Informar se o PDF já vem com a sangria dos Cadastros; sem sangria, a arte fica no tamanho final e a sangria fica em branco.
- [x] PDF novo do tamanho da folha, com a arte em vetor (a página original é copiada, não vira imagem).
- [x] Marcas de corte em preto puro, só fora do bloco de artes, sem entrar na sangria.
- [x] Frente e verso: o verso gira para cair de cabeça para cima atrás da frente, virando a folha pela lateral ou por cima.
- [x] Pré-visualização da frente e do verso antes de baixar; quantidade opcional mostra quantas folhas imprimir.
- [x] Avisos: arte que não cabe, verso com medida diferente da frente, PDF com mais de 2 páginas.

## Futuras features

- Artes diferentes na mesma folha (ex.: 4 cartões de pessoas diferentes).
- Abrir direto do Orçamento de PDF ou do Aproveitamento de folha com o arquivo já escolhido.
- Marcas de registro e barra de cor, se a máquina pedir.
- Detectar a sangria sozinha pela TrimBox do PDF, quando o arquivo trouxer.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | O que mais toma tempo entre receber o arquivo e imprimir? (decide se esta ferramenta compensa) | |
| 2 | Que tipo de marca de corte vocês usam? Qual o comprimento e a distância da arte? | |
| 3 | No frente e verso, o verso vira pela borda maior ou pela menor da folha? | |
| 4 | As cópias ficam encostadas (corte único entre elas) ou com espaço (corte duplo)? | |
| 5 | A máquina tem margem mínima diferente por papel? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | `montar()` saiu do Aproveitamento de folha para `@pst/dados` | Duas ferramentas usam a mesma conta; uma só fonte evita as duas divergirem |
| 2026-11-25 | Marcas de 5 mm, a 1 mm do bloco, 0,5 pt, preto puro (provisório) | Padrão comum; esperar a pergunta 2 |
| 2026-11-25 | Pré-visualização é o próprio PDF gerado, desenhado pelo pdf.js | O que se vê é exatamente o que vai para a impressora |

## Notas técnicas

- `src/montagem.ts`: `gerarMontagem` (pdf-lib: `embedPage` + `drawPage` girado), `ancora` (ponto de desenho para cada rotação), `rotacaoVerso` e `marcasDeCorte`. Roda no Node: testes em `montagem.test.ts` geram PDFs de verdade.
- `src/App.tsx`: opções, pré-visualização (pdf.js) e download.
- Usa `producao.sangriaMm`, `espacoMm` e `margemMaquinaMm` dos Cadastros.
- shortcut: com sangria no arquivo, supõe que ela é igual à dos Cadastros; arquivo com sangria maior invade o espaço entre artes. Recortar pela TrimBox se aparecer caso real.
- O grid é centralizado na folha; por isso cada verso cai atrás de uma frente sem espelhar posições.
- `exemplos/cartao-frente-verso.pdf`: cartão 90×50 com 3 mm de sangria, frente azul e verso laranja, com "topo" escrito para conferir a rotação.
- Só calcula e gera arquivo, sem dados próprios: não precisa de exportar/importar.
