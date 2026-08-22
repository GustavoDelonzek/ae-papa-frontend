# Design system Ameixa profunda — refatoração visual do frontend

Data: 2026-08-22
Branch: `refactor/new-interface-design-system`
Referência: mockup "AEPAPA Telas Ameixa" (13 telas: C1–C3, F1–F4, G1–G6)

## Objetivo

Unificar a identidade visual do sistema sob a paleta Ameixa profunda, substituindo a
duplicação atual de estilos por uma camada de tokens e primitivas reutilizáveis.

**A arquitetura de informação de cada tela permanece intacta.** Nenhuma tela ganha,
perde ou reorganiza dados; nenhum endpoint novo é consumido. O que muda é cor,
tipografia, espaçamento, raio, borda, sombra e a apresentação da navegação.

## Situação atual

- Angular 20 standalone, sem NgModules, sem suíte de testes.
- ~12.800 linhas de SCSS distribuídas por componente, com hex repetidos e
  cartão/botão/chip/tabela/estado-vazio reimplementados em cada tela
  (`patient.component.scss` = 1.923 linhas, `appointment-list.component.scss` = 1.896).
- Paleta atual roxa `#6a307d` com cinzas `#f3f4f6` / `#6b7280` / `#e5e7eb`.
- Não existe rota de layout: cada página importa `SidebarComponent` e depende de uma
  das quatro classes globais de container em `src/styles.scss`
  (`.patient-list-container`, `.patient-page-container`, `.caretaker-list-container`,
  `.caretaker-page-container`), todas com `margin-left: 260px`.
- Bootstrap 5 e Angular Material coexistem; o tema prebuilt é `deeppurple-amber` e os
  overrides do Material vivem em `.custom-mat-form-field` no `styles.scss`.

## Decisões

| Decisão | Escolha |
|---|---|
| Escopo | Somente a pele; IA de cada tela intacta |
| Navegação | Rail de ícones no desktop, drawer no mobile; sem larguras fixas rígidas |
| Tática CSS | Tokens + primitivas globais, encolhendo o SCSS local |
| Entrega | Branch única, um commit por fase |
| Verificação | `npm run build` limpo + conferência visual da rota |

## Arquitetura

### 1. Fundação — `src/styles/`

Três parciais novas, importadas no topo de `src/styles.scss`. Nenhum arquivo de
componente redeclara cor, raio ou sombra a partir daqui.

**`_tokens.scss`** — custom properties em `:root`:

```
--bg:            #f4f2f5   papel / fundo da área
--surface:       #fefdff   cartão, barra
--border:        #e0dbe4   borda
--border-strong: #d6d0dc   borda de botão e input
--hairline:      #efecf2   divisória interna
--text:          #1e1823   texto principal
--text-muted:    #655c6e   texto secundário
--text-faint:    #9a91a4   texto terciário / vazio
--nav-bg:        #241c2b   rail de navegação
--nav-icon:      #8f8398   ícone inativo do rail
--brand-soft:    #7a52a8   marca no rail
--accent:        #5b2d8c   ação (botão, link, seleção)
--accent-soft:   #ece4f5   fundo de chip de ação
--accent-strong: #3f1d66   texto sobre fundo de ação suave
--warn:          #7d6427   atenção — texto
--warn-bg:       #f5efdf   atenção — fundo
--danger:        #b0463c   bloqueio — texto
--danger-bg:     #f8e8e6   bloqueio — fundo
--ok:            #2c6b50   sucesso / ativo — texto
--ok-bg:         #e5f0e9   sucesso / ativo — fundo
```

Mais os tokens de forma e ritmo:

```
--r-card: 10px   --r-control: 8px   --r-chip: 16px
--sp-1..--sp-8   régua de 4px (4, 8, 12, 16, 20, 24, 28, 32)
--pad-card: 16px   --pad-row: 12px   --gap-block: 20px   --pad-content: 28px
--nav-w                largura corrente da navegação (ver seção 2)
--shadow-overlay       única sombra permitida; usada só em gaveta/modal/overlay
```

Regra: **nenhuma sombra dentro da aplicação** — borda de 1px basta.

**`_typography.scss`**

- Libre Franklin (400/500/600/700) em tudo; IBM Plex Mono (400/500/600) apenas para
  CPF, datas, telefones, IDs e contagens, via a classe utilitária `.mono`.
- Fontes carregadas por Google Fonts no `src/index.html`, ao lado do Font Awesome que
  já é servido por CDN. `display=swap` e `preconnect` conforme o mockup.
- Escala: título de página 26px/700 · título de bloco 15–16px/700 · corpo 13–14px ·
  rótulo 12–12,5px. `letter-spacing: -0.02em` em títulos grandes.

**`_primitives.scss`** — classes globais consumidas pelos templates. Todas levam o
prefixo `ae-` para não colidir com Bootstrap (`.card`, `.btn`, `.chip` são dele):

- `.ae-card` — superfície, borda 1px, raio 10px, padding 16px.
- `.ae-btn` com variantes `.ae-btn--primary` (sólido `--accent`), `.ae-btn--ghost`
  (borda `--border-strong`, fundo `--surface`) e `.ae-btn--danger`. Raio 8px.
  **Um botão sólido por tela**; todos os demais são ghost.
- `.ae-chip` — raio 16px, variantes `--accent`, `--warn`, `--danger`, `--ok`,
  `--neutral`.
- `.ae-field` — input/select/textarea com borda `--border-strong`, raio 8px, foco em
  `--accent`.
