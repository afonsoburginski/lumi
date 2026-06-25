# Feature: Autoplay / auto-avanço  ·  `player/autoplay`

> A narração inicia sozinha e, ao terminar o áudio de uma página, avança automaticamente para a próxima.

- **Prioridade:** P1 · **Status:** 🟢 implementado (sobre áudio simulado)
- **Rota/entrada:** comportamento implícito do `StoryPlayer` ao abrir e ao tocar

## User story & valor
Como **criança**, quero que a história continue sozinha de página em página, para ficar imersa sem precisar tocar em nada.

## Comportamento esperado
- **Início automático:** ao montar uma página, `usePlayback` começa com `isPlaying = true` (narração toca sozinha).
- **Auto-avanço:** um `useEffect` observa `positionMs >= durationMs`; quando o áudio da página atual termina **e** há próxima página, chama `goToPage(currentPage + 1)`.
- **Nova página:** `onMomentumScrollEnd` chama `resetForPage`, que zera a posição e mantém `isPlaying = true` → a próxima página toca automaticamente.
- **Última página:** ao terminar, **não** avança (fica parado na última); candidata a `story_complete`.
- **Pausa:** se o usuário pausa, o auto-avanço não dispara (a posição não atinge `durationMs`).

## UI / Atomics
| Camada | Componente | Origem |
|--------|-----------|--------|
| organismo | StoryPlayer | @/components/story/StoryPlayer |
| hook | usePlayback | interno (StoryPlayer.tsx) |

Sem UI dedicada — é orquestração de estado/efeitos.

## Dados & estado
- **Entrada:** `positionMs`, `durationMs` (de `usePlayback`), `currentPage`, `story.pages.length`.
- **Efeito:** `goToPage(currentPage + 1)` quando o áudio termina e há próxima página.
- **Persistência:** nenhuma.

## Regras & validações
- Só avança se `durationMs > 0 && positionMs >= durationMs && currentPage < pages.length - 1`.
- Em página pausada, não avança.
- Evitar avanço duplo (a posição é clampada a `durationMs`, mas validar ao migrar para o evento "didJustFinish" do áudio real).

## Estados de UI
- *tocando → fim → transição* para a próxima página (animada via `scrollToIndex`).
- *última página, fim:* permanece; (futuro) UI de conclusão / "ler de novo".

## Telemetria
- `story_complete` { storyId, durationMs } — ao concluir o áudio da **última** página.
- `page_view` { via: 'autoplay' } — na troca automática de página.

## Critérios de aceite (verificáveis)
- [ ] Dado que abro o player, quando a página carrega, então a narração inicia automaticamente.
- [ ] Dado o fim do áudio em uma página intermediária, quando concluído, então avança para a próxima e ela toca sozinha.
- [ ] Dado que pausei, quando o tempo passa, então não há auto-avanço.
- [ ] Dado o fim do áudio na última página, quando concluído, então não avança e emite `story_complete`.

## O que falta para o áudio REAL
- Hoje o "fim" é detectado pelo timer simulado (`positionMs` atinge `durationMs`). Com `expo-audio`, usar o evento de término do `onPlaybackStatusUpdate` ("didJustFinish") como gatilho primário, mantendo o `useEffect` como guarda.
- Tratar latência de carregamento do áudio da próxima página (evitar avançar para uma tela "muda").

## Dependências & questões em aberto
- `expo-audio` (evento de término real). `autoplay` em background/tela bloqueada — fora de escopo por ora.
- Toggle de "autoplay" (alguns pais podem querer avanço manual) — a avaliar como preferência.
- UI de conclusão na última página (replay / fechar) — a especificar.
