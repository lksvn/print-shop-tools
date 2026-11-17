# Pix com valor

## Objetivo

Gerar na hora o Pix "copia e cola" e o QR code com o valor exato do pedido. O cliente paga sem digitar valor nem chave, e o atendente confere o pagamento mais fácil.

## Status

v1 pronta (2026-11-17). Falta conferir um Pix real de R$ 0,01 no app do banco antes de usar com clientes.

## Features (v1)

- [x] Campo de valor (ou valor vindo de outra ferramenta pelo link `?valor=`).
- [x] Campo opcional de identificação do pedido (ex.: "PED123"), que aparece no extrato.
- [x] Gera o código **copia e cola**, com botão Copiar, e o **QR code** na tela, para o cliente no balcão.
- [x] Botão **Enviar pelo WhatsApp** com o código e uma frase curta.
- [x] Usa a chave e o nome dos Cadastros, e a cidade do endereço da loja. Se faltar algum, avisa e mostra o link para os Cadastros.

## Futuras features

- Confirmação automática do pagamento: exige a API do banco e um servidor.
- Histórico dos Pix gerados no dia.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Hoje vocês mandam só a chave Pix ou já mandam QR code/copia e cola? | |
| 2 | Pedem sinal (ex.: 50% antes de imprimir)? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-17 | Sem campo de cidade no Pix: usa a cidade do endereço da loja | Campo obrigatório no código, mas o banco não confere; dois campos iguais confundiriam |
| 2026-11-17 | Tipo da chave Pix nos Cadastros (CPF, CNPJ, telefone, e-mail, aleatória), com máscara por tipo | CPF e celular têm 11 dígitos; o Pix exige formatos diferentes (telefone vai como +55…) |
| 2026-11-16 | Pix "estático" gerado no navegador, sem banco nem servidor | Não precisa de conta de API nem custo; o dinheiro cai direto na chave da gráfica |

## Notas técnicas

- `src/brcode.ts`: gerador + validação da chave. O teste reproduz o exemplo do manual do Banco Central (CRC `1D3D`).
- O código segue o padrão BR Code do Banco Central (campos EMV + CRC16 no final). São cerca de 60 linhas, com teste comparando com um código de exemplo válido.
- QR code: biblioteca `qrcode` (pequena, sem dependências). Escrever um gerador de QR à mão não compensa.
- O valor é validado: maior que zero e com no máximo 2 casas decimais.
- Antes de usar com clientes, conferir um Pix de R$ 0,01 no app do banco.
- Exportar/importar: não precisa na v1 (sem dados próprios; chave, nome e cidade vêm dos Cadastros). Entra junto com o histórico de Pix gerados, se ele for feito.
