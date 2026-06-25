# Mod: Autenticação & Acesso

**Status:** ⛔ Não iniciado · **Depende de:** `story` (tipos globais em `src/lib/story/types.ts`), BNA UI, expo-router · **Rotas:** `(auth)/login`, `(auth)/signup`, modais `auth-prompt`, `paywall`

## Objetivo & escopo

Permitir que a pessoa responsável crie conta, faça login e que o app diferencie **Visitante** (não logado) de **Logado**, aplicando o *gating* de funcionalidades e o limite diário de leituras para visitantes. No cadastro coleta-se a **idade da criança**, da qual deriva-se o `ageBand` que afeta tom/complexidade e recomendações das histórias.

**Inclui:**
- Login por e-mail/senha (provedor de auth).
- Cadastro com nome da criança + idade -> derivação de `ageBand`.
- Hook `useGate(action)` que decide entre executar / abrir `AuthPrompt` / abrir `Paywall`.
- Contador diário de leituras de visitante (`ReadingQuota`), persistido localmente, com reset às 00h locais.
- Modais `AuthPrompt` (convite a logar) e `Paywall` (placeholder, gerido por outro mod no futuro).

**Não inclui:**
- Recuperação de senha / login social (Google/Apple) — questões em aberto.
- Lógica de assinatura/cobrança (apenas o disparo do `Paywall`; o mod `billing` cuidará da compra).
- Edição de perfil avançada, múltiplas crianças por conta — fora do MVP.

## User stories

- **Como** pai/responsável, **quero** criar uma conta informando a idade da criança, **para** receber histórias adequadas à faixa etária.
- **Como** pai/responsável, **quero** entrar com minha conta, **para** ter acesso completo (criar, gravar voz, curtir, comentar, favoritar, coleções).
- **Como** visitante, **quero** ler algumas histórias públicas gratuitamente, **para** experimentar o app antes de me cadastrar.
- **Como** visitante, **quero** ser convidado a entrar quando tento uma ação bloqueada, **para** entender o valor de criar conta.
- **Como** sistema, **quero** limitar leituras diárias do visitante, **para** incentivar o cadastro sem bloquear a experimentação.

## Features (índice)

| Feature | Slug | Prioridade | Status |
|---|---|---|---|
| Login | `auth/login` | Alta | ⛔ |
| Cadastro com idade | `auth/signup-age` | Alta | ⛔ |
| Gating de Visitante | `auth/guest-gating` | Alta | ⛔ |

## Modelo de dados (deste mod)

Definidos/estendidos em `src/lib/story/types.ts`.

```ts
export type AgeBand = '3-5' | '6-8' | '9-12';

export interface User {
  id: string;
  email: string;
  displayName: string;        // nome do responsável (opcional no MVP)
  childName: string;          // nome da criança
  childAge: number;           // idade informada (3..12)
  ageBand: AgeBand;           // derivado de childAge
  createdAt: string;          // ISO 8601
  isPremium: boolean;         // controlado pelo mod billing; default false
}

export interface ReadingQuota {
  date: string;               // 'YYYY-MM-DD' em hora LOCAL
  count: number;              // leituras consumidas no dia
  limit: number;              // limite diário (default 3)
}
```

Derivação de `ageBand`:

```ts
export function toAgeBand(age: number): AgeBand {
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}
```

## Estados & fluxos

- **Sessão:** `loading` -> (`guest` | `authenticated`). Persistida; restaurada no boot.
- **Visitante consome leitura:** ao abrir uma história pública, `useGate('read')` verifica `ReadingQuota`. Se `count < limit` -> incrementa e executa; se `count >= limit` -> abre `Paywall`.
- **Visitante tenta ação bloqueada** (criar, gravar voz, curtir, comentar, favoritar, coleções): `useGate(action)` -> abre `AuthPrompt`.
- **Reset de quota:** comparar `date` armazenada com a data local atual; se diferente, zerar `count` e atualizar `date`.
- **Cadastro:** form -> valida -> cria User -> deriva `ageBand` -> autentica -> volta à origem.
- **Logado:** todas as ações executam direto; `ReadingQuota` ignorada.

## UI (Atomic Design)

