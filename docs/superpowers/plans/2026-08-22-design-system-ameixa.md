# Design system Ameixa profunda — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a identidade visual Ameixa profunda a todas as telas do sistema, substituindo estilos duplicados por uma camada de tokens e primitivas, sem alterar a arquitetura de informação nem o comportamento de nenhuma tela.

**Architecture:** Três parciais SCSS novas em `src/styles/` (tokens, tipografia, primitivas) importadas por `src/styles.scss`. A sidebar de 260px vira um rail de ícones no desktop e mantém o drawer no mobile, com a largura exposta na variável `--nav-w` que substitui os nove `margin-left: 260px` espalhados pelo projeto. Cada tela é migrada num commit próprio, consumindo as primitivas e apagando a duplicação local.

**Tech Stack:** Angular 20 standalone, SCSS por componente, Bootstrap 5 e Angular Material coexistindo, Font Awesome 6 e Google Fonts por CDN.

**Spec:** `docs/superpowers/specs/2026-08-22-design-system-ameixa-design.md`

## Global Constraints

Valem para **todas** as tarefas. Violação aqui é motivo de rejeição, mesmo que a tela fique bonita.

- **Não há suíte de testes.** O projeto não tem nenhum `.spec.ts` nem Karma/Jasmine. `ng test` **não funciona** — não rode, não sugira, não afirme que testes passaram. A verificação de cada tarefa é `npm run build` limpo mais conferência visual da rota.
- **Não altere comportamento.** Nenhum `*ngIf`, `*ngFor`, `[(ngModel)]`, `(click)`, `routerLink`, chamada de serviço, filtro, ordenação ou paginação muda. Esta refatoração mexe em classes CSS, SCSS e marcação de apresentação — nada mais.
- **Nenhuma assinatura de `@Input`/`@Output` muda** em componente compartilhado. Se um ajuste visual precisar de configuração, adicione `@Input` opcional com default que preserva o comportamento atual.
- **Antes de editar componente compartilhado**, rode `grep -rl NomeDoComponente src/app` e confira todos os usos.
- **Não remova** feature, campo, filtro, rota, prop ou chave de payload que hoje funciona, mesmo que pareça morto.
- **Prefixo obrigatório `ae-`** em toda primitiva global: `.ae-card`, `.ae-btn`, `.ae-chip`, `.ae-field`, `.ae-table`, `.ae-page-header`, `.ae-alert`, `.ae-empty`. Sem prefixo colide com Bootstrap.
- **Nenhuma sombra dentro da aplicação.** Borda de 1px basta. Sombra só em gaveta, modal e overlay, via `--shadow-overlay`.
- **Um botão sólido roxo por tela.** Todos os demais são `.ae-btn--ghost`.
- **Mono só onde é dado tabular**: CPF, datas, telefones, IDs e contagens usam `.mono`. Nunca em texto corrido.
- **Vazio se escreve em `--text-faint`**, com a palavra ("não informado", "sem endereço"), nunca com traço.
- **Idioma**: código, classes CSS e nomes de arquivo em inglês; todo texto visível ao usuário em pt-BR. Não traduza texto de interface existente nem renomeie rotas.
- **Sem comentários óbvios** no SCSS. Comente só regra não evidente (ex.: por que um override do Material precisa de `!important`).
- **Commits** em Conventional Commits, um por tarefa, na branch `refactor/new-interface-design-system`.

---

## Estrutura de arquivos

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `src/styles/_tokens.scss` | Custom properties: paleta, raio, espaçamento, `--nav-w`, `--shadow-overlay` |
| `src/styles/_typography.scss` | Famílias, escala tipográfica, utilitário `.mono` |
| `src/styles/_primitives.scss` | `.ae-card`, `.ae-btn`, `.ae-chip`, `.ae-field`, `.ae-table`, `.ae-page-header`, `.ae-alert`, `.ae-empty` |

**Modificados:** `src/index.html` (fontes), `src/styles.scss` (imports, containers globais, overrides do Material), `src/app/sidebar/*` e o par `.html` / `.scss` de cada tela.

**Os nove offsets de sidebar** que a Tarefa 2 substitui por `var(--nav-w)`:

```
src/styles.scss:6                              (4 classes de container)
src/app/home/home.scss:2
src/app/reports/reports.component.scss:4
src/app/statistics/statistics.component.scss:3
src/app/user-register/user-register.component.scss:7
src/app/user-register/user-register.component.scss:22
src/app/caretaker-list/caretaker-list.component.scss:41
src/app/patient/patient.component.scss:42
src/app/appointment-list/appointment-list.component.scss:44
```

---

### Task 1: Fundação — tokens, tipografia e primitivas

**Files:**
- Create: `src/styles/_tokens.scss`
- Create: `src/styles/_typography.scss`
- Create: `src/styles/_primitives.scss`
- Modify: `src/index.html` (bloco `<head>`)
- Modify: `src/styles.scss` (topo do arquivo)

**Interfaces:**
- Consumes: nada.
- Produces: as custom properties e as classes `.ae-*` listadas acima. Todas as tarefas seguintes consomem daqui e **não redeclaram cor, raio ou sombra**.

- [ ] **Step 1: Criar `src/styles/_tokens.scss`**

```scss
:root {
  --bg: #f4f2f5;
  --surface: #fefdff;
  --border: #e0dbe4;
  --border-strong: #d6d0dc;
  --hairline: #efecf2;

  --text: #1e1823;
  --text-muted: #655c6e;
  --text-faint: #9a91a4;

  --nav-bg: #241c2b;
  --nav-icon: #8f8398;
  --nav-active-bg: rgba(255, 255, 255, 0.14);
  --brand-soft: #7a52a8;

  --accent: #5b2d8c;
  --accent-soft: #ece4f5;
  --accent-strong: #3f1d66;

  --warn: #7d6427;
  --warn-bg: #f5efdf;
  --warn-border: #e6dbc0;
  --danger: #b0463c;
  --danger-bg: #f8e8e6;
  --danger-border: #eccdc8;
  --ok: #2c6b50;
  --ok-bg: #e5f0e9;

  --r-card: 10px;
  --r-control: 8px;
  --r-chip: 16px;

  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-7: 28px;
  --sp-8: 32px;

  --pad-card: 16px;
  --pad-row: 12px;
  --gap-block: 20px;
  --pad-content: 28px;

  --nav-w: 64px;
  --shadow-overlay: 0 24px 60px -30px rgba(30, 24, 35, 0.5);
}

@media (max-width: 1023px) {
  :root {
    --nav-w: 0px;
    --pad-content: 16px;
  }
}
```

