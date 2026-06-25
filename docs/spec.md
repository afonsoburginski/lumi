# Lumi — Especificação Geral (SDD)

> **Spec-Driven Development (SDD):** a especificação é a fonte da verdade. Todo código
> nasce de uma spec; toda spec tem critérios de aceite verificáveis. Este `spec.md` é o
> documento **geral** — ele define visão, arquitetura e o índice dos **mods** (módulos).
> Cada mod tem seu próprio `spec.md` e suas **features**. O design segue **Atomic Design**
> (ver [`atomics/README.md`](./atomics/README.md)).

- **App:** Lumi — criação e leitura de livros de histórias infantis interativos, com geração por IA, narração com clonagem de voz e comunidade segura.
- **Brief de produto/branding/UX:** [`SPECS.md`](./SPECS.md) (documento original — nomes, paleta, mockups).
- **Stack:** Expo SDK 56 · React Native 0.85 · React 19 · **expo-router** (file-based) · **BNA UI** (componentes) · TypeScript.

---

## 1. Visão & Princípios

1. **Criança no centro, segurança primeiro.** Nada chega à criança sem passar pelos *safety guardrails* (mod `safety`).
2. **Conexão emocional.** A grande feature é a narração com a **voz da família** (mod `narration-voice`).
3. **Encantamento simples.** UI lúdica, bordas arredondadas, toques grandes, microanimações — sem fricção para pais e crianças.
4. **SDD.** Spec → critérios de aceite → implementação → verificação. Sem spec, não há merge.
5. **Composição (Atomic Design).** UI montada de átomos → moléculas → organismos, sobre a BNA UI.

## 2. Personas

| Persona | Necessidade | Implicação de design |
|--------|-------------|----------------------|
| **Criança (3–12)** | Ouvir/ler histórias, reconhecer a voz da mãe/pai | Karaokê, autoplay, alvos grandes, pouca leitura de UI |
| **Pai/Mãe (cuidador)** | Criar histórias seguras, gravar a própria voz, curar conteúdo | Wizard simples, clonagem de voz amigável, controles de privacidade |
| **Visitante (não logado)** | Experimentar antes de criar conta | Acesso limitado (3 leituras/dia), gates claros |

## 3. Arquitetura técnica

```
lumi/
├── app.json · babel.config.js · tsconfig.json (@/* → ./src/*) · .npmrc (legacy-peer-deps)
├── docs/                      ← SDD (este diretório)
└── src/
    ├── app/                   ← rotas expo-router (file-based)
    │   ├── _layout.tsx        (Stack root + Providers + ThemeProvider)
    │   ├── (tabs)/            (Bottom Tabs: index, explore, create, library, profile)
    │   └── player/[id].tsx    (player imersivo, fullScreenModal)
    ├── components/
    │   ├── ui/                ← BNA UI (código que nós possuímos)
    │   ├── layout/            ← Screen e cascas (moléculas/templates)
    │   └── story/             ← StoryPlayer, StoryCard (organismos)
    ├── hooks/                 ← useColor, useColorScheme (BNA UI)
    ├── theme/                 ← colors.ts, globals.ts, tokens.ts, theme-provider.tsx
    └── lib/                   ← domínio (story/types.ts, story/mock.ts), futura API/stores
```

**Decisões já tomadas (verificadas neste setup):**
- expo-router em `src/app` (suportado nativamente). `main: expo-router/entry`.
- BNA UI via `bna-ui add` → componentes ficam em `src/components/ui` (nós editamos livremente).
- Tema BNA UI **personalizado** com a paleta Lumi em `theme/colors.ts` (todas as chaves preservadas).
- SDK 56 dropou compat com `@react-navigation/native` → usar `expo-router/react-navigation`.
- Reanimated 4 exige `react-native-worklets` + plugin babel `react-native-worklets/plugin`.

## 4. Mapa de Mods (índice + verificação)

Cada mod tem `mods/<mod>/spec.md` e `mods/<mod>/features/*.md`.

