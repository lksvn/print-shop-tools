# Aproveitamento de folha

## Objetivo

Descobrir quantas artes pequenas cabem numa folha (cartões, etiquetas, adesivos) e quanto custa cada unidade. Hoje essa conta é feita de cabeça ou no programa de design. A ferramenta faz na hora e mostra um desenho da folha montada.

## Status

v1 pronta (2026-11-24). Espaço entre artes (2 mm) e margem da máquina (5 mm) são palpites até as perguntas 2 e 3; os dois ficam nos Cadastros → Produção.

## Como funcionaria

1. O atendente informa o tamanho da arte (ex.: 9×5 cm) e a quantidade (ex.: 100).
2. Escolhe a folha e o papel (ex.: A3, couchê 240g).
3. A ferramenta mostra:
   - quantas cabem por folha, testando a arte em pé e deitada e ficando com a melhor;
   - quantas folhas são necessárias;
   - o preço total e o preço por unidade;
   - um desenho simples da folha com as artes posicionadas.

## Features (v1, se aprovada)

- [x] Cálculo de quantas cabem, considerando a sangria, o espaço entre as artes e a margem da máquina.
- [x] Desenho da folha (SVG simples, sem animação).
- [x] Folhas, papéis, preços e sangria vindos dos Cadastros.
- [x] Botão "levar para o Orçamento rápido" com a quantidade de folhas (abre o orçamento já preenchido).
- [x] Compara todas as folhas cadastradas e marca a mais barata; clicar numa folha mostra o desenho dela.

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
| 2026-11-24 | Mostrar todas as folhas lado a lado, com a mais barata marcada, em vez de escolher uma folha antes | O atendente vê na hora qual folha compensa |
| 2026-11-24 | Espaço entre artes e margem da máquina nos Cadastros (Produção), com padrão 2 mm e 5 mm | São medidas da gráfica, não de cada orçamento; ficam no backup dos Cadastros |

## Notas técnicas

- `src/montagem.ts`: cálculo puro. Cada arte ocupa arte + sangria em volta; cabem `floor((área útil + espaço) / (célula + espaço))` em cada sentido; testa em pé e deitada. Testes com casos conhecidos (cartão 9×5 numa A3: 24 sem sangria; 16 com sangria 3, espaço 2 e margem 5).
- `src/App.tsx`: tela e desenho em SVG (margem da máquina tracejada, sangria clara, arte por cima).
- O Orçamento rápido aceita `?papel=…&folha=…&quantidade=…` para abrir já preenchido.
- Exportar/importar: não precisa na v1. Se ganhar "produtos prontos" (ex.: cartão 9×5), eles são dados próprios e entram no exportar/importar (ou nos Cadastros, se o Orçamento rápido também usar).
