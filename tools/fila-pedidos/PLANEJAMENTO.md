# Fila de pedidos

## Objetivo

Ver de uma vez em que pé está cada pedido: quem ainda não mandou o arquivo, quem não respondeu ao orçamento, o que está pronto para entregar. Assim nenhum cliente fica esquecido no meio das conversas do WhatsApp.

## Status

Ideia: mostrar ao especialista antes de planejar a fundo (cerca de 2 dias de trabalho).

## Como funcionaria

Um quadro com colunas. Cada pedido é um cartão que anda da esquerda para a direita:

**Aguardando arquivo → Orçamento enviado → Aprovado/pago → Em produção → Pronto → Entregue**

Cada cartão tem:
- nome do cliente e telefone (abre o WhatsApp com um clique);
- descrição curta e valor;
- há quantos dias está naquela coluna.

Cartão parado há muito tempo fica destacado (ex.: orçamento enviado há 3 dias sem resposta → hora de cobrar o cliente).

## Features (v1, se aprovada)

- [ ] Criar pedido em poucos campos (nome, telefone, descrição, valor).
- [ ] Mover o cartão entre colunas com botões, que funcionam no teclado (sem obrigar a arrastar).
- [ ] Destaque de "parado há X dias" (o X é configurável).
- [ ] Busca por nome ou telefone.
- [ ] Mensagens prontas por coluna (ex.: "seu pedido está pronto"), usando as Respostas prontas.
- [ ] Exportar/importar (backup).

## Futuras features

- Criar o pedido direto do Orçamento de PDF ou do Orçamento rápido.
- Vários computadores vendo a mesma fila: exige servidor. Sem isso, a fila só existe no computador onde foi criada.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Hoje vocês controlam os pedidos de algum jeito (caderno, planilha, etiquetas do WhatsApp)? | |
| 2 | As etapas acima são as certas? Falta ou sobra alguma? | |
| 3 | Mais de uma pessoa atende ao mesmo tempo, em computadores diferentes? | |
| 4 | Precisa guardar histórico (ex.: o que o cliente pediu da última vez)? | |

A resposta 3 decide se a fila precisa de servidor desde o começo.

## Decisões

| Data | Decisão | Motivo |
|---|---|---|

## Notas técnicas

- Pedidos em `pst:fila-pedidos:v1`. É a primeira ferramenta em que perder dados dói: backup por exportação e aviso se o último backup tiver mais de 7 dias.
- Telefone e nome do cliente são dados pessoais: ficam só no computador da gráfica e nunca vão em link ou endereço.
