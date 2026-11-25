# Tabela de preços para o cliente

## Objetivo

Uma tabela de preços bonita, gerada a partir dos Cadastros, para mandar no WhatsApp ou imprimir e deixar no balcão. Mudou o preço nos Cadastros, a tabela muda junto, sem refazer arte.

## Status

v1 pronta (2026-11-25). Mostra preço por folha; pode mudar para produtos conforme a pergunta 2.

## Features (v1)

- [x] Tabela papel × folha com os preços dos Cadastros; células vazias aparecem como "—". Papel sem nenhum preço e folha que nenhum papel usa ficam de fora.
- [x] Cabeçalho com o nome da loja; rodapé com WhatsApp, endereço e horário (o que estiver preenchido).
- [x] Escolher quais papéis entram (ex.: esconder os que só a gráfica usa). A escolha fica salva.
- [x] Baixar como imagem PNG (1080 px de largura) para mandar no WhatsApp.
- [x] Imprimir: sai só a tabela, igual à imagem.
- [x] Data "preços válidos em" no rodapé.

## Futuras features

- Página pública com link fixo (exige servidor ou publicar os preços).
- Incluir os Produtos prontos (preço por quantidade), se essa ferramenta existir.
- Logo da gráfica no cabeçalho (exige guardar imagem nos Cadastros).

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Vocês mostram preço ao cliente antes do orçamento, ou só depois de ver o arquivo? | |
| 2 | Preço por folha faz sentido para o cliente, ou ele pensa em produto (100 cartões)? | |

A resposta 2 decide se esta tabela mostra folhas ou produtos.

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | A tabela é uma imagem desenhada em canvas, usada como prévia, download e impressão | O que se vê é o que sai; um layout só para manter |
| 2026-11-25 | Imagem sempre clara, com cores fixas | Vai para o cliente e para a impressora, independente do tema da tela |
| 2026-11-25 | Salva os papéis ocultos, não os visíveis | Papel novo nos Cadastros já aparece na tabela |

## Notas técnicas

- `src/tabela.ts`: `montarTabela` e `rodape` (puras, testadas em `tabela.test.ts`) e `desenharImagem` (canvas → PNG).
- `src/App.tsx`: escolha dos papéis, prévia, Baixar imagem e Imprimir (`print:hidden` esconde o resto da tela).
- Só lê `@pst/dados`. A lista de papéis ocultos fica em `pst:tabela-precos:v1`.
- A única configuração própria é a lista de papéis ocultos, simples de refazer: não precisa de exportar/importar (entra no Backup geral do hub, quando existir).
