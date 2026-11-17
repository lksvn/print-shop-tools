# Aproveitamento de folha

## Objetivo

Descobrir quantas artes pequenas cabem numa folha (cartões, etiquetas, adesivos) e quanto custa cada unidade. Hoje essa conta é feita de cabeça ou no programa de design. A ferramenta faz na hora e mostra um desenho da folha montada.

## Status

Ideia: mostrar ao especialista antes de planejar a fundo (cerca de 1 dia de trabalho).

## Como funcionaria

1. O atendente informa o tamanho da arte (ex.: 9×5 cm) e a quantidade (ex.: 100).
2. Escolhe a folha e o papel (ex.: A3, couchê 240g).
3. A ferramenta mostra:
   - quantas cabem por folha, testando a arte em pé e deitada e ficando com a melhor;
   - quantas folhas são necessárias;
   - o preço total e o preço por unidade;
   - um desenho simples da folha com as artes posicionadas.

## Features (v1, se aprovada)

- [ ] Cálculo de quantas cabem, considerando a sangria, o espaço entre as artes e a margem da máquina.
- [ ] Desenho da folha (SVG simples, sem animação).
- [ ] Folhas, papéis, preços e sangria vindos dos Cadastros.
- [ ] Botão "levar para o Orçamento rápido" com a quantidade de folhas.

## Futuras features

- Produtos prontos (cartão de visita = 9×5 cm em couchê 240g), para o Orçamento rápido perguntar só a quantidade.
- Artes de tamanhos diferentes na mesma folha.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Essa conta ajudaria no dia a dia? Para quais produtos? | |
| 2 | Qual o espaço entre uma arte e outra na folha (mm)? | |
| 3 | A máquina tem uma margem em que não imprime? Quantos mm? | |
| 4 | O corte/recorte tem custo separado por unidade ou por folha? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|

## Notas técnicas

- O cálculo é uma função pura: `floor(área útil / (arte + espaço))` nos dois sentidos, comparando em pé e deitada. Precisa de teste com casos conhecidos (ex.: cartões 9×5 numa A3).
- Exportar/importar: não precisa na v1. Se ganhar "produtos prontos" (ex.: cartão 9×5), eles são dados próprios e entram no exportar/importar (ou nos Cadastros, se o Orçamento rápido também usar).