- [ ] **Step 2: Criar `src/styles/_typography.scss`**

```scss
body {
  font-family: 'Libre Franklin', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  background-color: var(--bg);
}

.mono {
  font-family: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace;
  font-variant-numeric: tabular-nums;
}

.ae-title-page {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0;
}

.ae-title-block {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.ae-label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted);
}

.ae-label-eyebrow {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.ae-text-muted { color: var(--text-muted); }
.ae-text-faint { color: var(--text-faint); }
```

- [ ] **Step 3: Criar `src/styles/_primitives.scss`**

```scss
.ae-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: var(--pad-card);
}

.ae-card--flush { padding: 0; }

.ae-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  border-radius: var(--r-control);
  padding: 9px 14px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  line-height: 1.2;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  i { font-size: 11px; }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ae-btn--primary {
  background: var(--accent);
  color: #fff;

  &:hover:not(:disabled) { background: var(--accent-strong); }
}

.ae-btn--ghost {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border-strong);

  &:hover:not(:disabled) { background: var(--bg); }
}

.ae-btn--danger {
  background: var(--surface);
  color: var(--danger);
  border-color: var(--danger-border);

  &:hover:not(:disabled) { background: var(--danger-bg); }
}

.ae-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--r-chip);
  padding: 4px 11px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}

.ae-chip--accent { color: var(--accent-strong); background: var(--accent-soft); }
.ae-chip--warn { color: var(--warn); background: var(--warn-bg); }
.ae-chip--danger { color: var(--danger); background: var(--danger-bg); }
.ae-chip--ok { color: var(--ok); background: var(--ok-bg); }
.ae-chip--neutral { color: var(--text-muted); background: var(--surface); border-color: var(--border); }
.ae-chip--selected { color: #fff; background: var(--accent); }

.ae-field {
  width: 100%;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-control);
  padding: 11px 13px;
  font-family: inherit;
  font-size: 14px;
  color: var(--text);

  &::placeholder { color: var(--text-faint); }

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &:disabled {
    background: var(--bg);
    color: var(--text-faint);
  }
}

.ae-field-label {
  display: block;
  margin-bottom: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.ae-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);

  th {
    text-align: left;
    padding: 11px 18px;
    border-bottom: 1px solid var(--hairline);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-faint);
    white-space: nowrap;
  }

  td {
    padding: var(--pad-row) 18px;
    border-bottom: 1px solid var(--hairline);
    font-size: 13.5px;
    color: var(--text);
    vertical-align: middle;
  }

  tbody tr:hover { background: var(--bg); }
  tbody tr:last-child td { border-bottom: none; }
}

.ae-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-4);
  flex-wrap: wrap;
  padding-bottom: var(--sp-4);

  .ae-page-header__subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--text-muted);
  }

  .ae-page-header__actions {
    display: flex;
    gap: var(--sp-2);
  }
}

.ae-alert {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  border-radius: 9px;
  border: 1px solid transparent;
  padding: 11px 14px;
  font-size: 13.5px;
}

.ae-alert--warn { color: var(--warn); background: var(--warn-bg); border-color: var(--warn-border); }
.ae-alert--danger { color: var(--danger); background: var(--danger-bg); border-color: var(--danger-border); }
.ae-alert--ok { color: var(--ok); background: var(--ok-bg); border-color: var(--ok); }

.ae-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  text-align: center;
  background: var(--surface);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-card);
  padding: 28px;
  color: var(--text-muted);
  font-size: 13.5px;

  i {
    font-size: 20px;
    color: var(--text-faint);
  }
}
```

- [ ] **Step 4: Carregar as fontes no `src/index.html`**

Adicione dentro do `<head>`, imediatamente antes da linha do Font Awesome:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 5: Importar as parciais no `src/styles.scss`**

Substitua a primeira linha do arquivo (o comentário `/* You can add global styles… */`) por:

```scss
@use 'styles/tokens';
@use 'styles/typography';
@use 'styles/primitives';
```

O restante do arquivo permanece intacto nesta tarefa.

- [ ] **Step 6: Verificar o build**

Run: `npm run build`
Expected: build conclui sem erro. Se o Angular reclamar do caminho de `@use`, confirme que os arquivos estão em `src/styles/` e que os nomes começam com underscore (`_tokens.scss` é referenciado como `styles/tokens`).

- [ ] **Step 7: Conferir na tela**

Run: `npm start` e abra `http://localhost:4200`.
Expected: as telas continuam funcionando; a fonte do corpo muda para Libre Franklin e o fundo geral fica levemente lilás. Nada mais muda ainda — nenhuma tela consome as primitivas nesta tarefa.

- [ ] **Step 8: Commit**

```bash
git add src/styles src/styles.scss src/index.html
git commit -m "feat: adiciona tokens, tipografia e primitivas do design system"
```

---

### Task 2: Rail de navegação e `--nav-w`

**Files:**
- Modify: `src/app/sidebar/sidebar.html`
- Modify: `src/app/sidebar/sidebar.scss`
- Modify: `src/styles.scss:3-18` (bloco das quatro classes de container)
- Modify: `src/app/home/home.scss:2`
- Modify: `src/app/reports/reports.component.scss:4`
- Modify: `src/app/statistics/statistics.component.scss:3`
- Modify: `src/app/user-register/user-register.component.scss:7` e `:22`
- Modify: `src/app/caretaker-list/caretaker-list.component.scss:41`
- Modify: `src/app/patient/patient.component.scss:42`
- Modify: `src/app/appointment-list/appointment-list.component.scss:44`

**Interfaces:**
- Consumes: `--nav-bg`, `--nav-icon`, `--nav-active-bg`, `--brand-soft`, `--nav-w` da Tarefa 1.
- Produces: nenhuma API nova. `SidebarComponent` mantém `menuItems`, `isAdmin`, `isSidebarOpen`, `toggleSidebar()`, `closeSidebar()`, `toggleGroup()` e `logout()` com as mesmas assinaturas.

**Atenção:** `sidebar.component.ts` **não muda nesta tarefa**. Os itens de menu, ícones, ordem, `adminOnly` e `type: 'header'` continuam exatamente como estão. No desktop os itens `type: 'header'` são renderizados como separador de 1px em vez de texto.

