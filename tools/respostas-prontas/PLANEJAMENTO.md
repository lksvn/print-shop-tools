# Respostas prontas

## Objetivo

As mesmas perguntas chegam todo dia no WhatsApp: como mandar o arquivo, formas de pagamento, prazo, endereço. Esta ferramenta guarda essas respostas já preenchidas com os dados da loja. O atendente clica, confere e envia.

## Status

v1 pronta (2026-11-17).

## Features (v1)

- [x] Lista de respostas com título e texto, com busca pelo título.
- [x] Campos automáticos vindos dos Cadastros: `{loja}`, `{telefone}`, `{endereco}`, `{horario}`, `{pix}`, `{prazo}`, `{prazoDias}`, `{sangria}`, `{margem}`, `{dpi}`. No editor, um clique insere o campo onde está o cursor. O prazo vira uma data: "fica pronto até quinta, 19/11", contando só dias úteis.
- [x] Campos digitados na hora: `{cliente}`, `{valor}`. A ferramenta pede só os que aparecem no texto.
- [x] Botões **Copiar** e **Enviar pelo WhatsApp** (wa.me, com telefone opcional).
- [x] Criar, editar e apagar respostas (confirmando antes de apagar).
- [x] **Exportar/importar** as respostas (.json). Importar valida o arquivo e substitui as respostas depois de uma confirmação.
- [x] Já vem com 5 respostas de exemplo:
  - como enviar o arquivo (PDF, 300 DPI, sangria);
  - formas de pagamento e Pix;
  - prazo;
  - endereço e horário;
  - "arquivo recebido, já te passo o orçamento".

## Futuras features

- Atalho de teclado para abrir a busca.
- Contar quais respostas são mais usadas, para saber o que vale automatizar no chatbot (fase 2).

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Quais são as 3 perguntas que mais chegam no WhatsApp? | |
| 2 | Tem algum texto que vocês já mandam sempre igual? (mande o texto, se puder) | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-16 | Ferramenta separada das respostas rápidas do app WhatsApp Business | O app não preenche dados nem calcula datas; as duas coisas podem ser usadas juntas |

## Notas técnicas

- Textos das respostas em `pst:respostas-prontas:v1`. Os dados da loja vêm do `@pst/dados`.
- A troca de campos e o cálculo de dias úteis ficam em funções puras, com teste (fim de semana e virada de mês). Feriados ficam de fora na v1.
  - `shortcut:` não considera feriados. Adicionar uma lista de feriados nos Cadastros se o prazo errar em véspera de feriado.
