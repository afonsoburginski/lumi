# Mod: Player de Leitura Interativo

> Leitura imersiva de histórias: swipe entre páginas, ilustração de fundo, texto sobreposto com karaokê e narração com controles de áudio.

- **Status:** 🟢 base implementada · áudio **simulado** (timer no hook `usePlayback`, ainda sem `expo-audio`)
- **Depende de:** `narration-voice` (gera `audioUri` + `wordTimings` via TTS), `safety` (só toca conteúdo aprovado) · **É usado por:** `community` / `library` (abrem o player), `story-creation` (preview da história gerada)
- **Rotas/telas:** `src/app/player/[id].tsx` (`fullScreenModal`) → renderiza o organismo `src/components/story/StoryPlayer.tsx`

## Objetivo & escopo
- **Inclui:**
  - Navegação paginada por swipe horizontal (snap por página) e por botões anterior/próxima.
  - Ilustração de fundo cobrindo a tela + gradiente para legibilidade do texto.
  - Texto sobreposto com efeito **karaokê** (palavra ativa realçada) a partir de `wordTimings`.
  - Controles de reprodução (play/pause, scrubber, dots, contador de página, botão de voz, fechar).
  - Chrome com auto-hide (some após ~3.5s; tap na página alterna a visibilidade).
  - Auto-avanço para a próxima página ao terminar o áudio da atual.
- **Não inclui (fora de escopo):**
  - Geração/seleção de voz e produção dos `wordTimings` (responsabilidade de `narration-voice`).
  - Moderação de conteúdo (responsabilidade de `safety`).
  - Busca/listagem de histórias (responsabilidade de `community`/`library`); o player recebe uma `Story` pronta.
  - Download/cache offline do áudio (meta transversal; a detalhar).

## User stories
- Como **criança (3–12)**, quero ver a palavra que está sendo narrada destacada, para acompanhar a leitura mesmo sem saber ler tudo.
- Como **criança**, quero passar a página com um swipe e a história continuar sozinha, para ficar imersa na narração.
- Como **pai/mãe**, quero pausar, voltar e avançar a narração, para ler junto no ritmo da criança.
- Como **leitor**, quero que os controles sumam sozinhos, para a ilustração ocupar a tela toda.

## Estado atual da implementação
O organismo `StoryPlayer.tsx` já está funcional e cobre o fluxo feliz. O que existe hoje:

- **Lista paginada:** `FlatList` horizontal com `pagingEnabled`, `getItemLayout` (snap por largura de tela) e `onMomentumScrollEnd` calculando o índice atual (`Math.round(contentOffset.x / width)`). `goToPage()` faz `scrollToIndex` clamped.
- **Página:** `ImageBackground` (`resizeMode="cover"`) + `LinearGradient` (transparente → `rgba(30,27,46,0.92)`) para legibilidade; texto ancorado embaixo com `paddingBottom: insets.bottom + 140`.
- **Karaokê:** componente interno `KaraokeText` que mapeia `page.wordTimings` e marca como ativa a palavra onde `positionMs >= startMs && positionMs < endMs` (realce amarelo `Colors.light.yellow` sobre tinta escura). Sem `wordTimings`, renderiza o texto puro.
- **Reprodução (SIMULADA):** hook interno **`usePlayback(page)`** mantém `isPlaying`, `positionMs`, `durationMs` e expõe `togglePlay`, `seek`, `resetForPage`. Hoje a posição avança por um `setInterval` de 50ms até `durationMs` (derivado do `endMs` da última palavra, ou 6000ms de fallback). **Este hook é o ponto único de integração com áudio real (`expo-audio`)** — a UI consome só a interface dele, então a troca do timer não toca no resto do player.
- **Auto-avanço:** `useEffect` observa `positionMs >= durationMs` e chama `goToPage(currentPage + 1)`.
- **Chrome / auto-hide:** `chromeVisible` + `Animated.Value` (`chromeOpacity`); `showChrome()` rearma um timer de 3500ms; `toggleChrome()` no `Pressable` da página. Topo: fechar (`X`) + contador `n / total`. Inferior: scrubber (track + fill + thumb, `seek` por `locationX`), transporte (anterior, play/pause grande, próxima, **botão de voz `Volume2` ainda sem ação**) e dots (ativo alongado).
- **Tema:** player sempre imersivo escuro (constantes locais `INK`, `HIGHLIGHT`, `OVERLAY`); usa `spacing`/`radius` de `tokens.ts` e `Colors`/`withOpacity` de `theme/colors`.
- **Rota:** `player/[id].tsx` ainda resolve a história via `mockStory` (TODO: buscar por `id`).

