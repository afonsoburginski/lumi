# Mod: Narração & Clonagem de Voz

> A grande feature do Lumi. Transforma o texto das histórias em narração com áudio + timings palavra-a-palavra, usando vozes de IA (presets) ou a **voz clonada do próprio cuidador**, criando conexão emocional na hora de contar a história.

- **Status:** ⛔ Não iniciado
- **Depende de:** `auth` (clonagem só para usuário logado), `safety` (moderação de áudio/consentimento/conteúdo)
- **É usado por:** `player` (consome `audioUri` + `wordTimings` para o karaokê), `story-creation` (escolha da voz ao criar/gerar a história)
- **Rotas (src/app):**
  - Modal `voice-clone` — fluxo de clonagem de voz (`src/app/(modals)/voice-clone.tsx`)
  - Tela/aba de gerenciamento de vozes (lista de presets + vozes clonadas)

---

## Objetivo & escopo

**Objetivo:** dar a cada história uma narração de qualidade, com sincronização de palavras para o karaokê do player, oferecendo (A) vozes de IA prontas e (B) a voz clonada do cuidador.

**No escopo:**
- Catálogo de **presets** de voz de IA (Narrador Épico, Fada, Vovô, etc.).
- Fluxo **amigável de clonagem**: consentimento → gravar amostra(s) → enviar → processar → pronto/erro.
- Geração de **áudio de narração** + **wordTimings** por página (TTS com timestamps).
- Persistência de `VoiceProfile` e `NarrationAsset`; seleção da voz ativa por história.
- Privacidade/LGPD da voz (dado biométrico/sensível): consentimento, retenção, exclusão.

**Fora do escopo:**
- Player/karaokê em si (mod `player`).
- Geração do texto da história (mod `story-creation`).
- Edição de áudio manual / mixagem com trilha sonora (futuro).

---

## User stories

- **Como cuidador**, quero escolher uma voz de IA bonita para narrar a história, para não precisar ler em voz alta toda vez.
- **Como cuidador**, quero **clonar minha própria voz** lendo um textinho na tela, para que meu filho ouça a história "na minha voz" mesmo quando eu não estiver por perto.
- **Como cuidador**, quero ter certeza de que **só eu autorizo** o uso da minha voz e poder **excluí-la** quando quiser.
- **Como criança (via player)**, quero ver as palavras acenderem no ritmo da narração (karaokê).
- **Como responsável pela conta**, quero que vozes clonadas sejam usadas **apenas para narrar histórias da minha família**.

---

## Features (índice)

| # | Feature | Slug | Status |
|---|---------|------|--------|
| 1 | Presets de Voz de IA | [`voice-presets`](./features/voice-presets.md) | ⛔ |
| 2 | Voz Customizada / Clonagem | [`voice-cloning`](./features/voice-cloning.md) | ⛔ |
| 3 | TTS & WordTimings (geração de narração) | [`tts-timings`](./features/tts-timings.md) | ⛔ |

---

## Modelo de dados (deste mod)

```ts
type VoiceProfile = {
  id: string;
  ownerId: string;                 // userId (auth) — dono do perfil de voz
  type: 'preset' | 'cloned';
  label: string;                   // "Narrador Épico", "Voz da Mamãe"
  providerVoiceId: string;         // id da voz no provider externo de TTS/clone
  status: 'ready' | 'processing' | 'error' | 'revoked';
  consent?: {                      // obrigatório quando type === 'cloned'
    grantedBy: string;             // userId que consentiu (dono da voz)
    grantedAt: string;             // ISO date
    recorderIsAdult: boolean;      // confirmação de que o gravador é adulto
    policyVersion: string;         // versão do termo de consentimento aceito
  };
};

type WordTiming = { word: string; startMs: number; endMs: number };

type NarrationAsset = {
  pageId: string;                  // StoryPage.id (mod player)
  voiceProfileId: string;          // qual voz gerou este áudio
  audioUri: string;                // arquivo local/remoto reproduzível
  wordTimings: WordTiming[];       // sincronização para o karaokê
  status: 'ready' | 'processing' | 'error';
};
```

> O `player` lê `StoryPage.audioUri` e `StoryPage.wordTimings`. Este mod **produz** esses valores a partir de `NarrationAsset` (ver `tts-timings`).

---

## Estados & fluxos

**Fluxo de clonagem (caminho feliz):**

```
[Consentimento] → [Gravar amostra(s)] → [Revisar/Re-gravar] → [Enviar]
       → [Processando] → [Pronto ✓]  (VoiceProfile.status = 'ready')
```

- **Consentimento (ConsentSheet):** explica o uso, dado biométrico/LGPD, exige confirmar "sou adulto e autorizo". Sem aceite → não avança.
- **Gravar amostra(s) (RecordPrompt):** o cuidador lê o roteiro exibido; expo-audio captura. Pode regravar.
- **Enviar:** upload da(s) amostra(s) ao provider.
- **Processando:** estado assíncrono; perfil fica `processing`; pode levar segundos/minutos.
- **Pronto / Erro:** `ready` (utilizável) ou `error` (mensagem + ação "tentar de novo").

**Fluxo de narração de uma história:**

```
[Escolher VoiceProfile] → para cada StoryPage: [gerar NarrationAsset (TTS+timestamps)]
       → [persistir audioUri + wordTimings] → player pronto para tocar
```

---

## UI (Atomic Design)

