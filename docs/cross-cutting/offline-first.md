# Cross-cutting: Offline-First

> Princípio: **o app é útil sem rede.** O máximo de funcionalidades opera offline, mesmo que
> de forma limitada. A rede é uma *otimização*, não um pré-requisito. Aplica-se a todos os mods.

## Objetivo
- Abrir o app, navegar, ler histórias já baixadas e criar rascunhos **sem conexão**.
- Ações que precisam de rede são **enfileiradas** (outbox) e sincronizadas quando voltar.
- Estado nunca se perde por falta de rede; a UI sempre comunica o que é local vs. sincronizado.

## O que funciona offline (por mod)

| Mod | Offline | Limitação |
|-----|---------|-----------|
| auth | sessão persistida; modo visitante | login/cadastro novo exige rede (enfileira) |
| story-creation | escrever rascunho, escolher faixa/tom, **geração mock local** | geração por IA real exige rede; sem rede usa gerador local/stub |
| player | ler histórias **baixadas**, karaokê, áudio em cache | histórias não baixadas indisponíveis |
| narration-voice | ouvir narração já sintetizada/baixada; gravar amostra (fica pendente) | síntese/clonagem real exige rede (enfileira) |
| community | ver feed/coleções em cache; **curtir/comentar/avaliar otimista** | busca nova e dados frescos exigem rede; interações sincronizam depois |
| safety | **moderação local** (classificador heurístico) sempre roda | reverificação no servidor ocorre ao sincronizar |

## Arquitetura

```
UI ──► stores (zustand + persist/AsyncStorage)  ──►  serviços (lib/services/*)
                       │                                   │
                       │ (escrita otimista)                ├─ online  → backend real (futuro)
                       ▼                                   └─ offline → mock local + outbox
                 cache local (fonte de verdade offline)
                       ▲
                       └──── sync flush (quando isOnline) ◄── outbox (fila de mutações)
```

- **Persistência:** todo store relevante usa `persist` em `AsyncStorage` (`lib/storage.ts`).
- **Conectividade:** `lib/net/connectivity.ts` expõe `isOnline` (e `setOnline` p/ testes/demo).
- **Outbox:** `lib/services/sync.ts` enfileira mutações (`enqueue`) e faz `flush()` quando online.
  Itens têm `id`, `type`, `payload`, `status: queued|syncing|done|failed`, `createdAt`.
- **Escrita otimista:** stores aplicam a mudança localmente já e marcam `pendingSync`; o flush
  reconcilia. Conflitos: *last-write-wins* nesta fase (documentar evolução futura).
- **Cache de mídia:** `coverUri/imageUri/audioUri` baixados ficam em cache local quando a história
  é "baixada" (campo `Story.downloaded`). Player exige `downloaded` para tocar offline.

## Modelo de dados (adições)
- `Story.downloaded?: boolean` · `Story.pendingSync?: boolean`
- `OutboxItem { id, type, payload, status, createdAt }`
- `Connectivity { isOnline: boolean }`

## Estados de UI
- **Banner offline** global quando `!isOnline`.
- Itens com mudanças locais mostram selo "pendente de sincronização".
- Conteúdo indisponível offline mostra estado vazio com CTA "Baixar quando tiver internet".

## Telemetria
- `offline_enter` / `offline_exit`, `outbox_enqueue {type}`, `sync_flush {count, ok, failed}`.

## Critérios de aceite
- [ ] Dado o app em modo avião, quando abro, então vejo Home com histórias em cache e banner offline.
- [ ] Dado offline, quando curto uma história, então a curtida aparece na hora e entra no outbox.
- [ ] Dado que volto a ficar online, quando o flush roda, então o outbox esvazia e os selos "pendente" somem.
- [ ] Dado offline, quando crio um rascunho e gero (mock), então recebo uma história lível localmente.
- [ ] Dado uma história não baixada, quando estou offline, então o player mostra estado "indisponível offline".

## Plano de implementação
1. `lib/storage.ts` (AsyncStorage JSON + storage adapter p/ zustand persist). ✅ base
2. `lib/net/connectivity.ts` (store isOnline). ✅ base
3. `lib/services/sync.ts` (outbox). ✅ base
4. Stores persistidos (auth, quota, library, community, voice) com escrita otimista.
5. Banner offline + selos de pendência na UI.
6. Trocar mocks por backend real mantendo as mesmas interfaces de serviço.
