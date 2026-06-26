# Lumi 🌟

App de **criação e leitura de livros de histórias infantis interativos** — geração por IA,
narração com clonagem de voz, karaokê e comunidade segura. Funciona **offline-first**.

Monorepo **bun workspaces**: app mobile (Expo), API desacoplada e tipos compartilhados.

```
lumi/
├── apps/
│   ├── mobile/        # App Expo (React Native) — feature-first
│   └── api/           # API Hono + Prisma + PostgreSQL + JWT
├── packages/shared/   # tipos de domínio + contratos (zod) usados pelos dois
├── docs/              # specs (SDD) + ADR de arquitetura
└── docker-compose.yml # PostgreSQL local
```

> Arquitetura completa em [`docs/architecture.md`](docs/architecture.md); specs por mod em [`docs/spec.md`](docs/spec.md).

## Pré-requisitos
- **bun** ≥ 1.3 · **Node** 22 (para o Expo CLI) · **Docker** (Postgres) · app **Expo Go** ou emulador.

## Instalação
```bash
bun install        # na raiz — instala todos os workspaces
```

## Rodar a API (com Postgres)
```bash
docker compose up -d                      # sobe o PostgreSQL (porta 5432)
cp apps/api/.env.example apps/api/.env     # ajuste os segredos
cd apps/api
bunx prisma migrate dev                    # cria o schema
bun run dev                                # API em http://localhost:3333
```
`GET /health` → `{"status":"ok"}`.

### Chaves opcionais (sem elas, tudo roda em **mock offline**)
No `apps/api/.env`:
```
GEMINI_API_KEY="AIza..."         # geração de histórias via Gemini (gemini-2.5-flash)
ELEVENLABS_API_KEY="..."         # TTS + clonagem de voz (com timestamps p/ karaokê)
```

## Rodar o app mobile
```bash
cd apps/mobile
# para falar com a API, crie apps/mobile/.env:
#   EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3333
bun run start                              # abre o Expo (i / a / w)
```
Sem `EXPO_PUBLIC_API_URL`, o app usa serviços **mock locais** (offline-first) — funciona sem backend.

## Scripts úteis (raiz)
```bash
bun run typecheck     # typecheck mobile + shared
bun run mobile        # = cd apps/mobile && expo start
bun run api           # = cd apps/api && bun dev
bun test              # testes (bun) de lógica
```
Qualidade no mobile: `cd apps/mobile && bun run lint` · `bun run format`.

## Arquitetura (resumo)
- **Mobile:** feature-first (`src/features/<mod>`), estado **Zustand** + persist, dados via **Repository + TanStack Query**, **expo-router** (typed routes), i18n PT-BR, ESLint+Prettier.
- **Offline-first:** stores persistidos + **escrita otimista** + **outbox** que sincroniza ao voltar online (toggle de conectividade no Perfil para testar).
- **Providers trocáveis (backend):** IA = **Google Gemini**, voz = **ElevenLabs**, imagem = mock (plugue futuro) — todos com fallback mock e selecionados por env.
- **Safety-first:** moderação de entrada/saída na geração e nos comentários.

## Mods (domínios)
`auth` · `story-creation` · `player` · `narration-voice` · `community` · `safety` — cada um com spec em `docs/mods/<mod>/`.
