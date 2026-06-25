# Mod: Criação Mágica de Histórias

- **Status:** draft
- **Depende de:** `safety` (moderação de entrada/saída), `narration-voice` (escolha de voz), `auth` (autoria/`authorId`)
- **Rotas:** `src/app/(tabs)/create.tsx`, `src/app/(tabs)/create/preview.tsx`

## Objetivo & escopo

Permitir que uma criança (ou responsável) crie uma história infantil ilustrada e paginada a partir de um **texto de contexto** (ex.: "Um cachorrinho que queria voar") e/ou de uma **imagem** (foto de um desenho da criança), escolhendo **faixa etária** (`AgeBand`) e **tom**. O app gera uma `Story` paginada por IA, **sempre validada pelos guardrails do mod `safety` antes de qualquer exibição**, e leva o usuário ao preview, escolha de voz e salvar/publicar.

**No escopo:**
- Entrada de prompt textual e upload de imagem do desenho.
- Seleção de faixa etária e tom.
- Geração assíncrona de texto + ilustrações paginadas.
- Moderação obrigatória de entrada e saída.
- Preview paginado, escolha de voz e salvar/publicar.

**Fora do escopo:**
- Edição manual de texto/imagens página a página (futuro).
- Biblioteca/curadoria de histórias salvas (mod separado).
- Síntese de áudio em si (delegada a `narration-voice`).

## User stories

- **US-1** — Como criança, quero descrever uma ideia em poucas palavras e receber uma história ilustrada, para ver minha imaginação virar livro.
- **US-2** — Como criança, quero tirar foto de um desenho meu para que ele vire o personagem da história, para me sentir autora.
- **US-3** — Como responsável, quero que toda entrada e todo conteúdo gerado seja filtrado por segurança, para confiar no que aparece na tela.
- **US-4** — Como usuário, quero ver o progresso da criação de forma lúdica ("Pintando os cenários..."), para entender que vale a pena esperar.
- **US-5** — Como usuário, quero pré-visualizar a história paginada, escolher uma voz e salvar/publicar, para concluir a criação.

## Features (índice)

| Feature | Slug | Prioridade | Status |
|---|---|---|---|
| Entrada de Prompt | `prompt-input` | P0 | draft |
| Upload de Imagem (desenho) | `image-upload` | P1 | draft |
| Geração da História | `generation` | P0 | draft |
| Preview & Publicar | `preview-publish` | P0 | draft |

## Modelo de dados (deste mod)

```ts
// Rascunho local enquanto o usuário monta os parâmetros de criação.
type CreateDraft = {
  id: string;
  prompt: string;                 // texto de contexto (pode ser vazio se houver imagem)
  imageUri?: string;              // foto do desenho da criança (sensível)
  ageBand: AgeBand;               // '3-5' | '6-8' | '9-12'
  tone: StoryTone;                // ver abaixo
  createdAt: number;
};

type StoryTone = 'calm' | 'silly' | 'hero'; // 😴 calmo · 🤪 bobo · 🦸 herói

// Job assíncrono de geração (texto + imagens), com checagens de safety.
type GenerationJob = {
  id: string;
  draftId: string;
  status: GenerationStatus;       // ver Estados & fluxos
  progress: number;               // 0..1 (animação lúdica)
  stage?: GenerationStage;        // 'writing' | 'illustrating' | 'moderating'
  story?: Story;                  // preenchido quando status = 'ready'
  blockedReason?: string;         // preenchido quando status = 'blocked'
  errorReason?: string;           // preenchido quando status = 'error'
  startedAt: number;
  finishedAt?: number;
};

type GenerationStatus = 'draft' | 'generating' | 'blocked' | 'ready' | 'error';
type GenerationStage = 'writing' | 'illustrating' | 'moderating';
```

> A `Story` resultante segue `src/lib/story/types.ts`: `Story{ id, title, authorId, ageBand, coverUri, pages[], moderation, isPublic, likes }` e `StoryPage{ id, imageUri, text, audioUri?, wordTimings? }`. O `audioUri`/`wordTimings` são preenchidos pelo mod `narration-voice`.

## Estados & fluxos

Estados do fluxo de criação:

- **rascunho** (`draft`) — usuário editando prompt/imagem/faixa/tom. Botão "Gerar" habilitado apenas com prompt **ou** imagem.
- **gerando** (`generating`) — job em andamento; tela de animação com `stage` (escrevendo → ilustrando → moderando) e `progress`.
- **bloqueado (safety)** (`blocked`) — entrada ou saída reprovada pelo mod `safety`; exibe mensagem amigável e volta ao rascunho.
- **pronto** (`ready`) — `Story` aprovada; navega para preview.
- **erro** (`error`) — falha de IA/rede/storage; permite tentar novamente.

Fluxo principal:

1. `rascunho` → usuário aciona "Gerar minha história".
2. `safety` valida **entrada** (prompt + imagem). Se reprovar → `bloqueado`.
3. `generating`: IA gera texto e ilustrações (`writing` → `illustrating`).
4. `moderating`: `safety` valida **saída** (cada página: texto + imagem) + coverUri. Reprovou → `bloqueado`.
5. `ready` → navega para `create/preview`.
6. Preview → escolher voz (`narration-voice`) → salvar/publicar (`isPublic`).

## UI (Atomic Design)

