# Feature: Coleções (privadas/públicas) · `community/collections`

Permitir que usuários logados organizem histórias em coleções privadas (família) ou públicas, e que coleções públicas sejam visualizadas por outros.

**Prioridade:** Média · **Status:** ⛔ Não iniciado (placeholder de biblioteca existe em `src/app/(tabs)/library.tsx`) · **Rotas:** `(tabs)/library`, `collection/[id]`

## User story & valor

**Como** pai/responsável logado, **quero** salvar histórias em coleções da família (ex.: "Para dormir"), **para** montar trilhas de leitura; **e** opcionalmente torná-las públicas **para** compartilhar recomendações.

## Comportamento esperado

- Em `(tabs)/library`, listar minhas coleções e permitir criar nova (`FolderPlus`).
- A partir de uma história (`StoryDetail`/`StoryCard`), abrir `CollectionPicker` (`bottom-sheet`) para adicionar/remover de coleções ou criar uma nova ali mesmo.
- `collection/[id]` (`CollectionDetail`) mostra o cabeçalho (título, visibilidade, dono) e o grid de `StoryCard`.
- *Toggle* de `visibility` `private` <-> `public` (apenas o dono).
- Coleção `private` só visível ao `ownerId`; `public` visível a todos (e pode ser compartilhada com `Share2`).
- Criar coleção / adicionar história por **visitante** dispara `useGate(action)` -> `AuthPrompt`.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Página | `LibraryScreen` | `src/app/(tabs)/library.tsx` (evoluir) |
| Página | `CollectionDetailScreen` | `src/app/collection/[id].tsx` (novo) |
| Organismo | `CollectionDetail` | novo (`src/components/community/CollectionDetail.tsx`) |
| Molécula | `CollectionPicker` (ícone `FolderPlus`) | novo; usa `bottom-sheet` |
| Molécula | `StoryCard` | `src/components/story/StoryCard.tsx` |
| Átomo | `input` (título da coleção) | `src/components/ui` |
| Átomo | `button` (criar, salvar, `Share2`) | `src/components/ui` |
| Átomo | `badge` (visibilidade), `separator`, `spinner`, `text` | `src/components/ui` |

A adicionar via `bna-ui add bottom-sheet sheet`.

## Dados & estado

- `Collection{ id, ownerId, title, visibility:'private'|'public', storyIds[], createdAt, updatedAt }`.
- `visibility` default `'private'`.
- Chama `community.createCollection`, `updateCollection`, `addStory(collectionId, storyId)`, `removeStory(...)`, `getCollection(id)`.
- `storyIds` referenciam apenas histórias visíveis (`approved`); referências a conteúdo removido são filtradas na leitura.
- Cache local (`lumi.collections`) das coleções do próprio usuário.

## Regras & validações

- **Gating (auth):** criar coleção / adicionar histórias exige login; visitante -> `AuthPrompt`.
- **Privacidade:** nova coleção é `private` por padrão; só o `ownerId` edita visibilidade e conteúdo.
- **Visibilidade na leitura:** `collection/[id]` `private` retorna conteúdo apenas ao dono; para terceiros, exibir estado de acesso negado.
- **Moderação (safety):** ao renderizar, filtrar histórias que deixaram de ser `approved`/`isPublic`.
- Título obrigatório, `1..60` caracteres.

## Estados de UI

- **Idle:** lista de coleções; vazio mostra "Crie sua primeira coleção".
- **Criando/Salvando:** `spinner`/botão `loading`.
- **Picker aberto:** `bottom-sheet` com checkboxes de coleções + criar nova.
- **Erro:** mensagem + retry; *rollback* de adição/remoção otimista.
- **Bloqueado (visitante):** `AuthPrompt` ao criar/adicionar; nada persistido até login.
- **Privada/sem acesso:** terceiro abrindo `collection/[id]` privada vê "Esta coleção é privada".

## Telemetria

- `community_collect{collectionId, storyId, action}` (add/remove)
- `community_collection_created{visibility}`
- `community_collection_visibility{collectionId, visibility}`
- `community_share{collectionId, channel}` / `community_gate_blocked{action}`

## Critérios de aceite (verificáveis)

- [ ] **Dado** um visitante, **Quando** tenta criar coleção ou adicionar história, **Então** vê o `AuthPrompt` e nada é persistido.
- [ ] **Dado** uma coleção nova sem escolha de visibilidade, **Quando** salvo, **Então** ela é `private`.
- [ ] **Dado** uma história, **Quando** abro o `CollectionPicker` e seleciono uma coleção, **Então** a história é adicionada (otimista, com *rollback* em erro).
- [ ] **Dado** uma coleção `private`, **Quando** outro usuário acessa `collection/[id]`, **Então** vê "Esta coleção é privada".
- [ ] **Dado** uma coleção `public` do dono, **Quando** o dono ativa o compartilhamento, **Então** um deep link é gerado e o share nativo abre.
- [ ] **Dado** uma história da coleção que deixou de ser `approved`, **Quando** o dono abre a coleção, **Então** ela não é exibida no grid.

## Dependências & questões em aberto

- Depende de `useGate`/`AuthPrompt` (auth), filtro `approved` (safety) e CRUD de coleção na API.
- Coleções públicas entram no feed/busca como entidade própria? — ver questões do mod.
- Deep link / domínio de compartilhamento de coleção a definir.
