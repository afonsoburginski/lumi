# Feature: Entrada de Prompt · `story-creation/prompt-input`

Captura o texto de contexto da história e os parâmetros de criação (faixa etária e tom), exibindo o selo de segurança e habilitando a geração.

- **Prioridade:** P0
- **Status:** draft
- **Rota:** `src/app/(tabs)/create.tsx`

## User story & valor

Como criança, quero descrever minha ideia em poucas palavras e escolher como a história será (faixa etária e tom), para que o app gere algo do meu jeito. (US-1, US-3)

## Comportamento esperado

- Campo de texto multiline para o prompt (ex.: "Um cachorrinho que queria voar"), com placeholder convidativo.
- Chips de **faixa etária**: `3-5`, `6-8`, `9-12` (seleção única; default conforme perfil/`auth` ou `6-8`).
- Chips de **tom**: 😴 calmo (`calm`), 🤪 bobo (`silly`), 🦸 herói (`hero`) (seleção única).
- **Selo de segurança** visível, comunicando que tudo é filtrado.
- Botão "Gerar minha história" **desabilitado** enquanto não houver prompt **nem** imagem (a imagem vem de `image-upload`).
- Ao tocar "Gerar", monta `CreateDraft` e dispara o gate de `safety` de entrada (ver `generation`).
- Alterações atualizam o `CreateDraft` em memória (debounce no texto).

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Template | `Screen` | molécula existente |
| Átomo | `input` (multiline) | BNA UI |
| Átomo | `button` (icon `Sparkles`/`Wand2`, haptic) | BNA UI |
| Átomo | `badge` (selo de segurança, icon `Shield`) | BNA UI |
| Átomo | `text`, `view`, `separator`, `icon` | BNA UI |
| Molécula | Chips de faixa etária (`button` size sm + estado selecionado) | composição |
| Molécula | Chips de tom (emoji + `text`) | composição |

## Dados & estado

- Escreve em `CreateDraft`: `prompt`, `ageBand`, `tone` (`imageUri` gerido por `image-upload`).
- Estado local da tela: rascunho atual; `canGenerate = !!prompt.trim() || !!imageUri`.
- Sem persistência remota nesta feature; rascunho vive em memória/store local.

## Regras & validações

- `prompt` opcional **se** houver `imageUri`; caso contrário obrigatório (não vazio após `trim`).
- Limite de caracteres do prompt (ex.: 280) com contador/limite no `input`.
- `ageBand` e `tone` sempre têm valor (default aplicado).
- **Safety (entrada):** ao gerar, o prompt é submetido à moderação do mod `safety`; reprovação leva ao estado `bloqueado` (tratado em `generation`). Nenhuma chamada de IA de geração antes da aprovação.

## Estados de UI

- **Vazio/inicial** — placeholder, chips com defaults, botão desabilitado.
- **Preenchendo** — botão habilita ao ter prompt ou imagem.
- **Limite excedido** — contador em cor de alerta (`useColor('destructive')`), bloqueia digitação extra.
- **Submetendo** — botão em `loading` enquanto inicia o gate de safety.

## Telemetria

- `create_draft_started` — `{ hasImage, ageBand, tone, promptLength }`
- `create_generate_tapped` — `{ hasImage, ageBand, tone }`

## Critérios de aceite (verificáveis)

- **Dado** prompt vazio e sem imagem, **Quando** a tela carrega, **Então** o botão "Gerar minha história" está desabilitado.
- **Dado** prompt com texto, **Quando** digitado, **Então** o botão fica habilitado.
- **Dado** que seleciono um chip de faixa/tom, **Quando** toco, **Então** apenas esse chip fica selecionado e o `CreateDraft` reflete a escolha.
- **Dado** texto além do limite, **Quando** tento digitar, **Então** a entrada é bloqueada e o contador sinaliza alerta.
- **Dado** que toco "Gerar", **Quando** disparo, **Então** o prompt é enviado ao `safety` antes de qualquer geração.

## Dependências & questões em aberto

- Depende de `image-upload` para a condição `canGenerate` quando não há texto.
- Depende de `safety` (moderação de entrada) e `auth` (default de faixa etária por perfil).
- Em aberto: limite exato de caracteres por faixa etária; default de tom.
