# Produtos prontos

## Objetivo

Cartão de visita, panfleto e adesivo com preço por quantidade (100, 250, 500…), para o orçamento sair só com "100 cartões", sem pensar em folhas. É como o cliente costuma pedir.

## Status

v1 pronta (2026-11-25). Só orça as quantidades cadastradas até a pergunta 3.

## Features (v1)

- [x] Cadastro de produtos: nome, tamanho final, papel e preço total por quantidade. Produto novo já vem como cartão 90×50 com 100/250/500/1000.
- [x] Ao lado de cada quantidade, o custo só das folhas (mesma conta do Aproveitamento de folha), como piso para o preço.
- [x] Orçar: produto e quantidade → valor, valor por unidade, mensagem (modelo dos Cadastros), WhatsApp e Pix.
- [x] Salvamento automático com aviso, exportar/importar, e trava se o dado salvo estiver estragado.

## Futuras features

- Quantidade fora da tabela (ex.: 300): proporcional, ou a próxima faixa? Depende da pergunta 3.
- Acabamentos com preço próprio (laminação, verniz, recorte).
- Entrar na Tabela de preços para o cliente (aí os produtos sobem para `@pst/dados` e passam a ser editados nos Cadastros).

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | O cliente pede em folhas ou em produtos ("100 cartões")? | |
| 2 | Quais produtos e quantidades vocês vendem mais? | |
| 3 | O preço do produto segue a conta da folha, ou é um preço fechado de tabela? E quantidade fora da tabela? | |
| 4 | Frente e verso muda o preço? (mesma pergunta dos Cadastros) | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | Ferramenta própria com dados em `pst:produtos-prontos:v1`, e não nos Cadastros | Só ela usa os produtos hoje (regra: compartilha quando 2+ usam) |
| 2026-11-25 | Orça só as quantidades com preço cadastrado | Não inventar regra de preço antes da pergunta 3 |

## Notas técnicas

- `src/produtos.ts`: tipo, validação, faixas com preço e `custoDasFolhas` (usa `montar` e `precoDe` do `@pst/dados`). Testes em `produtos.test.ts`.
- `src/Editor.tsx`: cadastro dos produtos. `src/App.tsx`: orçamento, salvar, exportar/importar.
- Preço por faixa é "regra de preço como dado" (regra 5 do multi-empresa).
- O hub carrega dois produtos no exemplo (`hub/src/exemplo.ts`).