- **Átomos (BNA UI):** `text`, `view`, `button` (icon Lucide, loading, haptic), `input` (multiline), `icon`, `badge`, `avatar`, `card`, `separator`, `spinner`, `image`. Imagem do desenho via `media-picker`/`camera`/`gallery` (adicionar com `bna-ui add media-picker camera gallery`).
- **Moléculas:** chips de faixa etária, chips de tom, selo de segurança, cartão de página de preview, barra de progresso lúdica.
- **Organismos:** formulário de criação (`create.tsx`), tela de geração animada, carrossel de preview (`create/preview.tsx`).
- **Template:** molécula `Screen`.
- **Tokens:** `src/theme/tokens.ts` (`spacing`, `radius`, `fontSize`, `gradients`); cores via `useColor('chave')`.

## Integrações

- **Serviço de IA de geração** — texto (roteiro paginado por faixa etária/tom) + imagens (ilustrações por página e capa). Entrada: prompt, `imageUri` opcional, `ageBand`, `tone`. Encapsulado em `src/lib/story/generation.ts` (a criar).
- **Mod `safety`** — moderação de entrada (prompt + imagem) e de saída (texto + imagem de cada página + capa). Bloqueio obrigatório.
- **Mod `narration-voice`** — seleção/síntese de voz no preview.
- **Mod `auth`** — `authorId` da `Story`.
- **Storage** — upload e persistência da imagem do desenho e das ilustrações geradas; gera URIs estáveis (`coverUri`, `pages[].imageUri`).

## Segurança & privacidade

- **Moderação obrigatória de entrada e saída** via `safety`; nenhum conteúdo gerado é exibido sem aprovação.
- **Imagem da criança é dado sensível:** tratar `imageUri` com cuidado — não logar conteúdo, transmitir por canal seguro, e definir retenção mínima (descartar foto original após geração, salvo consentimento). Documentar em política de privacidade.
- Mensagens de bloqueio são amigáveis e não expõem detalhes técnicos da moderação à criança.
- Conteúdo `isPublic` exige aprovação de saída do `safety` e, conforme `auth`, consentimento do responsável.

## Telemetria

Eventos (sem PII/conteúdo bruto):

- `create_draft_started` — `{ hasImage, ageBand, tone, promptLength }`
- `create_generate_tapped` — `{ hasImage, ageBand, tone }`
- `create_input_blocked` — `{ reason }` (safety entrada)
- `create_generation_stage` — `{ stage, progress }`
- `create_output_blocked` — `{ reason }` (safety saída)
- `create_generation_succeeded` — `{ durationMs, pageCount }`
- `create_generation_failed` — `{ reason }`
- `create_published` — `{ isPublic, withVoice }`

## Critérios de aceite (do mod)

- **Dado** que o usuário não inseriu prompt nem imagem, **Quando** abre a tela, **Então** o botão "Gerar minha história" está desabilitado.
- **Dado** que há prompt **ou** imagem válida, **Quando** o usuário toca "Gerar", **Então** a entrada passa por `safety` antes de iniciar a geração.
- **Dado** que a entrada é reprovada pelo `safety`, **Quando** o resultado chega, **Então** o estado vai para `bloqueado` com mensagem amigável e nenhuma chamada de IA de geração ocorre.
- **Dado** que a geração concluiu, **Quando** a saída é reprovada pelo `safety`, **Então** o estado vai para `bloqueado` e a `Story` não é exibida.
- **Dado** que a saída é aprovada, **Quando** o job fica `ready`, **Então** o app navega para o preview paginado.
- **Dado** o estado `generating`, **Quando** exibido, **Então** há animação lúdica com mensagens por `stage` ("Pintando os cenários...").
- **Dado** o preview, **Quando** o usuário escolhe voz e salva/publica, **Então** a `Story` é persistida com `authorId`, `ageBand` e `isPublic` corretos.

## Questões em aberto

- Qual **modelo de IA** (texto e imagem) e provedor? Latência aceitável por página?
- **Custo** por geração e limites/cotas por usuário (free vs. premium)?
- **Tempo de geração** alvo e estratégia de UX para esperas longas (background + push)?
- Número de páginas por faixa etária? (ex.: 3-5 → menos páginas, 9-12 → mais).
- Consistência visual de personagem entre páginas (mesmo estilo) — viável com o provedor escolhido?
- Retenção/descarte da foto do desenho — alinhamento jurídico.

## Plano de implementação

1. **Tipos & estado** — `CreateDraft`, `GenerationJob` em `src/lib/story/create-types.ts`; store local de rascunho.
2. **prompt-input** — refinar `create.tsx` (input, chips de faixa/tom, selo de segurança, regra de habilitação do botão).
3. **image-upload** — adicionar `media-picker`/`camera`/`gallery`; preview/remoção da imagem; tratamento sensível.
4. **Integração safety (entrada)** — gate antes da geração.
5. **generation** — `src/lib/story/generation.ts` (stub → IA real); tela de geração animada com `stage`/`progress`.
6. **Integração safety (saída)** — moderação por página + capa.
7. **preview-publish** — `create/preview.tsx`; carrossel paginado; integração `narration-voice`; salvar/publicar via storage + `auth`.
8. **Telemetria** — instrumentar eventos.
9. **Polimento** — animações, acessibilidade, estados de erro/retry.
