# Feature: Cadastro com idade · `auth/signup-age`

Criar conta do responsável coletando o nome e a idade da criança, derivando o `ageBand` que personaliza as histórias.

**Prioridade:** Alta · **Status:** ⛔ Não iniciado · **Rota:** `(auth)/signup`

## User story & valor

**Como** pai/responsável, **quero** criar uma conta informando o nome e a idade da criança, **para** que o app gere histórias com tom e complexidade adequados à faixa etária e recomende conteúdo relevante.

## Comportamento esperado

- Tela com: e-mail, senha, nome da criança e seleção de idade (3–12).
- A idade é convertida em `ageBand` via `toAgeBand(age)`.
- Exibe aviso de consentimento parental (LGPD/COPPA) que deve ser aceito.
- Ao submeter: valida -> `auth.signUp(...)` -> cria `User` com `ageBand` -> autentica -> navega à home.
- Link para a tela de login para quem já tem conta.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Página | `SignupScreen` | `src/app/(auth)/signup.tsx` (novo) |
| Molécula | `Screen` | `src/components/layout/Screen.tsx` |
| Molécula | `AuthForm` | novo (`src/components/auth/AuthForm.tsx`) |
| Molécula | `AgeStepper` (seleção de idade, ícone `Calendar`) | novo (`src/components/auth/AgeStepper.tsx`) |
| Átomo | `input` (e-mail `Mail`, senha `Lock`, nome `User`) | `src/components/ui` |
| Átomo | `checkbox` (consentimento) | `src/components/ui` (via `bna-ui add checkbox`) |
| Átomo | `button` (variant default, loading) | `src/components/ui` |
| Átomo | `text` (título, erro, aviso legal) | `src/components/ui` |
| Átomo | `badge` (mostra ageBand derivado) | `src/components/ui` |

## Dados & estado

- Entrada: `{ email, password, childName, childAge, consent }` (local ao form).
- `ageBand = toAgeBand(childAge)` (3-5 / 6-8 / 9-12).
- Cria `User`: `{ id, email, childName, childAge, ageBand, createdAt, isPremium: false }`.
- Persiste sessão; `User.ageBand` disponível ao mod story.

## Regras & validações

- E-mail válido e único (validação do provedor).
- Senha mínimo 8 caracteres.
- `childName` obrigatório, não vazio.
- `childAge` inteiro entre 3 e 12; fora disso bloqueia com mensagem clara.
- `consent` deve ser `true` para habilitar o envio.
- `ageBand` sempre derivado de `childAge` (nunca informado direto).

## Estados de UI

- **Idle:** form editável; badge atualiza `ageBand` ao mudar a idade.
- **Loading:** botão com `loading`, campos desabilitados.
- **Erro:** mensagem (e-mail já existe, rede, idade inválida).
- **Sucesso:** navega para home já autenticado.

## Telemetria

- `auth_signup_submitted`
- `auth_signup_success{ageBand}` (sem nome/idade exata da criança no payload)
- `auth_signup_error{code}`

## Critérios de aceite (verificáveis)

- [ ] **Dado** idade 4, **Quando** concluo o cadastro, **Então** `User.ageBand === '3-5'`.
- [ ] **Dado** idade 7, **Quando** concluo o cadastro, **Então** `User.ageBand === '6-8'`.
- [ ] **Dado** idade 11, **Quando** concluo o cadastro, **Então** `User.ageBand === '9-12'`.
- [ ] **Dado** idade 2 ou 13, **Quando** seleciono, **Então** o envio é bloqueado com mensagem de faixa válida (3–12).
- [ ] **Dado** o consentimento não marcado, **Quando** o form está preenchido, **Então** o botão de envio permanece desabilitado.
- [ ] **Dado** cadastro concluído, **Quando** entro no app, **Então** estou `authenticated` e sem limite de leituras.

## Dependências & questões em aberto

- Depende de `toAgeBand` e tipo `User` em `src/lib/story/types.ts`.
- Texto legal de consentimento parental requer revisão jurídica.
- Coletar data de nascimento vs. idade simples — decidir pelo mínimo necessário (idade).
