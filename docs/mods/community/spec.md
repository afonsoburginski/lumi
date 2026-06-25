# Mod: Comunidade & Social

- **Status:** ⛔ Não iniciado (placeholders existem para `explore` e `library`)
- **Depende de:** `auth` (gating de visitante/logado, `useGate`, `AuthPrompt`, `Paywall`), `safety` (moderação de conteúdo e de comentários, `moderation='approved'`), `player` (abrir/ler histórias)
- **Rotas:** `(tabs)/explore`, `(tabs)/library`, `collection/[id]`

## Objetivo & escopo

Permitir que pessoas **descubram histórias de outras famílias** (explorar/buscar), **interajam** com elas (curtidas, comentários, avaliação por estrelas) e **organizem** o que gostam em **coleções** privadas (família) ou públicas. O mod respeita o *gating* de acesso do `auth`: visitante vê e busca conteúdo público com limite diário; qualquer ação social exige login. Só aparece na comunidade conteúdo com `moderation='approved'`.

**Inclui:**
- Explorar/buscar histórias públicas de outros (feed + busca).
- Curtir, comentar e avaliar (estrelas) histórias.
- Criar/editar coleções privadas ou públicas e adicionar/remover histórias.
- Favoritar (curtir) e compartilhar histórias.
- Report de história/comentário/usuário (encaminhado ao `safety`).

**Não inclui:**
- Criação/edição de histórias (mod `story-creation`).
- Reprodução/leitura em si (mod `player`).
- Lógica de moderação/guardrails (mod `safety`); aqui só consumimos `moderation` e enviamos reports.
- Autenticação, quota e paywall (mod `auth`); aqui só **chamamos** `useGate`.
- Mensagens diretas, seguir usuários, perfis sociais — fora do MVP.

## User stories

- **Como** visitante, **quero** explorar e buscar histórias públicas, **para** descobrir conteúdo antes de criar conta (respeitando o limite diário).
- **Como** pai/responsável logado, **quero** curtir, comentar e avaliar histórias, **para** dar retorno e ajudar outras famílias a escolher.
- **Como** pai/responsável logado, **quero** salvar histórias em coleções da família, **para** montar trilhas de leitura (ex.: "Para dormir").
- **Como** pai/responsável logado, **quero** tornar uma coleção pública, **para** compartilhar recomendações com outras famílias.
- **Como** visitante, **quero** ser convidado a logar ao tentar curtir/comentar/avaliar/colecionar, **para** entender o valor da conta.
- **Como** qualquer usuário, **quero** reportar uma história, comentário ou usuário, **para** manter o ambiente seguro para crianças.

## Features (índice)

| Feature | Slug | Prioridade | Status |
|---|---|---|---|
| Explorar & Buscar | `community/explore-search` | Alta | 🟡 placeholder existe |
| Interações (curtir, comentar, avaliar) | `community/interactions` | Alta | ⛔ |
| Coleções (privadas/públicas) | `community/collections` | Média | ⛔ |

## Modelo de dados (deste mod)

Definidos/estendidos em `src/lib/story/types.ts`. Reutiliza o tipo global `Story{ ..., isPublic, likes, moderation }`.

```ts
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  storyId: string;
  authorId: string;            // User.id
  authorName: string;          // nome de exibição do responsável
  body: string;                // texto do comentário (moderado pelo safety)
  createdAt: string;           // ISO 8601
  moderation: ModerationStatus;// só 'approved' é exibido na comunidade
}

export interface Rating {
  id: string;
  storyId: string;
  authorId: string;            // 1 avaliação por usuário por história
  stars: 1 | 2 | 3 | 4 | 5;
  createdAt: string;           // ISO 8601
  updatedAt: string;
}

export interface Collection {
  id: string;
  ownerId: string;             // User.id
  title: string;
  visibility: 'private' | 'public'; // default 'private'
  storyIds: string[];          // referências a Story.id (somente approved/visíveis)
  createdAt: string;           // ISO 8601
  updatedAt: string;
}
```

Derivados úteis (não persistidos): `avgRating` e `ratingCount` por história (agregados pela API de feed).

## Estados & fluxos

- **Feed/Busca (visitante ou logado):** carrega apenas histórias com `isPublic === true` **e** `moderation === 'approved'`. Estados: `idle` -> `loading` -> (`success` | `empty` | `error`).
- **Consumo de leitura (visitante):** ao abrir uma história a partir do feed, o `player`/`useGate('read')` aplica a `ReadingQuota`. Estado **bloqueado por limite:** `count >= limit` -> `Paywall` (mod `auth`).
- **Ação social restrita (visitante):** curtir/comentar/avaliar/favoritar/criar coleção -> `useGate(action)` -> `AuthPrompt`. A ação só executa após login bem-sucedido (retorna ao contexto).
- **Ação social (logado):** executa direto; atualização otimista da UI (like/rating/comment) com *rollback* em erro.
- **Comentário:** envio -> `moderation='pending'` -> exibido só após `safety` aprovar (`approved`); se `rejected`, autor vê aviso e o comentário não aparece publicamente.
- **Coleção:** criar/editar/adicionar/remover; *toggle* de `visibility`. Coleção `private` só visível ao `ownerId`.
- **Report:** qualquer item -> abre fluxo de denúncia -> envia ao `safety` -> confirmação ao usuário.

## UI (Atomic Design)

