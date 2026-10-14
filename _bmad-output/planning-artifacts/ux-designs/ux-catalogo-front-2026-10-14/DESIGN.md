---
name: catalogo-front
description: Painel administrativo de produtos do TCC. Angular Material (M3), tema claro, primária neutra; este DESIGN.md especifica só o delta sobre os padrões do Material.
status: final
sources:
  - _bmad-output/specs/spec-catalogo-front/SPEC.md
  - _bmad-output/specs/spec-catalogo-front/golden-path.md
  - docs/referencia-api/
  - README.md
updated: 2026-10-14
colors:
  # Delta de marca: só a primária. Os demais tokens são os padrões M3 de
  # sistema (--mat-sys-*), repetidos aqui apenas para verificar contraste.
  primary: '#455A64'            # Material blue-grey 700 como primária neutra
  on-primary: '#FFFFFF'
  surface: '#FFFFFF'            # superfície branca em vez do tom neutro M3 #FEF7FF
  on-surface: '#1D1B20'
  on-surface-variant: '#49454F'
  outline: '#79747E'
  error: '#BA1A1A'
  on-error: '#FFFFFF'
  error-container: '#FFDAD6'
  on-error-container: '#410002'
  inverse-surface: '#322F35'
  inverse-on-surface: '#F5EFF7'
  # Tokens próprios do produto (estado Desativado)
  row-desativado: '#EEEEEE'
  chip-desativado: '#E0E0E0'
  on-chip-desativado: '#1D1B20'
typography:
  # Roboto + escala tipográfica M3 padrão. Valores repetidos só como referência; não sobrescrever.
  headline:
    fontFamily: 'Roboto'
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    note: 'M3 headline-small — título da página (h1)'
  title:
    fontFamily: 'Roboto'
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 28px
    note: 'M3 title-large — nome do produto no detalhe, título de diálogo'
  body:
    fontFamily: 'Roboto'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    note: 'M3 body-medium — células da tabela, valores do detalhe'
  label:
    fontFamily: 'Roboto'
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    note: 'M3 label-large — botões, cabeçalhos de coluna, rótulos do detalhe'
rounded:
  # Formas M3 padrão, sem override.
  sm: 4px      # M3 extra-small — campos de formulário (outline)
  chip: 8px    # M3 small — chips de status
  md: 12px     # M3 medium — cards
  lg: 28px     # M3 extra-large — diálogos
  full: 9999px # M3 full — botões, chips
spacing:
  '1': 4px
  '2': 8px
  '3': 16px
  '4': 24px
  '5': 32px
  gutter-mobile: 16px
  gutter-desktop: 24px
  content-max-lista: 1200px
  content-max-formulario: 720px # formulário e detalhe
components:
  barra-superior:
    background: '{colors.surface}'
    foreground: '{colors.on-surface}'
    typography: '{typography.title}'
  botao-primario:
    background: '{colors.primary}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.full}'
  linha-desativada:
    background: '{colors.row-desativado}'
    foreground: '{colors.on-surface}'
    secondary-foreground: '{colors.on-surface-variant}'
    link-foreground: '{colors.primary}'
  chip-status-ativo:
    background: '{colors.surface}'
    foreground: '{colors.on-surface}'
    border: '1px solid {colors.outline}'
    radius: '{rounded.chip}'
  chip-status-desativado:
    background: '{colors.chip-desativado}'
    foreground: '{colors.on-chip-desativado}'
    border: 'none'
    radius: '{rounded.chip}'
  alerta-geral:
    background: '{colors.error-container}'
    foreground: '{colors.on-error-container}'
    icon: '{colors.error}'
    radius: '{rounded.md}'
    padding: '{spacing.3}'
  snackbar:
    background: '{colors.inverse-surface}'
    foreground: '{colors.inverse-on-surface}'
---

## Brand & Style

O `catalogo-front` é um painel administrativo de demonstração para um TCC cujo objeto é a plataforma Kubernetes/GitOps, não a interface. A postura visual é deliberadamente *sem design próprio*: Angular Material ≥ 18 com Material 3 (não M2) e seus padrões, tema claro, uma primária neutra e nada mais. Limpo, sóbrio, funcional — o tipo de tela que ninguém nota porque faz exatamente o que se espera de um admin.

Este documento registra apenas o delta sobre o Material: a cor primária, o tratamento visual do estado **Desativado** e o bloco de alerta geral de erro. Todo o resto (botões, campos, tabela, diálogos, menus, paginador) segue o Material sem customização — e customizar é contra a regra.

## Colors

- **Primária neutra (`{colors.primary}` `#455A64`)** — botão principal (Cadastrar, Salvar, confirmar no diálogo), link do nome na tabela, foco e estado ativo do Material. Contraste com branco: 7,24:1. Não é usada para status. O tema M3 é gerado a partir dela com `ng generate @angular/material:theme-color`, e `--mat-sys-primary` é fixado em `#455A64`.
- **Superfície e texto (`{colors.surface}`, `{colors.on-surface}`, `{colors.on-surface-variant}`, `{colors.outline}`)** — padrões M3, exceto a superfície branca pura. Texto principal 17,07:1, secundário 9,34:1 sobre branco.
- **Erro (`{colors.error}`, `{colors.error-container}`, `{colors.on-error-container}`)** — padrões M3. Usados no `mat-error` dos campos (6,46:1 sobre branco) e no alerta geral (13,26:1).
- **Desativado (`{colors.row-desativado}` `#EEEEEE`, `{colors.chip-desativado}` `#E0E0E0`, `{colors.on-chip-desativado}`)** — os únicos tokens próprios do produto: fundo da linha, preenchimento do chip e texto do chip. Contrastes verificados (WCAG 2.1 AA, ≥ 4,5:1 para texto):