- [ ] **Step 1: Reescrever `src/app/sidebar/sidebar.html`**

Preserve todos os bindings existentes; a mudança é de estrutura de apresentação. O `nav-text` passa a ficar dentro de `.nav-label`, visível no drawer mobile e usado como tooltip no desktop via `[title]`.

```html
<button class="mobile-toggle" (click)="toggleSidebar()" aria-label="Abrir menu">
  <i class="fa-solid fa-bars"></i>
</button>

<div class="sidebar-overlay" [class.open]="isSidebarOpen" (click)="closeSidebar()"></div>

<div class="sidebar" [class.open]="isSidebarOpen">
  <div class="sidebar-brand">
    <img src="assets/images/logo.png" alt="AEPAPA" class="brand-logo">
    <span class="brand-name">AEPAPA</span>
  </div>

  <nav class="sidebar-nav">
    <ul class="nav-list">
      <ng-container *ngFor="let item of menuItems">

        <li class="nav-separator" *ngIf="item.type === 'header' && (!item.adminOnly || isAdmin)">
          <span class="nav-separator-text">{{ item.text }}</span>
        </li>

        <li class="nav-item" *ngIf="item.type === 'link' && !item.children && (!item.adminOnly || isAdmin)">
          <a [routerLink]="[item.link]" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link" [title]="item.text" (click)="closeSidebar()">
            <span class="nav-icon" *ngIf="item.icon"><i [class]="item.icon"></i></span>
            <span class="nav-label">{{ item.text }}</span>
          </a>
        </li>

        <li class="nav-item has-children" *ngIf="item.type === 'link' && item.children && (!item.adminOnly || isAdmin)"
          [class.expanded]="item.expanded">
          <a class="nav-link parent-link" [title]="item.text" (click)="toggleGroup(item)">
            <span class="nav-icon" *ngIf="item.icon"><i [class]="item.icon"></i></span>
            <span class="nav-label">{{ item.text }}</span>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
          </a>

          <ul class="submenu" [style.max-height]="item.expanded ? '500px' : '0'">
            <li class="nav-item" *ngFor="let subItem of item.children">
              <a [routerLink]="[subItem.link]" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
                class="nav-link sub-link" [title]="subItem.text" (click)="closeSidebar()">
                <span class="nav-label">{{ subItem.text }}</span>
              </a>
            </li>
          </ul>
        </li>

      </ng-container>
    </ul>
  </nav>

  <div class="sidebar-footer">
    <button class="logout-button" (click)="logout()" title="Sair do Sistema">
      <span class="nav-icon"><i class="fa-solid fa-arrow-right-from-bracket"></i></span>
      <span class="nav-label">Sair do Sistema</span>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Reescrever `src/app/sidebar/sidebar.scss`**

Substitua o arquivo inteiro. As variáveis SCSS locais (`$primary-color`, `$text-main`, …) somem; tudo passa a vir dos tokens.

```scss
$mobile-breakpoint: 1023px;

.mobile-toggle {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1100;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-control);
  padding: 10px 12px;
  cursor: pointer;

  i {
    font-size: 18px;
    color: var(--text);
  }

  @media (max-width: $mobile-breakpoint) {
    display: block;
  }
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(30, 24, 35, 0.3);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.open {
    display: block;
    opacity: 1;
  }
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: var(--nav-w);
  height: 100vh;
  background: var(--nav-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 0;
  gap: var(--sp-2);
  overflow-x: hidden;
  overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
  padding: 0 12px;

  .brand-logo {
    width: 34px;
    height: 34px;
    border-radius: var(--r-control);
    background: var(--brand-soft);
    object-fit: contain;
    flex-shrink: 0;
  }

  .brand-name {
    display: none;
    font-size: 15px;
    font-weight: 700;
    color: var(--surface);
    letter-spacing: -0.01em;
  }
}

.sidebar-nav {
  width: 100%;
  flex: 1;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.nav-separator {
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 6px 0;

  .nav-separator-text {
    display: none;
  }
}

.nav-item {
  width: 100%;
  display: flex;
  justify-content: center;
}

.nav-link,
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 9px;
  color: var(--nav-icon);
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  font-size: 13.5px;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    color: var(--surface);
    background: rgba(255, 255, 255, 0.07);
  }

  &.active {
    color: var(--surface);
    background: var(--nav-active-bg);
  }
}

.nav-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;

  i { font-size: 14px; }
}

.nav-label,
.arrow-icon {
  display: none;
}

.submenu {
  display: none;
}

.sidebar-footer {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: var(--sp-2);
}

