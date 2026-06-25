# Feature: Moderação de Entrada · `safety/input-moderation`

> ShieldAlert — Camada 1. Bloqueia conteúdo impróprio **antes** de gastar uma única chamada de geração.

Classifica o texto de contexto e a imagem que o usuário envia ao criar uma história. Se acionar uma categoria bloqueada, a geração é impedida e o usuário recebe uma mensagem amigável e convidativa para tentar outra ideia.

- **Prioridade:** P0
- **Status:** ⛔ Não iniciado
- **Onde atua:** Entrada de `story-creation` (antes da geração). Camada 1 do pipeline.

---

## User story & valor

- **Como cuidador**, quero que ideias impróprias que eu (ou meu filho) digite sejam recusadas de forma gentil, **para** que a criança não seja exposta nem incentivada a explorar esses temas.
- **Como plataforma**, quero bloquear na entrada, **para** economizar custo de geração e impedir que conteúdo ruim sequer comece a existir.

---

## Comportamento esperado

- **Dado** que o usuário informou texto de contexto e/ou imagem, **Quando** ele aciona “Gerar”, **Então** o conteúdo é enviado a `moderate()` (texto → `TextClassifier`, imagem → `ImageClassifier`) **antes** de chamar o modelo generativo.
- **Dado** que nenhuma categoria bloqueada foi acionada (score abaixo do limiar), **Quando** a classificação retorna, **Então** o fluxo de geração prossegue normalmente.
- **Dado** que uma categoria bloqueada foi acionada, **Quando** a classificação retorna, **Então** a geração é abortada, exibe-se a `FriendlyBlockMessage` e dispara-se `content_blocked`.
- **Dado** um score na zona cinzenta, **Quando** a classificação retorna `needs_review`, **Então** a geração é impedida com a mesma mensagem amigável (conservador por padrão para conteúdo destinado a criança).

---

## UI / Atomics

- `FriendlyBlockMessage` (molécula) — texto acolhedor (“Vamos tentar uma ideia diferente? 🌈”) + ícone `ShieldAlert` + botão “Tentar de novo”.
- `BlockedState` (organismo) — substitui a área de geração no estado bloqueado.
- **Nunca** mostrar categoria/score/reason ao usuário — apenas mensagem amigável.

---

## Dados & estado

- Produz um `ModerationResult` com `targetType: 'input_text' | 'input_image'`.
- Campos relevantes: `status`, `categories[]`, `score`, `reason` (este só para auditoria interna).
- Não persiste o conteúdo bloqueado além do log de auditoria.

---

## Regras & validações

- **Categorias bloqueadas:** `violence`, `sexual`, `hate`, `self_harm`, `profanity`, `adult_theme`.
- **`ageBand`:** repassado ao classificador para calibrar a sensibilidade — faixas mais novas usam limiares mais conservadores.
- Texto **e** imagem devem passar; falha em qualquer um bloqueia o conjunto.
- Em erro/timeout do classificador: tratar como **fail-closed** (bloquear), pois é conteúdo infantil.

---

## Estados de UI

- **Normal:** formulário de criação ativo.
- **Bloqueado:** `FriendlyBlockMessage` + “Tentar de novo”.
- **Em revisão:** mesma mensagem amigável (não distinguir do bloqueio para o usuário final).

---

## Telemetria

- `content_blocked` com `category`, `targetType` (`input_text`/`input_image`), `layer: 'input'`, `score`.

---

## Critérios de aceite (verificáveis)

- **Dado** texto com palavrão/violência, **Quando** gerar, **Então** não há chamada ao modelo generativo e aparece a mensagem amigável.
- **Dado** imagem imprópria, **Quando** gerar, **Então** bloqueio idêntico ao de texto.
- **Dado** entrada limpa, **Quando** gerar, **Então** o fluxo segue sem fricção.
- **Dado** timeout do classificador, **Quando** gerar, **Então** o sistema bloqueia (fail-closed).
- **Dado** qualquer bloqueio, **Então** dispara `content_blocked` e grava auditoria.

---

## Dependências & questões em aberto

- Depende de `TextClassifier` e `ImageClassifier` (serviços externos abstratos).
- Limiares por categoria/`ageBand` — em aberto (ver spec do mod).
- Qualidade do classificador em PT-BR e gírias — em aberto.