## Features (índice)
| Feature | Arquivo | Prioridade | Status |
|---------|---------|------------|--------|
| Swipe entre páginas | [features/swipe-pages.md](features/swipe-pages.md) | P0 | 🟢 implementado |
| Karaokê (realce da palavra) | [features/karaoke.md](features/karaoke.md) | P0 | 🟢 base ok · falta sync com áudio real |
| Controles de áudio | [features/audio-controls.md](features/audio-controls.md) | P0 | 🟡 parcial · áudio simulado, botão de voz inerte |
| Autoplay / auto-avanço | [features/autoplay.md](features/autoplay.md) | P1 | 🟢 implementado |

## Modelo de dados (deste mod)
O player não possui entidades próprias; consome os tipos globais de `src/lib/story/types.ts`:

- `Story { id, title, authorId, ageBand, coverUri, pages: StoryPage[], moderation, isPublic, likes }`
- `StoryPage { id, imageUri, text, audioUri?, wordTimings? }`
- `WordTiming { word, startMs, endMs }`

Estado **local** do player (não persistido):
- `currentPage: number` (página visível).
- `usePlayback`: `{ isPlaying, positionMs, durationMs }` + ações `togglePlay`, `seek(ms)`, `resetForPage(page)`.
- `chromeVisible: boolean` + `chromeOpacity: Animated.Value`.

> Decisão: o player recebe a `Story` **já aprovada** (`moderation === 'approved'`); quem abre o player garante isso (ver Segurança).

## Estados & fluxos
- **Estados de tela:**
  - *loading:* história/áudio carregando (hoje inexistente — mock síncrono; a tratar quando vier API/`expo-audio`).
  - *erro:* falha ao carregar áudio/imagem (a tratar; hoje sem fallback visual).
  - *sucesso:* página renderizada, narração tocando, karaokê ativo.
  - *bloqueado (safety):* história não aprovada não deve abrir o player (gate na origem).
- **Fluxo principal:**
  1. Rota `player/[id]` resolve a `Story` e monta `StoryPlayer`.
  2. Abre na `initialPage` (default 0); narração inicia automaticamente (`isPlaying = true`).
  3. Karaokê acompanha `positionMs`; chrome aparece e some após 3.5s.
  4. Usuário pode tocar para mostrar chrome, dar swipe, usar transporte ou scrubber.
  5. Ao terminar o áudio, avança para a próxima página (autoplay); na última página, para.
  6. Botão `X` fecha (`onClose` → `router.back()`).

## UI (Atomic Design)
- **Organismo:** `StoryPlayer` (`src/components/story/StoryPlayer.tsx`).
- **Moléculas a extrair** (hoje internas ao organismo; refatorar para reuso/teste):
  - `KaraokeText` — texto com realce palavra-a-palavra.
  - `AudioControls` — scrubber + transporte + dots (barra inferior).
  - `PageDots` — indicador de páginas (pode sair de dentro de `AudioControls`).
- **Átomos:** `RoundButton` (interno; candidato a virar átomo `IconButton`), `Icon` (`@/components/ui/icon`, BNA UI), `LinearGradient` (expo-linear-gradient), `ImageBackground` (RN).
- **Tokens:** `spacing`, `radius` (`theme/tokens`), cores via `Colors`/`withOpacity` (player escuro fixo).

## Integrações
- **`expo-audio` (já instalado):** substitui o timer simulado dentro de `usePlayback`. Carregar `page.audioUri`, assinar `onPlaybackStatusUpdate` e mapear `position`/`duration` reais para `positionMs`/`durationMs`. O resto da UI não muda (interface estável do hook).
- **`narration-voice`:** fornece `audioUri` e `wordTimings` por página (TTS / clonagem de voz). O **botão de voz** (`Volume2`) deve abrir a troca de voz desse mod (hoje inerte).
- **`expo-router`:** rota modal fullscreen; `onClose` usa `router.back()`.
- **expo-linear-gradient, react-native-safe-area-context:** já em uso.

