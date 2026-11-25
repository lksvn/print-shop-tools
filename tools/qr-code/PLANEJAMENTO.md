# Gerador de QR code

## Objetivo

O cliente pede um QR code no cartão ou no cardápio (Instagram, site, cardápio digital, Wi-Fi, WhatsApp). A ferramenta gera o QR pronto para colocar na arte, em boa qualidade para impressão.

## Status

v1 pronta (2026-11-25).

## Features (v1)

- [x] Tipos: link (ganha https:// sozinho), WhatsApp (número + mensagem), Wi-Fi (rede, senha, tipo) e texto livre.
- [x] Baixar em SVG (vetor, imprime em qualquer tamanho) e PNG (1024 px).
- [x] Tamanho mínimo recomendado para impressão, maior quanto mais longo o conteúdo.
- [x] Mostra o texto exato que o celular vai ler.

## Futuras features

- Cor do QR e logo no meio (exige nível de correção alto e teste de leitura).
- Mandar o QR direto para a Montagem ou a Prova.

## Perguntas para o especialista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Quais QR os clientes mais pedem? | |
| 2 | Vocês colocam o QR na arte em qual programa (Corel, Illustrator, Canva)? Ele aceita SVG? | |
| 3 | Qual o menor QR que vocês já imprimiram e funcionou? | |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-25 | Correção de erro nível M e margem de 4 módulos | Padrão do formato; aguenta sujeira e corte sem aumentar demais o QR |

## Notas técnicas

- `src/conteudo.ts`: texto de cada tipo (Wi-Fi com escape de `\ ; , : "`) e tamanho mínimo. Testes em `conteudo.test.ts`.
- shortcut: tamanho mínimo = módulo de 0,5 mm, nunca abaixo de 2 cm; trocar pela resposta 3.
- Biblioteca `qrcode` (a mesma do Pix). A senha do Wi-Fi não é salva.
- Só gera arquivo, sem dados próprios: não precisa de exportar/importar.
