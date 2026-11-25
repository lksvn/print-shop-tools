# Prova para aprovação

## Objetivo

Antes de imprimir, mandar ao cliente uma imagem da arte com a marca "PROVA – não imprimir" e um texto pedindo a aprovação. Evita imprimir errado e deixa registrado o que o cliente aprovou.

## Status

v1 pronta (2026-11-25). O texto da mensagem é provisório até a pergunta 2.

## Features (v1)

- [x] Abrir um PDF ou imagem (PNG/JPG). PDF com mais de 30 páginas: só as 30 primeiras, com aviso.
- [x] Uma imagem por página com a marca d'água "PROVA – não imprimir" repetida na diagonal.
- [x] Faixa de rodapé embaixo da arte (sem cobrir nada) com nome da loja, data, medida em mm e página.
- [x] Mensagem pronta para copiar ou abrir no WhatsApp, com nome e telefone do cliente opcionais.
- [x] Baixar cada imagem (JPG) ou todas; "Copiar imagem" para colar direto no WhatsApp Web (Ctrl+V).

## Futuras features

- Marcar na Fila de pedidos que a prova foi enviada e quando o cliente aprovou.
- Mostrar a linha de corte e a área de segurança na prova.
- Botão "Compartilhar" no celular (Web Share API com arquivos), que manda as imagens direto para o WhatsApp.
- Mensagem vinda das Respostas prontas, editável pela gráfica.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Vocês já mandam prova hoje? Em imagem ou PDF? | |
| 2 | Qual texto vocês usam para pedir a aprovação? | |
| 3 | A prova precisa mostrar onde vai ser o corte? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | Imagem JPG com 1600 px no lado maior | Leve para o WhatsApp, nítida para conferir e ruim para imprimir (a prova não vira arquivo final) |
| 2026-11-25 | Rodapé numa faixa abaixo da arte, e não por cima | Não esconde nada que o cliente precisa conferir |
| 2026-11-25 | Medida em mm no rodapé, sem nome da folha | Imagem não tem medida confiável; o nome da folha fica no Orçamento de PDF |

## Notas técnicas

- `src/prova.ts`: desenha a página (pdf.js) ou a imagem num canvas, aplica a marca e o rodapé, gera o JPG. Funções puras (escala, rodapé, mensagem, nome do arquivo) testadas em `prova.test.ts`.
- `src/App.tsx`: área de soltar o arquivo, mensagem, imagens com Baixar e Copiar imagem.
- "Copiar imagem" usa `navigator.clipboard.write` com PNG (único formato aceito). Se o navegador bloquear, aparece o aviso para usar Baixar.
- Só gera arquivo, sem dados próprios: não precisa de exportar/importar.
