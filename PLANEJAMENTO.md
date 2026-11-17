# print-shop-tools — planejamento geral

## Objetivo
Reunir pequenas ferramentas que agilizem o atendimento da gráfica: analisar arquivos, gerar orçamentos e responder clientes mais rápido.
As regras de negócio vêm de um especialista em gráfica. As ferramentas traduzem essas regras em telas simples.

## Ferramentas
| Ferramenta | Pasta | Tipo | Status |
|---|---|---|---|
| Cadastros da gráfica | `tools/cadastros` | base (edita os dados compartilhados) | **v1 pronta** (2026-11-17) |
| Orçamento de PDF | `tools/orcamento-pdf` | principal | planejada (aguardando especialista, rodada 2) |
| Respostas prontas | `tools/respostas-prontas` | ação rápida | **v1 pronta** (2026-11-17) |
| Orçamento rápido | `tools/orcamento-rapido` | ação rápida | **v1 pronta** (2026-11-17) |
| Pix com valor | `tools/pix` | ação rápida | **v1 pronta** (2026-11-17), falta teste real de R$ 0,01 |
| Aproveitamento de folha | `tools/aproveitamento-folha` | ideia (mostrar ao especialista) | ideia |
| Fila de pedidos | `tools/fila-pedidos` | ideia (mostrar ao especialista) | ideia |

Ordem sugerida: Cadastros → Respostas prontas → Pix → Orçamento rápido → Orçamento de PDF (quando a rodada 2 voltar).
Os Cadastros vêm primeiro porque todas as outras ferramentas leem os dados que ele edita.

## Dados compartilhados
Regra: **um dado vai para o compartilhado quando 2 ou mais ferramentas usam esse dado.** Se só uma usa, ele fica na chave da própria ferramenta (`pst:<nome>:v1`).

| Dado | Quem usa | Onde fica |
|---|---|---|
| Loja: nome, telefone, endereço, horário | respostas prontas, orçamentos, pix | compartilhado |
| Pix: tipo da chave, chave, nome do recebedor (cidade vem do endereço) | pix, respostas prontas, orçamentos | compartilhado |
| Folhas (nome, largura, altura) | orçamento de PDF, orçamento rápido, aproveitamento | compartilhado |
| Papéis e preço por folha | orçamento de PDF, orçamento rápido, aproveitamento | compartilhado |
| Produção: sangria, margem de segurança, DPI, fonte mínima | orçamento de PDF, aproveitamento | compartilhado |
| Prazo padrão (dias úteis) | respostas prontas, orçamentos | compartilhado |
| Textos das respostas prontas | só respostas prontas | `pst:respostas-prontas:v1` |
| Modelo da mensagem de orçamento | orçamento de PDF e rápido | compartilhado |
| Pedidos da fila | só fila de pedidos | `pst:fila-pedidos:v1` |

**Como fica no código:**
- Novo pacote `packages/dados` (`@pst/dados`), com o tipo `Dados`, os valores padrão, a validação (usada ao importar o .json) e as funções `carregarDados()` / `salvarDados()`.
  - Grava numa chave só, `pst:dados:v1`, usando o storage do `@pst/ui`.
  - `@pst/ui` continua sem regra de negócio; `@pst/dados` é o único lugar com dados da gráfica.
- Só a ferramenta **Cadastros** edita esses dados. As outras só leem, com um link "editar nos Cadastros".
- Rascunho do formato:
  ```ts
  type Dados = {
    loja: { nome: string; telefone: string; endereco: { cep, rua, numero, complemento, bairro, cidade, uf }; horario: string; prazoDiasUteis: number }
    pix: { tipo: TipoChavePix; chave: string; recebedor: string } // cidade = endereço.cidade
    folhas: { nome: string; larguraMm: number; alturaMm: number }[]
    papeis: { nome: string; precos: Record<string, number> }[]   // chave = nome da folha; ausente = indisponível
    producao: { sangriaMm: number; margemMm: number; dpi: number; fontePt: number }
    modeloOrcamento: string
  }
  ```

