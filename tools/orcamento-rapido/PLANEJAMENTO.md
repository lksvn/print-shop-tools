# Orçamento rápido

## Objetivo

Para quando o cliente pergunta "quanto fica?" antes de mandar o arquivo. O atendente escolhe o papel, a folha e a quantidade, vê o valor e já sai com a mensagem pronta. Usa a mesma tabela de preços do Orçamento de PDF, então o valor é o mesmo nas duas ferramentas.

## Status

v1 pronta (2026-11-17).

## Features (v1)

- [x] Escolher o papel. Ao escolher, só aparecem as folhas em que esse papel existe.
- [x] Escolher a folha e a quantidade (de folhas ou de cópias).
- [x] Mostrar o preço unitário e o total.
- [x] Vários itens no mesmo orçamento (ex.: 50 A4 em couchê + 10 A3 adesivo).
- [x] Mensagem com o modelo de orçamento dos Cadastros, mais os botões **Copiar** e **Enviar pelo WhatsApp**.
- [x] Botão "gerar Pix com este valor", que abre a ferramenta Pix já com o total.

## Futuras features

- Produtos prontos (cartão de visita, etiqueta), que dependem do Aproveitamento de folha. Exemplo: 100 cartões → quantas A3 → preço.
- Desconto por quantidade, se o especialista confirmar que existe.
- Frente e verso, se mudar o preço.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | O cliente costuma pedir em folhas ("10 A4") ou em produtos ("100 cartões")? | |
| 2 | Tem valor mínimo de pedido? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-16 | Mesma tabela de preços do Orçamento de PDF (`@pst/dados`) | O mesmo pedido não pode ter dois preços diferentes |

## Notas técnicas

- O cálculo (preço × quantidade, soma dos itens) é o mesmo do Orçamento de PDF. Fica no `@pst/dados` como `precoDe(dados, papel, folha)` + `calcularOrcamento(dados, itens)`, com teste (arredonda em centavos), para as duas ferramentas não terem cópias da mesma conta.
- Para abrir o Pix: link `../pix/?valor=123.45`. O valor vai no endereço porque não é dado pessoal.
- Exportar/importar: não precisa na v1 (preços vêm dos Cadastros). Se passar a guardar orçamentos ou produtos prontos, ganha exportar/importar.