## Segurança
- O player **só** deve receber histórias com `moderation === 'approved'`; o gate fica na origem (`community`/`library`/preview de `story-creation`), não no player.
- Player imersivo é seguro para criança: sem links externos, sem texto livre de terceiros em tela, sem entrada de dados.
- Áudio respeita o modo silencioso/volume do dispositivo (configurar `audio mode` ao integrar `expo-audio`).
- Privacidade de voz (clonagem) é responsabilidade de `narration-voice`/`safety`; o player apenas reproduz o `audioUri` recebido.

## Telemetria
| Evento | Quando | Props |
|--------|--------|-------|
| `story_open` | player monta | `storyId`, `pages`, `initialPage`, `source` |
| `page_view` | página passa a ser a atual | `storyId`, `pageIndex`, `via` (`swipe` \| `button` \| `autoplay`) |
| `story_complete` | última página concluída pelo áudio | `storyId`, `durationMs` total aproximado |
| `replay` | usuário reinicia a narração (play após o fim) | `storyId`, `pageIndex` |

> A instrumentação ainda **não existe** no código; adicionar junto à integração de áudio.

## Critérios de aceite (do mod)
- [ ] Dado uma `Story` com N páginas, quando o player abre, então mostra a `initialPage` em tela cheia com a ilustração de fundo e o contador `1 / N`.
- [ ] Dado o swipe horizontal, quando solto, então a lista faz snap exato em uma página e `currentPage` reflete o índice.
- [ ] Dado `wordTimings` na página atual, quando a narração avança, então exatamente a palavra do intervalo `[startMs, endMs)` fica realçada.
- [ ] Dado nenhum toque por ~3.5s, quando o chrome está visível, então ele some; e um tap na página alterna a visibilidade.
- [ ] Dado o fim do áudio de uma página intermediária, quando concluído, então avança automaticamente para a próxima.
- [ ] Dado `expo-audio` integrado, quando a narração toca, então `positionMs`/`durationMs` vêm do status real do áudio (sem timer simulado).

## Questões em aberto
- **Sincronização fina do karaokê:** o realce depende da precisão dos `wordTimings` e da frequência de `onPlaybackStatusUpdate` (intervalo do status pode ser maior que os ~50ms do timer atual → realce "saltado"). Definir interpolação/limiar.
- **Gesto em landscape:** comportamento do swipe/snap e do layout do texto em orientação paisagem (ainda não tratado; hoje assume `useWindowDimensions` retrato).
- **Loading/erro de áudio e imagem:** placeholders e retry ausentes.
- **Origem do `source` na telemetria** e como `library`/`community` passam esse contexto.
- **Resolução da história por `id`** (substituir `mockStory` por store/API).

## Plano de implementação
1. **Extrair moléculas** `KaraokeText`, `AudioControls`, `PageDots` do organismo (sem mudar comportamento) para teste/reuso.
2. **Trocar o timer simulado por `expo-audio`** dentro de `usePlayback`:
   - Criar/abrir o player de áudio com `page.audioUri`; tratar ausência de `audioUri` (mantém fallback por `wordTimings`).
   - Assinar `onPlaybackStatusUpdate` e mapear `status.currentTime`/`positionMs` → `positionMs` e `status.duration`/`durationMs` → `durationMs`.
   - Implementar `togglePlay` (play/pause), `seek(ms)` e `resetForPage` (carregar áudio da nova página, zerar posição, dar play) sobre a API real.
   - Disparar autoplay pelo evento de "didJustFinish" do status, mantendo o `useEffect` como guarda.
3. **Mapear posição → `wordTimings`** com tolerância (interpolar entre updates do status; opção de "look-ahead" para suavizar o realce).
4. **Botão de voz:** ligar ao `narration-voice` (abrir seletor de voz; ao trocar, recarregar `audioUri`/`wordTimings` e `resetForPage`).
5. **Estados de loading/erro** de áudio e imagem (spinner/placeholder + retry).
6. **Telemetria:** emitir `story_open`, `page_view`, `story_complete`, `replay`.
7. **Resolver `Story` por `id`** na rota (remover `mockStory`).
8. **Configurar audio mode** (silent switch, foco de áudio) e cuidar do unload ao desmontar.