**Cuidados:**
- **Mesmo endereço**: o localStorage só é compartilhado entre páginas do mesmo endereço. Em produção todas ficam no mesmo domínio, então funciona. No desenvolvimento, cada ferramenta roda numa porta, então o hub (5173) faz `server.proxy` de `/<nome>/` para a porta da ferramenta, e tudo é aberto por `localhost:5173`.
- **Mudança de formato**: se o formato de `Dados` mudar, sobe para `pst:dados:v2` com uma função que converte os dados da v1. Nunca apagar os dados do usuário.
- **Acoplamento**: um erro no `@pst/dados` afeta todas as ferramentas que leem esses dados. Por isso ele tem testes (validação e conversão de versão) e o build para no primeiro erro.
- **Servidor**: quando vier, só `carregarDados`/`salvarDados` mudam. Os dados compartilhados são os primeiros a ir para o servidor, porque são os que mais fazem sentido entre vários computadores.

## Arquitetura
- `hub/`: página inicial com os cartões das ferramentas (lista `FERRAMENTAS` em `hub/src/App.tsx`).
- `tools/<nome>/`: cada ferramenta é um mini-projeto Vite independente, com build e planejamento próprios.
- `packages/ui/` (`@pst/ui`): só peças genéricas (componentes, tema, `cn`, storage). Nenhuma regra de negócio.
- Build: `npm run build` gera um site estático em `dist/` (hub na raiz, cada ferramenta em `dist/<nome>/`), com caminhos relativos: funciona na raiz de um domínio ou numa subpasta.
- Publicação: cada push no `main` roda os testes, faz o build e publica no GitHub Pages (`.github/workflows/pages.yml`).
- `packages/dados/` (`@pst/dados`): dados da gráfica que várias ferramentas usam (ver "Dados compartilhados").
- Dados: localStorage. Os compartilhados ficam em `pst:dados:v1`, e os de uma ferramenta só ficam em `pst:<nome>:v1`. Para trocar por servidor no futuro, basta mudar `packages/ui/src/storage.ts`.

## Backup geral (planejado)
Um botão no hub, "Backup de tudo", que exporta num arquivo só todas as chaves `pst:*`: cadastros, respostas, pedidos e tema. A importação valida cada parte com o validador da ferramenta dona. Serve para trocar de computador sem passar ferramenta por ferramenta. Entra quando houver 3 ou mais ferramentas com dados próprios (hoje são 2: Cadastros e Respostas prontas). Os botões de cada ferramenta continuam existindo.

## Multi-empresa (futuro: liberar como serviço)
Não será construído agora. A ideia é que nada feito hoje impeça isso depois.

### Fases
| Fase | Como funciona | Precisa de |
|---|---|---|
| **A. Hoje** | Uma gráfica, dados no navegador. Qualquer gráfica já poderia usar o site: cada computador guarda os próprios dados. | Nada além do site estático |
| **B. Conta da gráfica** | Login. Os dados ficam num servidor, separados por empresa, e vários atendentes e computadores veem os mesmos dados. | Servidor + login |
| **C. Serviço** | Cadastro aberto, planos pagos, marca/logo de cada gráfica, termos de uso e LGPD, suporte | Cobrança, documentos legais, atendimento |

### Caminho técnico sugerido para a fase B
- **Supabase**: banco Postgres + login prontos, com plano gratuito para começar. O site continua estático. Só `storage.ts` (`@pst/ui`) e `carregarDados`/`salvarDados` (`@pst/dados`) passam a falar com o Supabase.
- Toda tabela tem `empresa_id`. As regras de segurança do próprio banco (RLS) garantem que uma gráfica nunca veja os dados de outra, mesmo se houver bug no site.
- Usuários: `usuario → empresa` (um atendente pertence a uma gráfica; o dono convida os atendentes).

### Regras que valem desde já (custam quase nada e evitam retrabalho)
1. **Nada da gráfica no código.** Nome, Pix, preços, papéis, folhas, textos e limites ficam nos Cadastros ou na chave da ferramenta. Os valores padrão são genéricos (preços zerados).
2. **Tudo que é salvo pertence a uma empresa.** `Dados` = os dados de uma gráfica. Na fase B, vira uma linha por `empresa_id`, sem mudar o formato.
3. **IDs com `crypto.randomUUID()`** em registros (pedidos, respostas), nunca 1, 2, 3. Assim os dados locais sobem para o servidor sem colisão.
4. **Datas em ISO** (`2026-11-16T14:30:00Z`).
5. **Regras de preço como dados, não como código.** Cada gráfica cobra de um jeito (por folha, por m², por faixa de quantidade). Uma regra nova entra como um tipo novo na tabela, e não como um `if` para uma gráfica específica.
6. **Nome da gráfica na tela vem dos Cadastros** (ex.: o título do hub usa `loja.nome`), e não de texto fixo.

