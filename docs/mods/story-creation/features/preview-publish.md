# Feature: Preview & Publicar · `story-creation/preview-publish`

Exibe a `Story` aprovada em um carrossel paginado, permite escolher a voz de narração (mod `narration-voice`) e salvar/publicar a história.

- **Prioridade:** P0
- **Status:** draft
- **Rota:** `src/app/(tabs)/create/preview.tsx`

## User story & valor

Como usuário, quero folhear a história gerada, escolher uma voz e salvá-la (ou publicá-la), para concluir minha criação e poder ouvi-la depois. (US-5)

## Comportamento esperado

- Carrossel paginado das `StoryPage` (imagem + texto) com indicador de página; capa (`coverUri`) e `title` no início.
- Botão para **escolher voz**, que abre/integra o mod `narration-voice`; após escolha, `pages[].audioUri`/`wordTimings` ficam disponíveis.
- Ações: **Salvar** (privado, `isPublic=false`) e **Publicar** (`isPublic=true`).
- Persistência da `Story` no storage com `authorId` (de `auth`).
- Possibilidade de voltar e descartar a criação.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Template | `Screen` | molécula existente |
| Átomo | `image` (página/capa) | BNA UI |
| Átomo | `text` (título, texto da página) | BNA UI |
| Átomo | `button` (escolher voz, salvar, publicar; haptic, loading) | BNA UI |
| Átomo | `badge` (status público/privado), `separator`, `view`, `icon`, `card` | BNA UI |
| Molécula | Cartão de página de preview | composição |
| Organismo | Carrossel paginado com indicador | composição |

## Dados & estado

- Lê a `Story` do `GenerationJob` (`status='ready'`).
- Atualiza `pages[].audioUri`/`wordTimings` via `narration-voice`.
- Define `isPublic` na ação; ao salvar/publicar persiste `Story` completa (`authorId`, `ageBand`, `coverUri`, `pages`, `moderation`, `isPublic`, `likes=0`).
- Estado local: `selectedVoice?`, `isSaving`, `saveError?`.

## Regras & validações

- Só renderiza `Story` que passou pela moderação de saída do `safety` (`moderation` aprovado).
- **Publicar** exige saída aprovada e, conforme `auth`, consentimento do responsável.
- Voz é opcional para salvar, mas recomendada; salvar sem voz mantém `audioUri` indefinido.
- Falha de persistência → mantém estado e permite retry sem perder a `Story`.

## Estados de UI

- **Pronto/preview** — carrossel navegável.
- **Escolhendo voz** — fluxo do `narration-voice` (loading enquanto sintetiza).
- **Salvando** — botões em `loading`.
- **Sucesso** — confirmação e navegação (ex.: para biblioteca/detalhe).
- **Erro de salvar** — mensagem + "Tentar novamente".

## Telemetria

- `create_preview_viewed` — `{ pageCount }`
- `create_voice_selected` — `{ voiceId }`
- `create_published` — `{ isPublic, withVoice }`
- `create_publish_failed` — `{ reason }`

## Critérios de aceite (verificáveis)

- **Dado** uma `Story` aprovada, **Quando** o preview abre, **Então** o carrossel mostra capa, título e páginas (imagem + texto) navegáveis.
- **Dado** o preview, **Quando** escolho uma voz, **Então** as páginas recebem `audioUri`/`wordTimings` do `narration-voice`.
- **Dado** que toco "Salvar", **Quando** persiste, **Então** a `Story` é gravada com `authorId` e `isPublic=false`.
- **Dado** que toco "Publicar", **Quando** persiste, **Então** `isPublic=true` (respeitando consentimento do responsável quando exigido por `auth`).
- **Dado** falha de persistência, **Quando** ocorre, **Então** a `Story` é mantida e há ação de tentar novamente.

## Dependências & questões em aberto

- Depende de `narration-voice` (voz/áudio), `auth` (`authorId`, consentimento), storage (persistência) e `safety` (saída aprovada).
- Em aberto: destino pós-publicação (biblioteca/feed); edição de página antes de publicar (futuro); permitir trocar de voz após salvar.
