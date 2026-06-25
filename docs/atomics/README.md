# Atomic Design — Sistema de UI do Lumi

A UI do Lumi é organizada por **Atomic Design** sobre a **BNA UI**. Os componentes da BNA
ficam em `src/components/ui` e **nós os possuímos** (podemos editar). Compomos a partir deles.

```
Átomos        → Moléculas         → Organismos        → Templates      → Páginas
(1 elemento)    (grupo de átomos)   (seção completa)     (layout)         (rota)
```

## Tokens (fonte da verdade)

| Token | Arquivo | Notas |
|------|---------|-------|
| Cores | `src/theme/colors.ts` (`Colors.light/dark`) | Paleta Lumi sobre estrutura BNA UI; **todas as chaves preservadas** |
| Dimensões base | `src/theme/globals.ts` | `HEIGHT`, `FONT_SIZE`, `BORDER_RADIUS`, `CORNERS` |
| Extras Lumi | `src/theme/tokens.ts` | `spacing`, `radius`, `fontSize`, `gradients`, `AgeBand` |
| Tema (navegação) | `src/theme/theme-provider.tsx` | usa `expo-router/react-navigation` (SDK 56) |

Cores são consumidas via hook **`useColor('chave')`** (`src/hooks/useColor.ts`), nunca hardcoded.
Paleta de marca: `primary #6C5CE7`, `yellow/estrela #FFB84C`, `pink #FF7AA2`, `teal #4ECDC4`,
fundo claro creme `#FFF9F0`, fundo escuro/leitura `#1E1B2E`, realce karaokê `#FFD93D/yellow`.

## Inventário — Átomos (BNA UI)

Já instalados em `src/components/ui`:

| Átomo | Componente | Uso típico |
|------|-----------|-----------|
| Texto | `text` (`<Text variant=...>`) | body/title/subtitle/caption/heading/link |
| Container | `view` | wrapper (transparente — fundo via `useColor`) |
| Botão | `button` (`variant`, `size`, `icon`, `loading`, `haptic`) | CTAs, chips |
| Campo | `input` (`variant`, `containerStyle`, `inputStyle`) | texto, busca |
| Ícone | `icon` (lucide via `name={X}`) | controles, tabs |
| Selo | `badge` | status, contadores |
| Avatar | `avatar` (+ `AvatarImage`/`AvatarFallback`) | perfil |
| Card | `card` (+ `CardHeader/Content/Footer/Title/Description`) | itens de lista |
| Separador | `separator` | divisórias |
| Spinner | `spinner` | loading |
| Imagem | `image` (expo-image) | ilustrações |

**A adicionar conforme os mods** (via `bna-ui add <nome>`): `audio-player`, `audio-recorder`,
`bottom-sheet`, `sheet`, `searchbar`, `camera`, `gallery`, `media-picker`, `tabs`, `picker`,
`checkbox`, `toggle`, `combobox`, `popover`, `parallax-scrollview`.

## Moléculas (nossas — `src/components/...`)

| Molécula | Arquivo | Composição |
|---------|---------|-----------|
| `Screen` | `components/layout/Screen.tsx` | View(tema) + Text(heading) + ScrollView |
| `StoryCard` | `components/story/StoryCard.tsx` | Card + LinearGradient + Icon + Text |
| Chips de seleção | (no `create.tsx`) | grupo de `Button size="sm"` | 
| Selo de segurança | (no `create.tsx`) | View tintada + Text(caption) | 

A extrair em moléculas conforme reuso: `AgeBandChips`, `ToneChips`, `SafetyBadge`,
`AudioControls`, `KaraokeText`, `LikeButton`, `SearchField`.

## Organismos (nossos)

| Organismo | Arquivo | Papel |
|-----------|---------|-------|
| `StoryPlayer` | `components/story/StoryPlayer.tsx` | Player imersivo: FlatList paginada + karaokê + controles de áudio + chrome auto-hide |
| Wizard de criação | `app/(tabs)/create.tsx` (a extrair) | passos: prompt → imagem → faixa/tom → gerar |
| Feed de comunidade | (a criar no mod `community`) | busca + lista de `StoryCard` |
| Fluxo de clonagem de voz | (a criar no mod `narration-voice`) | gravação guiada com `audio-recorder` |

## Templates

- `Screen` (casca com safe-area + título) — base de toda aba.
- `ImmersiveScreen` (a criar) — tela full-bleed sem chrome (player).

## Páginas (rotas expo-router)

`src/app/(tabs)/index.tsx`, `explore.tsx`, `create.tsx`, `library.tsx`, `profile.tsx`,
`src/app/player/[id].tsx`. Cada página apenas **compõe** organismos/moléculas — sem regra de
layout duplicada.

## Regras

1. **Sem cor hardcoded** em páginas/organismos → usar `useColor`/tokens.
2. **Sem layout duplicado** → extrair molécula quando repetir 2×.
3. **Acessibilidade no átomo de interação** → `accessibilityLabel` em todo controle.
4. **Editar BNA UI é permitido** (nós possuímos o código), mas registre mudanças relevantes na spec do mod.