### Pontos de atenção para a fase C
- **LGPD**: a Fila de pedidos guarda nome e telefone de clientes. Como serviço, você passa a tratar dados pessoais de terceiros: termos de uso, política de privacidade, opção de apagar os dados e backup.
- **Chatbot WhatsApp multi-empresa**: cada gráfica precisaria conectar o próprio número à Meta. Isso exige virar "provedor de tecnologia" na Meta (cadastro integrado). É a parte mais complexa e fica por último.
- **Regras do especialista**: elas valem para a gráfica dele. Para outras gráficas, tudo precisa ser configurável (já é a regra 1).

## Comandos
- `npm install`: instala tudo.
- `npm run dev`: sobe o hub e todas as ferramentas. Abra tudo por **http://localhost:5173** (o hub repassa `/<nome>/` para a porta de cada ferramenta, então todas leem os mesmos dados). Abrir a porta da ferramenta direto funciona, mas com dados separados.
- `npm test`: roda os testes de todos os projetos.
- `npm run build`: gera `dist/` e para no primeiro erro.

## Convenção de arquivos
- Poucas pastas e poucos arquivos. Arquivo novo só quando o atual passar de ~400 linhas ou quando o papel for claramente outro.
- Meta: arquivos de ~100 a 300 linhas.
- Nada de pastas `utils/`, `hooks/`, `types/` com um arquivo só. Tipos ficam junto do código.
- Cores sempre pelos nomes do tema (`bg-fundo`, `bg-superficie`, `text-texto-2`, `border-borda`, `text-tinta`…), nunca `slate-*` ou `white`. Assim o modo escuro funciona sem esforço. Os valores ficam em `packages/ui/theme.css`.
- **Feedback**: salvar, apagar ou importar mostram `toast('…')` do `@pst/ui`, que some sozinho (no salvamento automático, só depois que a digitação para). Copiar troca o texto do botão (`BotaoCopiar`). Carregamento aparece no próprio campo. Erros e avisos ficam junto do campo. Não há linha fixa de "deu certo" na página.
- **Exportar/importar**: toda ferramenta que guarda dados criados ou editados pelo usuário tem os botões Exportar e Importar no topo. O arquivo é um .json com o mesmo formato salvo; ao importar, ele é validado e substitui os dados atuais depois de uma confirmação. Ferramenta que só calcula, sem dados próprios, não precisa. Ao planejar uma ferramenta, anotar nas Notas técnicas se ela guarda dados e, portanto, se precisa de exportar/importar.

## Nova ferramenta
1. Copiar `tools/cadastros/` para `tools/<nome>/` (apagar o `src/` que não servir). O `App.tsx` usa `<Topo />` (voltar + tema) e termina com `montar(<App />)`, ambos do `@pst/ui`. No `package.json`, trocar `name`. No `vite.config.ts`, trocar `base: '/<nome>/'`, `outDir: '../../dist/<nome>'` e a porta.
2. Adicionar a porta em `PORTAS` (`hub/vite.config.ts`) e um item em `FERRAMENTAS` (`hub/src/App.tsx`). O `npm run dev` encontra a ferramenta sozinho.
3. Criar o `PLANEJAMENTO.md` da ferramenta com o modelo abaixo.

## Modelo de PLANEJAMENTO.md
```
# <Nome da ferramenta>
## Objetivo        — que problema do atendimento resolve (2 a 3 frases)
## Status          — ideia / planejada / em desenvolvimento / em uso
## Features (v1)   — lista com [ ]
## Futuras features — o que ficou para depois e por quê
## Perguntas para o especialista — pergunta, resposta, data
## Decisões        — data, decisão, motivo
## Notas técnicas  — arquivos, bibliotecas, atalhos conhecidos
```
