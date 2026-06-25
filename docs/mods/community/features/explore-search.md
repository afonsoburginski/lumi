# Feature: Explorar & Buscar · `community/explore-search`

Permitir descobrir histórias públicas de outras famílias por meio de um feed e de busca textual, respeitando o gating de visitante.

**Prioridade:** Alta · **Status:** 🟡 placeholder existe (`src/app/(tabs)/explore.tsx`) · **Rota:** `(tabs)/explore`

## User story & valor

**Como** visitante ou pai/responsável, **quero** explorar e buscar histórias públicas, **para** descobrir conteúdo adequado à criança antes (e depois) de criar conta.

## Comportamento esperado

- Tela com `SearchField` no topo e um feed (`CommunityFeed`) de `StoryCard`.
- O feed e a busca retornam **apenas** histórias com `isPublic === true` e `moderation === 'approved'`.
- Digitar na busca filtra por título/descrição (debounce); limpar volta ao feed padrão.
- Filtro opcional por `ageBand`; ordenação por relevância/recência (ver questões em aberto).
- Tocar num `StoryCard` navega para `/player/[id]`; a leitura aplica `useGate('read')` (quota do visitante).
- Paginação por "carregar mais" / *infinite scroll*.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Página | `ExploreScreen` | `src/app/(tabs)/explore.tsx` (evoluir) |
| Molécula | `Screen` | `src/components/layout/Screen.tsx` |
| Organismo | `CommunityFeed` | novo (`src/components/community/CommunityFeed.tsx`) |
| Molécula | `SearchField` (ícone `Search`) | novo; usa `searchbar`/`input` |
| Molécula | `StoryCard` | `src/components/story/StoryCard.tsx` |
| Átomo | `badge` (filtro `ageBand`) | `src/components/ui` |
| Átomo | `spinner` (loading/paginação) | `src/components/ui` |
| Átomo | `text` (estado vazio/erro) | `src/components/ui` |

A adicionar via `bna-ui add searchbar`.

## Dados & estado

- Entrada: `{ query: string; ageBand?: AgeBand; cursor?: string }` (local à tela).
- Chama `community.getFeed(params)` e `community.searchStories(params)` -> `{ stories: Story[]; nextCursor?: string }`.
- Agregados (`likes`, `avgRating`, `ratingCount`) vêm da API.
- Cache local opcional do feed (`lumi.feedCache`) para abertura rápida.

## Regras & validações

- **Gating (auth):** visualizar/buscar é permitido a visitante; abrir/ler dispara `useGate('read')` -> incrementa quota ou abre `Paywall`.
- **Moderação (safety):** filtrar `moderation === 'approved'` e `isPublic === true` no client e exigir o mesmo do servidor.
- Query vazia mostra o feed padrão; query com espaços é normalizada (trim).
- Resultados sem PII de criança.

## Estados de UI

- **Idle/Feed:** lista de `StoryCard` padrão.
- **Buscando:** `spinner` enquanto carrega resultados (debounce ativo).
- **Vazio:** mensagem "Nenhuma história encontrada" quando `results === 0`.
- **Erro:** mensagem (cor de erro via `useColor`) + ação "Tentar novamente".
- **Bloqueado/limite atingido:** ao abrir história sem quota, exibe `Paywall` (mod `auth`); o feed em si continua navegável.
- **Paginação:** `spinner` no rodapé ao carregar a próxima página.

## Telemetria

- `community_search{query_len, ageBand?, results}`
- `community_gate_blocked{action: 'read'}` (quando aplicável)

## Critérios de aceite (verificáveis)

- [ ] **Dado** o feed, **Quando** carrega, **Então** todas as histórias têm `isPublic` e `moderation === 'approved'`.
- [ ] **Dado** uma busca por termo existente, **Quando** submeto, **Então** vejo resultados filtrados; **Quando** não há, **Então** vejo o estado vazio.
- [ ] **Dado** um visitante sem quota, **Quando** toco numa história, **Então** vejo o `Paywall` e não entro no player.
- [ ] **Dado** um item de história, **Quando** toco nele com quota disponível, **Então** navego para `/player/[id]`.
- [ ] **Dado** mais resultados disponíveis, **Quando** chego ao fim da lista, **Então** a próxima página carrega com `spinner` no rodapé.

## Dependências & questões em aberto

- Depende da API de feed/busca e de `useGate` (auth) e filtro `approved` (safety).
- Ranking por `ageBand` e estratégia de paginação (cursor vs. offset) — ver questões do mod.
