# Livreto e dobra

## Objetivo

Responder na hora quantas folhas um livreto ou cardápio dobrado precisa e em que ordem as páginas saem na impressão. Evita erro de montagem e páginas em branco esquecidas.

## Status

v1 pronta (2026-11-25). O recuo da dobra carteira (2 mm) é provisório até a pergunta 3.

## Features (v1)

- [x] Livreto: número de páginas e tamanho fechado (folha cadastrada ou outro tamanho em mm).
- [x] Aviso quando o número não é múltiplo de 4, com quantas páginas em branco entram.
- [x] Folha aberta (A5 fechado → A4 aberto), em que folha imprimir (mesmo tamanho sem refile, ou a menor em que cabe com sangria e margem, refilando) e quantas folhas por livreto.
- [x] Quantidade de livretos opcional: total de folhas e link para o Orçamento rápido com papel, folha e quantidade.
- [x] Ordem das páginas por folha, frente e verso (ex.: folha 1 frente: 12 | 1), com as páginas em branco marcadas.
- [x] Dobras de folheto: ao meio, em 3 sanfona ou carteira, com a largura de cada painel, onde dobrar e um desenho na proporção real.

## Futuras features

- Gerar o PDF já montado na ordem do livreto (a Montagem para impressão já tem a parte de pôr páginas na folha).
- Compensar o "deslocamento" das páginas do meio em livretos grossos.
- Capa em papel diferente do miolo (depende da pergunta 4).

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Vocês fazem livreto grampeado? Até quantas páginas? | |
| 2 | Quais dobras mais aparecem (ao meio, em 3, sanfona)? | |
| 3 | Na dobra em 3, vocês deixam o painel de dentro mais estreito? Quantos mm? | |
| 4 | Capa em papel diferente do miolo é comum? | |
| 5 | Livreto é cobrado por folha impressa (frente e verso) ou tem preço próprio? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | Páginas em branco vão para o final, com aviso para combinar com o cliente | É o padrão mais simples; o atendente decide com o cliente onde elas entram |
| 2026-11-25 | Dobra sempre no lado maior da folha | É como se dobra folheto A4 em 3; outro sentido entra se o especialista pedir |

## Notas técnicas

- `src/contas.ts`: `paginasDoLivreto`, `ordemDasPaginas`, `folhaAberta`, `folhaParaImprimir` e `paineis`, todas puras e testadas em `contas.test.ts`.
- `src/App.tsx`: duas seções (Livreto e Dobra) numa página só.
- O link do Orçamento rápido passa as folhas como quantidade; frente e verso ainda não muda preço (pergunta 5 e pergunta 2 dos Cadastros).
- Só calcula, sem dados próprios: não precisa de exportar/importar.