| Combinação | Razão |
|---|---|
| `{colors.on-surface}` sobre `{colors.row-desativado}` | 14,72:1 |
| `{colors.on-surface-variant}` sobre `{colors.row-desativado}` | 8,05:1 |
| `{colors.primary}` (link do nome) sobre `{colors.row-desativado}` | 6,24:1 |
| `{colors.on-chip-desativado}` sobre `{colors.chip-desativado}` | 12,93:1 |
| `{colors.outline}` (borda, não-texto, ≥ 3:1) sobre `{colors.row-desativado}` | 3,92:1 |
| `{colors.inverse-on-surface}` sobre `{colors.inverse-surface}` (snackbar) | 11,65:1 |

A cor nunca é o único sinal de Desativado: o chip com o texto "Desativado" é obrigatório (CAP-1).

## Typography

Roboto com a escala M3 padrão (`{typography.headline}`, `{typography.title}`, `{typography.body}`, `{typography.label}`); nenhum override. `headline` só no título da página (h1, um por rota). Valores monetários e numéricos na tabela alinhados à direita com `font-variant-numeric: tabular-nums`.

## Layout & Spacing

Escala de 4 px (`{spacing.1}`–`{spacing.5}`). Coluna única centralizada: listagem até `{spacing.content-max-lista}`, formulário e detalhe até `{spacing.content-max-formulario}`. Margem lateral `{spacing.gutter-mobile}` abaixo de 600 px e `{spacing.gutter-desktop}` acima. Comportamento por breakpoint em `EXPERIENCE.md` › Responsivo e plataforma (Responsive & Platform).

## Elevation & Depth

Padrão M3: superfícies planas, elevação só onde o Material já aplica (diálogo, menu, snackbar). A tabela e o painel de detalhe usam a variante `outlined`, sem sombra.

## Shapes

Formas M3 sem override: `{rounded.sm}` em campos, `{rounded.chip}` em chips de status, `{rounded.md}` em cards e no alerta geral, `{rounded.lg}` em diálogos, `{rounded.full}` em botões.

## Components

Todos os componentes seguem o Material sem customização (lista completa em `EXPERIENCE.md` › Padrões de componentes); campos usam a aparência `outline`, o menu da linha usa o ícone `more_vert` e o painel de detalhe é um `mat-card` outlined. Deltas:

| Componente | Especificação visual |
|---|---|
| Barra superior | `{components.barra-superior}`: fundo branco, título "Catálogo de Produtos" em `{typography.title}`, divisor inferior `{colors.outline}`. |
| Botões | Ação principal em `{components.botao-primario}` (`mat-flat-button`, padrão M3 com a primária neutra), no máximo um por superfície; secundária em `mat-stroked-button`; terciária em `mat-button`. |
| Linha desativada | `{components.linha-desativada}`: só o fundo muda; texto, ícones e link com cores normais. Sem opacidade, sem tachado. |
| Chip de status | `mat-chip`. Ativo = `{components.chip-status-ativo}` (contorno). Desativado = `{components.chip-status-desativado}` (preenchido) + ícone `block` 18 px à esquerda. Texto sempre "Ativo" / "Desativado". |
| Alerta geral | Bloco próprio acima do formulário ou da tabela: `{components.alerta-geral}`, ícone `error` à esquerda, título em `{typography.label}`, detalhe em `{typography.body}`. |
| Estado vazio / estado de erro | Bloco centralizado no lugar da tabela ou do painel: ícone Material 48 px em `{colors.on-surface-variant}` (`inventory_2` vazio, `cloud_off` falha, `search_off` 404), mensagem em `{typography.title}`, um botão abaixo. |
| Formulário de produto | Campos empilhados em coluna única com `{spacing.3}` entre eles; Descrição em `textarea` de 4 linhas; alerta geral acima do primeiro campo; ações no rodapé alinhadas à direita (Cancelar à esquerda de Salvar). |
| Snackbar | `{components.snackbar}` — padrão M3; ação em `{colors.inverse-on-surface}`. |

## Do's and Don'ts

| Faça | Não faça |
|---|---|
| Usar componentes Angular Material com aparência padrão | Criar componentes visuais próprios além do alerta geral e dos estados de vazio e de erro |
| `{colors.primary}` só em ação principal, link e foco | Usar cor para indicar status sem o texto "Desativado" |
| Distinguir Desativado por chip textual + `{colors.row-desativado}` | Aplicar opacidade, tachado ou cinza no texto da linha desativada |
| Tema claro único | Dark mode, gradientes, ilustrações, fontes extras |
| Botão de confirmação do diálogo em `mat-flat-button` primário | Usar `{colors.error}` para Desativar (a ação é reversível) |
