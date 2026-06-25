# Feature: Presets de Voz de IA · `narration-voice/voice-presets`

Catálogo de vozes de IA prontas (ex.: **Narrador Épico**, **Fada**, **Vovô**) que o cuidador pode pré-ouvir e escolher para narrar a história, sem precisar gravar nada.

- **Prioridade:** Alta
- **Status:** ⛔ Não iniciado
- **Rota:** tela/aba de vozes (lista de presets) + seleção a partir de `story-creation`

---

## User story & valor

> Como cuidador, quero escolher uma voz de IA bonita e pré-ouvi-la, para dar personalidade à história sem ler em voz alta toda vez.

Valor: gratificação imediata (zero fricção), serve de "porta de entrada" antes da clonagem.

---

## Comportamento esperado

- **Dado** que abro a lista de vozes, **quando** a tela carrega, **então** vejo os presets com nome, ícone/`avatar` e badge de categoria.
- **Dado** um preset, **quando** toco em **prévia** (`Play`), **então** ouço uma amostra curta; **quando** toco de novo (`Pause`), **então** pausa.
- **Dado** um preset, **quando** toco em **Selecionar**, **então** ele vira a voz ativa da história (persistido) e há feedback visual.
- **Dado** que troco de preset, **quando** confirmo, **então** a narração da história será (re)gerada com a nova voz (ver `tts-timings`).

---

## UI / Atomics

- **Molécula:** `VoicePresetList` — lista/grade de `card`s.
- **Por item:** `avatar`/`icon` (`Sparkles`), `text` (nome + descrição), `badge` (categoria), botão de prévia (`Play`/`Pause`), botão **Selecionar** (`button`), `spinner` enquanto a prévia carrega.
- **Átomos:** `text`, `view`, `button`, `icon`, `badge`, `avatar`, `card`, `separator`, `spinner`.
- **Áudio:** `audio-player` (BNA UI) para a prévia.
- **Ícones lucide:** `Play`, `Pause`, `Sparkles`.

---

## Dados & estado

- Lê catálogo de `VoiceProfile` com `type: 'preset'` (`status: 'ready'`).
- Estado de seleção: `selectedVoiceProfileId` por história (persistido).
- Estado de prévia: `previewingId | null`, `isLoadingPreview`.

---

## Regras & validações

- Presets disponíveis para qualquer usuário (não exigem login para pré-ouvir), mas **selecionar para uma história** segue regra do `story-creation`.
- Texto narrado passa por `safety` antes de virar áudio (na geração, em `tts-timings`).
- Sem consentimento aqui — presets não usam voz de pessoa real.

---

## Estados de UI

- **Carregando lista:** `spinner`.
- **Prévia carregando:** `spinner` no item.
- **Tocando prévia:** ícone `Pause`.
- **Selecionado:** `badge`/realce "Voz atual".
- **Vazio/erro de catálogo:** mensagem + "tentar de novo".

---

## Telemetria

- `voice_preset_previewed` { presetId }
- `voice_preset_selected` { presetId, storyId? }

---

## Critérios de aceite (verificáveis)

- [ ] Lista exibe todos os presets `ready` com nome, ícone e categoria.
- [ ] Prévia toca e pausa corretamente; só uma prévia toca por vez.
- [ ] Selecionar um preset persiste e mostra "Voz atual".
- [ ] Trocar de preset dispara (re)geração da narração da história.
- [ ] Estados de carregamento/erro são exibidos.

---

## Dependências & questões em aberto

- Depende de `tts-timings` para gerar a narração final com a voz escolhida.
- Amostras de prévia: pré-gravadas pelo provider ou sintetizadas sob demanda?
- Quais presets no lançamento e como localizá-los em PT-BR?
