# Feature: Moderação de Comunidade · `safety/community-moderation`

> Flag — Camada 4. Só conteúdo **aprovado** vai para a comunidade; usuários podem reportar; comentários são filtrados; casos ambíguos vão para a fila `needs_review`.

Garante que o feed comunitário do Lumi contenha apenas conteúdo aprovado, oferece um mecanismo de denúncia e mantém uma fila de moderação humana para casos que exigem julgamento.

- **Prioridade:** P0
- **Status:** ⛔ Não iniciado
- **Onde atua:** Publicação e comentários em `community`. Camada 4 do pipeline.

---

## User story & valor

- **Como cuidador**, quero denunciar um conteúdo que considerei impróprio, **para** que seja revisado e removido se necessário.
- **Como plataforma**, quero publicar apenas o que foi aprovado, **para** que o feed visto por crianças seja sempre seguro.
- **Como plataforma**, quero uma fila humana para zona cinzenta, **para** não bloquear injustamente nem deixar passar conteúdo duvidoso.

---

## Comportamento esperado

- **Dado** uma história, **Quando** o cuidador tenta publicá-la na comunidade, **Então** a publicação só é aceita se `status === 'approved'`; caso contrário é recusada.
- **Dado** um conteúdo público, **Quando** um usuário toca em `ReportButton`, **Então** cria-se um `Report`, o alvo entra (ou volta) para `needs_review` e dispara `report_created`.
- **Dado** um comentário enviado, **Quando** recebido, **Então** passa por `moderate()` (`targetType: 'comment'`) e só aparece se `approved`.
- **Dado** um item em `needs_review`, **Quando** um moderador o resolve, **Então** vira `approved` (continua/volta ao feed) ou `rejected` (some do feed) e dispara `review_resolved`.
- **Dado** que a UI nunca renderiza `pending`/`rejected`, **Quando** o feed/lista carrega, **Então** esses itens não aparecem.

---

## UI / Atomics

- `ReportButton` (átomo, `Flag`) — em cada post/comentário público.
- `ReportSheet` (molécula) — escolha de motivo + envio.
- `ReviewQueueRow` (molécula) — item da fila com prévia, categoria, score, reason.
- `ModerationQueueScreen` (organismo) — tela **interna** da fila `needs_review` (não acessível a usuários finais).

---

## Dados & estado

- `Report{ id, reporterId, targetId, targetType, reason, status, createdAt }`.
- `ModerationResult` para posts (`community_post`) e comentários (`comment`).
- **Fila `needs_review`:** itens com `status === 'needs_review'` (de classificação automática ou de `Report`), ordenados por prioridade/data.

---

## Regras & validações

- **Gate de publicação:** apenas `approved` é publicável; `pending`/`rejected`/`needs_review` não.
- **Categorias bloqueadas** (em comentários e posts): `violence`, `sexual`, `hate`, `self_harm`, `profanity`, `adult_theme`.
- **`ageBand`:** o feed é infantil; conteúdo de comunidade segue os limiares mais conservadores.
- Um novo `Report` sobre item `approved` pode reabrir para `needs_review`.
- Decisão humana é final e auditada (quem/quando/decisão).

---

## Estados de UI

- **Publicado:** visível no feed (apenas `approved`).
- **Em revisão:** invisível no feed público; visível apenas na `ModerationQueueScreen` interna.
- **Bloqueado/rejeitado:** removido do feed; reporter pode receber confirmação amigável (“Obrigado, vamos verificar 🌈”).

---

## Telemetria

- `report_created` com `targetType`, `reason`.
- `review_resolved` com `decision` (approved/rejected), `targetType`, `category`.
- `content_blocked` (`layer: 'community'`) quando um comentário/post é reprovado automaticamente.

---

## Critérios de aceite (verificáveis)

- **Dado** uma história não `approved`, **Quando** se tenta publicar, **Então** a publicação é recusada.
- **Dado** um `Report`, **Quando** criado, **Então** o alvo vai para `needs_review` e dispara `report_created`.
- **Dado** um comentário impróprio, **Quando** enviado, **Então** não aparece no feed.
- **Dado** um item resolvido na fila, **Quando** moderador decide, **Então** o feed reflete a decisão e dispara `review_resolved`.
- **Dado** o feed, **Então** nenhum item `pending`/`rejected` é renderizado.

---

## Dependências & questões em aberto

- Depende do mod `community` (modelo de post/comentário/feed) e dos classificadores.
- SLA e equipe da fila `needs_review`; ferramentas internas — em aberto.
- Política de reincidência/bloqueio de usuário que reporta abusivamente ou publica repetidamente conteúdo ruim — em aberto.
