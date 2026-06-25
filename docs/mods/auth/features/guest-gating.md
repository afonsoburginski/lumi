# Feature: Gating de Visitante · `auth/guest-gating`

Decidir, para cada ação, se ela é executada, se exige login (`AuthPrompt`) ou se atingiu o limite diário (`Paywall`), com contador persistido localmente.

**Prioridade:** Alta · **Status:** ⛔ Não iniciado · **Rota:** modais `auth-prompt`, `paywall`

## User story & valor

**Como** visitante, **quero** experimentar o app lendo algumas histórias e ser convidado a entrar nas ações bloqueadas, **para** entender o valor antes de me cadastrar; **e como** sistema, limitar leituras diárias para incentivar o cadastro sem bloquear a experimentação.

## Comportamento esperado

- Hook `useGate(action)` retorna uma função `run(fn)` que decide:
  - **Logado:** executa `fn` sempre (sem gate).
  - **Visitante + ação bloqueada** (`create`, `record`, `like`, `comment`, `favorite`, `collection`): abre `AuthPrompt`, não executa `fn`.
  - **Visitante + `read`:** consulta `ReadingQuota`; se `count < limit` incrementa e executa; senão abre `Paywall`.
- `ReadingQuota` persistida localmente (`AsyncStorage`, chave `lumi.readingQuota`).
- **Reset:** ao consultar, compara `date` armazenada com a data local (`YYYY-MM-DD`); se diferente, zera `count` e atualiza `date` (reset 00h local).
- Limite padrão `limit = 3`.
- `QuotaBadge` mostra leituras restantes para visitantes.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Modal | `AuthPrompt` | `src/app/auth-prompt.tsx` (novo) |
| Modal | `Paywall` | `src/app/paywall.tsx` (novo, placeholder) |
| Molécula | `QuotaBadge` | novo (`src/components/auth/QuotaBadge.tsx`) |
| Átomo | `card` (+CardHeader/Content/Footer) | `src/components/ui` |
| Átomo | `button` (entrar / cadastrar / fechar) | `src/components/ui` |
| Átomo | `badge` (leituras restantes) | `src/components/ui` |
| Átomo | `text`, `icon` (`Lock`) | `src/components/ui` |
| Hook | `useGate(action)` | novo (`src/lib/auth/useGate.ts`) |
| Hook | `useReadingQuota()` | novo (`src/lib/auth/useReadingQuota.ts`) |

## Dados & estado

- `ReadingQuota { date: 'YYYY-MM-DD'; count: number; limit: number }` em `AsyncStorage`.
- Sessão via `useSession` (`guest` | `authenticated`).
- `action`: `'read' | 'create' | 'record' | 'like' | 'comment' | 'favorite' | 'collection'`.
- `useGate` lê sessão + quota; não toca em senha/token.

## Regras & validações

- Apenas `read` consome quota; demais ações bloqueadas vão direto ao `AuthPrompt`.
- `count` nunca excede `limit`; ao atingir, próximas leituras abrem `Paywall`.
- Reset baseado em data **local**, não UTC.
- Usuário logado nunca consome quota nem vê `AuthPrompt`/`Paywall` por gate.
- Persistência tolerante a falha: erro de leitura trata quota como `{ count: 0 }` do dia.

## Estados de UI

- **Visitante com cota disponível:** `QuotaBadge` mostra `restantes = limit - count`.
- **Visitante sem cota:** `Paywall` exibido ao tentar ler.
- **Ação bloqueada:** `AuthPrompt` com CTAs "Entrar" e "Criar conta".
- **Logado:** sem badge de quota, sem modais de gate.

## Telemetria

- `gate_blocked{action}`
- `gate_auth_prompt_shown{action}`
- `gate_paywall_shown{reason}` (`reason: 'quota_exhausted'`)
- `quota_consumed{remaining}`
- `quota_reset`

## Critérios de aceite (verificáveis)

- [ ] **Dado** um visitante com `count = 0`, **Quando** abre uma história, **Então** `count` vira 1 e a história abre.
- [ ] **Dado** um visitante com `count = 3` e `limit = 3`, **Quando** tenta abrir outra história, **Então** o `Paywall` é exibido e nada é lido.
- [ ] **Dado** um visitante, **Quando** tenta `like`/`comment`/`favorite`/`create`/`record`/`collection`, **Então** o `AuthPrompt` aparece e a ação não executa.
- [ ] **Dado** um usuário logado, **Quando** executa qualquer ação, **Então** `useGate` executa `fn` sem abrir modais.
- [ ] **Dado** que `date` armazenada é de ontem, **Quando** o visitante abre uma história hoje, **Então** `count` reinicia em 0 antes de incrementar (vira 1).
- [ ] **Dado** um visitante com `count = 1`, **Quando** vejo o `QuotaBadge`, **Então** mostra "2 restantes".

## Dependências & questões em aberto

- Depende de `useSession` (sessão) e do tipo `ReadingQuota`.
- `Paywall` é placeholder até o mod `billing`.
- Limite de 3/dia é configurável remotamente? (ver questões do mod).
