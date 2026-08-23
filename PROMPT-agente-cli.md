# Prompt — Precificador de Receitas (app de precificação para confeitaria)

Use este prompt como briefing inicial para um agente de CLI (Claude Code, etc). Ele descreve o produto, o modelo de dados, a stack e a identidade visual da marca ("Doces & Nós").

---

## 1. O que é o produto

Um sistema web, de uso interno, para **uma confeitaria específica** (não é multi-tenant, não é SaaS para várias confeitarias). Existe login por e-mail/senha apenas como trava de acesso — pode ser uma pessoa só usando ou a dona + alguém da equipe, mas os dados (ingredientes, receitas) são únicos e compartilhados entre quem tiver login, não segregados por conta.

A ferramenta serve para cadastrar os ingredientes que a confeitaria compra, montar as receitas com base neles, e calcular automaticamente quanto cobrar por cada uma, com base no custo real de ingredientes, mão de obra, custos fixos e a margem de lucro desejada.

Não é uma landing page de vendas. É a ferramenta em si, de uso privado, com dados persistidos no banco (sem isolamento por usuário).

## 2. Conceito central de precificação (regra de negócio, não é detalhe de UI)

O preço de venda **não** é custo + markup simples. A fórmula é:

```
preco_venda = custo_por_unidade / (1 - margem% - taxa%)
```

- `margem%` = margem de lucro desejada sobre o preço de venda (não sobre o custo).
- `taxa%` = taxa de cartão/marketplace, também descontada em cima do preço final.
- Se `margem% + taxa% >= 100%`, não existe preço válido — a API/UI deve retornar um erro de validação claro, nunca dividir por zero ou número negativo.
- `lucro_por_unidade = preco_venda - custo_por_unidade - (preco_venda * taxa%)`

Essa fórmula deve viver em uma função pura e testável (ex: `lib/pricing.ts`), coberta por testes Vitest, porque é o coração do produto.

## 3. Modelo de dados (entidades principais)

- **User** — conta de acesso (e-mail/senha, Better-Auth). Serve só para autenticação/login, **não** é dono de dados — todo mundo que loga vê e edita os mesmos ingredientes e receitas, não existe cópia por conta.
- **ConfiguracaoConfeitaria** (perfil do negócio) — uma única linha/registro no banco (não é por usuário), com nome da confeitaria e outros dados gerais que fizerem sentido (telefone, etc.) — manter simples por enquanto.
- **Ingrediente** (biblioteca de ingredientes) — global ao sistema (não pertence a um usuário). Campos: nome, preço pago, quantidade comprada, unidade (g/ml/un/kg...). Custo unitário é **derivado** (`preco / quantidade`), nunca armazenado como campo redundante que possa dessincronizar.
- **Receita** — global ao sistema. Campos: nome, rendimento (quantas unidades a receita rende), horas de mão de obra, valor da hora, custos fixos (embalagem, gás/energia, outros — podem ser um JSON ou campos separados, decidir na implementação), taxa de cartão/marketplace (%), margem de lucro desejada (%), favorita (boolean).
- **ReceitaIngrediente** (tabela de junção) — referencia uma Receita e um Ingrediente da biblioteca, com a quantidade usada nessa receita. **Nunca duplicar dados do ingrediente aqui** — sempre puxar preço/unidade da biblioteca no momento do cálculo, para que editar um ingrediente atualize automaticamente o custo de todas as receitas que o usam.

Não implementar nenhuma lógica de escopo/isolamento por usuário (sem `userId` em Ingrediente/Receita, sem checagem de "dono do registro"). O `User` do Better-Auth existe só para a tela de login; as tabelas de negócio não têm relação com ele.

## 4. Funcionalidades da v1

1. **Autenticação** — cadastro e login por e-mail/senha via Better-Auth. Sessão protegendo todas as rotas do app (tudo exceto login/cadastro fica atrás de auth). Não precisa de papéis/permissões diferentes — quem loga tem acesso total.
2. **Biblioteca de ingredientes** — CRUD completo (criar, listar, editar, excluir), compartilhado entre todos que acessam o sistema.
3. **Receitas** — CRUD completo. Ao montar/editar uma receita, selecionar ingredientes da biblioteca + quantidade usada. Cálculo de custo em tempo real no formulário (client-side, usando a mesma função de `lib/pricing.ts` usada no backend — não duplicar a lógica em dois lugares com risco de divergir).
4. **Favoritar receitas** — toggle de favorita; listagem principal mostra favoritas em destaque/no topo.
5. **Resultado da precificação** — para cada receita: custo total, custo por unidade, preço de venda sugerido, lucro por unidade e lucro total da receita.
6. Validações de formulário com mensagens claras (ex: margem + taxa >= 100%, quantidade usada maior que zero, etc).

**Fora de escopo na v1** (não implementar ainda): identidade visual definitiva, upload de imagens, multi-tenant/múltiplas confeitarias, permissões/papéis de usuário, exportação/relatórios, planos pagos.

