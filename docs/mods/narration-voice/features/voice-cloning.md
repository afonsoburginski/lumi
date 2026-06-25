# Feature: Voz Customizada / Clonagem · `narration-voice/voice-cloning`

Fluxo amigável onde o **cuidador** lê um pequeno texto na tela para registrar e clonar a própria voz; o app passa a narrar as histórias **na voz dele**, criando conexão emocional. Apenas usuário **logado** e com **consentimento explícito**.

- **Prioridade:** Alta (diferencial do produto)
- **Status:** ⛔ Não iniciado
- **Rota:** modal `voice-clone` (`src/app/(modals)/voice-clone.tsx`)

---

## User story & valor

> Como cuidador, quero clonar minha voz lendo um textinho, para que meu filho ouça as histórias "na minha voz" mesmo quando eu não estou junto.

Valor: vínculo afetivo — a feature emblemática do Lumi.

---

## Comportamento esperado

- **Dado** que abro o modal de clonagem, **quando** não estou logado, **então** sou direcionado a entrar (`auth`).
- **Dado** o passo de consentimento, **quando** não aceito o termo / não confirmo ser adulto, **então** não consigo avançar.
- **Dado** o passo de gravação, **quando** leio o roteiro exibido e gravo (`Mic` → `Square`), **então** posso ouvir e **regravar** antes de enviar.
- **Dado** amostra(s) válida(s), **quando** toco em **Enviar**, **então** o perfil entra em `processing` e vejo progresso.
- **Dado** o processamento concluído, **quando** termina, **então** a voz fica `ready` e disponível para narrar; em falha, vejo erro com "tentar de novo".
- **Dado** uma voz clonada, **quando** escolho **Excluir**, **então** ela é revogada (`status='revoked'`), o provider é notificado e amostras/áudios são apagados.

---

## UI / Atomics

- **Organismo:** `VoiceCloneFlow` — orquestra os passos (consentimento → gravação → revisão → envio → processando → resultado).
- **Moléculas:** `ConsentSheet` (`ShieldCheck`, checkbox adulto, link da política), `RecordPrompt` (roteiro + `Mic`/`Square` + medidor + prévia `Play`/`Pause`).
- **Átomos:** `text`, `view`, `button`, `input`, `icon`, `badge`, `card`, `separator`, `spinner`.
- **Áudio:** `audio-recorder` (captura, expo-audio) + `audio-player` (revisar amostra).
- **Ícones lucide:** `ShieldCheck`, `Mic`, `Square`, `Play`, `Pause`, `Sparkles`.

---

## Dados & estado

- Cria `VoiceProfile { type:'cloned', ownerId, label, providerVoiceId, status, consent }`.
- `consent { grantedBy, grantedAt, recorderIsAdult, policyVersion }` obrigatório.
- Estado do fluxo: `step`, `samples[]` (uris locais), `submitStatus`, `pollingStatus`.
- Após `ready`, perfil entra no catálogo de vozes do usuário (`VoicePresetList` mostra também vozes clonadas).

---

## Regras & validações

- **Login obrigatório** (`auth`).
- **Consentimento explícito** aceito + **confirmação de adulto** (`recorderIsAdult=true`) antes de gravar — idade mínima do gravador.
- **Qualidade mínima da amostra:** duração mínima e checagem básica de áudio (silêncio/ruído) — bloqueia envio se inválida.
- **`safety`:** moderação do fluxo/conteúdo; uso restrito a narrar histórias da própria família.
- **Finalidade restrita** e **direito de exclusão** registrados no perfil.

---

## Estados de UI

- **Bloqueado (não logado):** CTA para entrar.
- **Consentimento pendente:** botão "Avançar" desabilitado.
- **Gravando:** indicador + `Square` para parar.
- **Revisão:** prévia + "Regravar" / "Enviar".
- **Enviando / Processando:** `spinner` + texto de progresso.
- **Pronto:** sucesso + "Usar esta voz".
- **Erro:** mensagem + "tentar de novo".

---

## Telemetria

- `voice_clone_started`
- `voice_clone_consent_accepted` { policyVersion }
- `voice_clone_sample_recorded` { durationMs, attempt }
- `voice_clone_submitted`
- `voice_clone_ready` / `voice_clone_failed` { reason }
- `voice_profile_deleted` { type: 'cloned' }

> Nunca registrar áudio bruto.

---

## Critérios de aceite (verificáveis)

- [ ] Modal exige login e consentimento (com confirmação de adulto) antes de gravar.
- [ ] Gravação, prévia e regravação funcionam via expo-audio.
- [ ] Amostra inválida (curta/ruidosa) é bloqueada com mensagem clara.
- [ ] Envio cria `VoiceProfile` em `processing` e transita para `ready`/`error`.
- [ ] Voz `ready` aparece no catálogo e pode narrar histórias.
- [ ] Exclusão revoga o perfil, notifica o provider e remove amostras/áudios.

---

## Dependências & questões em aberto

- Depende de `auth`, `safety`, `tts-timings` e do provider de clonagem.
- Quantas amostras e qual duração para um clone de boa qualidade?
- Tempo de processamento (UX de espera) — notificar quando ficar pronto?
- Texto do roteiro de leitura (cobertura fonética em PT-BR) e versão da política de consentimento.
