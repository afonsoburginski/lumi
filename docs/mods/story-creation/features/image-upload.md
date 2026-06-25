# Feature: Upload de Imagem (desenho) · `story-creation/image-upload`

Permite anexar uma foto de um desenho da criança (câmera ou galeria) para servir de base/personagem da história, tratando-a como dado sensível.

- **Prioridade:** P1
- **Status:** draft
- **Rota:** `src/app/(tabs)/create.tsx`

## User story & valor

Como criança, quero tirar foto de um desenho meu e ver ele virar personagem da história, para me sentir autora da criação. (US-2)

## Comportamento esperado

- Botão/área para adicionar imagem com duas opções: **Câmera** (icon `Camera`) e **Galeria** (icon `Image`).
- Após captura/seleção, exibe **preview** da imagem com opção de **remover** ou **trocar**.
- A imagem é opcional; quando presente, satisfaz `canGenerate` mesmo sem prompt.
- Imagem é submetida ao `safety` (moderação de entrada) junto do prompt ao gerar.
- Upload ao storage ocorre na geração (ou ao anexar, conforme implementação), gerando `imageUri`.

## UI / Atomics

| Camada | Componente | Origem |
|---|---|---|
| Átomo | `media-picker` | BNA UI (`bna-ui add media-picker`) |
| Átomo | `camera` | BNA UI (`bna-ui add camera`) |
| Átomo | `gallery` | BNA UI (`bna-ui add gallery`) |
| Átomo | `image` (preview do desenho) | BNA UI |
| Átomo | `button` (icon `Camera`/`Image`, haptic; remover icon `X`) | BNA UI |
| Átomo | `card`, `view`, `text`, `icon`, `spinner` | BNA UI |
| Molécula | Cartão de upload com estados (vazio/preview) | composição |

## Dados & estado

- Escreve `imageUri` em `CreateDraft`.
- Estado local: `imageUri?`, `isUploading`, `uploadError?`.
- A imagem original (sensível) deve ter retenção mínima: descartar após geração, salvo consentimento.

## Regras & validações

- Tipos aceitos: imagem (JPEG/PNG); tamanho/resolução máximos validados antes do upload.
- Permissões de câmera/galeria solicitadas via `media-picker`/`camera`/`gallery`; negação exibe orientação.
- **Safety (entrada):** a imagem passa por moderação de imagem do `safety` antes de qualquer uso na geração; reprovação → estado `bloqueado` com mensagem amigável.
- **Privacidade:** `imageUri` é dado sensível — não logar conteúdo; transmissão por canal seguro; retenção mínima.

## Estados de UI

- **Vazio** — cartão com opções Câmera/Galeria.
- **Selecionando** — picker/câmera abertos.
- **Enviando** — `spinner` sobre o preview (`isUploading`).
- **Com imagem** — preview + remover/trocar.
- **Erro de upload/permissão** — mensagem e ação de tentar novamente.
- **Bloqueada (safety)** — imagem removida e aviso amigável.

## Telemetria

- `create_image_added` — `{ source: 'camera' | 'gallery' }` (sem conteúdo da imagem)
- `create_image_removed`
- `create_input_blocked` — `{ reason: 'image' }`

## Critérios de aceite (verificáveis)

- **Dado** que não há prompt, **Quando** anexo uma imagem válida, **Então** o botão "Gerar minha história" habilita.
- **Dado** que escolho Câmera ou Galeria, **Quando** confirmo, **Então** o preview da imagem aparece com opções remover/trocar.
- **Dado** que removo a imagem, **Quando** confirmo, **Então** `imageUri` é limpo no `CreateDraft`.
- **Dado** que a imagem é reprovada pelo `safety`, **Quando** o resultado chega, **Então** ela é descartada e uma mensagem amigável é exibida, sem geração.
- **Dado** que a geração concluiu, **Quando** aplicável, **Então** a foto original tem retenção mínima conforme política.

## Dependências & questões em aberto

- Depende dos componentes `media-picker`/`camera`/`gallery` (adicionar via `bna-ui add`).
- Depende de `safety` (moderação de imagem) e storage (upload/`imageUri`).
- Em aberto: como a IA usa a imagem (referência de personagem vs. estilo); limites de tamanho; janela de retenção.
