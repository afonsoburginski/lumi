# Feature: Interações (curtir, comentar, avaliar) · `community/interactions`

Permitir que usuários logados curtam, comentem e avaliem (estrelas) histórias públicas, com moderação de comentários e gating de visitante.

**Prioridade:** Alta · **Status:** ⛔ Não iniciado · **Rota:** `(tabs)/explore` (detalhe `StoryDetail`)

## User story & valor

**Como** pai/responsável logado, **quero** curtir, comentar e avaliar histórias, **para** dar retorno e ajudar outras famílias a escolher boas leituras.

## Comportamento esperado

- Em `StoryDetail`, exibir capa/descrição da história e as ações sociais: `LikeButton`, `RatingStars`, `CommentList` (lista + composer) e `Share2`.
- **Curtir:** *toggle* otimista; atualiza `Story.likes`. *Rollback* em erro.
- **Avaliar:** `RatingStars` 1–5; **1 avaliação por usuário por história** — reavaliar **atualiza** o `Rating` existente, não cria outro.
- **Comentar:** envio cria `Comment` com `moderation='pending'`; aparece publicamente só após `safety` aprovar (`approved`). Autor vê o próprio comentário com aviso de "em análise".
- **Compartilhar:** abre share nativo com deep link da história.
- Qualquer ação social por **visitante** dispara `useGate(action)` -> `AuthPrompt`; executa após login.
- Item de report disponível em história e em cada comentário.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Organismo | `StoryDetail` | novo (`src/components/community/StoryDetail.tsx`) |
| Molécula | `LikeButton` (ícone `Heart`) | novo |
| Molécula | `RatingStars` (ícone `Star`) | novo |
| Molécula | `CommentList` (ícone `MessageCircle`) | novo |
| Átomo | `avatar` (autor do comentário) | `src/components/ui` |
| Átomo | `input` (composer de comentário) | `src/components/ui` |
| Átomo | `button` (enviar, `Share2`) | `src/components/ui` |
| Átomo | `badge` (avgRating/contagem) | `src/components/ui` |
| Átomo | `separator`, `spinner`, `text` | `src/components/ui` |

## Dados & estado

- `Comment{ id, storyId, authorId, authorName, body, createdAt, moderation }`.
- `Rating{ id, storyId, authorId, stars, createdAt, updatedAt }` — único por `(storyId, authorId)`.
- Agregados exibidos: `Story.likes`, `avgRating`, `ratingCount`.
- Chama `community.like/unlike(storyId)`, `community.setRating(storyId, stars)`, `community.addComment(storyId, body)`, `community.reportItem(...)`.
- Atualização otimista local; reconciliação com a resposta do servidor.

## Regras & validações

- **Gating (auth):** curtir/comentar/avaliar exige login; visitante -> `AuthPrompt`.
- **Moderação (safety):** comentário entra `pending`; só `approved` é público; `rejected` mostra aviso ao autor e não é exibido a terceiros.
- Comentário: corpo obrigatório, `1..500` caracteres, sem links/PII (validação client + safety).
- Rating: inteiro `1..5`; uma avaliação por usuário (reavaliar atualiza).
- Só é possível interagir com histórias `isPublic` e `approved`.

## Estados de UI

- **Idle:** ações habilitadas (logado) ou em modo "convidar a logar" (visitante).
- **Enviando:** botão com `loading`; like/rating com atualização otimista.
- **Comentário em análise:** comentário do autor com badge "Em análise" (`pending`).
- **Erro:** mensagem + *rollback* do estado otimista.
- **Bloqueado (visitante):** `AuthPrompt` ao tentar qualquer ação social; nada é persistido até o login.
- **Vazio:** "Seja o primeiro a comentar" quando não há comentários aprovados.

## Telemetria

- `community_like{storyId, value}`
- `community_rate{storyId, stars}`
- `community_comment_submitted{storyId}` / `community_comment_visible{storyId}`
- `community_share{storyId, channel}`
- `community_gate_blocked{action}` / `community_report{itemType}`

## Critérios de aceite (verificáveis)

- [ ] **Dado** um visitante, **Quando** toca em curtir/avaliar/comentar, **Então** vê o `AuthPrompt` e a ação não é persistida.
- [ ] **Dado** um usuário logado, **Quando** curte, **Então** o estado alterna otimisticamente e `Story.likes` reflete a mudança (com *rollback* em erro).
- [ ] **Dado** um usuário que já avaliou, **Quando** avalia de novo, **Então** o `Rating` é atualizado (sem duplicar).
- [ ] **Dado** um comentário enviado, **Quando** ainda não aprovado, **Então** ele aparece só para o autor com aviso "Em análise".
- [ ] **Dado** um comentário aprovado pelo `safety`, **Quando** outros abrem a história, **Então** ele aparece na `CommentList`.
- [ ] **Dado** um item, **Quando** uso "reportar", **Então** o report é enviado ao `safety` e recebo confirmação.

## Dependências & questões em aberto

- Depende de `useGate`/`AuthPrompt` (auth) e da moderação de comentários (safety).
- Like binário vs. contador livre — ver questões do mod.
- Edição/remoção de comentário próprio entra no MVP?