- `.ae-table` — cabeçalho em mono 11px com `letter-spacing`, linhas com padding
  11–13px separadas por `--hairline`.
- `.ae-page-header` — título + subtítulo + ações à direita.
- `.ae-alert` com variantes `--warn`, `--danger`, `--ok`, para o padrão do mockup em
  que campo obrigatório vazio aparece como aviso no topo do bloco, não só como
  asterisco.
- `.ae-empty` — estado vazio. A `.empty-state-box` global existente é reescrita em
  cima dos tokens **mantendo o mesmo seletor**, para não quebrar os templates que já a
  usam; telas migradas passam a usar `.ae-empty`.

Vazio se escreve em `--text-faint`, nunca com traço.

### 2. Navegação

`SidebarComponent` mantém `menuItems`, ícones, ordem, `adminOnly`, `routerLinkActive`
e o método `logout()`. Muda apenas a apresentação:

- **Desktop (≥1024px)**: rail escuro fixo (`--nav-bg`), largura ~64px, somente ícones
  com tooltip no hover, marca no topo em `--brand-soft`. O item ativo é o único que
  muda: branco sobre `rgba(255,255,255,0.14)`. Os cabeçalhos de seção
  (PRINCIPAL / RELATÓRIOS / ADMINISTRAÇÃO) viram separadores de 1px.
- **Mobile (<1024px)**: o drawer que já existe — botão hambúrguer, overlay, `.open` —
  agora exibindo os rótulos por extenso. O comportamento de abrir/fechar não muda.
- `--nav-w` substitui o `margin-left: 260px` nas quatro classes globais de container:
  `margin-left: var(--nav-w)`, com `--nav-w: 0` abaixo do breakpoint. Nenhum template
  de página precisa ser alterado por causa disso.
- "Sair do Sistema" sai do rodapé do rail e passa a um menu de conta no topo da área de
  conteúdo, chamando o mesmo `logout()`.

### 3. Componentes compartilhados

`SharedTableComponent`, `StatCardComponent`, `ToastComponent`,
`ConfirmationModalComponent`, `AppointmentDetailsModalComponent`,
`AppointmentsTypeComponent` e os quatro modais de formulário (paciente, cuidador,
prontuário, perfil socioeconômico) passam a consumir as primitivas; o SCSS local de
cada um fica só com o que é específico daquele componente.

**Restrição dura**: nenhuma assinatura de `@Input` / `@Output` muda, nem a estrutura de
dados que cada um recebe. Se um ajuste visual exigir nova configuração, ela entra como
`@Input` opcional com default que preserva o comportamento atual.

Material: o tema prebuilt `deeppurple-amber` permanece; `.custom-mat-form-field` é
reapontado para os tokens (borda `--border-strong`, foco `--accent`, fundo `--bg`).
Bootstrap permanece carregado e não é removido nesta refatoração.

### 4. Migração das telas

Um commit por etapa, nesta ordem:

1. Fundação (`_tokens`, `_typography`, `_primitives`, `index.html`)
2. Rail de navegação + `--nav-w` nos containers globais
3. Componentes compartilhados
4. Login
5. Home
6. Listas: pacientes, cuidadores, atendimentos
7. Detalhes: paciente (abas Detalhes/Documentos/Cuidador/Histórico), cuidador,
   document-list, document-upload
8. Estatísticas, relatórios, usuários

Em cada tela: aplicar as primitivas, apagar a duplicação local que elas cobrem e
preservar integralmente `*ngIf`, bindings, filtros, ordenação e paginação server-side.

## Não faz parte deste escopo (fase 2)

Elementos do mockup que dependem de dados que a API não expõe hoje, ou que
reorganizam a IA. **Correção pós-levantamento:** a agenda do dia e a lista de
aniversários já existem e funcionam na tela de início (commit `8a3b632`) — não
são fase 2; são preservadas e apenas repintadas. Cada um exige alinhamento com o backend antes de ser planejado:

- Fila de pendências no início (C1)
- Indicador "Ficha 68%" / percentual de completude por atendido
- Coluna "último acesso" em usuários (F4)
- Validade e vencimento de documentos (G4)
- Master-detail com prévia lateral em Atendidos (C2)
- Registro clínico como gaveta de 3 etapas com rascunho automático (C3)
- Histórico de atendimentos como linha do tempo (G6)
- Prévia da primeira página e modelos salvos em relatórios (F3)

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Regressão visual silenciosa em tela não conferida | Conferência obrigatória da rota afetada a cada commit, incluindo estados carregando / vazio / erro |
| Quebra de tela por mudança em componente compartilhado | `grep -rl NomeDoComponente src/app` antes de editar; nenhuma assinatura de `@Input`/`@Output` alterada |
| Container novo sem a classe global | `--nav-w` mantém as quatro classes existentes funcionando; nenhuma delas é renomeada |
| Conflito entre Bootstrap, Material e as primitivas | Toda primitiva leva o prefixo `ae-`, evitando colisão com `.card` / `.btn` / `.chip` do Bootstrap |
| Perda de comportamento frágil já documentado | Formatos de data por contexto, erro de rede não deslogar, paginação server-side e `SecureImageDirective` não são tocados |

## Verificação

Não há suíte de testes no projeto e `ng test` não funciona. Por commit:

1. `npm run build` limpo (o `strictTemplates` pega a maioria dos erros de template).
2. Abrir cada rota afetada e conferir os estados carregando, vazio e erro.
3. Conferir desktop e mobile (o breakpoint da navegação é o ponto sensível).

Nenhuma etapa é dada por concluída sem os três.
