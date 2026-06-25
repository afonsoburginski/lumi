# Feature: Moderação de Saída · `safety/output-moderation`

> ShieldCheck — Camadas 2 e 3. Reforça o prompt do modelo e re-classifica a história gerada **antes** de exibir.

Cobre duas camadas: (2) montar o prompt de sistema reforçado com regras de público infantil + `ageBand`; e (3) re-classificar cada página da história gerada antes de ela ser exibida à criança, regenerando ou bloqueando o que reprovar.

- **Prioridade:** P0
- **Status:** ⛔ Não iniciado
- **Onde atua:** Geração e exibição em `story-creation`. Camadas 2–3 do pipeline.

---

## User story & valor

- **Como plataforma**, quero instruir o modelo a só produzir conteúdo infantil seguro, **para** reduzir a chance de saída imprópria na origem.
- **Como plataforma**, quero re-classificar a saída mesmo assim, **para** capturar o que o modelo eventualmente produzir de errado.
- **Como cuidador**, quero confiar que a história final foi verificada, **para** deixar a criança ler/ouvir sem supervisão minuto a minuto.

---

## Comportamento esperado

**Camada 2 — Prompt reforçado**

- **Dado** o `ageBand` da história, **Quando** o prompt de sistema é montado, **Então** ele inclui regras rígidas de público infantil (proíbe terror gráfico, palavrões, temas adultos) calibradas para a faixa.

**Camada 3 — Re-classificação da saída**

- **Dado** que a história foi gerada, **Quando** ela vai ser exibida, **Então** cada página passa por `moderate()` (`targetType: 'story_page'`) **antes** de renderizar.
- **Dado** uma página aprovada, **Quando** classificada, **Então** ela é exibida.
- **Dado** uma página reprovada, **Quando** classificada, **Então** o sistema **regenera** essa página (até N tentativas) e, persistindo a reprovação, **bloqueia** a história e informa o usuário de forma amigável.
- **Dado** que a UI nunca renderiza `pending`/`rejected`, **Quando** uma página está nesses estados, **Então** ela jamais aparece.

---

## UI / Atomics

- `SafetyBadge` (átomo, `ShieldCheck`) — selo “verificado para crianças” na história aprovada.
- `FriendlyBlockMessage` — caso de bloqueio definitivo após esgotar regenerações.
- Indicador de “gerando/verificando” durante a re-classificação.

---

## Dados & estado

- Cada página gera um `ModerationResult` com `targetType: 'story_page'`.
- A história só passa a `approved` quando **todas** as páginas estão `approved`.
- Contador de tentativas de regeneração por página (não exposto ao usuário).

---

## Regras & validações

- **Categorias bloqueadas:** `violence`, `sexual`, `hate`, `self_harm`, `profanity`, `adult_theme`.
- **`ageBand`:** alimenta tanto o prompt (camada 2) quanto o limiar do classificador (camada 3).
- Limite de N regenerações por página; ao exceder → bloqueia a história inteira (fail-closed).
- Texto e ilustração de cada página são classificados.

---

## Estados de UI

- **Verificando:** spinner/skeleton enquanto re-classifica.
- **Aprovado:** história exibida com `SafetyBadge`.
- **Bloqueado:** `FriendlyBlockMessage` após regenerações esgotadas.
- **Em revisão:** se uma página cair em `needs_review`, a história não é exibida até resolução (tratada como bloqueio amigável para o usuário).

---

## Telemetria

- `content_blocked` com `category`, `targetType: 'story_page'`, `layer: 'output'`, `score`.
- (Opcional) métrica de regenerações por página para ajustar prompt/limiar.

---

## Critérios de aceite (verificáveis)

- **Dado** o `ageBand`, **Quando** o prompt é montado, **Então** contém as regras infantis e a faixa correta.
- **Dado** uma página com conteúdo impróprio, **Quando** classificada, **Então** é regenerada; persistindo, a história é bloqueada com mensagem amigável.
- **Dado** uma história totalmente aprovada, **Quando** exibida, **Então** mostra o `SafetyBadge` e nenhuma página `pending`/`rejected` aparece.
- **Dado** bloqueio de saída, **Então** dispara `content_blocked` e grava auditoria.

---

## Dependências & questões em aberto

- Depende de `TextClassifier`/`ImageClassifier` e do builder de prompt por `ageBand`.
- Valor de **N regenerações** e custo associado — em aberto.
- Limiares de saída vs entrada (saída pode ser mais tolerante ou não) — em aberto.
