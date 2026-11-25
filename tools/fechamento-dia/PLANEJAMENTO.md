# Fechamento do dia

## Objetivo

No fim do dia, somar o que entrou (sinais e pagamentos) e o que foi entregue, separado por forma de pagamento (Pix, dinheiro, cartão). Ajuda a conferir o caixa sem planilha.

## Status

v1 pronta (2026-11-25). Formas de pagamento provisórias até a pergunta 2.

## Features (v1)

- [x] Escolher o dia (padrão: hoje, no fuso do computador).
- [x] Total recebido e total por forma de pagamento.
- [x] Lista dos pagamentos do dia, com hora, cliente e forma.
- [x] Pedidos marcados como entregues no dia.
- [x] Pedidos entregues com valor a receber (de qualquer dia).
- [x] Imprimir o resumo.

## Futuras features

- Resumo da semana e do mês.
- Pagamento avulso, fora de pedido (ex.: uma cópia no balcão), se a pergunta 3 pedir.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Como vocês fecham o caixa hoje? | |
| 2 | Quais formas de pagamento aceitam? | |
| 3 | Serviço pequeno de balcão (uma cópia) também precisaria entrar aqui? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | Pagamento é lançado no pedido da Fila (Editar → Pagamentos), com data e forma | Um lugar só; a OS e o Fechamento leem de lá |
| 2026-11-25 | "A cobrar" mostra entregues com saldo de qualquer dia | Dinheiro que já saiu pela porta não pode sumir da vista |

## Notas técnicas

- `src/fechamento.ts`: soma do dia e listas, testada em `fechamento.test.ts` (incluindo pagamento às 22h, que não pode virar o dia).
- Lê os pedidos com `carregarFila()` do `@pst/dados` (só leitura). "Entregue no dia" usa a data em que o pedido entrou na etapa Entregue.
- Sem dados próprios: não precisa de exportar/importar.
