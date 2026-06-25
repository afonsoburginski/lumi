# Feature: Privacidade Infantil · `safety/privacy`

> EyeOff — Camada 5. Voz e fotos da criança são dados sensíveis; coleções são privadas por padrão; nenhum dado de criança é exposto.

Implementa as proteções de privacidade infantil (COPPA/LGPD) que permeiam todo o app: tratamento de voz/foto como dado pessoal sensível, coleções privadas por padrão e consentimento do responsável.

- **Prioridade:** P0
- **Status:** ⛔ Não iniciado
- **Onde atua:** Transversal — `story-creation` (fotos), `narration-voice` (voz/consentimento), `community` (exposição). Camada 5 do pipeline.

---

## User story & valor

- **Como cuidador**, quero que fotos e a voz do meu filho fiquem privadas e protegidas, **para** que dados sensíveis nunca vazem nem sejam usados sem minha autorização.
- **Como cuidador**, quero que nada da minha criança apareça publicamente sem eu decidir, **para** manter controle total.
- **Como plataforma**, quero cumprir COPPA/LGPD por padrão, **para** operar de forma legal e confiável.

---

## Comportamento esperado

- **Dado** que uma coleção/história é criada, **Quando** ela nasce, **Então** seu padrão é **privado** (nunca público sem ação explícita do cuidador).
- **Dado** captura de voz ou foto da criança, **Quando** solicitada, **Então** exige **consentimento explícito do responsável** antes de coletar.
- **Dado** voz/foto armazenadas, **Quando** persistidas, **Então** são tratadas como **dado sensível** (criptografia em repouso/trânsito, retenção mínima, acesso restrito).
- **Dado** conteúdo público, **Quando** exibido, **Então** **não** contém nome real, rosto identificável ou geolocalização da criança.
- **Dado** um pedido de exclusão, **Quando** o cuidador solicita, **Então** voz/foto/coleções são apagadas (direito ao esquecimento).

---

## UI / Atomics

- `PrivateBadge` (átomo, `EyeOff`) — indica que uma coleção/história é privada.
- `ConsentSheet` (molécula) — solicitação de consentimento do responsável para voz/foto.
- Toggle de visibilidade (privado ⇄ público) com confirmação clara do cuidador.

---

## Dados & estado

- Flag de visibilidade por coleção/história (default: `private`).
- Marcação de dados sensíveis (voz/foto) com metadados de consentimento (quem, quando).
- Registro de consentimento e de solicitações de exclusão (auditoria).

---

## Regras & validações

- **Privado por padrão**: tornar público é sempre uma ação explícita e reversível.
- **Sem dados de criança expostos**: bloquear nome real/rosto/geo em qualquer saída pública.
- **`ageBand`** não relaxa privacidade — proteções valem para todas as faixas.
- Coleta de voz/foto **fail-closed** sem consentimento válido.
- Aplica-se em conjunto com `community-moderation` (publicação só de `approved` E não-sensível).

---

## Estados de UI

- **Privado (padrão):** `PrivateBadge` visível; conteúdo só para o cuidador/criança.
- **Consentimento pendente:** captura de voz/foto bloqueada até `ConsentSheet` ser confirmado.
- **Público:** apenas após ação explícita e sem dados identificáveis da criança.

---

## Telemetria

- Sem conteúdo bruto da criança. Apenas metadados: evento de concessão/revogação de consentimento e de solicitação de exclusão (sem PII).
- `content_blocked` não se aplica aqui; eventos de privacidade são separados e anonimizados.

---

## Critérios de aceite (verificáveis)

- **Dado** uma nova coleção, **Quando** criada, **Então** ela é privada por padrão.
- **Dado** captura de voz/foto, **Quando** sem consentimento válido, **Então** a coleta é impedida.
- **Dado** voz/foto armazenadas, **Quando** inspecionadas, **Então** estão criptografadas e com acesso restrito.
- **Dado** conteúdo público, **Quando** exibido, **Então** não contém nome real/rosto/geo da criança.
- **Dado** pedido de exclusão, **Quando** solicitado, **Então** os dados são removidos e o ato é auditado.

---

## Dependências & questões em aberto

- Integra com `narration-voice` (fluxo de consentimento de voz) e armazenamento seguro.
- Política de **retenção** (por quanto tempo guardar voz/foto) — em aberto.
- Verificação de idade/identidade do responsável para consentimento — em aberto.
- Conformidade jurisdicional além de COPPA/LGPD (ex.: GDPR-K) — em aberto.