## 5. Stack obrigatória

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| UI | React 19 + Tailwind CSS 4 + Radix UI (primitives, sem tema visual próprio ainda) |
| Backend/ORM | Prisma 7, banco MySQL |
| Autenticação | Better-Auth (e-mail/senha) |
| Estado no cliente | Jotai (para estado de UI/formulário; **não** usar para dados de servidor — isso vem de Server Components / route handlers) |
| Qualidade de código | Biome (lint + format), configurar como única ferramenta de lint/format do projeto |
| Testes | Vitest, ao menos para `lib/pricing.ts` e para as validações de regra de negócio |

Diretrizes de arquitetura:
- Preferir Server Components para leitura de dados; Client Components só onde há interatividade real (formulários, cálculo em tempo real, toggles).
- Mutations via Server Actions ou route handlers do App Router — escolher um padrão e manter consistente no projeto inteiro.
- Prisma schema em `prisma/schema.prisma`, migrations versionadas.
- Toda lógica de precificação centralizada em `lib/pricing.ts`, importada tanto no servidor quanto no client (mesma função, sem duplicação).
- Configurar Biome logo no início do projeto (antes de escrever muito código) para já formatar/lintar tudo desde o primeiro commit.

## 6. Ordem sugerida de execução

1. Scaffold do Next.js 16 + TypeScript + Tailwind 4 + Biome configurados e rodando (`dev`, `lint`, `format`, `test` funcionando vazios/mínimos).
2. Prisma + MySQL: schema inicial (User, ConfiguracaoConfeitaria, Ingrediente, Receita, ReceitaIngrediente — sem `userId` nas tabelas de negócio) + migration inicial.
3. Better-Auth: cadastro/login por e-mail/senha, proteção de rotas, página de login básica sem estilo definitivo.
4. `lib/pricing.ts` com a fórmula + testes Vitest cobrindo casos normais e o caso de margem+taxa >= 100%.
5. CRUD de Ingredientes (biblioteca) — API/actions + telas básicas.
6. CRUD de Receitas, incluindo seleção de ingredientes da biblioteca e cálculo em tempo real no formulário (Jotai para estado local do formulário).
7. Favoritar receita + listagem com destaque para favoritas.
8. Revisão geral: rodar Biome e Vitest, garantir que tudo passa, documentar comandos no README.

## 7. Identidade visual — marca "Doces & Nós"

A marca é uma logo circular em estilo boho-romântico: ilustração de traço fino (line art) de um casal, moldura circular dupla com coração e estrelas, wordmark serifado elegante com "&" caligráfico, e tagline em caixa alta com letter-spacing largo. Aplicar essa linguagem na UI do app (não é uma landing de vendas, é o painel interno — usar a identidade de forma sóbria: fundo neutro claro no dia a dia, verde da marca em header/destaques/botões primários, não a tela inteira).

**Paleta (configurar como cores customizadas no Tailwind, não usar direto os defaults):**

| Token | Hex | Uso |
|---|---|---|
| `brand-sage` | `#707B54` | Verde-oliva principal — header, botões primários, badges de destaque |
| `brand-sage-dark` | `#4A5237` | Texto sobre fundo claro quando precisar do tom da marca, hover de botão primário |
| `brand-cream` | `#F3EEDE` | Fundo claro geral da UI, texto sobre `brand-sage` |
| `brand-gold` | `#C9A227` | Acento pontual — valor de preço em destaque, ícone de favorito, nunca em grandes áreas |
| Neutros de apoio | escala de cinza/verde-acinzentado a definir no Tailwind config | textos secundários, bordas, inputs |

**Tipografia (carregar via `next/font`):**
- Display/serifa — nome de produtos/receitas, títulos de página, wordmark: **Cormorant Garamond** ou **Playfair Display**.
- Acento script — usar só em ornamentos pontuais (ex.: um "&" decorativo em algum título), nunca em corpo de texto ou dados: **Playfair Display Italic**.
- Apoio/labels — rótulos de formulário, tags, breadcrumbs, sempre **caixa alta com letter-spacing largo** (`tracking-widest uppercase`), sans geométrica: **Jost** ou **Montserrat**.
- Números/dados — toda a parte de cálculo (preços, custos, tabelas) usa fonte monoespaçada para alinhar os valores, independente da marca: **IBM Plex Mono** ou **Space Mono**. Não usar a serifa decorativa em números.

**Regras de aplicação:**
- Não recriar a ilustração do casal em outras telas — é um ativo específico da logo, não um padrão de UI repetível. Pode aparecer como logo no header/tela de login, só isso.
- Botões primários: fundo `brand-sage`, texto `brand-cream`. Botões secundários/outline: borda `brand-sage`, texto `brand-sage-dark`.
- `brand-gold` é acento raro (1-2 elementos por tela no máximo) — não usar como cor de fundo de seção nem em texto de corpo.
- Manter contraste de acessibilidade: nunca texto `brand-sage` claro sobre `brand-cream` claro sem checar contraste mínimo AA.

## 8. Observações finais para o agente

- Pergunte antes de tomar decisões que travam o produto no futuro (ex: estrutura de custos fixos como JSON vs. colunas separadas) se não estiver claro — mas não pare o trabalho esperando resposta para decisões reversíveis, escolha a opção mais simples e documente a escolha.
- Configurar a paleta e as fontes da seção 7 no Tailwind config e no layout raiz logo no início do projeto (junto do scaffold), para que toda tela nova já nasça consistente com a marca.
- Manter todo texto voltado ao usuário final em português do Brasil.
