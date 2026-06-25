# Templates SDD

Copie o bloco apropriado ao criar um novo mod ou feature. Mantenha as seções e a ordem —
a consistência é o que torna as specs verificáveis e navegáveis.

---

## Template de MOD (`mods/<mod>/spec.md`)

```markdown
# Mod: <Nome>

> Uma frase: qual problema de produto este mod resolve.

- **Status:** 🟡 a detalhar | 🟢 ok | ⛔ não iniciado
- **Depende de:** <outros mods> · **É usado por:** <outros mods>
- **Rotas/telas:** <caminhos em src/app>

## Objetivo & escopo
- **Inclui:** ...
- **Não inclui (fora de escopo):** ...

## User stories
- Como <persona>, quero <ação> para <valor>.

## Features (índice)
| Feature | Arquivo | Prioridade | Status |
|---------|---------|------------|--------|
| <nome>  | features/<slug>.md | P0/P1/P2 | ⛔/🟡/🟢 |

## Modelo de dados (deste mod)
- `Entidade { campos... }` (e relação com tipos globais)

## Estados & fluxos
- Estados de tela: loading / vazio / erro / sucesso / bloqueado(safety)
- Fluxo principal (passos).

## UI (Atomic Design)
- Átomos/moléculas/organismos usados (componentes BNA UI e nossos).

## Integrações
- APIs/serviços (IA, TTS, storage), permissões nativas.

## Segurança & privacidade
- O que passa pelo mod `safety`; dados sensíveis.

## Telemetria
- Eventos e propriedades.

## Critérios de aceite (do mod)
- [ ] ...

## Questões em aberto
- ...

## Plano de implementação
1. ...
```

---

## Template de FEATURE (`mods/<mod>/features/<slug>.md`)

```markdown
# Feature: <Nome>  ·  `<mod>/<slug>`

> Uma frase do que entrega ao usuário.

- **Prioridade:** P0 | P1 | P2 · **Status:** ⛔ | 🟡 | 🟢
- **Rota/entrada:** <onde o usuário aciona>

## User story & valor
Como <persona>, quero <ação>, para <valor>.

## Comportamento esperado
- Passo a passo do fluxo feliz.
- Variações e casos de borda.

## UI / Atomics
| Camada | Componente | Origem |
|--------|-----------|--------|
| átomo | Button | @/components/ui/button (BNA UI) |
| ... | ... | ... |

## Dados & estado
- Entradas, saídas, estado local/global, persistência.

## Regras & validações
- Inclui checagens do mod `safety` quando aplicável.

## Estados de UI
- loading · vazio · erro · sucesso · bloqueado

## Telemetria
- `evento` { props }

## Critérios de aceite (verificáveis)
- [ ] Dado <contexto>, quando <ação>, então <resultado observável>.

## Dependências & questões em aberto
- ...
```
