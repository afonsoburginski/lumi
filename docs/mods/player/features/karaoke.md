# Feature: Karaokê (realce da palavra)  ·  `player/karaoke`

> Realça a palavra que está sendo narrada, sincronizada ao áudio, para a criança acompanhar a leitura.

- **Prioridade:** P0 · **Status:** 🟢 base implementada · ⚠️ sincroniza com a posição **simulada**; falta atrelar ao áudio real
- **Rota/entrada:** texto sobreposto na página, dentro de `StoryPlayer`

## User story & valor
Como **criança (3–12)**, quero ver destacada a palavra que está sendo falada, para acompanhar a história mesmo sem ler tudo sozinha.

## Comportamento esperado
- O texto da página é renderizado a partir de `page.wordTimings` (`{ word, startMs, endMs }`).
- A palavra **ativa** é aquela onde `positionMs >= startMs && positionMs < endMs`; ela recebe realce (fundo amarelo `Colors.light.yellow` sobre tinta escura `#1E1B2E`).
- A `positionMs` usada é a da **página atual**; páginas fora de foco recebem `positionMs = 0` (sem realce).
- **Fallback:** sem `wordTimings` (ou lista vazia), renderiza `page.text` puro, sem realce.
- Espaçamento entre palavras é reinserido na renderização (um espaço entre tokens).

## UI / Atomics
| Camada | Componente | Origem |
|--------|-----------|--------|
| molécula | KaraokeText (a extrair) | interno → futura molécula |
| átomo | Text (RN) | react-native |
| token | cor de realce (`HIGHLIGHT`) | Colors.light.yellow (theme/colors) |

- Estilo do texto: `fontSize 22`, `lineHeight 33`, `fontWeight 600`, `textShadow` para legibilidade sobre a ilustração.

## Dados & estado
- **Entrada:** `page: StoryPage` (usa `wordTimings` e `text`), `positionMs: number`.
- **Estado:** sem estado próprio; é função pura de `(wordTimings, positionMs)`.
- **Origem dos dados:** `wordTimings` vêm do mod `narration-voice` (TTS / clonagem de voz).

## Regras & validações
- Comparação de intervalo half-open `[startMs, endMs)` para não realçar duas palavras na fronteira.
- `wordTimings` devem estar ordenados e cobrir o texto; divergência texto×timings é tratada renderizando só os timings (a validar na origem).
- (safety) o texto exibido é o da história já aprovada.

## Estados de UI
- *com timings:* uma palavra realçada por vez conforme `positionMs`.
- *sem timings:* texto puro (sem realce).
- *pausado:* realce congela na palavra corrente.
- *erro de sync:* (a tratar) timings ausentes/desalinhados → cair no fallback de texto puro.

## Telemetria
- Sem evento próprio. A qualidade do karaokê é observada via `story_complete` (conclusão) e feedback qualitativo.

## Critérios de aceite (verificáveis)
- [ ] Dado uma página com `wordTimings`, quando `positionMs` entra em `[startMs, endMs)` de uma palavra, então **apenas** essa palavra fica realçada.
- [ ] Dado uma página sem `wordTimings`, quando renderizada, então o texto aparece sem realce e sem quebrar.
- [ ] Dado que pauso a narração, quando paro, então a palavra realçada permanece a do `positionMs` atual.
- [ ] Dado que a página não é a atual, quando visível na lista, então nenhuma palavra fica realçada.

## O que falta para o áudio REAL
- Hoje o realce segue a `positionMs` do **timer simulado** (`usePlayback`, passo 50ms). Ao integrar `expo-audio`, o realce passará a depender de `onPlaybackStatusUpdate`, cujo intervalo costuma ser **maior** (~100–250ms) → realce pode "saltar" palavras curtas.
- Mitigações a especificar: interpolar `positionMs` entre updates (relógio local entre callbacks), aplicar tolerância/limiar, ou pré-agendar a troca de palavra pelo `endMs`.
- Garantir que `wordTimings` e `audioUri` venham do **mesmo** processamento TTS para que os tempos batam.

## Dependências & questões em aberto
- **`narration-voice`:** formato e precisão dos `wordTimings`; o que acontece ao trocar de voz (timings mudam → recalcular).
- **Sincronização fina:** definir estratégia de interpolação e a frequência alvo de atualização.
- **Acessibilidade:** opção de aumentar fonte / contraste do realce para crianças com baixa visão (a avaliar).
