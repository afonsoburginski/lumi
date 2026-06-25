# Feature: Login · `auth/login`

Permitir que o responsável entre com e-mail e senha e tenha acesso completo ao app.

**Prioridade:** Alta · **Status:** ⛔ Não iniciado · **Rota:** `(auth)/login`

## User story & valor

**Como** pai/responsável, **quero** entrar com minha conta, **para** desbloquear todas as funcionalidades (criar, gravar voz, curtir, comentar, favoritar, coleções) e remover o limite diário de leituras.

## Comportamento esperado

- Tela com campos de e-mail e senha e botão "Entrar".
- Ao submeter, valida o formulário, chama o auth provider e exibe estado de carregamento.
- Sucesso: persiste sessão (`expo-secure-store`), atualiza `useSession` para `authenticated` e retorna à origem (rota anterior ou home).
- Erro: mantém o form preenchido (exceto senha) e mostra mensagem de erro mapeada.
- Link para a tela de cadastro (`(auth)/signup`).
- Quando aberta via `AuthPrompt`, ao logar volta para a ação originalmente bloqueada.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Página | `LoginScreen` | `src/app/(auth)/login.tsx` (novo) |
| Molécula | `Screen` | `src/components/layout/Screen.tsx` |
| Molécula | `AuthForm` | novo (`src/components/auth/AuthForm.tsx`) |
| Átomo | `input` (e-mail, ícone `Mail`) | `src/components/ui` |
| Átomo | `input` (senha, ícone `Lock`, secure) | `src/components/ui` |
| Átomo | `button` (variant default, loading) | `src/components/ui` |
| Átomo | `button` (variant link, ir p/ cadastro) | `src/components/ui` |
| Átomo | `text` (título, erro) | `src/components/ui` |
| Átomo | `spinner` | `src/components/ui` |

## Dados & estado

- Entrada: `{ email: string; password: string }` (local ao form).
- Chama `auth.signIn(email, password)` -> retorna `User` + token.
- Persiste sessão (`lumi.session`) e atualiza `AuthContext`.
- Nenhum dado de senha persistido localmente.

## Regras & validações

- E-mail: formato válido e obrigatório.
- Senha: obrigatória, mínimo 8 caracteres.
- Botão "Entrar" desabilitado enquanto inválido ou carregando.
- Erros do provedor mapeados: credenciais inválidas, rede, usuário inexistente.

## Estados de UI

- **Idle:** form vazio/preenchido, botão habilitado quando válido.
- **Loading:** botão com `loading`, campos desabilitados.
- **Erro:** mensagem em `text` (cor de erro via `useColor`), senha limpa.
- **Sucesso:** navegação para origem/home (sem flash de tela vazia).

## Telemetria

- `auth_login_submitted`
- `auth_login_success`
- `auth_login_error{code}`

## Critérios de aceite (verificáveis)

- [ ] **Dado** e-mail e senha válidos, **Quando** submeto, **Então** a sessão fica `authenticated` e volto à origem.
- [ ] **Dado** senha com menos de 8 caracteres, **Quando** edito o campo, **Então** o botão "Entrar" fica desabilitado.
- [ ] **Dado** credenciais inválidas, **Quando** submeto, **Então** vejo mensagem de erro e o campo senha é limpo.
- [ ] **Dado** que cheguei via `AuthPrompt` ao tentar curtir, **Quando** logo com sucesso, **Então** retorno ao contexto da ação anterior.
- [ ] **Dado** o estado de carregamento, **Quando** aguardo a resposta, **Então** o botão exibe `loading` e os campos ficam desabilitados.

## Dependências & questões em aberto

- Depende do auth provider definido no mod.
- Recuperação de senha e login social fora do escopo (ver questões do mod).
