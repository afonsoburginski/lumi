# Spec: Economia & Performance de Narração

> "TTS é o asset mais caro do app. Cada (voz, texto) deve ser sintetizado **no
> máximo uma vez na vida da plataforma**." — premissa de produto.

## Problema

Hoje o app dispara `POST /voice/synthesize` em vários momentos:

- Toda vez que a criança abre o livrinho e troca de voz (se a voz/página ainda
  não está em cache local).
- Toda vez que o usuário aperta o "preview da voz" no perfil (sample fixo).
- Toda vez que o pré-bake roda em background.

O resultado: **mesma frase sintetizada N vezes** (uma por device, uma por sessão
sem cache, etc.) — queimando cota de ElevenLabs (free 10k chars/mês) e Gemini
(10/dia). Plus o usuário ouve loading de 8-18s por troca de voz.

## Princípios

1. **TTS é um one-shot**. Síntese só acontece em 2 momentos:
   - **Publicação de história** (`POST /stories`) — background prebake do servidor.
   - **Primeiro preview** de uma voz no profile — content-addressed por (voz, sample).
2. **R2 é a SOT**. Toda leitura na vida útil da história usa o áudio do R2 (ou
   sua cópia local no device).
3. **Mobile nunca pede TTS por conta própria**. O caminho normal de leitura
   nunca cai em `/voice/synthesize`. Esse endpoint vira um "último recurso"
   (livrinho ainda não pré-bakeado, sample novo).
4. **Picker mostra só o que existe**. Vozes ainda não pré-bakeadas (cota
   estourada, erro) ficam ocultas no livrinho — em vez de tocar voz errada
   (fallback morto).

## Camadas de cache

```
device:    documentDirectory/lumi/stories/<id>/audio/<voice>/<page>.<ext>
                                              /<voice>/<page>.json
           documentDirectory/lumi/previews/<voice>.<ext>
                                          /<voice>.json
   ↑ download (sem síntese)
R2:        stories/<id>/audio/<voice>/<page>.<ext>     (real blob + sidecar .json)
           previews/<sha(voice+sample)>.<ext>          (real blob + sidecar .json)
   ↑ síntese (uma vez na vida)
provider:  ElevenLabs / Gemini TTS
```

## Fluxos

### A. Criação de história (custo de TTS pago aqui)

1. `POST /stories` persiste a história no DB.
2. `prebakeStoryInBackground(storyId)` enfileira síntese de `pages × ACTIVE_VOICE_PRESETS`.
3. Por (page, voiceId): sintetiza → `stories/<id>/audio/<voiceId>/<pageId>.<ext>`
   + sidecar `.json` (timings + duração). Idempotente — pula o que já existe.

### B. Abrir livrinho (sem custo de TTS)

1. Mobile chama `GET /stories/:id/manifest` (em memória pelo resto da sessão).
2. **Prefetch eager**: baixa todos os `audioByVoice` pro device em background.
3. **Picker** mostra só as vozes que aparecem em `audioByVoice` (filtradas).
4. Ao trocar de voz, `fetchNarration` resolve:
   - arquivo local → toca direto
   - manifest do R2 → baixa do CDN (sem síntese) → toca
   - `/voice/synthesize` apenas se a história NÃO foi pré-bakeada (raro).

### C. Preview de voz no profile (custo de TTS = 1 chamada por voz NOVA)

1. Mobile chama `fetchNarration({ text: SAMPLE, voiceId })` — sem storyId.
2. Mobile checa `lumi/previews/<voiceId>.{mp3,wav}` local → toca se houver.
3. Sem local: `POST /voice/synthesize { text: SAMPLE, voiceId }`.
4. Server salva em `previews/<sha(voiceId+SAMPLE)>.<ext>` (idempotente — toda
   primeira vez sintetiza; subsequentes só devolvem a URL).
5. Mobile baixa o áudio pro `lumi/previews/<voiceId>.<ext>` → próximas previews
   da mesma voz são instantâneas, zero rede.

### D. Voz nova adicionada ao catálogo

- Sem ação automática. Só sintetiza quando alguém aperta preview ou quando uma
  história é prebakeada e essa voz está no `ACTIVE_VOICE_PRESETS`.

## Anti-patterns proibidos

- **Síntese sem checar R2 primeiro** — server-side, `/voice/synthesize` SEMPRE
  consulta `getText(metaKey)` antes de chamar o provider.
- **Fallback cross-vendor** — REMOVIDO. Voz indisponível → erro propagado →
  picker mobile esconde a voz.
- **Síntese por device** — proibido. O mobile baixa do R2 ou pede ao server,
  nunca chama provider direto.

## Métricas / monitoramento

- Server-side log: `[voice] cache_hit` vs `cache_miss` (synth call). Idealmente
  > 95% hit ratio depois das primeiras horas de uso.
- Bucket R2: tamanho da pasta `stories/<id>/audio/` cresce linearmente
  no número de histórias publicadas, NÃO no número de plays.

## Edge cases

- **Free tier estourada** (ElevenLabs 401, Gemini 429): voz vira indisponível
  no manifest até o reset. Picker esconde. Usuário não vê erro, vê só as vozes
  que funcionam.
- **Texto da seed muda**: invalidar cache na mão é caro — o ideal é que textos
  sejam imutáveis pós-publicação. Pra seeds (Catarina), congelar.
- **Sample do profile muda**: invalida automaticamente porque a key é
  content-addressed por (voiceId + sample). Histórico de samples órfãos pode
  ser limpo via cleanup script.

## Implementação (esta PR)

- [x] Catálogo: 5 ElevenLabs Pro (carla default, luna, graziella, amanda, yasmin) + 3 Gemini.
- [x] Catalog-provider strict: sem fallback cross-vendor.
- [x] `fetchNarration` no mobile checa **manifest do R2** antes de bater na síntese.
- [x] Cache local de previews por `voiceId` (mobile).
- [x] Picker filtra vozes não pré-bakeadas (manifest do R2).
- [x] Manifest endpoint tolera história só-bundled (sem registro no DB).
- [x] Bundled audio removido do seed (era voz fora do catálogo agora).

## Não-objetivos (out of scope)

- Cross-story dedup por (voice, text) — adia até virar problema (textos AI
  raramente repetem exatamente entre stories).
- UI de progresso do prefetch — silencioso por enquanto, depois.
- Re-prebake automático quando voz/cota volta — manual via script.
