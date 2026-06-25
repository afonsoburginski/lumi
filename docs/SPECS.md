# 📖 Especificação do App — Livros de Histórias Interativos

> App de **criação e leitura de livros de histórias infantis interativos**, com geração por IA,
> narração com clonagem de voz e uma comunidade segura. Inspirado no "Gemini Story Book".

Documento vivo. Stack alvo: **React Native + Expo (SDK 51+) + TypeScript + React Navigation**.

---

## 1. Branding

### Sugestões de nome (3)

| Nome | Conceito | Tagline |
|------|----------|---------|
| **Lumi** ⭐ *(nome de trabalho adotado)* | De *lume / luz* — histórias que "acendem" a imaginação. Curto, fofo, fácil de falar por crianças e funciona globalmente. | *"Histórias que brilham."* |
| **Contolá** | De *contar* + sufixo lúdico. Soa a "vem cá ouvir um conto". Bem brasileiro e afetivo. | *"Era uma vez, do seu jeito."* |
| **Vagalume** | O vaga-lume que ilumina a noite — metáfora perfeita para a hora de dormir e leitura. Imagem de marca forte e mágica. | *"Acenda uma história."* |

> Para o esqueleto de código, adotei **Lumi** como nome de trabalho (`slug: lumi`). Trocar é trivial em `app.json`.

### Paleta de cores

Paleta vibrante porém **confortável para leitura noturna** (alto contraste sem estourar branco puro).

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#6C5CE7` | Roxo mágico — botões principais, marca |
| `secondary` | `#FFB84C` | Amarelo-estrela — destaques, CTAs lúdicos |
| `accentPink` | `#FF7AA2` | Rosa — curtidas, elementos afetivos |
| `accentTeal` | `#4ECDC4` | Verde-água — sucesso, badges "seguro" |
| `bgLight` | `#FFF9F0` | Creme — fundo claro (não branco puro, menos cansativo) |
| `bgDark` | `#1E1B2E` | Roxo-noite — fundo modo leitura/escuro |
| `surface` | `#FFFFFF` | Cards |
| `textPrimary` | `#2D2A40` | Texto principal |
| `textSecondary` | `#7A7690` | Texto secundário |
| `karaokeHighlight` | `#FFD93D` | Realce da palavra narrada (efeito karaokê) |
| `danger` | `#FF6B6B` | Erros / bloqueio de moderação |

**Gradientes de marca:** `#6C5CE7 → #A29BFE` (capa/splash), `#FFB84C → #FF7AA2` (banners lúdicos).

**Tipografia sugerida:** títulos arredondados e amigáveis (ex.: *Baloo 2*, *Fredoka*); corpo de leitura com boa legibilidade infantil (ex.: *Nunito*, *Quicksand*). Tamanho de leitura grande por padrão (18–22pt) com controle de aumento.

---

## 2. Arquitetura de Navegação (React Navigation)

```
RootNavigator (Stack)
│
├── AuthStack (Stack)            ← exibido se !user (mas Guest pode pular)
│   ├── Welcome
│   ├── Login
│   ├── SignUp  (coleta IDADE da criança → ageBand)
│   └── ForgotPassword
│
├── MainTabs (Bottom Tabs)      ← app principal (Guest OU Logado)
│   ├── HomeTab (Stack)
│   │   ├── Home                 (recomendações por faixa etária)
│   │   └── StoryDetail
│   ├── ExploreTab (Stack)
│   │   ├── Explore              (busca + comunidade)
│   │   ├── SearchResults
│   │   └── CollectionDetail
│   ├── CreateTab                (botão central destacado → abre CreateStory como modal)
│   ├── LibraryTab (Stack)       (Logado: minhas histórias, favoritos, coleções)
│   │   ├── Library
│   │   └── CollectionDetail
│   └── ProfileTab (Stack)
│       ├── Profile / GuestProfile
│       └── Settings
│
└── Modais (apresentados sobre tudo, presentation: 'modal'/'fullScreenModal')
    ├── CreateStoryModal         (wizard de criação mágica)
    ├── StoryPlayerModal         (player de leitura imersivo, fullScreen, landscape opcional)
    ├── VoiceCloneModal          (fluxo de gravação/clonagem de voz)
    ├── PaywallModal             (limite diário do Guest atingido)
    └── AuthPromptModal          (Guest tenta ação restrita → "Entre para curtir/criar")
```

### Regras de acesso (Guest vs. Logado)

| Ação | Guest | Logado |
|------|:-----:|:------:|
| Ver/pesquisar histórias públicas | ✅ (limite diário, ex.: 3 leituras) | ✅ ilimitado |
| Ler história completa | ⚠️ até o limite → `PaywallModal`/`AuthPromptModal` | ✅ |
| Criar história | ❌ → `AuthPromptModal` | ✅ |
| Clonar voz / usar presets | ❌ | ✅ |
| Curtir / comentar / avaliar | ❌ | ✅ |
| Favoritar / criar coleções | ❌ | ✅ |

O gating é centralizado num hook `useGate(action)` que decide entre **executar**, **abrir AuthPromptModal** ou **abrir PaywallModal** (contador de leituras diárias persistido localmente).

### Faixa etária (registro)

No `SignUp` coleta-se a idade → derivamos `ageBand`:
- `3-5` (pré-leitor): frases curtíssimas, foco em imagem e som.
- `6-8` (alfabetizando): karaokê palavra-a-palavra, vocabulário simples.
- `9-12`: tramas mais longas, vocabulário ampliado.

