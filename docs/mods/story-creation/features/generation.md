# Feature: Geração da História · `story-creation/generation`

Orquestra o job assíncrono que valida a entrada no `safety`, chama a IA para gerar texto + ilustrações paginadas, valida a saída no `safety` e produz uma `Story` pronta para preview, exibindo progresso lúdico.

- **Prioridade:** P0
- **Status:** draft
- **Rota:** `src/app/(tabs)/create.tsx` (tela de geração sobre/após o formulário)

## User story & valor

Como usuário, quero ver minha ideia virar uma história ilustrada com um progresso divertido e seguro, para esperar com confiança. (US-1, US-3, US-4)

## Comportamento esperado

- Ao tocar "Gerar", cria-se um `GenerationJob` a partir do `CreateDraft`.
- **Gate de entrada:** `safety` modera prompt + imagem. Reprovou → `blocked`.
- **Geração:** IA escreve o roteiro paginado (`stage='writing'`) e gera ilustrações por página + capa (`stage='illustrating'`).
- **Gate de saída:** `safety` modera cada `StoryPage` (texto + imagem) e a `coverUri` (`stage='moderating'`). Reprovou → `blocked`.
- Sucesso → `status='ready'` com `Story` montada; navega para `create/preview`.
- Falha de IA/rede/storage → `status='error'` com opção de tentar novamente.
- Animação lúdica com mensagens por `stage` ("Escrevendo a aventura...", "Pintando os cenários...", "Conferindo a magia...") e `progress` 0..1.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Template | `Screen` | molécula existente |
| Átomo | `spinner` / barra de `progress` lúdica | BNA UI |
| Átomo | `icon` (`Wand2`, `Sparkles`) | BNA UI (Lucide) |
| Átomo | `text`, `view`, `button` (tentar novamente, haptic) | BNA UI |
| Átomo | `badge` (selo de segurança durante `moderating`) | BNA UI |
| Molécula | Barra de progresso com mensagem por `stage` | composição |
| Organismo | Tela de geração animada (overlay) | composição |

## Dados & estado

- Lê `CreateDraft`; produz e atualiza `GenerationJob` (`status`, `stage`, `progress`, `story`, `blockedReason`, `errorReason`).
- Em sucesso, monta `Story` (`src/lib/story/types.ts`): `id`, `title`, `authorId` (de `auth`), `ageBand`, `coverUri`, `pages[]`, `moderation`, `isPublic=false` (default), `likes=0`.
- Serviço encapsulado em `src/lib/story/generation.ts` (a criar).

## Regras & validações

- **Safety (entrada) obrigatória** antes de qualquer chamada de IA de geração.
- **Safety (saída) obrigatória** em todas as páginas + capa antes de qualquer exibição/navegação.
- `pages.length` conforme `ageBand` (ver questões em aberto).
- Timeout/erro de IA → `error`, sem `Story` parcial exposta.
- Idempotência: tocar "tentar novamente" reinicia o job a partir do mesmo `draftId`.

## Estados de UI

- **generating** — animação + `stage`/`progress`.
- **blocked** — mensagem amigável (`blockedReason` traduzida para tom infantil), botão "Tentar outra ideia" → volta ao `rascunho`.
- **ready** — transição para preview.
- **error** — ilustração de erro + "Tentar novamente".

## Telemetria

- `create_generation_stage` — `{ stage, progress }`
- `create_input_blocked` — `{ reason }`
- `create_output_blocked` — `{ reason }`
- `create_generation_succeeded` — `{ durationMs, pageCount }`
- `create_generation_failed` — `{ reason }`

## Critérios de aceite (verificáveis)

- **Dado** que toco "Gerar", **Quando** o job inicia, **Então** o `safety` de entrada roda antes de qualquer geração de texto/imagem.
- **Dado** que a entrada é reprovada, **Quando** o resultado chega, **Então** `status='blocked'` e nenhuma IA de geração é chamada.
- **Dado** que a geração termina, **Quando** a saída é reprovada, **Então** `status='blocked'` e a `Story` não é exibida nem persistida.
- **Dado** o estado `generating`, **Quando** exibido, **Então** há animação com mensagens por `stage` incluindo "Pintando os cenários...".
- **Dado** que a saída é aprovada, **Quando** `status='ready'`, **Então** navega para `create/preview` com a `Story` montada.
- **Dado** erro de IA/rede, **Quando** ocorre, **Então** `status='error'` com ação de tentar novamente e sem `Story` parcial visível.

## Dependências & questões em aberto

- Depende de `safety` (entrada e saída), `auth` (`authorId`), storage (URIs de ilustrações), e do serviço de IA.
- Em aberto: **modelo de IA** (texto/imagem) e provedor; **custo** por geração e cotas; **tempo de geração** alvo e UX para esperas longas (background/push); número de páginas por `ageBand`; consistência visual de personagem entre páginas.
