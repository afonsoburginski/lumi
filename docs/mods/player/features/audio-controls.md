# Feature: Controles de áudio  ·  `player/audio-controls`

> Play/pause, scrubber para buscar posição, troca de voz, contador e dots — o "chrome" do player com auto-hide.

- **Prioridade:** P0 · **Status:** 🟡 parcial · reprodução **simulada** (timer), botão de voz **inerte**
- **Rota/entrada:** barras de chrome (topo e inferior) sobre `StoryPlayer`

## User story & valor
Como **pai/mãe**, quero pausar, retomar e arrastar para um ponto da narração, para ler no ritmo da criança.
Como **leitor**, quero que os controles desapareçam sozinhos, para a ilustração ocupar a tela.

## Comportamento esperado
- **Auto-hide:** ao montar e a cada interação, `showChrome()` exibe o chrome (fade 200ms) e arma um timer de **3.5s** que o esconde (fade 400ms). Um **tap** na página (`toggleChrome`) alterna manualmente; ao trocar de página, o chrome reaparece.
- **Topo:** botão **Fechar** (`X` → `onClose`/`router.back()`) e **contador** `n / total`.
- **Inferior:**
  - **Scrubber:** track com fill proporcional a `progress = positionMs/durationMs` e thumb; tocar na track faz `seek` proporcional ao `locationX`.
  - **Transporte:** anterior, **play/pause** (botão grande, ícone `Play`/`Pause` conforme `isPlaying`), próxima e **botão de voz** (`Volume2`).
  - **Dots** de página (ativo alongado).
- **Play/pause:** `togglePlay`; se estava no fim (`positionMs >= durationMs`), retomar reinicia do zero (replay).

## UI / Atomics
| Camada | Componente | Origem |
|--------|-----------|--------|
| molécula | AudioControls (a extrair) | interno → futura molécula |
| molécula | PageDots (a extrair) | interno |
| átomo | RoundButton (`big` no play) | interno (candidato a IconButton) |
| átomo | Icon (Play/Pause/Chevron/Volume2/X) | @/components/ui/icon (BNA UI) + lucide-react-native |
| átomo | Scrubber (track/fill/thumb) | interno (Pressable + View) |
| efeito | Animated (opacity) | react-native |

- Cores: `OVERLAY` nos botões, `Colors.light.primary` no play grande, `Colors.light.yellow` no fill/dot ativo. Alvos grandes (56–76px) atendendo acessibilidade.

## Dados & estado
- **De `usePlayback`:** `isPlaying`, `positionMs`, `durationMs`; ações `togglePlay`, `seek(ms)`.
- **Chrome:** `chromeVisible` (`useState`), `chromeOpacity` (`Animated.Value`), `hideTimer` (`ref`).
- **Persistência:** nenhuma.

## Regras & validações
- `seek` clampa a `[0, durationMs]`; `progress` clampa a `[0, 1]` e trata `durationMs === 0`.
- Limpar `hideTimer` ao desmontar e antes de rearmar.
- Botões com `accessibilityLabel` (Fechar, Tocar/Pausar, Anterior, Próxima, Trocar voz).

## Estados de UI
- *chrome visível / oculto* (fade).
- *tocando / pausado* (ícone alterna).
- *no fim* (play vira replay).
- *loading/erro de áudio:* a tratar (spinner no play, desabilitar scrubber).

## Telemetria
- `replay` { storyId, pageIndex } — quando o usuário dá play após o áudio ter terminado.
- (auxilia) `page_view { via: 'button' }` ao usar anterior/próxima — ver `swipe-pages`.

## Critérios de aceite (verificáveis)
- [ ] Dado o chrome visível, quando passo ~3.5s sem tocar, então ele some; e um tap na página o traz de volta.
- [ ] Dado que toco play/pause, quando alterno, então o ícone e o estado `isPlaying` mudam e a posição para/retoma.
- [ ] Dado que arrasto/toco no scrubber, quando solto, então `positionMs` salta para o ponto correspondente (clamped) e o fill/thumb refletem.
- [ ] Dado que o áudio terminou, quando toco play, então a narração reinicia do começo (replay) e emite `replay`.
- [ ] Dado cada controle, quando inspecionado, então possui `accessibilityLabel` em PT-BR.

## O que falta para o áudio REAL
- **Reprodução simulada:** `positionMs`/`durationMs` vêm de um `setInterval` (50ms) no `usePlayback`, não do áudio.
- **Substituir por `expo-audio`** dentro de `usePlayback` (interface do hook permanece igual): carregar `page.audioUri`, `onPlaybackStatusUpdate` → `positionMs`/`durationMs`; `togglePlay`/`seek` chamam a API real; `resetForPage` recarrega e dá play.
- **Botão de voz (`Volume2`) inerte:** ligar ao mod `narration-voice` (abrir seletor; ao trocar, recarregar `audioUri`/`wordTimings` e `resetForPage`).
- **audio mode** (silent switch / foco de áudio) e **unload** ao desmontar/trocar de página.
- **Estados de loading/erro** do áudio (buffering, falha de rede, ausência de `audioUri`).

## Dependências & questões em aberto
- `expo-audio` (integração no hook). `narration-voice` (ação do botão de voz).
- Scrubber por **arraste contínuo** (hoje é só toque) — avaliar `PanResponder`/gesture.
- Acessibilidade do scrubber (`accessibilityRole="adjustable"`).
