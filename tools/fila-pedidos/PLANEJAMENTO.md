# Fila de pedidos

## Objetivo

Ver de uma vez em que pé está cada pedido: quem ainda não mandou o arquivo, quem não respondeu ao orçamento, o que está pronto para entregar. Assim nenhum cliente fica esquecido no meio das conversas do WhatsApp.

## Status

v1 pronta (2026-11-24). Funciona num computador só; a pergunta 3 decide se precisa de servidor.

## Como funcionaria

Um quadro com colunas. Cada pedido é um cartão que anda da esquerda para a direita:

**Aguardando arquivo → Orçamento enviado → Aprovado/pago → Em produção → Pronto → Entregue**

Cada cartão tem:
- nome do cliente e telefone (abre o WhatsApp com um clique);
- descrição curta e valor;
- há quantos dias está naquela coluna.

Cartão parado há muito tempo fica destacado (ex.: orçamento enviado há 3 dias sem resposta → hora de cobrar o cliente).

## Features (v1, se aprovada)

- [x] Criar pedido em poucos campos (nome, telefone, descrição, valor).
- [x] Mover o cartão entre colunas com botões, que funcionam no teclado (sem obrigar a arrastar).
- [x] Destaque de "parado há X dias" (o X é configurável).
- [x] Busca por nome ou telefone.
- [x] Mensagem curta por etapa no botão WhatsApp (ex.: "seu pedido está pronto para retirar"). Ainda fixa no código; pode passar a usar as Respostas prontas.
- [x] Exportar/importar (backup).

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
| 2026-11-24 | Novo pedido e edição numa modal; mover de etapa com botões ← → | Funciona no teclado e no celular, sem arrastar |
| 2026-11-24 | Dado salvo estragado não é carregado nem sobrescrito; a tela pede para importar um backup | É a ferramenta em que perder dados mais dói |

## Notas técnicas

- Pedidos em `pst:fila-pedidos:v1`. É a primeira ferramenta em que perder dados dói: backup por exportação e aviso se o último backup tiver mais de 7 dias.
- Telefone e nome do cliente são dados pessoais: ficam só no computador da gráfica. O telefone só sai ao abrir a conversa no WhatsApp (link wa.me), que é o próprio canal com o cliente.
- `src/pedidos.ts`: etapas, validação do que é salvo/importado, dias parado, mover e aviso de backup. Testes em `pedidos.test.ts`.
- `src/App.tsx`: quadro (colunas no computador, etapas empilhadas no celular), busca, modal do pedido, exportar/importar.
