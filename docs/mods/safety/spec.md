# Mod: Segurança & Moderação (Safety First)

> ShieldCheck — A segurança da criança vem **antes** de qualquer outra coisa. Nenhum conteúdo chega aos olhos de uma criança sem passar por este mod.

- **Status:** ⛔ Não iniciado
- **Natureza:** Transversal (cross-cutting). Não é uma jornada de usuário isolada — é um *guardrail* que envolve as jornadas dos outros mods.
- **É usado por:**
  - `story-creation` — moderação de **entrada** (contexto + imagem do usuário) e de **saída** (história gerada).
  - `community` — **publicação** apenas de conteúdo aprovado + **report** de usuários + **comentários** filtrados.
  - `narration-voice` — **consentimento** e tratamento de **áudio/voz** como dado sensível.

---

## Objetivo & escopo

Garantir que **100% do conteúdo** exibido a uma criança no Lumi seja apropriado para a faixa etária, livre de violência, linguagem imprópria, temas adultos, ódio e estímulo a perigo/auto-lesão. O mod implementa uma **defesa em camadas** (Safety Guardrails) que atua de forma **automática e instantânea** em cada ponto onde conteúdo entra, é gerado ou é compartilhado.

**No escopo:**
- Classificação automática de texto e imagem na entrada.
- Reforço do prompt de sistema com regras de público infantil + `ageBand`.
- Re-classificação da saída gerada antes de exibir.
- Moderação de comunidade: publicação, report e comentários.
- Privacidade infantil (COPPA/LGPD): voz, fotos, coleções privadas por padrão.

**Fora do escopo:**
- Treinar os classificadores (são serviços externos abstratos).
- Geração de conteúdo em si (responsabilidade de `story-creation`).
- Funcionalidades de comunidade não relacionadas a moderação.

---

## User stories

Na ótica do **cuidador** (pai/mãe/responsável) e da **plataforma**.

- **Como cuidador**, quero ter certeza de que meu filho nunca verá violência, palavrões ou temas adultos, **para** confiar no app sem precisar revisar tudo manualmente.
- **Como cuidador**, quero que fotos e a voz do meu filho fiquem privadas por padrão, **para** proteger os dados sensíveis da criança.
- **Como cuidador**, quero poder denunciar um conteúdo que considerei impróprio, **para** que ele seja revisado e removido.
- **Como plataforma**, quero bloquear conteúdo inapropriado **na criação** (antes de salvar/publicar), **para** que ele nunca alcance a comunidade nem a criança.
- **Como plataforma**, quero re-classificar toda história gerada antes de exibir, **para** capturar falhas do modelo generativo.
- **Como plataforma**, quero uma fila de moderação humana para casos ambíguos (`needs_review`), **para** decidir com segurança sem bloquear injustamente.
- **Como plataforma**, quero registrar (auditoria) cada bloqueio e decisão, **para** prestar contas e melhorar os limiares.

---

## Princípio de defesa em camadas

Nenhuma camada confia sozinha. O conteúdo só "passa" se **todas** as camadas aplicáveis aprovarem. Falha em qualquer camada → bloqueio ou revisão.

```
                 USUÁRIO (cuidador)
                        │
                        ▼
        ┌───────────────────────────────┐
   (1)  │  ENTRADA — classifica          │  texto + imagem do usuário
        │  ShieldAlert  texto + imagem    │  ─► reprovado: msg amigável 🌈
        └───────────────┬───────────────┘
                        ▼
        ┌───────────────────────────────┐
   (2)  │  PROMPT de sistema reforçado   │  regras infantis + ageBand
        │  proíbe terror/palavrão/+18     │
        └───────────────┬───────────────┘
                        ▼
        ┌───────────────────────────────┐
   (3)  │  SAÍDA — re-classifica          │  história gerada
        │  ShieldCheck  página a página   │  ─► reprovado: regenera ou bloqueia
        └───────────────┬───────────────┘
                        ▼
        ┌───────────────────────────────┐
   (4)  │  COMUNIDADE — só aprovado       │  publicação + report + comentários
        │  Flag  fila needs_review        │
        └───────────────┬───────────────┘
                        ▼
        ┌───────────────────────────────┐
   (5)  │  PRIVACIDADE infantil           │  COPPA/LGPD: voz/foto sensíveis,
        │  EyeOff  privado por padrão     │  coleções privadas por padrão
        └───────────────┬───────────────┘
                        ▼
              CRIANÇA vê apenas conteúdo APROVADO
```

