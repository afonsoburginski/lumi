# Lumi — Arquitetura (ADR consolidado)

Decisões de arquitetura travadas com o time. Fonte da verdade para estrutura, patterns e stack.
Ver também: [`spec.md`](./spec.md) (SDD geral) e [`cross-cutting/offline-first.md`](./cross-cutting/offline-first.md).

## Visão geral

Monorepo **bun workspaces** com app mobile, API desacoplada e pacote de tipos compartilhados.

```
lumi/                          # raiz do monorepo (bun workspaces)
├── apps/
│   ├── mobile/                # App Expo (React Native) — feature-first
│   └── api/                   # API desacoplada — Hono + Prisma + PostgreSQL
├── packages/
│   └── shared/                # tipos de domínio + contratos da API (usados por mobile e api)
├── docs/                      # specs (SDD) e este ADR
├── package.json               # workspaces
└── docker-compose.yml         # PostgreSQL local
```

## Decisões (ADR)

| # | Tema | Decisão | Notas |
|---|------|---------|-------|
| 1 | Gerenciador/runtime | **Bun** | install, scripts e **`bun test`** (lógica). Testes de render RN ficam p/ depois. |
| 2 | Repositório | **Monorepo (bun workspaces)** | `apps/*` + `packages/*`. API desacoplada mas com tipos compartilhados. |
| 3 | Organização do código (mobile) | **Feature-first** | 1 mod = `features/<mod>/` (screens, components, hooks, store, services, types, constants, index). |
| 4 | Estado (mobile) | **Zustand** + persist + selectors | offline-first; store por feature. |
| 5 | Dados/servidor | **Repository + TanStack Query** | services/ = interface trocável (mock↔API); React Query p/ cache/offline. |
| 6 | API framework | **Hono** + `@hono/zod-openapi` | REST tipado + validação Zod; roda em bun. |
| 7 | ORM / DB | **Prisma** + **PostgreSQL** | schema.prisma + migrations. Atenção a quirks bun↔Prisma (usar engine compatível). |
| 8 | Auth | **JWT próprio** (access + refresh) | refresh rotativo; usuários no Postgres. |
| 9 | Erros | **Result type** + ErrorBoundary + toast | `{ ok } | { ok:false, reason }` p/ falhas esperadas. |
| 10 | Navegação | **expo-router typed routes** | autocomplete + checagem de rotas. |
| 11 | Config/env | `app.config.ts` + `EXPO_PUBLIC_*` + módulo `config` | dev/staging/prod; troca mock↔API. |
| 12 | Lint/format | **ESLint (expo) + Prettier** + import-order | sem pre-commit (rodar manual/CI). |
| 13 | i18n | textos centralizados agora (`i18n-js`) | PT-BR; lib pronta p/ 2º idioma. |
| 14 | Tipagens | **híbrido** | domínio compartilhado em `packages/shared` + `src/types`; específico em `features/<mod>/types.ts`. |
| 15 | Constantes | **global + por feature** | `src/constants/` (app/limites/rotas) + `features/<mod>/constants.ts`. |
| 16 | Nomes/arquivos | **kebab-case** + PascalCase (comp/types) + barrels `index.ts` | imports via alias `@/...`. |

## Estrutura do app mobile (feature-first)

```
apps/mobile/src/
├── app/                       # expo-router: rotas finas → delegam p/ features/<mod>/screens
├── features/
│   └── <mod>/                 # auth, story-creation, player, narration-voice, community, safety
│       ├── components/  screens/  hooks/  store/  services/
│       ├── types.ts  constants.ts  index.ts (barrel = API pública)
├── components/
│   ├── ui/                    # BNA UI (gerenciado pela lib — caminho fixo)
│   └── shared/                # moléculas/organismos transversais (Screen, OfflineBanner, StoryCard)
├── hooks/                     # hooks do tema (BNA UI) + globais
├── theme/                     # tokens (colors, tokens, globals, provider)
├── constants/                 # consts globais (app, rotas, limites)
├── types/                     # re-export de @lumi/shared + tipos globais do app
├── lib/                       # utilitários transversais (id, storage, sync/outbox, connectivity, query client)
└── config/                    # env/ambiente
```

## Estrutura da API (Hono + Prisma)

```
apps/api/src/
├── index.ts                   # bootstrap Hono
├── routes/                    # por recurso: auth, stories, community, voice
├── modules/                   # lógica de domínio (espelha os mods): services + repos
├── middleware/                # auth (JWT), error handler, cors
├── db/                        # prisma client
├── lib/                       # jwt, hash, result
└── env.ts
prisma/schema.prisma           # User, Story, Page, Comment, Rating, Collection, VoiceProfile, Moderation
```

## packages/shared

Tipos de domínio (`Story`, `User`, `Collection`, ...) e **contratos de API** (schemas Zod + tipos de
request/response). Importado como `@lumi/shared` por mobile e api → uma só fonte de verdade.

## Patterns transversais

- **Service/Repository:** mobile fala com `services/` (interface); impl mock offline **ou** cliente HTTP da API.
- **Container/Presentational:** `screens/` orquestram; `components/` são apresentacionais.
- **Gate:** acesso centralizado em `useGate(action)`.
- **Offline-first:** escrita otimista + outbox; cache local como fonte de verdade offline.
- **Barrels:** só o exportado no `index.ts` da feature é público (encapsulamento).

## Plano de execução (fases)

1. **Monorepo + bun:** raiz workspaces, mover app p/ `apps/mobile`, `bun install`, validar `expo export`.
2. **Tooling mobile:** ESLint+Prettier, typed routes, `config/`, i18n base.
3. **Feature-first:** migrar `lib/*`, `components/story`, telas → `features/<mod>/` + barrels.
4. **packages/shared:** extrair tipos de domínio + contratos.
5. **API:** Hono + Prisma + Postgres (docker-compose) + auth JWT + rotas dos mods.
6. **Integração:** repository do mobile → API via TanStack Query (online), mantendo fallback offline.
```