- **Organismo:** `VoiceCloneFlow` — orquestra o fluxo multi-etapas (consentimento → gravação → envio → processando → resultado). Renderizado no modal `voice-clone`.
- **Moléculas:**
  - `VoicePresetList` — grade/lista de presets com `card`, `avatar`, `badge`, botão de **prévia** (`Play`/`Pause`).
  - `RecordPrompt` — exibe o roteiro a ler + controles de gravação (`Mic`, `Square`) e medidor; usa o `audio-recorder`.
  - `ConsentSheet` — termo de consentimento com `ShieldCheck`, checkbox de adulto, link da política.
- **Átomos BNA UI:** `text`, `view`, `button`, `input`, `icon` (lucide), `badge`, `avatar`, `card`, `separator`, `spinner`.
- **Áudio (adicionar via BNA UI):**
  ```bash
  npx bna-ui add audio-recorder
  npx bna-ui add audio-player
  ```
- **Ícones lucide:** `Mic`, `Play`, `Pause`, `Square`, `Sparkles`, `ShieldCheck`.

---

## Integrações

- **Provider de TTS / Voice Cloning (serviço externo abstrato):** interface `VoiceProvider` desacoplada do fornecedor concreto:
  - `cloneVoice(samples) -> providerVoiceId` (assíncrono, com status)
  - `synthesize(text, providerVoiceId) -> { audio, wordTimings }` (TTS com timestamps)
  - `deleteVoice(providerVoiceId)`
- **expo-audio:** captura das amostras (gravação) e reprodução de prévias.
- **Storage de áudio:** arquivos de narração e amostras (local cache + storage remoto da conta); referências em `NarrationAsset.audioUri`.
- **`safety`:** moderação do conteúdo de áudio/consentimento e checagem de uso aceitável.
- **`auth`:** identidade do `ownerId` e gating (clonagem só logado).

---

## Segurança & privacidade

- **Consentimento explícito** do dono da voz é **obrigatório** para clonagem (`VoiceProfile.consent`), com versão de política registrada.
- **Dado biométrico/sensível (LGPD):** amostras de voz e voz clonada são tratadas como dado sensível — finalidade restrita, base legal = consentimento.
- **Finalidade restrita:** voz clonada usada **apenas para narrar histórias da própria família/conta**. Proibido uso fora disso.
- **Idade mínima do gravador:** apenas adulto pode registrar/clonar voz (confirmado no consentimento).
- **Retenção & exclusão:** o dono pode **revogar/excluir** a voz a qualquer momento → `status='revoked'` e `deleteVoice` no provider; amostras locais e remotas apagadas.
- **Moderação:** via `safety` (texto narrado e fluxo de consentimento).
- **Acesso:** vozes clonadas só visíveis/usáveis pelo `ownerId`.

---

## Telemetria

- `voice_preset_previewed` { presetId }
- `voice_preset_selected` { presetId, storyId? }
- `voice_clone_started` / `voice_clone_consent_accepted` { policyVersion }
- `voice_clone_sample_recorded` { durationMs, attempt }
- `voice_clone_submitted` / `voice_clone_ready` / `voice_clone_failed` { reason }
- `voice_profile_deleted` { type }
- `narration_generated` { pageId, voiceType, latencyMs }
- `narration_generation_failed` { pageId, reason }

> Nunca registrar conteúdo de áudio bruto na telemetria.

---

## Critérios de aceite (do mod)

- [ ] Usuário logado vê e pode **pré-ouvir** presets e selecioná-los para narração.
- [ ] Fluxo de clonagem completo funciona: consentimento → gravação → envio → processando → pronto.
- [ ] Clonagem **bloqueada** sem consentimento aceito e sem login.
- [ ] Cada `NarrationAsset` gerado entrega `audioUri` **e** `wordTimings` válidos ao player.
- [ ] O player consegue reproduzir a narração com karaokê sincronizado usando esses dados.
- [ ] Dono consegue **excluir** sua voz; áudios/amostras são removidos e o provider é notificado.
- [ ] Estados de processamento/erro são visíveis e recuperáveis.

---

## Questões em aberto

- Qual **provider** de TTS/clonagem (qualidade PT-BR, suporte a timestamps por palavra, custo)?
- **Latência** aceitável para gerar narração de uma história inteira (pré-gerar todas as páginas vs. sob demanda)?
- **Custo** por minuto sintetizado / por voz clonada — limites por conta?
- **Qualidade mínima da amostra** (duração, ruído) e quantas amostras para um clone bom?
- Os `wordTimings` vêm do provider ou precisam de alinhamento forçado (forced alignment) próprio?
- Armazenar áudio gerado (cache) por quanto tempo? Regerar quando o texto muda.

---

## Plano de implementação

1. **Contratos & dados:** definir tipos `VoiceProfile`, `NarrationAsset`, `WordTiming` e a interface `VoiceProvider` (mock primeiro).
2. **Átomos de áudio:** `bna-ui add audio-recorder audio-player`; validar gravação/reprodução com expo-audio.
3. **Presets (feature 1):** `VoicePresetList` + prévia + seleção persistida.
4. **TTS & timings (feature 3):** integrar `synthesize`, persistir `NarrationAsset`, expor ao player; mock → provider real.
5. **Clonagem (feature 2):** `ConsentSheet` → `RecordPrompt` → envio → polling de status → `VoiceCloneFlow` no modal.
6. **Privacidade:** exclusão/revogação, retenção, ganchos do `safety`.
7. **Telemetria & critérios de aceite:** instrumentar eventos e validar ponta a ponta com o `player`.
