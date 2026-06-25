# Feature: Swipe entre páginas  ·  `player/swipe-pages`

> Passar a história página a página com swipe horizontal (snap), botões anterior/próxima e indicadores.

- **Prioridade:** P0 · **Status:** 🟢 implementado
- **Rota/entrada:** `StoryPlayer` (organismo) em `src/app/player/[id].tsx`

## User story & valor
Como **criança**, quero deslizar o dedo para virar a página, para sentir que estou folheando um livro.
Como **pai/mãe**, quero botões de anterior/próxima e ver em que página estou, para navegar com precisão.

## Comportamento esperado
- `FlatList` horizontal com `pagingEnabled`: o scroll para (snap) exatamente em uma página por largura de tela.
- Ao terminar o momentum (`onMomentumScrollEnd`), calcula `index = round(contentOffset.x / width)`; se mudou, atualiza `currentPage`, chama `resetForPage(page)` (reinicia a narração da nova página) e reexibe o chrome.
- Botões **anterior/próxima** chamam `goToPage(currentPage ± 1)`, que faz `scrollToIndex` (animado) com índice clamped a `[0, pages.length-1]`.
- **Dots:** um por página; o ativo é alongado (`width: 22`) na cor de destaque.
- **Contador** `n / total` no topo.
- **Casos de borda:** na primeira página, "anterior" não faz nada (clamp); na última, "próxima" não faz nada; `initialScrollIndex` posiciona na `initialPage` ao abrir.

## UI / Atomics
| Camada | Componente | Origem |
|--------|-----------|--------|
| organismo | StoryPlayer | @/components/story/StoryPlayer |
| molécula | PageDots (a extrair) | interno → futura molécula |
| átomo | RoundButton (anterior/próxima) | interno (candidato a IconButton) |
| átomo | Icon (ChevronLeft/Right) | @/components/ui/icon (BNA UI) + lucide-react-native |
| átomo | FlatList / ImageBackground | react-native |

## Dados & estado
- **Entrada:** `story.pages: StoryPage[]`, `initialPage`.
- **Estado local:** `currentPage` (`useState`), `listRef` (`FlatList`).
- **Saída/efeito:** ao trocar de página, `resetForPage(story.pages[index])` e `showChrome()`.
- **Persistência:** nenhuma.

## Regras & validações
- Índice sempre clamped a `[0, pages.length - 1]`.
- `getItemLayout` deve casar com a largura de tela (`useWindowDimensions().width`) para snap correto.
- `keyExtractor` usa `page.id`.
- (safety) não aplicável diretamente; a `Story` já chega aprovada.

## Estados de UI
- *sucesso:* página renderizada com fundo + texto.
- *vazio:* história sem páginas — não deveria ocorrer (validar na origem); a tratar com guard.
- *loading/erro:* imagem de fundo carregando/falhando — placeholder ausente (a tratar).

## Telemetria
- `page_view` { storyId, pageIndex, via: 'swipe' | 'button' | 'autoplay' } — emitir ao confirmar a troca em `onMomentumScrollEnd`/`goToPage`.

## Critérios de aceite (verificáveis)
- [ ] Dado uma história com N páginas, quando dou swipe e solto, então a lista faz snap em uma única página e `currentPage` reflete o índice.
- [ ] Dado que estou na página 1, quando toco "anterior", então nada muda (clamp).
- [ ] Dado que estou na última página, quando toco "próxima", então nada muda (clamp).
- [ ] Dado que troquei de página, quando ela passa a ser a atual, então a narração reinicia para essa página (`resetForPage`) e o chrome reaparece.
- [ ] Dado `initialPage = k`, quando o player abre, então ele inicia na página k.

## Dependências & questões em aberto
- **Landscape:** snap e largura assumem retrato; revisar `getItemLayout` e relayout ao rotacionar.
- Mudança de `width` (rotação/split-view) durante a leitura pode dessincronizar offset × índice — recalcular.
- Extrair `PageDots` como molécula reutilizável.
