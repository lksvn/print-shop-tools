# Ordem de serviço / recibo

## Objetivo

Gerar a folha do pedido (ordem de serviço para a produção ou recibo para o cliente) a partir de um pedido da Fila, sem digitar de novo. Imprime ou vira PDF para mandar no WhatsApp.

## Status

v1 pronta (2026-11-25).

## Features (v1)

- [x] Escolher um pedido da Fila, ou abrir pelo botão "OS" no cartão do pedido (`?pedido=<id>`).
- [x] Folha com dados da loja, cliente, descrição, valor, data do pedido e número curto (6 primeiros caracteres do id).
- [x] **OS**: prazo, etapa, situação do pagamento, observações para a produção e linhas de "conferido por" e "retirado por".
- [x] **Recibo**: tabela dos pagamentos, total pago, frase "Recebemos de… a quantia de…" com o que falta, data e assinatura.
- [x] Imprimir ou salvar em PDF pelo navegador (sai só a folha, sempre clara).

## Futuras features

- Via do cliente e via da gráfica na mesma folha A4.
- CPF/CNPJ do cliente no recibo (pergunta 2).

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Vocês usam ordem de serviço hoje? O que ela precisa ter? | |
| 2 | O cliente pede recibo? Precisa de CPF/CNPJ? | |
| 3 | Cobram sinal? Quanto, normalmente? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | Pagamentos, prazo e observações ficam no pedido da Fila | A OS e o Fechamento do dia usam os mesmos dados; lançar uma vez só |
| 2026-11-25 | Recibo só aparece se houver pagamento lançado | Recibo de R$ 0,00 não serve e confunde |
| 2026-11-25 | Folha em HTML + impressão do navegador, sem biblioteca de PDF | "Salvar como PDF" já existe em todo navegador |

## Notas técnicas

- `src/os.ts`: número curto, data e frase do recibo, testados em `os.test.ts`. `src/App.tsx`: escolha do pedido e a folha.
- Lê os pedidos com `carregarFila()` do `@pst/dados` (só leitura). Se a fila salva estiver estragada, manda para a Fila importar o backup.
- Sem dados próprios: não precisa de exportar/importar.
