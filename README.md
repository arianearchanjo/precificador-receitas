# Precificador de Receitas — Doces & Nós

Aplicativo web de uso interno para precificação de receitas de confeitaria: cadastro de ingredientes, montagem de receitas com cálculo automático de custo e preço de venda sugerido.

**Acesse em:** <https://precificador-receitas-doces.vercel.app>

## Funcionalidades

- **Painel** (`/`) — resumo geral: receitas cadastradas, ticket médio, lucro médio por lote, receitas em destaque e ações rápidas.
- **Receitas** (`/receitas`) — lista em cards com busca por nome e paginação; criação, edição, favoritos e exclusão.
- **Visualização da receita** (`/receitas/[id]`) — preço sugerido, custos detalhados, composição do custo (ingredientes / mão de obra / custos fixos) e parâmetros usados.
- **Editor de receita** (`/receitas/nova` e `/receitas/[id]/editar`) — seções guiadas, busca de ingredientes, presets de margem (20/30/50%), barra fixa mobile com preço ao vivo.
- **Ingredientes** (`/ingredientes`) — biblioteca com busca e paginação; custo unitário derivado do preço pago ÷ quantidade comprada.
- **Autenticação** — acesso restrito via login (better-auth).

## Fórmula de precificação

```
custo/un = (ingredientes + mão de obra + embalagem + gás/energia + adicionais) ÷ rendimento
preço    = custo/un ÷ (1 − margem% − taxa do cartão%)
lucro    = preço − custo/un − taxa   (por unidade × rendimento = lucro do lote)
```

A margem e a taxa incidem sobre o **preço final**. Validações automáticas: rendimento > 0, valores ≥ 0 e margem + taxa < 100%. Regra centralizada em `src/lib/pricing.ts`.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Server Actions) + React 19
- Tailwind CSS v4 · jotai · radix-ui
- Prisma 7 (PostgreSQL/Neon, driver adapter `@prisma/adapter-pg`) · better-auth
- Biome (lint/format) · Vitest (testes)
