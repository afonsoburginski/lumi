# Feature: TTS & WordTimings · `narration-voice/tts-timings`

Geração da narração: converte o texto de cada `StoryPage` em **áudio** + **wordTimings** (sincronização palavra-a-palavra), usando a `VoiceProfile` escolhida (preset ou clonada), e entrega ao `player` para o karaokê.

- **Prioridade:** Alta (núcleo técnico do mod)
- **Status:** ⛔ Não iniciado
- **Rota:** sem UI própria (serviço); acionado por `story-creation` / seleção de voz e consumido pelo `player`

---

## User story & valor

> Como cuidador, quero que a história seja narrada e que as palavras acendam no ritmo certo, para meu filho acompanhar a leitura (karaokê).

Valor: é o que liga "voz escolhida" à experiência de leitura assistida do player.

---

## Comportamento esperado

- **Dado** uma história com voz selecionada, **quando** a narração é solicitada, **então** para cada `StoryPage` é gerado um `NarrationAsset { pageId, voiceProfileId, audioUri, wordTimings, status }`.
- **Dado** o texto da página, **quando** chamo `VoiceProvider.synthesize(text, providerVoiceId)`, **então** recebo `{ audio, wordTimings[] }` (TTS **com timestamps por palavra**).
- **Dado** o áudio gerado, **quando** persisto, **então** gravo `audioUri` (cache local + storage) e os `wordTimings` na `StoryPage` correspondente.
- **Dado** que o texto da página muda, **quando** detecto a alteração, **então** invalido o asset e **regenero**.
- **Dado** uma falha de síntese, **quando** ocorre, **então** o asset fica `error` e a geração pode ser reexecutada.

### Como o áudio e os wordTimings são produzidos e entregues ao player

1. **Entrada:** texto da `StoryPage` + `providerVoiceId` da `VoiceProfile` ativa.
2. **Moderação:** texto passa por `safety` antes da síntese.
3. **Síntese:** `VoiceProvider.synthesize` retorna o **áudio** e os **timestamps por palavra**.
   - Se o provider **não** fornecer timestamps, aplicar **forced alignment** (alinhamento texto↔áudio) para derivar `wordTimings`.
4. **Normalização:** mapear cada palavra do texto para `{ word, startMs, endMs }` (mesma ordem/tokenização que o player espera).
5. **Persistência:** salvar `audioUri` (arquivo reproduzível) + `wordTimings` no `NarrationAsset` e refletir em `StoryPage.audioUri` / `StoryPage.wordTimings`.
6. **Entrega ao player:** o `player` lê `StoryPage.audioUri` (reprodução via expo-audio/`audio-player`) e usa `wordTimings` para destacar a palavra atual conforme a posição do áudio (karaokê).

---

## UI / Atomics

- Sem UI dedicada. Estados de progresso refletem em quem dispara a geração (ex.: `spinner`/`badge` "Gerando narração…" em `story-creation` e no catálogo de vozes).

---

## Dados & estado

```ts
type WordTiming = { word: string; startMs: number; endMs: number };
type NarrationAsset = {
  pageId: string;
  voiceProfileId: string;
  audioUri: string;
  wordTimings: WordTiming[];
  status: 'ready' | 'processing' | 'error';
};
```

- Chave de cache: `(pageId, voiceProfileId, textHash)` — regenerar quando o `textHash` muda.

---

## Regras & validações

- Texto narrado **moderado por `safety`** antes da síntese.
- `wordTimings` devem cobrir o texto na ordem correta; `startMs < endMs` e monotonicamente crescentes.
- Voz clonada exige `VoiceProfile.status === 'ready'` e consentimento válido para ser usada.
- Idade/consentimento são validados na clonagem (feature `voice-cloning`); aqui apenas verifica-se o `status`.

---

## Estados de UI

- **Gerando:** `processing` (indicador em quem disparou).
- **Pronto:** `ready` — player habilitado.
- **Erro:** `error` — opção de regenerar.

---

## Telemetria

- `narration_generated` { pageId, voiceType, latencyMs }
- `narration_generation_failed` { pageId, reason }
- `narration_regenerated` { pageId, cause: 'text_changed' | 'voice_changed' }

---

## Critérios de aceite (verificáveis)

- [ ] Para cada página gera-se `audioUri` reproduzível **e** `wordTimings` válidos.
- [ ] `wordTimings` estão na ordem do texto, com `startMs < endMs` e crescentes.
- [ ] O player reproduz o áudio e destaca palavras em sincronia (karaokê).
- [ ] Mudança de texto ou de voz dispara regeneração (cache por `textHash`/voz).
- [ ] Falha de síntese deixa asset em `error` e permite regenerar.
- [ ] Texto passa por `safety` antes de virar áudio.

---

## Dependências & questões em aberto

- Depende do `VoiceProvider` (TTS com timestamps) e de `safety`; consumido por `player`.
- Provider entrega timestamps por palavra nativamente ou precisa de forced alignment?
- Pré-gerar a história inteira (latência inicial maior) vs. gerar por página sob demanda?
- Política de cache/retenção do áudio gerado e custo por minuto sintetizado.
- Tokenização das palavras deve casar exatamente com a do `player` (acentos, pontuação).