- **Átomos (BNA UI):** `text`, `view`, `button`, `input`, `icon` (lucide), `badge`, `avatar`, `card` (+`CardContent`, etc.), `separator`, `spinner`, `image`. A adicionar via `bna-ui add`: `searchbar`, `sheet`, `bottom-sheet`.
- **Organismos:** `CommunityFeed` (lista de `StoryCard` + filtros), `StoryDetail` (capa, descrição, ações sociais, comentários), `CollectionDetail` (cabeçalho + grid de histórias).
- **Moléculas:** `SearchField` (busca), `LikeButton` (curtir), `RatingStars` (avaliação por estrelas), `CommentList` (lista + composer), `CollectionPicker` (`bottom-sheet` para escolher/criar coleção). Reaproveita `Screen` (`src/components/layout/Screen.tsx`) e `StoryCard` (`src/components/story/StoryCard.tsx`).
- **Cores/tokens:** `useColor('chave')`; spacing/radius/fontSize/gradients de `src/theme/tokens.ts`.
- **Ícones lucide:** `Search`, `Heart`, `MessageCircle`, `Star`, `FolderPlus`, `Share2`.

## Integrações

- **API de feed/busca:** serviço que retorna histórias públicas aprovadas com agregados (`likes`, `avgRating`, `ratingCount`), paginadas. Filtros por `ageBand` e ordenação. Expõe `searchStories`, `getFeed`, `getStoryDetail`.
- **API social:** `like/unlike`, `addComment`, `setRating`, CRUD de `Collection`, `reportItem`.
- **Storage:** cache local de feed/coleções (AsyncStorage) para leitura offline parcial; nada sensível. Chaves: `lumi.feedCache`, `lumi.collections`.
- **Mod auth:** `useGate(action)`, `useSession`, `AuthPrompt`, `Paywall`, `ReadingQuota`.
- **Mod safety:** estado `moderation` das histórias e comentários; endpoint de report.
- **Mod player:** abre `/player/[id]` ao tocar numa história.

## Segurança & privacidade

- **Só conteúdo `approved`:** feed, busca, detalhe e coleções públicas filtram `moderation === 'approved'` e `isPublic === true`. Nunca exibir `pending`/`rejected` a terceiros.
- **Comentários moderados pelo `safety`:** todo comentário entra como `pending` e só aparece após aprovação; rejeitados não são públicos.
- **Coleções privadas por padrão:** `visibility` default `'private'`; tornar pública exige ação explícita do dono. Coleções privadas nunca aparecem em feed/busca.
- **Report de usuários/itens:** disponível em histórias, comentários e perfis de autor; encaminhado ao `safety` com contexto mínimo.
- **PII de criança:** não exibir nome/idade da criança em conteúdo público; usar nome de exibição do responsável.

## Telemetria

Eventos (sem PII de criança nos payloads):
- `community_search{query_len, ageBand?, results}`
- `community_like{storyId, value}` (curtir/descurtir)
- `community_comment_submitted{storyId}` / `community_comment_visible{storyId}`
- `community_rate{storyId, stars}`
- `community_collect{collectionId, storyId, action}` (add/remove)
- `community_share{storyId, channel}`
- `community_report{itemType}` / `community_gate_blocked{action}`

## Critérios de aceite (do mod)

- [ ] **Dado** um visitante, **Quando** abre `explore`, **Então** vê apenas histórias `isPublic` e `approved` e pode buscar.
- [ ] **Dado** um visitante que esgotou a quota, **Quando** tenta abrir uma história do feed, **Então** vê o `Paywall`.
- [ ] **Dado** um visitante, **Quando** toca em curtir/comentar/avaliar/colecionar, **Então** vê o `AuthPrompt` e a ação não é executada.
- [ ] **Dado** um usuário logado, **Quando** comenta, **Então** o comentário fica `pending` e só aparece publicamente após `approved`.
- [ ] **Dado** um usuário logado, **Quando** avalia uma história já avaliada por ele, **Então** a avaliação é atualizada (não duplicada).
- [ ] **Dado** uma coleção recém-criada, **Quando** não escolho visibilidade, **Então** ela é `private` por padrão.
- [ ] **Dado** uma coleção `private`, **Quando** outro usuário acessa `collection/[id]`, **Então** o conteúdo não é exibido.

## Questões em aberto

- **Ranking de busca por `ageBand`:** ordenação deve priorizar a faixa da criança do usuário? Peso de `likes`/`avgRating`/recência?
- **Paginação:** cursor vs. offset; tamanho de página; *infinite scroll* vs. "carregar mais".
- Like é binário (1 por usuário) ou contador livre? Hoje `Story.likes` é número agregado.
- Coleções públicas entram na busca/feed como entidade própria?
- Compartilhamento: deep link interno + share nativo de SO? Domínio de link?

## Plano de implementação

1. Definir `Comment`, `Rating`, `Collection`, `ModerationStatus` em `src/lib/story/types.ts`.
2. Criar camada de dados (`src/lib/community/`): `searchStories`, `getFeed`, `getStoryDetail`, `like`, `addComment`, `setRating`, CRUD de coleção, `reportItem`.
3. Adicionar átomos via `bna-ui add searchbar sheet bottom-sheet`.
4. Implementar moléculas `SearchField`, `LikeButton`, `RatingStars`, `CommentList`, `CollectionPicker`.
5. Implementar organismos `CommunityFeed`, `StoryDetail`, `CollectionDetail`.
6. Evoluir telas `(tabs)/explore.tsx` e `(tabs)/library.tsx`; criar `collection/[id].tsx`.
7. Integrar `useGate`/`AuthPrompt`/`Paywall` (auth) e filtro `approved` (safety) em todos os pontos.
8. Cablear telemetria e testes (filtros de moderação, gating, atualização otimista, 1 rating/usuário).