- **Átomos (BNA UI):** `text`, `view`, `button`, `input`, `icon`, `card` (+CardHeader/Content/Footer), `separator`, `spinner`, `badge`.
- **Moléculas:** `Screen` (`src/components/layout/Screen.tsx`); novas a criar neste mod: `AuthForm`, `AgeStepper` (seleção de idade), `QuotaBadge` (mostra leituras restantes), `AuthPrompt` (modal), `Paywall` (modal placeholder).
- **Cores/tokens:** `useColor('chave')`; spacing/radius/fontSize/gradients de `src/theme/tokens.ts`.
- **Ícones lucide:** `Mail`, `Lock`, `User`, `Calendar`.

## Integrações

- **Auth provider:** serviço de autenticação por e-mail/senha (a confirmar — ver questões em aberto). Expõe `signIn`, `signUp`, `signOut`, `getSession`.
- **Storage local:** persistência de sessão e de `ReadingQuota` via `expo-secure-store` (sessão/token) e `AsyncStorage` (quota não sensível). Chaves: `lumi.session`, `lumi.readingQuota`.
- **Mod story:** consome `ageBand` para tom/recomendações.
- **Mod billing (futuro):** recebe o disparo de `Paywall`.

## Segurança & privacidade

- **LGPD/COPPA:** a conta pertence ao **responsável adulto**; dados da criança (nome, idade) tratados como dados de menor. Coletar apenas o mínimo (idade, não data de nascimento exata). Exibir aviso de consentimento parental no cadastro.
- **Idade:** restringir a faixa 3–12; idade fora da faixa bloqueia o cadastro com mensagem clara.
- **Token/sessão:** armazenado em `expo-secure-store` (criptografado), nunca em `AsyncStorage`.
- **Senha:** nunca persistida localmente; mínimo de força validado no client e no provedor.

## Telemetria

Eventos (sem PII de criança nos payloads):
- `auth_login_submitted`, `auth_login_success`, `auth_login_error{code}`
- `auth_signup_submitted`, `auth_signup_success{ageBand}`, `auth_signup_error{code}`
- `gate_blocked{action}`, `gate_auth_prompt_shown{action}`, `gate_paywall_shown{reason}`
- `quota_consumed{remaining}`, `quota_reset`

## Critérios de aceite (do mod)

- [ ] **Dado** um visitante, **Quando** abre o app, **Então** a sessão é restaurada como `guest` e ele vê histórias públicas.
- [ ] **Dado** um visitante que já leu 3 histórias hoje, **Quando** tenta abrir a 4ª, **Então** o `Paywall` é exibido.
- [ ] **Dado** um visitante, **Quando** tenta curtir/comentar/favoritar/criar/gravar/coleção, **Então** o `AuthPrompt` é exibido e a ação não é executada.
- [ ] **Dado** um cadastro com idade 7, **Quando** concluído, **Então** o `User.ageBand` salvo é `'6-8'`.
- [ ] **Dado** um usuário logado, **Quando** executa qualquer ação, **Então** nenhum gate é aplicado.
- [ ] **Dado** que mudou o dia local, **Quando** o visitante abre uma história, **Então** a quota reinicia para 0/3.

## Questões em aberto

- Qual provedor de auth (Supabase, Firebase, custom)? Suporte futuro a login social?
- Recuperação de senha entra no MVP?
- Limite diário = 3 é definitivo? Configurável remotamente?
- Múltiplas crianças por conta no futuro afeta o modelo `User`?
- Texto/fluxo legal de consentimento parental — revisão jurídica necessária.

## Plano de implementação

1. Definir `User`, `ReadingQuota`, `AgeBand`, `toAgeBand` em `src/lib/story/types.ts`.
2. Criar camada de auth provider (`src/lib/auth/`) com `signIn/signUp/signOut/getSession` e persistência segura.
3. Implementar `AuthContext`/`useSession` e restauração no boot.
4. Criar molécula `AuthForm` e telas `(auth)/login.tsx`, `(auth)/signup.tsx` (com `AgeStepper`).
5. Implementar `useReadingQuota` (AsyncStorage, reset por data local) e `QuotaBadge`.
6. Implementar `useGate(action)` + modais `auth-prompt.tsx` e `paywall.tsx`.
7. Cablear telemetria.
8. Testes: derivação de ageBand, reset de quota, decisões do gate.