| # | Camada | Quando atua | Em caso de falha |
|---|--------|-------------|------------------|
| 1 | **Entrada** | Antes de gerar — sobre o que o usuário digita/envia | Mensagem amigável; não gera |
| 2 | **Prompt reforçado** | Durante a geração | Restringe o que o modelo pode produzir |
| 3 | **Saída** | Após gerar, antes de exibir | Regenera a página ou bloqueia |
| 4 | **Comunidade** | Ao publicar / comentar / reportar | `pending` → `approved`/`rejected`/`needs_review` |
| 5 | **Privacidade** | Sempre | Dado sensível protegido; coleção privada |

---

## Features (índice)

| Feature | Slug | Camada | Prioridade | Status |
|---------|------|--------|-----------|--------|
| Moderação de Entrada | [`safety/input-moderation`](./features/input-moderation.md) | 1 | P0 | ⛔ |
| Moderação de Saída | [`safety/output-moderation`](./features/output-moderation.md) | 2–3 | P0 | ⛔ |
| Moderação de Comunidade | [`safety/community-moderation`](./features/community-moderation.md) | 4 | P0 | ⛔ |
| Privacidade Infantil | [`safety/privacy`](./features/privacy.md) | 5 | P0 | ⛔ |

---

## Modelo de dados (deste mod)

`ModerationStatus` já vive em `src/lib/story/types.ts` (compartilhado):

```ts
type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';
```

Tipos próprios do mod (`src/lib/safety/types.ts`):

```ts
type ModerationCategory =
  | 'violence'
  | 'sexual'
  | 'hate'
  | 'self_harm'   // perigo / auto-lesão
  | 'profanity'
  | 'adult_theme';

type ModerationTargetType =
  | 'input_text'
  | 'input_image'
  | 'story_page'
  | 'community_post'
  | 'comment';

interface ModerationResult {
  targetId: string;
  targetType: ModerationTargetType;
  status: ModerationStatus;
  categories: ModerationCategory[]; // categorias acionadas (vazio se limpo)
  score: number;                    // 0..1 — maior risco encontrado
  reason?: string;                  // motivo legível (auditoria/UI interna)
}

interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: ModerationTargetType;
  reason: string;
  status: ModerationStatus; // tipicamente pending → needs_review → approved/rejected
  createdAt: string;
}
```

A **fila `needs_review`** é a lista de `ModerationResult` e `Report` cujo `status === 'needs_review'`, ordenada por prioridade/data, consumida pela equipe interna de moderação.

---

## Estados & fluxos

Máquina de estados de `ModerationStatus`:

```
            ┌─────────────────────────────────────┐
            │                                       │
            ▼                                       │
        ┌────────┐   score baixo / limpo      ┌──────────┐
        │ pending├───────────────────────────►│ approved │ (terminal*)
        └───┬────┘                            └──────────┘
            │
            │ score alto / categoria bloqueada
            ▼
        ┌──────────┐
        │ rejected │ (terminal)
        └──────────┘
            ▲
            │ decisão humana: reprovar
            │
        ┌──────────────┐  zona cinzenta / report   decisão humana: aprovar
        │ needs_review │◄──────────────  ────────────────────────────►(approved)
        └──────────────┘
```

- `pending` é o estado inicial de qualquer alvo recém-criado. **A UI NUNCA renderiza `pending` nem `rejected`.**
- Decisão **automática** resolve a maioria dos casos (→ `approved` ou `rejected`).
- Casos na zona de incerteza (score intermediário) ou alvos **reportados** vão para `needs_review`.
- Da fila `needs_review`, um moderador humano decide → `approved` ou `rejected`.
- (*) Um item `approved` pode voltar a `needs_review` se receber um novo `Report`.

---

## UI (Atomic Design)

- **Átomos:** `SafetyBadge` (selo de segurança — ícone `ShieldCheck`), `BlockedIcon` (`ShieldAlert`), `ReportButton` (`Flag`), `PrivateBadge` (`EyeOff`).
- **Moléculas:** `FriendlyBlockMessage` (mensagem amigável de bloqueio — “Vamos tentar uma ideia diferente? 🌈”), `ReportSheet` (formulário de denúncia), `ReviewQueueRow` (linha da fila interna).
- **Organismos:** `ModerationQueueScreen` (tela interna da fila `needs_review`), `BlockedState` (estado de bloqueio amigável usado por outros mods).
- Mensagens para a criança/cuidador são **sempre amigáveis e não punitivas**. Detalhes técnicos (categoria, score, reason) aparecem **apenas na UI interna** de moderação, nunca para o usuário final.

---

## Integrações

