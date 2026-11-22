# Orçamento de PDF

## Objetivo

O atendente solta o PDF do cliente e, em segundos, vê:
- em que folha cada página se enquadra;
- os problemas que costumam dar errado na impressão;
- o valor pela tabela de preços.

Sai com uma mensagem de orçamento pronta para copiar ou mandar no WhatsApp.

## Status

Protótipo pronto (2026-11-22). Algumas regras são provisórias até a rodada 2 do especialista (girar a arte, sangria, margem) e estão marcadas nas Notas técnicas.

## Features (v1)

- [x] **Enquadramento na folha**: a página entra na menor folha da tabela em que cabe (medida linear). Exemplo: 20×20 cm → A4; 23×23 cm → A3. As folhas são cadastradas na tabela (A6 a A3 vêm de exemplo, e dá para incluir outras). Maior que a maior folha cadastrada → "Fora da tabela: orçar à parte", sem preço. Provisório: a arte pode girar (23×5 cm → A4), até a rodada 2, pergunta 1.
- [x] **Papel**: o atendente escolhe o papel. A lista de papéis é editável: os que o especialista citou são exemplos e já vêm cadastrados. O preço vem da tabela papel × folha. Um papel pode existir só em algumas folhas (ex.: adesivo com recorte só em A3).
- [x] **Cálculo**: preço (papel, folha) × páginas × cópias.
- [x] **Avisos de produção** por página:
  - imagem abaixo de 300 DPI, no tamanho original: aviso "conferir" (a pessoa decide);
  - texto menor que 10 pt (o tamanho 10 do Word);
  - conteúdo dentro da margem de segurança (perto demais da borda);
  - falta de sangria;
  - fonte não incorporada no PDF.
- [ ] **Cor** (ficou para depois): só informativo (CMYK / RGB / cinza), sem alerta. As máquinas digitais convertem para CMYK sozinhas.
- [x] **Mensagem** de orçamento com o modelo dos Cadastros, botão Copiar, Enviar pelo WhatsApp (wa.me) e Gerar Pix do total (abre o Pix numa modal, sem perder o PDF aberto).
- [x] **Tabela de preços**: lida dos Cadastros (`@pst/dados`). Aqui só aparece o link "editar nos Cadastros".

## Futuras features

- Acabamentos além do recorte (laminação, dobra…), se o especialista pedir.
- Mídias que não são folha (banner, lona…), se precisarem de outra regra de preço (ex.: por m²).
- Aceitar Word/PPT: por enquanto, não. O especialista prefere PDF porque, em outros formatos, a fonte pode ser trocada sem ninguém perceber.
- Chatbot no WhatsApp (fase 2): o cliente manda o PDF e recebe o orçamento automático. Exige servidor, a API oficial da Meta (Cloud API) e um número dedicado. A leitura do PDF (`lerPdf.ts` + `analise.ts`) não usa o navegador, então o servidor reaproveita esses arquivos.
  - Responder dentro de 24h depois da mensagem do cliente não tem custo. Mensagens iniciadas pela gráfica são pagas.
  - Não usar bibliotecas não oficiais (whatsapp-web.js, Baileys): o número pode ser banido.
- Servidor e tabela compartilhada entre vários computadores.

## Perguntas para o especialista

### Rodada 1 (enviada 2026-11-14, respondida 2026-11-16)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Medida: página inteira ou só o tamanho final? | Medida linear. Se cabe na A4, é A4 (20×20 cm → A4). Se passa, é A3 (23×23 cm e 23×5 cm → A3). |
| 2 | Tamanho fora do padrão? | Enquadra em folhas até A3. Acima disso, já é outra mídia. |
| 3 | RGB impede? Pantone? | As máquinas digitais convertem para CMYK sozinhas. Pantone: sem resposta. |
| 4 | 150/300 DPI servem para tudo? | Tamanho original e 300 DPI, mas uma pessoa consegue avaliar. |
| 5 | Papéis e acabamentos? | Couchê 240g, sulfite color 90g, sulfite 75g P/B, couchê adesivo 150g, couchê adesivo A3 com recorte. |
| 6 | O que mais conferir? | Troca de fonte é difícil de perceber, por isso pedir PDF (não Word/PPT). Sangria e margem de segurança são sempre problema. Fonte mínima 10 (medida do Word). |
| 7 | Exemplo de mensagem de orçamento | Pendente: ele vai mandar depois. Até lá, a v1 usa um modelo editável. |

