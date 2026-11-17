# Cadastros da gráfica

## Objetivo

Um lugar só para cadastrar o que todas as ferramentas usam: dados da loja, Pix, folhas, papéis, preços e regras de produção. Mudou o preço do couchê? Muda aqui, e todas as ferramentas já usam o valor novo.

## Status

v1 pronta (2026-11-17). As outras ferramentas leem os dados que ela edita.

## Features (v1)

- [x] **Loja**: nome, telefone (com máscara), horário, prazo padrão (dias úteis) e endereço em campos separados, com busca por CEP (ViaCEP, gratuita e sem chave). Estado e cidade são selects com busca (lista do IBGE, sem internet). A cidade encontrada também preenche a cidade do Pix, se estiver vazia.
- [x] **Pix**: tipo da chave (com máscara por tipo), chave e nome do recebedor. A cidade, obrigatória no código Pix, vem do endereço da loja (sem campo separado).
- [x] **Folhas**: nome, largura e altura em mm. Já vem com A6, A5, A4 e A3, e dá para incluir outras.
- [x] **Papéis e preços**: uma tabela com os papéis nas linhas e as folhas nas colunas, com o preço em cada célula. Célula vazia = papel indisponível naquela folha. Já vem com os 5 papéis citados pelo especialista, com preço zerado.
- [x] **Produção**: sangria (mm), margem de segurança (mm), DPI mínimo (300), fonte mínima (10 pt).
- [x] **Modelo da mensagem de orçamento**, com campos como `{cliente}`, `{itens}`, `{total}`, `{prazo}`.
- [x] **Exportar/importar** tudo num arquivo .json (backup e cópia para outro computador). O arquivo é validado antes de entrar.

## Futuras features

- Quando vier o servidor: os mesmos dados em vários computadores, sem precisar exportar/importar.
- Histórico de mudança de preço (quem mudou e quando).

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Os preços mudam com a quantidade (ex.: de 1 a 99 folhas um valor, de 100 em diante outro)? | |
| 2 | Frente e verso muda o preço? É o dobro ou tem valor próprio? | |

As duas perguntas também estão na rodada 2 do Orçamento de PDF (pergunta 4). A resposta pode mudar o formato da tabela de preços.

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-16 | Só esta ferramenta edita os dados compartilhados; as outras só leem | Evita duas telas diferentes mudando o mesmo preço |

## Notas técnicas

- Lê e grava pelo `@pst/dados` (`carregarDados`, `salvarDados`, `validarDados`).
- Um arquivo de tela por seção só se passar de ~300 linhas. Começa com `App.tsx` + `Precos.tsx` (a tabela papel × folha é a parte maior).