| Mod | Responsabilidade | Status spec | Status código |
|-----|------------------|-------------|---------------|
| [`auth`](./mods/auth/spec.md) | Login, cadastro com idade, gating Visitante×Logado | 🟢 detalhado | 🟢 login/signup + `useGate` + quota diária (mock local) |
| [`story-creation`](./mods/story-creation/spec.md) | Wizard de criação mágica (texto + imagem → história paginada) | 🟢 detalhado | 🟢 wizard completo: prompt+imagem+faixa/tom→geração(mock)→preview→salvar/publicar |
| [`player`](./mods/player/spec.md) | Player de leitura imersivo (swipe, karaokê, áudio) | 🟢 base ok | 🟢 `StoryPlayer` + troca de voz (áudio ainda simulado) |
| [`narration-voice`](./mods/narration-voice/spec.md) | Presets de voz + **clonagem de voz** | 🟢 detalhado | 🟡 presets + fluxo de clonagem (mock) + TTS de timings; falta áudio real |
| [`community`](./mods/community/spec.md) | Explorar, buscar, curtir/comentar/avaliar, coleções | 🟢 detalhado | 🟢 feed/busca/like/comentário/avaliação/coleções (offline, store local) |
| [`safety`](./mods/safety/spec.md) | Guardrails de moderação (entrada/saída/comunidade) | 🟢 detalhado | 🟢 `moderateText` (entrada/saída/comentários) — classificador heurístico offline |

> Implementação atual usa **serviços mock que rodam offline** (geração, TTS, moderação) e
> **stores persistidos** (zustand + AsyncStorage) com escrita otimista + outbox. Ver
> [`cross-cutting/offline-first.md`](./cross-cutting/offline-first.md). Trocar mocks por backend
> real mantendo as mesmas interfaces em `src/lib/services/*`.

**Verificação do brief original ([SPECS.md](./SPECS.md)) — lacunas a resolver nas specs dos mods:**
- Limite diário do Visitante: valor (3?) e reset (fuso/00h local?) — definir em `auth`.
- Origem dos `wordTimings` do karaokê (serviço TTS) — definir em `narration-voice`/`player`.
- Persistência (offline-first? backend?) — definir modelo em cada mod (seção *Dados*).
- Política de privacidade de voz/foto (LGPD/COPPA) — formalizar em `safety`.

## 5. Modelo de dados (global)

Tipos canônicos em `src/lib/story/types.ts`. Resumo:

- `Story { id, title, authorId, ageBand, coverUri, pages[], moderation, isPublic, likes }`
- `StoryPage { id, imageUri, text, audioUri?, wordTimings? }`
- `WordTiming { word, startMs, endMs }` (karaokê)
- `ModerationStatus = pending | approved | rejected | needs_review`
- `AgeBand = '3-5' | '6-8' | '9-12'`

Entidades a especificar nos mods: `User`, `VoiceProfile`, `Collection`, `Comment`, `Rating`, `ReadingQuota`.

## 6. Navegação (expo-router)

- Stack raiz: `(tabs)` + `player/[id]` (modal fullscreen).
- Tabs: `index` (Início), `explore`, `create`, `library`, `profile`.
- A criar: grupo `(auth)` (login/signup), modais `voice-clone`, `paywall`, `auth-prompt`.

## 7. Requisitos transversais

- **Segurança:** todo conteúdo gerado/publicado passa pelo mod `safety` (ver pipeline lá).
- **Acessibilidade:** alvos ≥ 56px, `accessibilityLabel` em controles, contraste AA, fonte grande.
- **i18n:** PT-BR primeiro; textos preparados para extração.
- **Tema claro/escuro:** automático; player sempre imersivo escuro.
- **Telemetria:** eventos por feature (definidos em cada spec) — criação, leitura, conclusão, clonagem.
- **Offline:** leitura de histórias já baixadas deve funcionar offline (meta; detalhar por mod).

## 8. Processo SDD (como trabalhamos)

1. Escreva/atualize a spec da feature (use [`TEMPLATE.md`](./TEMPLATE.md)).
2. Defina **critérios de aceite** verificáveis e os **átomos/moléculas** usados.
3. Implemente referenciando a spec no PR.
4. Verifique contra os critérios (typecheck, export, e teste manual do fluxo).
5. Atualize o status no índice acima.

## 9. Glossário

- **Mod:** módulo de domínio (fatia vertical de produto) com sua spec e features.
- **Feature:** unidade entregável dentro de um mod, com critérios de aceite próprios.
- **Atomic Design:** organização de UI em átomos → moléculas → organismos → templates → páginas.
- **Guardrails:** verificações automáticas de segurança de conteúdo.
- **Karaokê:** realce da palavra narrada sincronizado ao áudio.