### Rodada 2 (a enviar)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Uma arte de 23×5 cm cabe **deitada** na A4 (que tem 29,7 cm de comprimento). Mesmo assim é A3, ou pode girar na folha? | |
| 2 | Sangria: quantos mm? Um arquivo A4 com sangria (21,6×30,3 cm) continua sendo A4? | |
| 3 | Margem de segurança: a quantos mm da borda o texto pode chegar? | |
| 4 | Preços: o valor de cada papel em cada folha. Muda com a quantidade? Frente e verso muda? | |
| 5 | Sulfite 75g P/B: se o arquivo for colorido e o cliente escolher esse papel, sai em preto e branco? A ferramenta deve avisar? | |
| 6 | Pantone (cor especial) já apareceu? Como vocês tratam? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-14 | React + Vite + Tailwind + componentes no estilo shadcn, dentro do projeto print-shop-tools | Facilita a criação de novas ferramentas |
| 2026-11-14 | Dados só no navegador (localStorage), com exportar/importar | Protótipo, um computador só |
| 2026-11-14 | WhatsApp por link wa.me na v1, chatbot só depois | O chatbot exige servidor e conta Meta |
| 2026-11-16 | Folhas e papéis em listas editáveis; os tamanhos e papéis citados pelo especialista são exemplos, não limites. Página maior que a maior folha cadastrada: "orçar à parte" | Respostas 2 e 5 (exemplos) |
| 2026-11-16 | Preço = tabela papel × folha × páginas × cópias (substitui "faixa × páginas × cópias") | Resposta 5 do especialista |
| 2026-11-16 | DPI: um limite só (300, editável), como aviso "conferir" e não como bloqueio | Resposta 4: uma pessoa avalia |
| 2026-11-16 | Cor só informativa, sem alerta | Resposta 3: as máquinas convertem para CMYK |
| 2026-11-16 | Sangria, margem, fonte < 10 pt e fonte não incorporada entram na v1 | Resposta 6: "sempre problema" |

## Notas técnicas

- `src/analise.ts`: regras sem pdf.js (enquadramento, avisos, itens do orçamento). Testes em `analise.test.ts`. Preço, total e texto dos itens vêm do `@pst/dados` (`calcularOrcamento`, `textoDosItens`), os mesmos do Orçamento rápido.
- `src/lerPdf.ts`: lê o PDF no navegador com pdfjs-dist (o arquivo não sai do computador). Mede por página:
  - tamanho (CropBox, já com a rotação da página);
  - pior DPI das imagens: pixels ÷ tamanho desenhado, acompanhando a matriz de transformação (`save`/`restore`/`transform` e Form XObjects);
  - menor texto (pt) e texto mais perto da borda, por `getTextContent`;
  - fontes não incorporadas (`missingFile` do pdf.js, com `fontExtraProperties` para mostrar o nome real);
  - arte até a borda: desenha a página pequena num canvas e procura algo não branco na faixa de 1 mm da borda.
- Enquadramento: a página pode ter a sangria em volta (A4 + 3 mm de cada lado continua A4, marcado "com sangria"). Folga de 1 mm para arredondamento dos programas de design.
- Margem de segurança: medida pela posição dos textos (não pelos desenhos). Com sangria no arquivo, conta a partir do corte.
- `shortcut:` a arte pode girar na folha (23×5 cm → A4). Trocar em `enquadrar()` se a rodada 2 disser que não.
- `shortcut:` imagens agrupadas pelo pdf.js (`paintImageXObjectRepeat`, grupos inline) não entram no DPI. São raras em arquivos de cliente.
- `shortcut:` texto girado pode medir a distância até a borda errada.
- O desenho da página (arte até a borda) só funciona no navegador. Para o chatbot (fase 2) vai precisar de outra forma; o resto não depende do navegador.
- Cor (CMYK/RGB) ficou fora do protótipo: é só informativa e exigiria uma segunda biblioteca (pdf-lib).
- O worker do pdf.js pesa ~1,2 MB, mas só é baixado quando o atendente abre esta ferramenta.
- Exportar/importar: não precisa (tabela e limites vêm dos Cadastros; o PDF não é guardado).