`ageBand` alimenta tanto o **prompt de geração** (tom/complexidade) quanto o **ranking de recomendações**.

---

## 3. Design System (UI)

### Princípios

- **Bordas bem arredondadas** (`radius.lg = 24`, `radius.pill = 999`).
- **Toques grandes** (alvo mínimo 56×56) — dedos de criança.
- **Microanimações suaves** (react-native-reanimated): páginas deslizam, botões "pulsam".
- **Sem cantos agressivos, sem cinzas tristes.** Sombras suaves e coloridas.
- **Modo leitura escuro** por padrão no Player (conforto noturno / hora de dormir).

### Tela "Criar História" (CreateStory Wizard)

Fluxo em passos (com barra de progresso de "estrelinhas"):

```
┌─────────────────────────────────────────┐
│  ←        ✨ Criar uma História          │   ← header com gradiente roxo
│        ● ● ○ ○   (passos)                │
├─────────────────────────────────────────┤
│                                           │
│   [ Sobre o que é a história? ]           │
│   ┌─────────────────────────────────┐     │
│   │ Um cachorrinho que queria voar… │     │   ← textarea grande, placeholder lúdico
│   └─────────────────────────────────┘     │
│                                           │
│   ┌───────────────┐  ┌───────────────┐     │
│   │  📷 Foto de   │  │  🎨 Desenho   │     │   ← upload de imagem (foto do desenho)
│   │   um desenho  │  │   da criança  │     │
│   └───────────────┘  └───────────────┘     │
│                                           │
│   Faixa etária:  [3-5] [6-8] [9-12]       │   ← chips (pré-selec. pelo perfil)
│   Tom:  😴 Calma  🤪 Divertida  🦸 Aventura │
│                                           │
│   🛡️  "Toda história passa por uma         │   ← selo de segurança sempre visível
│        verificação de segurança."         │
│                                           │
│   ╭─────────────────────────────────╮     │
│   │     ✨  Gerar minha história      │     │   ← CTA grande, gradiente, pill
│   ╰─────────────────────────────────╯     │
└─────────────────────────────────────────┘
```

Estado de geração: animação de "varinha mágica" + texto rotativo ("Pintando os cenários…", "Escrevendo o final feliz…"). Ao concluir → preview paginado → escolher voz → salvar/publicar.

### Tela "Player de Leitura" (StoryPlayer)

Experiência imersiva tipo Reels, **focada em leitura**, fullscreen:

```
┌───────────────────────────────────────────────┐
│ [imagem de fundo da página, cobrindo a tela]   │
│  ✕                                    1 / 8     │   ← fechar + indicador de página
│                                                 │
│                                                 │
│        (área da ilustração — respira)           │
│                                                 │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          │   ← gradiente escuro p/ legibilidade
│   "Era uma vez um cachorrinho                   │
│    que sonhava em [VOAR] alto…"                 │   ← texto sobreposto; palavra atual
│                                                 │      realçada em amarelo (karaokê)
│   ●━━━━━━━━━━━━━━━━○──────────                  │   ← progresso do áudio (scrubber)
│                                                 │
│   ◀◀     ⏯  (play/pause)     ▶▶     🔊         │   ← controles de narração
│         ◦ ◦ ● ◦ ◦ ◦ ◦ ◦   (dots de páginas)    │
└───────────────────────────────────────────────┘
```

- **Swipe horizontal** troca de página (gesto fluido, com snap).
- **Tap na tela** mostra/esconde os controles (chrome auto-some após alguns segundos).
- **Karaokê:** cada palavra tem timestamp; a palavra ativa recebe `karaokeHighlight`.
- **Auto-play:** ao terminar o áudio de uma página, avança sozinho (modo "história contada").
- Botão de **voz**: troca entre presets e voz clonada da família.

---

## 4. Segurança e Moderação (Safety First)

Pipeline de **Safety Guardrails** — defesa em camadas, tudo antes de publicar:

1. **Entrada (input):** o texto de contexto e a imagem do usuário passam por classificador de conteúdo (violência, sexual, ódio, perigo/auto-lesão). Bloqueado → mensagem amigável ("Vamos tentar uma ideia diferente? 🌈").
2. **Prompt de sistema reforçado:** instruções rígidas de público infantil + `ageBand`; proíbe terror gráfico, palavrões, temas adultos.
3. **Saída (output):** a história gerada é re-classificada **antes de ser exibida**. Qualquer página reprovada → regenera ou bloqueia.
4. **Comunidade:** só publica conteúdo aprovado nas etapas acima; report de usuários + fila de moderação; comentários também filtrados.
5. **Privacidade infantil (COPPA/LGPD):** dados de voz e fotos tratados como sensíveis; coleções privadas por padrão; sem dados de criança expostos publicamente.

Status modelado como enum: `pending → approved | rejected | needs_review`. A UI nunca renderiza conteúdo `pending`/`rejected`.

---

## Estrutura de pastas (proposta)

```
lumi/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── docs/
│   └── SPECS.md
└── src/
    ├── navigation/
    │   └── RootNavigator.tsx
    ├── theme/
    │   └── theme.ts
    ├── components/
    │   └── StoryPlayer.tsx      ← componente funcional principal (item 4 do plano)
    ├── hooks/
    │   └── useGate.ts           ← gating Guest vs. Logado (a implementar)
    ├── data/
    │   └── mockStory.ts
    └── types/
        └── story.ts
```