- **Classificador de texto** — serviço externo abstrato (`TextClassifier`): recebe texto + `ageBand`, devolve categorias + score.
- **Classificador de imagem** — serviço externo abstrato (`ImageClassifier`): recebe imagem, devolve categorias + score.
- Ambos atrás de uma interface única (`Classifier`), permitindo trocar de provedor sem afetar os outros mods.
- **Logging/Auditoria** — todo `ModerationResult` e toda decisão humana são persistidos em log imutável de auditoria (quem, quando, o quê, decisão).
- **Modelo generativo** — recebe o prompt de sistema reforçado (camada 2) montado por este mod a partir do `ageBand`.

---

## Privacidade (LGPD/COPPA)

- Voz e fotos da criança são **dados pessoais sensíveis**: minimização, criptografia em repouso e trânsito, retenção mínima.
- **Coleções privadas por padrão** — nada vai para a comunidade sem ação explícita do cuidador.
- **Nenhum dado de criança exposto** publicamente: sem nome real, sem rosto identificável, sem geolocalização em conteúdo público.
- Consentimento do responsável obrigatório para captura de voz/foto (ver `narration-voice`).
- Direito ao esquecimento: exclusão de voz/foto/coleções a pedido.

---

## Telemetria

| Evento | Quando | Propriedades |
|--------|--------|--------------|
| `content_blocked` | Conteúdo reprovado em qualquer camada | `category`, `targetType`, `layer`, `score` |
| `report_created` | Usuário cria um `Report` | `targetType`, `reason` |
| `review_resolved` | Moderador resolve item de `needs_review` | `decision` (approved/rejected), `targetType`, `category` |

> Telemetria **não** registra conteúdo bruto da criança — apenas metadados de moderação.

---

## Critérios de aceite (do mod)

- **Dado** um texto/imagem de entrada com categoria bloqueada, **Quando** o usuário tenta gerar, **Então** a geração é impedida e é exibida a mensagem amigável (“Vamos tentar uma ideia diferente? 🌈”).
- **Dado** uma história gerada com página reprovada, **Quando** ela vai ser exibida, **Então** a página é regenerada ou bloqueada — nunca exibida como está.
- **Dado** qualquer conteúdo com `status` `pending` ou `rejected`, **Quando** a UI renderiza listas/feeds, **Então** esse conteúdo nunca aparece.
- **Dado** um conteúdo só pode ir à comunidade se `approved`, **Quando** se tenta publicar algo não-aprovado, **Então** a publicação é rejeitada.
- **Dado** um `Report` de usuário, **Quando** criado, **Então** o alvo entra (ou volta) para `needs_review` e gera `report_created`.
- **Dado** voz/foto de criança, **Quando** armazenadas, **Então** são tratadas como dado sensível e a coleção é privada por padrão.
- **Dado** qualquer bloqueio ou decisão humana, **Quando** ocorre, **Então** é registrado no log de auditoria e dispara telemetria.

---

## Questões em aberto

- **Limiares de score**: qual o corte para `approved` vs `needs_review` vs `rejected` por categoria? (ex.: `self_harm` deve ser mais conservador que `profanity`).
- **Revisão humana**: SLA da fila `needs_review`; quem são os moderadores; ferramentas internas; escalonamento.
- **Idioma**: os classificadores cobrem PT-BR com a mesma qualidade que EN? Como tratar gírias regionais e linguagem mista?
- **Falsos positivos**: fluxo de apelação para o cuidador quando algo inocente for bloqueado.

---

## Plano de implementação

1. **Tipos & contrato** — definir `src/lib/safety/types.ts` e a função-contrato que os outros mods chamam:

   ```ts
   // Contrato consumido por story-creation, community, narration-voice.
   // Sempre antes de salvar/exibir/publicar.
   async function moderate(
     content: {
       targetId: string;
       targetType: ModerationTargetType;
       text?: string;
       imageUri?: string;
       ageBand: AgeBand;
     }
   ): Promise<ModerationResult>;
   ```

2. **Camada 1 — Entrada** (`input-moderation`): integrar `TextClassifier` + `ImageClassifier`; `FriendlyBlockMessage`.
3. **Camada 2/3 — Prompt + Saída** (`output-moderation`): builder de prompt de sistema por `ageBand`; re-classificação página a página; regenerar/bloquear.
4. **Camada 4 — Comunidade** (`community-moderation`): gate de `approved`; `Report`; fila `needs_review`; filtro de comentários.
5. **Camada 5 — Privacidade** (`privacy`): coleções privadas por padrão; tratamento de voz/foto como sensível; consentimento.
6. **Auditoria & Telemetria** — log imutável + eventos `content_blocked` / `report_created` / `review_resolved`.
7. **Ferramenta interna** — `ModerationQueueScreen`.