@media (max-width: $mobile-breakpoint) {
  .sidebar {
    width: 260px;
    align-items: stretch;
    padding: 18px 12px;
    transform: translateX(-100%);

    &.open { transform: translateX(0); }
  }

  .sidebar-brand .brand-name { display: block; }

  .nav-separator {
    width: 100%;
    height: auto;
    background: transparent;
    margin: 14px 0 4px;

    .nav-separator-text {
      display: block;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 10.5px;
      letter-spacing: 0.1em;
      color: var(--nav-icon);
      padding-left: 12px;
    }
  }

  .nav-item { justify-content: stretch; }

  .nav-link,
  .logout-button {
    width: 100%;
    justify-content: flex-start;
    padding: 0 12px;
  }

  .nav-label { display: block; }

  .arrow-icon {
    display: block;
    margin-left: auto;
    font-size: 11px;
    transition: transform 0.2s ease;
  }

  .has-children.expanded .arrow-icon { transform: rotate(90deg); }

  .submenu {
    display: block;
    list-style: none;
    margin: 0;
    padding: 0 0 0 24px;
    overflow: hidden;
    transition: max-height 0.25s ease;
  }
}
```

- [ ] **Step 3: Trocar o offset global em `src/styles.scss`**

No bloco das quatro classes de container, substitua a linha `margin-left: 260px;` e o `background-color`:

```scss
.patient-list-container,
.patient-page-container,
.caretaker-list-container,
.caretaker-page-container {
    padding: var(--pad-content);
    margin-left: var(--nav-w);
    background-color: var(--bg);
    min-height: 100vh;
    transition: margin-left 0.3s ease;

    @media (max-width: 1023px) {
        padding-top: 72px;
    }
}
```

O `margin-left: 0` do bloco `@media` some — `--nav-w` já vale `0px` abaixo de 1024px.

- [ ] **Step 4: Trocar os oito offsets locais**

Em cada um dos arquivos abaixo, troque `margin-left: 260px;` por `margin-left: var(--nav-w);` e remova a linha `margin-left: 0;` do `@media` correspondente quando ela existir só para desfazer o offset. Nas mesmas regras, troque o breakpoint de `768px` para `1023px`:

```
src/app/home/home.scss:2
src/app/reports/reports.component.scss:4
src/app/statistics/statistics.component.scss:3
src/app/user-register/user-register.component.scss:7
src/app/user-register/user-register.component.scss:22
src/app/caretaker-list/caretaker-list.component.scss:41
src/app/patient/patient.component.scss:42
src/app/appointment-list/appointment-list.component.scss:44
```

- [ ] **Step 5: Confirmar que nenhum 260px sobrou**

Run: `grep -rn "260px" src/`
Expected: apenas a regra `width: 260px` dentro do `@media` do drawer em `sidebar.scss`. Qualquer outro resultado é um offset esquecido.

- [ ] **Step 6: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 7: Conferir na tela**

Abra `/`, `/lista-pacientes`, `/lista-cuidadores`, `/lista-atendimentos`, `/estatisticas`, `/relatorios`, `/registro-usuario`, `/paciente/:id` e `/cuidador/:id`.
Expected: rail escuro estreito à esquerda em todas; conteúdo encostando nele sem faixa vazia nem sobreposição; ícone da rota atual em branco sobre fundo claro translúcido; tooltip aparecendo no hover. Estreite a janela para menos de 1024px: o rail some, o botão hambúrguer aparece, o drawer abre com os rótulos e os cabeçalhos de seção por extenso, e o conteúdo ocupa a largura toda.

- [ ] **Step 8: Commit**

```bash
git add src/app/sidebar src/styles.scss src/app/home/home.scss src/app/reports/reports.component.scss src/app/statistics/statistics.component.scss src/app/user-register/user-register.component.scss src/app/caretaker-list/caretaker-list.component.scss src/app/patient/patient.component.scss src/app/appointment-list/appointment-list.component.scss
git commit -m "refactor: sidebar vira rail de icones com largura em --nav-w"
```

---

### Task 3: Overrides do Material e estado vazio global

**Files:**
- Modify: `src/styles.scss` (blocos `.custom-mat-form-field`, `.empty-state-box`, `.secure-image-loading`)

**Interfaces:**
- Consumes: tokens da Tarefa 1.
- Produces: `.custom-mat-form-field` e `.empty-state-box` repintados. **Os dois seletores continuam existindo com o mesmo nome** — vários templates os usam e nenhum é alterado aqui.

- [ ] **Step 1: Repintar `.custom-mat-form-field`**

Troque os hex antigos pelos tokens, mantendo cada seletor, cada `!important` e a altura de 46px. As substituições, uma a uma:

```
#e5e7eb  →  var(--border-strong)     (bordas do notched outline)
#6a307d  →  var(--accent)            (hover, foco e cor do ícone)
#f9fafb  →  var(--surface)           (fundo do wrapper)
#333     →  var(--text)              (texto do input)
#6b7280  →  var(--text-muted)        (floating label e separador de range)
```

- [ ] **Step 2: Repintar `.empty-state-box`**

```scss
.empty-state-box {
    background-color: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-card);
    padding: 2.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--text-muted);
    box-sizing: border-box;
    width: 100%;

    i {
        font-size: 2.2rem;
        margin-bottom: 0.75rem;
        color: var(--text-faint);
    }

    p {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 500;
        line-height: 1.4;
    }
}
```

- [ ] **Step 3: Repintar o shimmer de `.secure-image-loading`**

```scss
.secure-image-loading {
    background: linear-gradient(90deg, var(--hairline) 25%, var(--border) 50%, var(--hairline) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    color: transparent !important;
}
```

O `z-index` do `.cdk-overlay-container` **não muda** — é o conserto do datepicker sobre modais.

- [ ] **Step 4: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 5: Conferir na tela**

Abra `/lista-atendimentos` e `/relatorios`, que usam datepicker do Material.
Expected: campo de data com borda cinza-lilás, foco roxo ameixa, ícone de calendário roxo; o calendário abre por cima do modal como antes. Abra uma tela com lista vazia (ex.: busca sem resultado em `/lista-pacientes`): a caixa de estado vazio aparece com borda tracejada e texto acinzentado.

- [ ] **Step 6: Commit**

```bash
git add src/styles.scss
git commit -m "refactor: aplica tokens nos overrides do Material e no estado vazio global"
```

---

### Task 4: Componentes compartilhados de feedback

**Files:**
- Modify: `src/app/shared/components/toast/toast.component.scss`
- Modify: `src/app/shared/components/confirmation-modal/confirmation-modal.component.scss`
- Modify: `src/app/shared/components/stat-card/stat-card.component.scss`
- Modify: `src/app/shared/components/shared-table/shared-table.component.scss`

**Interfaces:**
- Consumes: tokens e primitivas.
- Produces: nada novo. Os quatro componentes mantêm `@Input`/`@Output` e templates inalterados — **só os arquivos `.scss` são tocados nesta tarefa**.

**Contexto que o executor precisa saber:** `SharedTableComponent` hoje não é usado por nenhum template (`grep -rl app-shared-table src/app` não retorna nada) e `StatCardComponent` é usado só por `statistics.component.html`. Nenhum dos dois é removido — a regra do projeto é não apagar o que existe. Repinte e siga.

- [ ] **Step 1: Confirmar os usos antes de editar**

Run: `grep -rl "app-toast\|app-confirmation-modal\|app-stat-card\|app-shared-table" src/app --include='*.html'`
Expected: a lista de templates afetados. Anote-a; ela é o roteiro de conferência do Step 4.

- [ ] **Step 2: Repintar os quatro SCSS**

Em cada arquivo, substitua os hex por tokens seguindo o mapa:

```
fundos claros (#fff, #f9fafb, #f3f4f6)   →  var(--surface) / var(--bg)
bordas (#e5e7eb, #e0e0e0, #f0f0f5)       →  var(--border) / var(--hairline)
texto forte (#111, #333, #2c2e3e)        →  var(--text)
texto fraco (#6b7280, #8890a5, #9ca3af)  →  var(--text-muted) / var(--text-faint)
roxo (#6a307d)                           →  var(--accent)
verde de sucesso (#10b981)               →  var(--ok) / fundo var(--ok-bg)
vermelho de erro (#ef4444, #ff4d6d)      →  var(--danger) / fundo var(--danger-bg)
amarelo de aviso                         →  var(--warn) / fundo var(--warn-bg)
```

Raios: 10px em cartão, 8px em botão e input, 16px em chip. Remova todo `box-shadow` **exceto** no `.modal-overlay` / caixa do `confirmation-modal` e no toast, que são overlay e podem usar `var(--shadow-overlay)`.

- [ ] **Step 3: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Conferir na tela**

Dispare um toast de sucesso (salve qualquer registro) e um de erro (salve um formulário inválido). Abra um modal de confirmação (desativar um atendido, sem confirmar). Abra `/estatisticas` para ver os stat cards.
Expected: toast com barra colorida no token certo, modal com sombra só no overlay, stat cards com borda de 1px e sem sombra.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/components/toast src/app/shared/components/confirmation-modal src/app/shared/components/stat-card src/app/shared/components/shared-table
git commit -m "refactor: aplica tokens nos componentes compartilhados de feedback"
```

---

### Task 5: Modais de formulário

**Files:**
- Modify: `src/app/shared/components/patient-form-modal/patient-form-modal.component.{html,scss}`
- Modify: `src/app/shared/components/caretaker-form-modal/caretaker-form-modal.component.{html,scss}`
- Modify: `src/app/shared/components/clinical-record-modal/clinical-record-modal.component.{html,scss}`
- Modify: `src/app/shared/components/socioeconomic-profile-modal/socioeconomic-profile-modal.component.{html,scss}`
- Modify: `src/app/shared/components/appointment-details-modal/appointment-details-modal.component.{html,scss}`
- Modify: `src/app/shared/components/appointments-type/appointments-type.component.{html,scss}`

**Interfaces:**
- Consumes: `.ae-field`, `.ae-field-label`, `.ae-btn`, `.ae-chip`, `.ae-alert`, `--shadow-overlay`.
- Produces: nada novo. Todos os `@Input`/`@Output` e todos os `[(ngModel)]` permanecem idênticos.

- [ ] **Step 1: Conferir os usos**

Run: `grep -rl "app-patient-form-modal\|app-caretaker-form-modal\|app-clinical-record-modal\|app-socioeconomic-profile-modal\|app-appointment-details-modal\|app-appointments-type" src/app --include='*.html'`
Expected: a lista de telas que abrem cada modal. Todas serão conferidas no Step 5.

- [ ] **Step 2: Migrar a marcação dos formulários**

Em cada template, nos elementos de formulário:
- `class="form-control"` → `class="ae-field"` (mantendo `[(ngModel)]`, `name`, `required`, `#ref="ngModel"` e placeholders em pt-BR intactos)
- `class="form-label"` → `class="ae-field-label"`
- botão de salvar/confirmar → `class="ae-btn ae-btn--primary"` (um só por modal)
- botão de cancelar/fechar → `class="ae-btn ae-btn--ghost"`
- bloco de erro de validação já existente → envolver em `class="ae-alert ae-alert--danger"` quando for aviso de bloco; erro de campo isolado continua como está, só recolorido para `var(--danger)`

Não mexa em `<mat-form-field>` — o Material continua com `.custom-mat-form-field`, já repintado na Tarefa 3.

- [ ] **Step 3: Enxugar os SCSS**

Apague de cada `.scss` as regras que a primitiva agora cobre (definição própria de input, label, botão primário e secundário). Mantenha o que é específico: grid do formulário, largura da caixa, cabeçalho e rodapé do modal. O overlay usa `background: rgba(30, 24, 35, 0.3)` e a caixa usa `box-shadow: var(--shadow-overlay)` e `border-radius: 12px`.

- [ ] **Step 4: Verificar o build**

Run: `npm run build`
Expected: build limpo. `strictTemplates` acusa qualquer binding quebrado — se acusar, foi alteração indevida de template.

- [ ] **Step 5: Conferir na tela**

Abra e **salve de verdade** um registro em cada modal: novo atendido, novo cuidador, novo registro clínico, perfil socioeconômico. Abra os detalhes de um atendimento.
Expected: campos com a nova borda e foco ameixa; máscara de data continuando a funcionar (`DateMaskDirective`); datas gravando certo; validação exibindo as mesmas mensagens em pt-BR; um único botão sólido por modal.

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components
git commit -m "refactor: aplica primitivas nos modais de formulario"
```

---

### Task 6: Login

**Files:**
- Modify: `src/app/login/login.html`
- Modify: `src/app/login/login.scss`

**Interfaces:**
- Consumes: `.ae-field`, `.ae-field-label`, `.ae-btn--primary`, tokens.
- Produces: nada.

O login não está no mockup; ele recebe a mesma linguagem por extensão. A composição de duas colunas com a imagem de fundo permanece.

- [ ] **Step 1: Migrar a marcação**

`class="form-control"` → `class="ae-field"`; `class="form-label"` → `class="ae-field-label"`; o botão de entrar → `class="ae-btn ae-btn--primary"`. O `input-wrapper` com ícone e o `password-toggle` continuam, só recoloridos. `[(ngModel)]`, `#loginForm="ngForm"`, `(ngSubmit)` e as mensagens de erro não mudam.

- [ ] **Step 2: Enxugar o SCSS**

Apague as regras de input, label e botão que a primitiva cobre. Ajuste: fundo `var(--bg)`, cartão `var(--surface)`, título 26px/700 em `var(--text)`, subtítulo `var(--text-muted)`, overlay da imagem em ameixa translúcido. Sem sombra na caixa do formulário.

- [ ] **Step 3: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Conferir na tela**

Abra `/login` deslogado. Faça um login com senha errada e depois um correto.
Expected: erro em `var(--danger)`; login bem-sucedido redirecionando como antes; o olho de mostrar senha funcionando; layout íntegro abaixo de 1024px.

- [ ] **Step 5: Commit**

```bash
git add src/app/login
git commit -m "refactor: aplica design system na tela de login"
```

---

### Task 7: Início

**Files:**
- Modify: `src/app/home/home.html`
- Modify: `src/app/home/home.scss`

**Interfaces:**
- Consumes: `.ae-card`, `.ae-btn`, `.ae-page-header`, `.mono`, tokens.
- Produces: nada.

**A estrutura da tela não muda**: continuam o cabeçalho de boas-vindas com a data, os três cartões de contagem (`totalPatients`, `appointmentsToday`, `pendingTasks`), o bloco de ações rápidas com as duas variantes por papel (`*ngIf="isAdmin"` e `*ngIf="!isAdmin"`) e o restante do conteúdo. Não introduza fila de pendências, agenda nem aniversários — é fase 2.

- [ ] **Step 1: Migrar a marcação**

- `.stat-card` e `.card` → `.ae-card` mantendo as classes de variante existentes para o SCSS local
- os botões de ação rápida continuam com `(click)` idêntico; a moldura vira `.ae-card` com hover em `var(--accent-soft)`
- número grande do cartão: 29px/700 em `var(--text)`; rótulo em `.ae-label`; a data do topo recebe `.mono`
- cabeçalho da página → `.ae-page-header`, com o título em `.ae-title-page`

- [ ] **Step 2: Enxugar o SCSS**

Apague as regras de cartão, sombra e gradiente que as primitivas cobrem. O ícone colorido de cada cartão passa a usar `var(--accent-soft)` de fundo e `var(--accent)` de traço; variantes `success`/`info` usam `--ok-bg`/`--ok` e `--accent-soft`/`--accent`.

- [ ] **Step 3: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Conferir na tela**

Abra `/` como admin e, se possível, como `social_worker`.
Expected: as duas grades de ações rápidas aparecendo conforme o papel; os três números carregando da API como antes; nenhuma sombra; conferir abaixo de 1024px.

- [ ] **Step 5: Commit**

```bash
git add src/app/home
git commit -m "refactor: aplica design system na tela inicial"
```

---

### Task 8: Lista de atendidos

**Files:**
- Modify: `src/app/patient-list/patient-list.component.html`
- Modify: `src/app/patient-list/patient-list.component.scss`

**Interfaces:**
- Consumes: `.ae-page-header`, `.ae-card`, `.ae-table`, `.ae-chip`, `.ae-field`, `.ae-btn`, `.mono`.
- Produces: o padrão de lista que as Tarefas 9, 10 e 14 repetem: cabeçalho, faixa de filtros, cartão com `.ae-table`, rodapé de paginação.

**A tela usa tabela própria (`.custom-table`), não o `SharedTableComponent`.** Continue assim — trocar de componente estaria fora de escopo.

- [ ] **Step 1: Migrar a marcação**

- cabeçalho → `.ae-page-header`; título em `.ae-title-page`; "Novo Atendido" é o **único** `.ae-btn--primary` da tela; "Ver inativos" vira `.ae-btn--ghost`
- busca e selects de filtro → `.ae-field`, mantendo `[(ngModel)]`, `(ngModelChange)` e o debounce existentes
- contador de registros → `.ae-chip ae-chip--neutral` com o número em `.mono`
- `.table-card` → `.ae-card ae-card--flush`; `.custom-table` ganha a classe `ae-table` ao lado da atual (`class="custom-table ae-table"`), para o SCSS local continuar achando seus seletores enquanto a base vem da primitiva
- CPF, idade e datas nas células recebem `.mono`
- status ativo/inativo → `.ae-chip ae-chip--ok` / `.ae-chip ae-chip--neutral`
- ícones de ordenação: cor `var(--text-faint)`, e `var(--accent)` na coluna ordenada

- [ ] **Step 2: Enxugar o SCSS**

Apague as regras de tabela, botão, input e badge cobertas pelas primitivas. Preserve integralmente as regras de largura de coluna e as de responsividade.

- [ ] **Step 3: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Conferir na tela**

Abra `/lista-pacientes`. Exercite: buscar por nome, aplicar cada filtro, limpar filtros, ordenar por duas colunas, virar duas páginas, alternar "ver inativos", abrir uma linha.
Expected: todos continuam funcionando e continuam server-side (confira no DevTools que cada ação dispara requisição com `page`, `search`, `sort_by`, `sort_order`). Estados carregando, vazio e erro conferidos.

- [ ] **Step 5: Commit**

```bash
git add src/app/patient-list
git commit -m "refactor: aplica design system na lista de atendidos"
```

---

### Task 9: Lista de cuidadores

**Files:**
- Modify: `src/app/caretaker-list/caretaker-list.component.html`
- Modify: `src/app/caretaker-list/caretaker-list.component.scss`

**Interfaces:**
- Consumes: o mesmo conjunto da Tarefa 8.
- Produces: nada novo.

- [ ] **Step 1: Migrar a marcação**

Aplique exatamente o mesmo tratamento da Tarefa 8: `.ae-page-header` no topo, "Novo Cuidador" como único `.ae-btn--primary`, filtros em `.ae-field`, tabela dentro de `.ae-card ae-card--flush` com `ae-table`, CPF/telefone/datas em `.mono`, status em `.ae-chip`.

- [ ] **Step 2: Enxugar o SCSS**

Apague o que as primitivas cobrem; preserve larguras de coluna e responsividade.

- [ ] **Step 3: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Conferir na tela**

Abra `/lista-cuidadores`. Exercite busca, filtros, ordenação, paginação e abertura de uma ficha.
Expected: comportamento idêntico ao anterior; visual igual ao da lista de atendidos.

- [ ] **Step 5: Commit**

```bash
git add src/app/caretaker-list
git commit -m "refactor: aplica design system na lista de cuidadores"
```

---

### Task 10: Lista de atendimentos

**Files:**
- Modify: `src/app/appointment-list/appointment-list.component.html`
- Modify: `src/app/appointment-list/appointment-list.component.scss`

**Interfaces:**
- Consumes: o mesmo conjunto da Tarefa 8, mais `.ae-alert`.
- Produces: nada novo.

Esta é a maior tela do projeto: 447 linhas de HTML e 1.896 de SCSS, com formulário de novo atendimento, filtros de data por Material datepicker e a tabela. Trabalhe por blocos e não reordene nada.

- [ ] **Step 1: Migrar o cabeçalho e os filtros**

`.ae-page-header` no topo; "Novo Atendimento" como único `.ae-btn--primary`; "Exportar" e demais ações como `.ae-btn--ghost`; chips de filtro por situação/tipo usando `.ae-chip--selected` no ativo e `.ae-chip--neutral` nos demais. Os `<mat-form-field class="custom-mat-form-field">` de data ficam como estão.

- [ ] **Step 2: Migrar a tabela**

`.ae-card ae-card--flush` em volta; a tabela existente recebe `ae-table` ao lado da classe atual. Data e hora em `.mono`; situação em `.ae-chip--warn` para agendado e `.ae-chip--ok` para realizado, usando exatamente a mesma condição que hoje define a cor.

- [ ] **Step 3: Migrar o formulário de atendimento**

`class="form-control"` → `class="ae-field"`; labels → `.ae-field-label`; botão de salvar → `.ae-btn--primary`; cancelar → `.ae-btn--ghost`. **Não toque** na lógica de datas: `toApiWriteDate()` grava `MM-DD-YYYY` e `toApiFilterDate()` filtra em `YYYY-MM-DD`.

- [ ] **Step 4: Enxugar o SCSS**

Apague o que as primitivas cobrem. Este arquivo tem a maior duplicação do projeto — espere reduzi-lo de forma substancial. Preserve as regras de responsividade e as de largura de coluna.

- [ ] **Step 5: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 6: Conferir na tela**

Abra `/lista-atendimentos`. Exercite: criar um atendimento com data passada (precisa continuar sendo aceito), filtrar por intervalo de datas, filtrar por tipo e por situação, ordenar, paginar, abrir o modal de detalhes.
Expected: tudo funcionando; as datas gravando e exibindo nos formatos certos (`DD/MM/AAAA` na tela); requisições continuando server-side.

- [ ] **Step 7: Commit**

```bash
git add src/app/appointment-list
git commit -m "refactor: aplica design system na lista de atendimentos"
```

---

### Task 11: Ficha do atendido

**Files:**
- Modify: `src/app/patient/patient.component.html`
- Modify: `src/app/patient/patient.component.scss`

**Interfaces:**
- Consumes: `.ae-card`, `.ae-btn`, `.ae-chip`, `.ae-alert`, `.ae-empty`, `.mono`.
- Produces: o padrão de ficha (cabeçalho de perfil + abas) que a Tarefa 12 repete no cuidador.

**As quatro abas existentes permanecem**: `detalhes`, `documentos`, `Cuidador`, `consultas`. Os valores passados a `selectTab()` e comparados em `activeTab` **não mudam** — inclusive o `'Cuidador'` com maiúscula. Não vire timeline; é fase 2.

- [ ] **Step 1: Migrar o cabeçalho de perfil**

Avatar circular com `var(--accent)` de fundo e inicial em branco (o `profile-picture_url` com `secureImage` continua tendo prioridade quando existe). Nome em 24px/700; ao lado, `.ae-chip--ok` "Ativo" ou `.ae-chip--neutral` "Inativo" pela mesma condição de hoje. A linha de dados (idade, nascimento, CPF, gênero, estado civil) vira uma faixa em `var(--text-muted)` com CPF e datas em `.mono`. Botões: "Registro Clínico" é o único `.ae-btn--primary`; "Editar Perfil" vira `.ae-btn--ghost`; "Desativar" vira `.ae-btn--danger`.

- [ ] **Step 2: Migrar as abas**

`.page-tabs` vira faixa em `var(--surface)` com borda inferior; cada `.tab-btn` fica 13,5px em `var(--text-muted)`, e o ativo ganha 700, `var(--text)` e `border-bottom: 2px solid var(--accent)`. Os `(click)` e `[class.active]` continuam idênticos.

- [ ] **Step 3: Migrar o conteúdo das abas**

Cada `.info-section` vira `.ae-card`; título de bloco em `.ae-title-block`; rótulo de campo em `.ae-label`; telefone, CPF e datas em `.mono`. Campo sem valor: texto "não informado" em `var(--text-faint)`, nunca traço. `.empty-state-box` existente pode ficar (já repintada na Tarefa 3) ou virar `.ae-empty` — as duas são aceitáveis, escolha uma e seja consistente na tela. Marcadores clínicos viram `.ae-chip`, com `--danger` para risco, `--warn` para alerta e `--accent` para os demais, seguindo a mesma classificação que o template já usa.

- [ ] **Step 4: Enxugar o SCSS**

São 1.923 linhas — o maior arquivo do projeto. Apague tudo que as primitivas cobrem, preserve grids, larguras e responsividade.

- [ ] **Step 5: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 6: Conferir na tela**

Abra `/paciente/:id` de um atendido com dados completos e de outro com dados faltando. Percorra as quatro abas. Exercite: editar perfil, adicionar registro clínico, trocar a foto, desativar (sem confirmar).
Expected: as quatro abas alternando, a foto carregando via `SecureImageDirective`, os modais abrindo, campos vazios escritos por extenso em cinza.

- [ ] **Step 7: Commit**

```bash
git add src/app/patient
git commit -m "refactor: aplica design system na ficha do atendido"
```

---

### Task 12: Ficha do cuidador e documentos

**Files:**
- Modify: `src/app/caretaker/caretaker.component.{html,scss}`
- Modify: `src/app/document-list/document-list.component.{html,scss}`
- Modify: `src/app/document-upload/document-upload.component.{html,scss}`

**Interfaces:**
- Consumes: o mesmo conjunto da Tarefa 11.
- Produces: nada novo.

`DocumentListComponent` e `DocumentUploadComponent` são usados **dentro** da ficha do atendido (aba Documentos) e da ficha do cuidador — por isso migram junto e são conferidos nos dois lugares.

- [ ] **Step 1: Migrar a ficha do cuidador**

Mesmo tratamento de cabeçalho e blocos da Tarefa 11. "Vincular atendido" (ou a ação equivalente já existente) é o único `.ae-btn--primary`.

- [ ] **Step 2: Migrar a lista de documentos**

Cada documento vira linha em `.ae-card`, com ícone do tipo de arquivo sobre `var(--accent-soft)`, nome em 13,5px/600 e a linha de metadados (formato, tamanho, data de envio) em `var(--text-faint)` com a data em `.mono`. Sem documentos: `.ae-empty` com texto explicando o que anexar.

- [ ] **Step 3: Migrar o envio de documentos**

A zona de arrastar vira `.ae-empty` com borda tracejada, ícone e as duas linhas de texto ("Arraste arquivos aqui…" e o limite de formato/tamanho), mantendo os mesmos textos em pt-BR que já existem. Barra de progresso em `var(--accent)`. Os handlers de drag/drop e o `(change)` do input não mudam.

- [ ] **Step 4: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 5: Conferir na tela**

Abra `/cuidador/:id`. Depois abra `/paciente/:id` na aba Documentos. **Envie um arquivo de verdade** e baixe outro.
Expected: upload concluindo, lista atualizando, download funcionando, miniatura carregando via `SecureImageDirective`.

- [ ] **Step 6: Commit**

```bash
git add src/app/caretaker src/app/document-list src/app/document-upload
git commit -m "refactor: aplica design system na ficha do cuidador e em documentos"
```

---

### Task 13: Estatísticas

**Files:**
- Modify: `src/app/statistics/statistics.component.html`
- Modify: `src/app/statistics/statistics.component.scss`

**Interfaces:**
- Consumes: `.ae-card`, `.ae-page-header`, `.ae-chip`, `.mono`, `StatCardComponent` (repintado na Tarefa 4).
- Produces: a rampa de roxos para séries de dados, reutilizável se outra tela precisar.

- [ ] **Step 1: Migrar cabeçalho e cartões**

`.ae-page-header` no topo; o seletor de período (30 dias / trimestre / ano) vira grupo de `.ae-chip`, com `--selected` no ativo. Os cartões de número usam `.ae-card`, número 30px/700 em `var(--text)` e rótulo em `.ae-label`.

- [ ] **Step 2: Recolorir os gráficos**

Série principal em `var(--accent)`; barras secundárias em `var(--brand-soft)`; a rampa para fatias de um mesmo gráfico, do mais escuro ao mais claro:

```
#5b2d8c  #8460b0  #9b7cd8  #bda8d6  #d3c3e6  #e6dbf2
```

Linhas de grade em `var(--hairline)`, eixo de base em `var(--border)`, rótulos de eixo em `.mono` 10px `var(--text-faint)`. Variação positiva em `var(--ok)`, negativa em `var(--warn)`, estável em `var(--text-faint)`.

- [ ] **Step 3: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Conferir na tela**

Abra `/estatisticas` e troque o período.
Expected: os mesmos números de antes, gráficos legíveis na rampa roxa, sem sombra nos cartões.

- [ ] **Step 5: Commit**

```bash
git add src/app/statistics
git commit -m "refactor: aplica design system nas estatisticas"
```

---

### Task 14: Relatórios e usuários

**Files:**
- Modify: `src/app/reports/reports.component.{html,scss}`
- Modify: `src/app/user-register/user-register.component.{html,scss}`

**Interfaces:**
- Consumes: todo o conjunto de primitivas.
- Produces: nada novo.

- [ ] **Step 1: Migrar relatórios**

Seções "o que incluir" viram cartões de opção em `.ae-card` com a caixa de seleção preenchida em `var(--accent)` quando marcada; período usa os datepickers do Material já repintados; "Baixar relatório" é o único `.ae-btn--primary`; escolha de formato (PDF/XLSX/CSV) vira grupo de `.ae-chip`. Prévia da primeira página e modelos salvos **não entram** — fase 2.

- [ ] **Step 2: Migrar usuários**

`.ae-page-header` com "Novo usuário" como único `.ae-btn--primary`; tabela em `.ae-card ae-card--flush` + `ae-table`; e-mail em 13px `var(--text)`; papel em `.ae-chip--accent` para administrador e `.ae-chip--neutral` para comum; datas em `.mono`. O formulário de cadastro mantém os mesmos campos e validações; o seletor de perfil continua sendo o controle que já existe. Coluna "último acesso" **não entra** — fase 2.

- [ ] **Step 3: Verificar o build**

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Conferir na tela**

Abra `/relatorios` e **gere um relatório de verdade**, conferindo o arquivo baixado. Abra `/registro-usuario` como admin e cadastre um usuário de teste.
Expected: relatório saindo com o mesmo conteúdo de antes; cadastro funcionando; `roleGuard(['admin'])` continuando a bloquear quem não é admin.

- [ ] **Step 5: Commit**

```bash
git add src/app/reports src/app/user-register
git commit -m "refactor: aplica design system em relatorios e usuarios"
```

---

### Task 15: Varredura final

**Files:**
- Modify: qualquer arquivo em que a varredura encontrar resíduo

**Interfaces:**
- Consumes: tudo.
- Produces: o estado final da branch, pronto para revisão.

- [ ] **Step 1: Caçar hex legado**

Run: `grep -rniE "#6a307d|#f3f4f6|#6b7280|#e5e7eb|#10b981|#ef4444|#ff4d6d|#2c2e3e|#8890a5|#9ca3af|#f0f0f5|#d1d5db|#f9fafb" src/ --include='*.scss'`
Expected: nenhum resultado.

Rode também `grep -rn "260px" src/` — o único resultado aceito é o `width: 260px` do drawer em `sidebar.scss`. Qualquer outro é um offset de sidebar reintroduzido por uma tarefa de tela. Cada ocorrência restante é uma cor da paleta antiga — troque pelo token equivalente usando o mapa da Tarefa 4.

- [ ] **Step 2: Caçar sombra indevida**

Run: `grep -rn "box-shadow" src/ --include='*.scss'`
Expected: só em overlay, modal, gaveta, drawer e toast. Qualquer sombra em cartão, botão ou tabela deve ser apagada.

- [ ] **Step 3: Conferir a regra de um botão sólido por tela**

Run: `grep -rc "ae-btn--primary" src/app --include='*.html'`
Expected: no máximo 1 por template de página. Modais contam separado (um por modal). Onde houver mais de um, o secundário vira `.ae-btn--ghost`.

- [ ] **Step 4: Build de produção**

Run: `npm run build`
Expected: build limpo, sem warning novo de orçamento de CSS. Compare o tamanho do bundle de estilos com o da master: ele deve ter **diminuído**.

- [ ] **Step 5: Passada final por todas as rotas**

Percorra `/login`, `/`, `/lista-pacientes`, `/paciente/:id` (quatro abas), `/lista-cuidadores`, `/cuidador/:id`, `/lista-atendimentos`, `/estatisticas`, `/relatorios`, `/registro-usuario` — em ≥1024px e em <1024px.
Expected: nenhuma tela com a paleta antiga, nenhuma quebra de layout, o rail correto em todas, nenhum resquício de faixa vazia de 260px.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "refactor: remove residuos da paleta antiga"
```

---

## Verificação final da branch

Antes de abrir o PR:

1. `npm run build` limpo.
2. As dez rotas conferidas nos dois breakpoints, nos estados carregando, vazio e erro.
3. Uma escrita real em cada fluxo crítico: criar atendido, criar atendimento com data passada, enviar documento, gerar relatório.
4. `git log --oneline master..HEAD` mostrando um commit por tarefa, em ordem.

Nada é dado por pronto sem os quatro.
