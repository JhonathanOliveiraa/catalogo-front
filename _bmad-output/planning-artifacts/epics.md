---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/specs/spec-catalogo-front/SPEC.md
  - _bmad-output/specs/spec-catalogo-front/golden-path.md
  - _bmad-output/planning-artifacts/architecture/architecture-catalogo-front-2026-10-14/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-catalogo-front-2026-10-14/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-catalogo-front-2026-10-14/EXPERIENCE.md
  - docs/referencia-api/produto.md
  - docs/referencia-api/SPEC.md
  - docs/referencia-api/ARCHITECTURE-SPINE.md
---

# catalogo-front - Epic Breakdown

## Overview

Este documento traz a divisão completa em épicos e histórias do catalogo-front. Ele decompõe os requisitos da SPEC (no papel de PRD), do contrato de UX (DESIGN.md + EXPERIENCE.md) e do spine de arquitetura em histórias implementáveis.

`AD-n` sem sufixo se refere ao spine do front; `AD-n da API`, ao spine em `docs/referencia-api/`.

## Requirements Inventory

### Functional Requirements

FR1: A listagem mostra produtos ativos e desativados, com os itens da página, o total (`total`) e a navegação entre páginas (CAP-1).
FR2: A listagem permite buscar por nome (`nome`, contém), filtrar por `status` (Todos/Ativo/Desativado) e por faixa de preço (`precoMin`/`precoMax`), ordenar (`ordenarPor` Nome/Preco/CriadoEm, `direcao` Asc/Desc) e paginar (`page` base 1, `pageSize` 1–100) (CAP-1).
FR3: A listagem envia à API só os parâmetros e valores definidos em `produto.md`. Parâmetros sem valor ou com o valor padrão não são enviados, e os enums vão pelo nome (CAP-1).
FR4: Um produto desativado se distingue de um ativo por algo além da cor, com o chip textual "Desativado" (CAP-1).
FR5: O usuário cadastra um produto (nome, descrição, preço, estoque) por um formulário que gera `POST /produtos`, e o produto criado aparece na consulta seguinte (CAP-2).
FR6: O formulário bloqueia o envio de valores fora dos limites do AD-4 da API e mostra o erro no campo (CAP-2, CAP-4).
FR7: O detalhe mostra todos os campos de `ProdutoResponse` (ID, nome, descrição, preço, estoque, status, criado em, atualizado em) (CAP-3).
FR8: Abrir a URL do detalhe direto no navegador funciona (deep link) (CAP-3).
FR9: Um id inexistente (404), ou um `:id` que não seja inteiro positivo, mostra a mensagem de produto não encontrado (CAP-3).
FR10: O usuário edita um produto, ativo ou desativado, num formulário que abre preenchido com os dados atuais e aplica a mesma validação do cadastro (CAP-4).
FR11: A edição envia `PUT /produtos/{id}` como substituição total (`nome`, `descricao`, `preco`, `estoque`), e a alteração aparece na consulta seguinte (CAP-4).
FR12: O usuário desativa ou reativa um produto pelo detalhe ou pelo menu ⋮ da listagem. A ação gera `PATCH /produtos/{id}/status` com o enum pelo nome (CAP-5).
FR13: Depois do `PATCH`, o novo status aparece na listagem e no detalhe sem recarregar a página manualmente (CAP-5).
FR14: A mesma imagem, iniciada com valores diferentes de `API_BASE_URL`, chama APIs diferentes. Nenhuma URL de ambiente fica no bundle, no código-fonte ou na configuração da aplicação (CAP-6).
FR15: Sem `API_BASE_URL` (ou com uma URL inválida), o contêiner não sobe (CAP-6).
FR16: `GET /healthz` no servidor estático retorna 200, inclusive com a API fora do ar (CAP-7).
FR17: Num 400, cada erro de `errors` aparece junto ao campo correspondente, e um erro sem campo correspondente aparece numa mensagem geral (CAP-8).
FR18: Os demais erros ProblemDetails mostram `title`/`detail` da API, sem tradução (CAP-8).
FR19: Uma falha de rede ou um 5xx mostra uma mensagem própria, e a tela continua utilizável, com "Tentar novamente" na leitura (CAP-8).

### NonFunctional Requirements

NFR1: A SPA é Angular e consome a `catalogo-api` exatamente pelo contrato de `docs/referencia-api/` (rotas, enums pelo nome, ProblemDetails, OpenAPI em `/openapi/v1.json`), sem redefinir nem estender esse contrato.
NFR2: O navegador chama a API direto, em outro host, via CORS, sem proxy no front e sem credenciais nem cabeçalhos próprios. **Dependência externa:** o overlay da API inclui a URL do front em `Cors__OrigensPermitidas`.
NFR3: O contrato do Golden Path é obrigatório: imagem `linux/arm64`, servidor estático não-root com `/healthz`, CI pelo template compartilhado `frontend-service.yml` (sem alterá-lo), e manifestos e segredos fora do repo.
NFR4: Não há OpenTelemetry nem trace no navegador. Logs e métricas do contêiner ficam com a plataforma.
NFR5: Os formulários validam antes de enviar, espelhando os limites do AD-4 da API. A API continua sendo a fonte da verdade.
NFR6: Os testes unitários rodam e passam com `npm test -- --watch=false` (Vitest + jsdom), sob Node 24.
NFR7: O layout é simples e responsivo (breakpoints em 600 e 960 px).
NFR8: Acessibilidade WCAG 2.1 AA: todo campo com rótulo, tudo operável por teclado e contraste ≥ 4,5:1 para texto.
NFR9: A interface fica só em pt-BR (sem i18n), com `LOCALE_ID` pt-BR e moeda BRL.
NFR10: Esteira: Trivy no código (vulnerabilidades e segredos, CRITICAL) e na imagem (CRITICAL com correção, `ignore-unfixed`), e qualquer achado falha a esteira. O deploy fica desligado em `pull_request`. O secret `PLATFORM_REPO_TOKEN` é usado.
NFR11: Non-goals: login/autenticação, i18n, trace no navegador, PWA/offline, dark mode, remoção de produto, alterações na infraestrutura comum, manifestos e segredos no repo.

### Additional Requirements

**Projeto inicial (impacta o Épico 1, História 1):**

- Criar o projeto com `ng new catalogo-front --style=scss --ssr=false` (Angular CLI 22.2.x), mantendo os padrões: standalone, zoneless, sem `NgModule` e com o builder `@angular/build:application`. O TypeScript fica na faixa do Angular 22 (≥ 6.0 < 6.1), e nunca se roda `npm i typescript` sem versão. Os testes usam o runner padrão Vitest + jsdom, sem Karma (AD-9).
- Instalar o Angular Material/CDK 22.2.x (M3).

**Estrutura e dependências (AD-1):**

- Camadas: `core/` (config, erros, avisos, ultima-consulta), `shared/` (alerta-geral, estado-erro, estado-vazio), `produtos/` (service, dominio, formulario, status, componentes, paginas), seguindo a seed estrutural.
- Só `ProdutosService` importa de `src/app/api`, o que é imposto por ESLint `no-restricted-imports`. Fora de `core/` e do código gerado, ninguém injeta `HttpClient`.
- Componentes de apresentação usam só `input()`/`output()` e não injetam o facade, `Router` nem `MatSnackBar`.
- `withCredentials` fica desligado e não há cabeçalhos próprios.

**Cliente gerado (AD-2):**

- `openapi/catalogo-api.json` é uma cópia versionada de `/openapi/v1.json`.
- `ng-openapi-gen` 1.1.0 usa `ng-openapi-gen.json` (`output: src/app/api`, `enumStyle: alias`, `promises: false`). `src/app/api/` fica no `.gitignore`.
- A geração roda nos hooks `prestart`, `pretest` e `prebuild`.
- O facade `ProdutosService` usa `Api.invoke(fn, params)` e devolve `Observable` do corpo, sem Promise nem `subscribe` interno.
- Os tipos e enums vêm só do código gerado. Os números (`number | string`) são normalizados para `number` na leitura e enviados sempre como número JSON.

**Config em tempo de execução (AD-3):**

- `provideAppInitializer` em `core/config` faz `fetch('/config.json', { cache: 'no-store' })` nativo, lê `apiBaseUrl`, define o `rootUrl` do `ApiConfiguration` e preenche o signal `ConfigEstado` (`ok`/`falhou`).
- O initializer nunca rejeita. Se a config falhar, o componente raiz renderiza a tela fatal (texto de `core/erros/mensagens.ts`) no lugar do `<router-outlet>`.
- Nenhum `environment*.ts` com URL, nenhum `fileReplacements`, e nenhum resolver ou guard que chame a API.
- `public/config.json` fica no `.gitignore` e no `.dockerignore`, e `public/config.example.json` aponta para uma API local.

**Erros (AD-4):**

- Um único `HttpInterceptorFn` converte `HttpErrorResponse` em `ErroApi` (`validacao` | `nao-encontrado` | `problema` | `servidor` | `rede`) e relança, sem exibir nada, sem retry e sem navegar.
- `descreverErro(ErroApi): ErroExibivel` (`{ titulo?, linhas[] }`) é a única tradução para texto. Os textos fixos ficam em `core/erros/mensagens.ts`.
- A página decide onde mostrar o erro (campo, alerta geral, snackbar ou estado de erro). Um 404 no `PUT` vai para o alerta geral.

**Validação e formulário (AD-5):**

- `LIMITES_PRODUTO` (em `produtos/dominio`) é a única cópia dos limites: nome 1–200 e não só espaços; descrição ≤ 2000; preço 0–9 999 999 999,99 com até 2 casas; estoque 0–2 147 483 647; `pageSize` ≤ 100.
- `lerDecimal`, `lerInteiro` e `formatarDecimalEntrada` são o único conversor entre texto (vírgula ou ponto) e número, usado por filtros e formulário.
- `criarFormularioProduto(produto?)` monta um único `FormGroup` tipado `nonNullable`. `preco` e `estoque` guardam texto, e a conversão acontece ao montar o corpo. Descrição vazia vira `null`.
- `aplicarErrosApi(form, erro)` casa as chaves sem diferenciar maiúsculas e ignorando o prefixo `$.`, faz `setErrors({ api: msg })` e devolve as mensagens sem campo correspondente.

**Estado (AD-6):**

- Sem store nem cache de produtos. Cada página consulta a API ao abrir, com estado em `signal`/`computed`. A última consulta vence (cancela a anterior), e `recarregar()` repete a consulta.
- Query string da listagem: `lerConsulta(ParamMap)` canoniza os valores (inválido vira padrão, padrão fica ausente) e `paraQueryParams(parcial)` converte padrão ou vazio em `null`. Qualquer mudança que não seja de página volta `page` para 1.
- A navegação usa `router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true })`, inclusive na correção de "página além do fim". A conversão base 0/base 1 do paginador fica no componente da tabela.
- `UltimaConsulta` (`core/`) guarda os parâmetros da última listagem e alimenta todo "Voltar para a lista". O título da barra vai para `/produtos` sem parâmetros. `location.back()` não é usado.
- As escritas atualizam a tela só depois da resposta. Salvar navega para o detalhe com `replaceUrl: true`.
- `lerIdProduto(param)` é o único parser de `:id`. Ele aceita só inteiro positivo; qualquer outro valor recebe o estado 404 sem chamar a API.

**Avisos e status (AD-7):**

- `core/avisos` (`sucesso(texto)`, `erro(ErroApi)`) é o único código que injeta `MatSnackBar`. Quem executa a escrita avisa depois da resposta e antes de navegar.
- `confirmarAlteracaoStatus(produto): Observable<ProdutoResponse | undefined>` (`produtos/status`) é a única porta da CAP-5. Ela abre o diálogo com o callback `executar` (`PATCH`) e mostra spinner até a resposta. No sucesso, avisa e emite o produto. No cancelamento ou erro, avisa o erro (se houver) e emite `undefined`. O detalhe troca o produto exibido, e a listagem chama `recarregar()`.

**Contêiner (AD-8):**

- Dockerfile multi-stage: build em `node:24-alpine` com `--platform=$BUILDPLATFORM` (`npm ci` + `npm run build`). Só `dist/catalogo-front/browser` vai para a imagem final.
- O `.dockerignore` exclui `node_modules`, `dist`, `.angular`, `src/app/api` e `public/config.json`.
- Imagem final: `nginxinc/nginx-unprivileged:stable-alpine` em `linux/arm64`, UID 101, porta 8080, sem substituir o `nginx.conf` principal.
- `docker/entrypoint/40-config-json.sh` entra com `COPY --chmod=0755` em `/docker-entrypoint.d/`, roda com `set -eu`, valida `API_BASE_URL` com `^https://[^"\\[:space:]]+[^/]$` (exit ≠ 0 se falhar) e gera `/tmp/config/config.json` com `envsubst '${API_BASE_URL}'` a partir de `/opt/catalogo/config.json.template`. O `.gitattributes` força `*.sh text eol=lf`.
- `docker/default.conf` (copiado para `/etc/nginx/conf.d/default.conf`):
  - `listen 8080`;
  - `location = /config.json` com alias para `/tmp/config/config.json` e `Cache-Control: no-store`;
  - `location = /healthz` com `return 200` e `access_log off`;
  - `try_files $uri $uri/ /index.html`;
  - `index.html` com `no-cache`, e arquivos com hash no nome com `max-age=31536000, immutable`.
- `HEALTHCHECK` com `wget -q -O /dev/null http://127.0.0.1:8080/healthz`.

**Esteira (AD-9):**

- `.github/workflows/ci.yml` chama `JhonathanOliveiraa/tcc-pipeline-templates/.github/workflows/frontend-service.yml@main` com `node-version: "24"`, `test-command: "npm test -- --watch=false"` e o `build-command` padrão.
- Os gatilhos `push`/`pull_request` são ligados na história que entrega código e Dockerfile.

**Convenções:**

- Nomes de domínio em português e termos Angular em inglês. Arquivos com os nomes que o `ng generate` produz (exceção: `produtos.service.ts`).
- Componentes standalone com `OnPush`, `@if`/`@for` e `inject()`.
- Rotas: `/` → `/produtos`; `/produtos`, `/produtos/novo`, `/produtos/:id`, `/produtos/:id/editar`; `**` → `/produtos`. As páginas são carregadas por `loadComponent`.
- Uma `TitleStrategy` acrescenta " — Catálogo" aos títulos. O detalhe e a edição definem o título depois de carregar o produto.
- Formatos: preço com `currency`, estoque com `number`, datas com `date: 'dd/MM/yyyy HH:mm'` no fuso do navegador.
- Testes obrigatórios (`*.spec.ts` ao lado do arquivo, `provideHttpClientTesting`): interceptor (cada `tipo`), `descreverErro`, `aplicarErrosApi`, conversores e limites de `produtos/dominio`, `lerConsulta`/`paraQueryParams`, `lerIdProduto`, initializer da config (sucesso e falha) e `confirmarAlteracaoStatus`.

**Dependências da plataforma (fora deste repo, só registradas):**

- As probes do pod apontam para `/healthz`.
- `emptyDir` em `/tmp` e em `/var/cache/nginx` (`readOnlyRootFilesystem`).
- O overlay `apps/catalogo-front` (com `API_BASE_URL`, rota Gateway e TLS) existe antes do primeiro deploy.
- O overlay da API inclui a URL do front no CORS.

### UX Design Requirements

UX-DR1: Tema Angular Material M3 único em `styles.scss` (`mat.theme`), gerado com `ng generate @angular/material:theme-color`. `--mat-sys-primary` fica fixado em `#455A64`, a superfície é branca `#FFFFFF`, o tema é claro, a fonte é Roboto com a escala M3 padrão e as formas M3 ficam sem override.
UX-DR2: Tokens próprios como CSS custom properties: linha desativada `#EEEEEE`, chip desativado `#E0E0E0` e texto do chip `#1D1B20`.
UX-DR3: Barra superior (`mat-toolbar`) com fundo branco, título "Catálogo de Produtos" (title-large) como link para `/produtos` sem parâmetros e divisor inferior na cor `outline`.
UX-DR4: Layout em coluna única centralizada, com a listagem até 1200 px e formulário/detalhe até 720 px. Gutter de 16 px abaixo de 600 px e de 24 px acima. Um `h1` por rota, em headline-small.
UX-DR5: Componente chip de status (`mat-chip`, não interativo). "Ativo" é contornado (borda `outline`, radius 8 px). "Desativado" é preenchido `#E0E0E0` com ícone `block` de 18 px.
UX-DR6: Linha desativada na tabela: só o fundo muda (`#EEEEEE`), sem opacidade, sem tachado e sem cinza no texto. Ela continua navegável e com menu ⋮.
UX-DR7: Tabela de produtos (`mat-table` outlined): colunas Nome, Preço, Estoque, Status, Criado em e ⋮. Nome é um link `<a>` para o detalhe, e a linha não é clicável. Valores numéricos alinhados à direita com `tabular-nums`. Formatos `R$ 1.234,56`, `1.234` e `dd/MM/yyyy HH:mm`.
UX-DR8: Ordenação pelo `mat-sort-header` só em Nome/Preco/CriadoEm (padrão Nome Asc), com `disableClear` (só Asc/Desc). Mudar a ordenação volta para `page=1`. `sortActionDescription` "Ordenar por {coluna}" e anúncio via `LiveAnnouncer` ("Ordenado por Nome, crescente").
UX-DR9: Paginador (`mat-paginator`): `pageSize` padrão 20, opções 10/20/50/100, botões de primeira/última página e total vindo de `total`. Textos pt-BR via `MatPaginatorIntl` ("Itens por página", "1 – 20 de 135", "Próxima página", "Página anterior"). Modo compacto abaixo de 600 px.
UX-DR10: Barra de filtros:
- "Buscar por nome" com debounce de 300 ms (vazio não envia).
- "Status" (Todos/Ativo/Desativado).
- "Preço mínimo"/"Preço máximo" aceitam vírgula e aplicam no blur/Enter. Se `precoMin > precoMax`, aparece o erro "O preço máximo deve ser maior ou igual ao mínimo" sob Preço máximo e a consulta não é enviada.
- Qualquer mudança volta para `page=1`.
- "Limpar filtros" aparece só com filtro ativo e mantém a ordenação.
UX-DR11: Menu ⋮ da linha (`mat-menu`, ícone `more_vert`) com `aria-label="Ações para {nome}"` e um único item, "Desativar" (se Ativo) ou "Reativar" (se Desativado), que abre o diálogo.
UX-DR12: Diálogo de confirmação (`mat-dialog`): modal com `autoFocus` em "Cancelar". Esc ou clique fora cancela. O título fica ligado por `aria-labelledby`. Ao confirmar, aparece um spinner no botão e ambos os botões ficam desabilitados. O sucesso fecha o diálogo. O erro fecha o diálogo e mostra um snackbar de erro. O foco volta ao gatilho. O botão de confirmação é `mat-flat-button` primário (nunca na cor de erro). Textos exatos de desativar/reativar conforme o EXPERIENCE.
UX-DR13: Snackbar (`core/avisos`): sucesso em 4 s sem ação ("Produto salvo", "Produto desativado", "Produto reativado"); erro de status em 6 s com ação "Fechar". Um por vez, e o novo substitui o anterior.
UX-DR14: Componente alerta geral (`shared/alerta-geral`): `role="alert"`, fundo `error-container`, ícone `error`, título em label-large e linhas em body-medium, radius 12 px e padding 16 px, posicionado no topo do formulário ou do detalhe. Mostra 400 sem campo, outros ProblemDetails (`title` em negrito + `detail`) e falha de rede/5xx na escrita. Some ao tentar de novo.
UX-DR15: Componentes estado vazio e estado de erro (`shared/estado-vazio`, `shared/estado-erro`): bloco centralizado no lugar da tabela ou do painel, com ícone de 48 px `on-surface-variant` (`inventory_2` vazio, `cloud_off` falha, `search_off` 404), mensagem em title-large e um botão.
UX-DR16: Estados da listagem:
- Primeira carga: `mat-progress-bar` indeterminada, sem mensagem de vazio.
- Nova consulta: barra com as linhas anteriores visíveis e os controles habilitados.
- Vazio sem filtros: "Nenhum produto cadastrado" + "Cadastrar".
- Vazio com filtros: "Nenhum resultado para os filtros" + "Limpar filtros".
- Página além do fim: redireciona para a última página válida.
- Rede/5xx: estado de erro + "Tentar novamente", com barra e filtros utilizáveis.
UX-DR17: Painel de detalhe (`mat-card` outlined): rótulo/valor de ID, Descrição ("Sem descrição" se nula), Preço, Estoque, Status (chip), Criado em e Atualizado em, com o nome do produto como `h1` e título do documento. Ações "Editar" (`mat-stroked-button`) e "Desativar"/"Reativar" (`mat-flat-button`), e link "Voltar para a lista". Carregando: `mat-progress-spinner` centralizado. 404: "Produto não encontrado" · "Não existe produto com o ID {id}." + "Voltar para a lista".
UX-DR18: Formulário de produto (cadastro e edição):
- Campos empilhados com 16 px entre eles, aparência `outline`, rótulos Nome · Descrição · Preço (R$) · Estoque.
- Descrição em `textarea` de 4 linhas com contador "n/2000" (`mat-hint`).
- Preço com `inputmode="decimal"` e Estoque com `inputmode="numeric"`. Status não aparece.
- Ações no rodapé à direita: "Cancelar" (volta ao detalhe na edição, à listagem no cadastro) à esquerda de "Salvar" (`type=submit`, Enter envia). Sem aviso de alterações não salvas.
UX-DR19: Validação do formulário com a microcopy exata:
- O erro aparece no blur ou ao tentar salvar.
- Ao salvar com campos inválidos, o foco vai para o primeiro campo com erro e nada é enviado.
- Os erros de campo ficam ligados ao input (`aria-describedby`).
- Os erros 400 da API vão para o `mat-error` (`setErrors({api})`) e são limpos ao editar o campo.
UX-DR20: Estado "Salvando": "Salvar" desabilitado com spinner interno, campos desabilitados e `mat-progress-bar` no topo, impedindo envio duplo. Em caso de erro, o formulário é reabilitado com os dados preservados.
UX-DR21: Títulos do documento por rota: "Produtos", "Cadastrar produto", "{nome}" e "Editar produto", seguidos de " — Catálogo". `lang="pt-BR"` no `index.html`.
UX-DR22: Responsivo:
- ≥ 960 px: filtros em uma linha (wrap).
- 600–959 px: filtros em duas linhas e tabela com rolagem horizontal.
- < 600 px: filtros empilhados em largura total, tabela com rolagem horizontal e coluna Nome `sticky`, e botões de ação do formulário e do detalhe em largura total.
UX-DR23: Teclado e interação:
- Tab segue a ordem visual (barra → filtros → Cadastrar → tabela → paginador), sem atalhos próprios e com o foco visível do Material sempre presente.
- Nenhuma ação por hover, arraste ou duplo clique.
- Proibidos: rolagem infinita, edição inline, diálogo sobre diálogo e atualização otimista.
UX-DR24: Tela fatal de configuração, renderizada pelo componente raiz no lugar do `router-outlet` quando `ConfigEstado` é `falhou`, com o texto exato (em `core/erros/mensagens.ts`): "Não foi possível carregar a configuração da aplicação. Tente recarregar a página. Se o problema continuar, contate o administrador."
UX-DR25: Microcopy centralizada: todos os textos de erro e aviso do EXPERIENCE (rede, 5xx, erros de campo do cliente, erro de faixa, 404, snackbars) ficam exatos em `core/erros/mensagens.ts`. Os demais textos de tela ficam nos templates.

### FR Coverage Map

FR1: Épico 2 — listagem com itens, total e paginação
FR2: Épico 2 — busca, filtros, ordenação e paginação
FR3: Épico 2 — só parâmetros válidos e com valor, enums pelo nome
FR4: Épico 2 — chip "Desativado" além da cor
FR5: Épico 2 — cadastro via `POST /produtos`
FR6: Épico 2 — validação de cliente com os limites do AD-4 da API
FR7: Épico 2 — detalhe com todos os campos de `ProdutoResponse`
FR8: Épico 2 — deep link do detalhe (fallback `try_files` entregue no Épico 1)
FR9: Épico 2 — 404 e `:id` inválido no detalhe/edição
FR10: Épico 2 — edição preenchida, com a mesma validação
FR11: Épico 2 — `PUT` como substituição total
FR12: Épico 2 — `PATCH /produtos/{id}/status` pelo detalhe e pelo menu ⋮
FR13: Épico 2 — status atualizado na tela sem recarregar
FR14: Épico 1 — URL da API só em tempo de execução (`/config.json`)
FR15: Épico 1 — contêiner não sobe sem `API_BASE_URL` válida
FR16: Épico 1 — `/healthz` independente da API
FR17: Épico 2 — erros 400 por campo e no alerta geral (base `ErroApi` no Épico 1)
FR18: Épico 2 — `title`/`detail` de outros ProblemDetails (base `descreverErro` no Épico 1)
FR19: Épico 2 — mensagens de rede/5xx e "Tentar novamente" (base no Épico 1)

## Epic List

### Épico 1: Front no ar pelo Golden Path
A plataforma publica e serve o `catalogo-front` pela esteira padrão, sem alterar a infraestrutura comum. Ao fim do épico, o operador acessa o front em hml: a mesma imagem arm64 aponta para a API do ambiente só por `API_BASE_URL`, `/healthz` responde 200 com a API fora do ar, uma config ausente mostra a tela fatal em vez de uma página em branco, e todas as falhas HTTP já chegam normalizadas em `ErroApi`. Mesmo modelo do Épico 1 da API: projeto inicial → config em tempo de execução → interceptor e erros → contêiner e `/healthz` → esteira com deploy no cluster.
**FRs covered:** FR14, FR15, FR16 (e a base de FR8, FR17, FR18, FR19)
**NFRs:** NFR1, NFR2, NFR3, NFR4, NFR6, NFR9, NFR10, NFR11
**Implementação:** AD-1 (estrutura e lint), AD-2 (cliente gerado e facade), AD-3, AD-4, AD-8, AD-9; UX-DR1, UX-DR3, UX-DR4, UX-DR21 (TitleStrategy e `lang`), UX-DR24, UX-DR25 (`mensagens.ts`).

### Épico 2: Gestão do catálogo
A operadora gerencia o catálogo de ponta a ponta no front já publicado: lista com busca, filtros, ordenação e paginação; abre o detalhe (também por link direto); cadastra e edita com validação e erros claros; desativa e reativa produtos. Depende só do Épico 1.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR17, FR18, FR19
**NFRs:** NFR5, NFR7, NFR8
**Implementação:** AD-5, AD-6, AD-7; UX-DR2, UX-DR5–UX-DR23.

## Epic 1: Front no ar pelo Golden Path

A plataforma publica e serve o `catalogo-front` pela esteira padrão, sem alterar a infraestrutura comum. A mesma imagem arm64 aponta para a API de cada ambiente só por `API_BASE_URL`. `/healthz` responde 200 sem depender da API. Uma config ausente mostra a tela fatal, e toda falha HTTP chega às páginas normalizada em `ErroApi`.

### Story 1.1: Projeto inicial e casca da SPA

Como operador da plataforma,
Quero uma SPA Angular criada pelo projeto inicial da arquitetura, com o tema e a casca de navegação,
Para que as próximas histórias construam sobre uma base única, testável pela esteira.

**Acceptance Criteria:**

**Dado** um repositório sem código de aplicação
**Quando** o projeto é criado com `ng new catalogo-front --style=scss --ssr=false` (Angular CLI 22.2.x)
**Então** ele mantém os padrões da CLI: standalone, zoneless, sem `NgModule`, builder `@angular/build:application` e TypeScript na faixa do Angular 22 (≥ 6.0 < 6.1)
**E** os testes usam o runner padrão Vitest + jsdom, sem Karma nem provider de navegador (AD-9)
**E** `npm test -- --watch=false` passa sob Node 24, e `npm run build` gera `dist/catalogo-front/browser`

**Dado** o projeto criado
**Quando** o Angular Material/CDK 22.2.x é instalado
**Então** `styles.scss` define um único tema M3 claro (`mat.theme`), gerado com `ng generate @angular/material:theme-color`, com `--mat-sys-primary` fixado em `#455A64`, superfície `#FFFFFF`, Roboto e a escala tipográfica e as formas M3 sem override (UX-DR1)
**E** os tokens próprios `#EEEEEE` (linha desativada), `#E0E0E0` (chip desativado) e `#1D1B20` (texto do chip) existem como CSS custom properties em `styles.scss` (UX-DR2)

**Dado** a SPA aberta em qualquer rota
**Quando** a página carrega
**Então** a barra superior (`mat-toolbar`, fundo branco, divisor inferior na cor `outline`) mostra "Catálogo de Produtos" como link para `/produtos` sem parâmetros (UX-DR3)
**E** o conteúdo fica numa coluna centralizada, com gutter de 16 px abaixo de 600 px e de 24 px acima (UX-DR4)
**E** `index.html` tem `lang="pt-BR"`

**Dado** as rotas da convenção de arquitetura
**Quando** o usuário acessa `/` ou uma rota desconhecida
**Então** ele é redirecionado para `/produtos`
**E** `/produtos` carrega por `loadComponent` uma página provisória com o `h1` "Produtos", que o Épico 2 substitui
**E** o título do documento é "Produtos — Catálogo", com uma `TitleStrategy` que acrescenta " — Catálogo" ao `title` da rota (UX-DR21)

**Dado** o `app.config.ts`
**Quando** a aplicação inicia
**Então** `LOCALE_ID` é `pt-BR` (com os dados do locale registrados) e `DEFAULT_CURRENCY_CODE` é `BRL`
**E** a estrutura de pastas segue a seed (`core/`, `shared/`, `produtos/`), com componentes standalone e `ChangeDetectionStrategy.OnPush`

### Story 1.2: Cliente da API e URL em tempo de execução

Como operador da plataforma,
Quero que a SPA leia a URL da API de `/config.json` antes do bootstrap e fale com a API só por um cliente gerado do OpenAPI,
Para que a mesma build sirva qualquer ambiente e nenhuma tela quebre em branco quando a config falha.

**Acceptance Criteria:**

**Dado** `openapi/catalogo-api.json`, uma cópia versionada de `/openapi/v1.json` da API
**Quando** `npm start`, `npm test` ou `npm run build` roda
**Então** os hooks `prestart`, `pretest` e `prebuild` executam `ng-openapi-gen` 1.1.0 com `ng-openapi-gen.json` (`output: src/app/api`, `enumStyle: alias`, `promises: false`)
**E** `src/app/api/` está no `.gitignore`, e nenhum arquivo gerado é editado à mão (AD-2)

**Dado** o cliente gerado
**Quando** `ProdutosService` (`produtos/produtos.service.ts`) é implementado
**Então** ele expõe métodos para listar, obter, criar, atualizar e alterar o status, cada um chamando `Api.invoke(fn, params)` e devolvendo `Observable` só do corpo, sem Promise nem `subscribe` interno
**E** os números da resposta (`number | string`) são normalizados para `number` por um conversor puro em `produtos/dominio`, e os números enviados são sempre número JSON
**E** os tipos e enums usados vêm só do código gerado, sem `interface Produto` própria
**E** as chamadas não levam `withCredentials` nem cabeçalhos próprios (AD-1)

**Dado** a configuração do ESLint
**Quando** qualquer arquivo fora de `produtos/produtos.service.ts` importa de `src/app/api`
**Então** a regra `no-restricted-imports` acusa erro no lint (AD-1)

**Dado** um `/config.json` válido `{ "apiBaseUrl": "https://…" }`
**Quando** a aplicação inicia
**Então** um `provideAppInitializer` em `core/config` faz `fetch('/config.json', { cache: 'no-store' })` nativo (sem `HttpClient`), define o `rootUrl` do `ApiConfiguration` gerado e coloca o signal `ConfigEstado` em `ok`
**E** o componente raiz renderiza o `<router-outlet>`

**Dado** um `/config.json` ausente, com JSON inválido ou sem `apiBaseUrl`
**Quando** a aplicação inicia
**Então** o initializer não rejeita, e `ConfigEstado` fica em `falhou`
**E** o componente raiz renderiza, no lugar do `<router-outlet>`, a tela fatal com o texto "Não foi possível carregar a configuração da aplicação. Tente recarregar a página. Se o problema continuar, contate o administrador.", vindo de `core/erros/mensagens.ts` (UX-DR24)
**E** nenhuma requisição à API é feita

**Dado** o ambiente de desenvolvimento
**Quando** o repositório é inspecionado
**Então** não há `environment*.ts` com URL nem `fileReplacements`, e nenhuma rota tem resolver ou guard que chame a API (AD-3)
**E** `public/config.json` está no `.gitignore`, e `public/config.example.json` aponta para uma API local
**E** existem testes unitários do initializer para sucesso e para cada tipo de falha

### Story 1.3: Erros da API normalizados

Como usuária do catálogo,
Quero que toda falha de comunicação com a API seja traduzida de um único jeito, com textos claros,
Para que eu entenda por que uma operação falhou, seja qual for a tela.

**Acceptance Criteria:**

**Dado** uma resposta HTTP de erro da API
**Quando** ela passa pelo `HttpInterceptorFn` único de `core/erros`, registrado no `app.config.ts`
**Então** a `HttpErrorResponse` é convertida em `ErroApi` e relançada:
- 400 com `errors` vira `validacao`, com `errors: Record<string, string[]>` e `title`;
- 404 vira `nao-encontrado`, com `title` e `detail`;
- outro 4xx, ou 400 sem `errors`, vira `problema`, com `title` e `detail` (vazios se o corpo não for ProblemDetails);
- 5xx vira `servidor`;
- `status === 0` vira `rede`.
**E** o interceptor não exibe nada, não faz retry e não navega (AD-4)
**E** há um teste unitário para cada `tipo`, incluindo o corpo que não é ProblemDetails

**Dado** um `ErroApi` de qualquer tipo
**Quando** `descreverErro(erro)` é chamada
**Então** ela devolve `ErroExibivel` (`{ titulo?, linhas: string[] }`):
- `rede` → "Não foi possível conectar à API. Verifique a conexão e tente novamente.";
- `servidor` → "O servidor encontrou um erro. Tente novamente em instantes.";
- `problema` e `nao-encontrado` → `title` como título e `detail` como linha, sem tradução;
- `validacao` → `title` e as mensagens de `errors` como linhas.
**E** há testes unitários de `descreverErro` para cada tipo

**Dado** `core/erros/mensagens.ts`
**Quando** o arquivo é revisado contra o EXPERIENCE
**Então** ele contém, com o texto exato do EXPERIENCE: as mensagens de rede, de 5xx e da tela fatal; os erros de campo do cliente (Nome, Descrição, Preço, Estoque); o erro de faixa do filtro de preço; os textos de 404 ("Produto não encontrado" · "Não existe produto com o ID {id}."); e os textos dos snackbars ("Produto salvo", "Produto desativado", "Produto reativado") (UX-DR25)

### Story 1.4: Contêiner estático com config no start e /healthz

Como operador da plataforma,
Quero uma imagem `linux/arm64` não-root que gere `/config.json` a partir de `API_BASE_URL` no start e sirva `/healthz`,
Para que a mesma imagem rode em hml e prd, recuse subir mal configurada e seja monitorável sem depender da API.

**Acceptance Criteria:**

**Dado** o `Dockerfile` multi-stage na raiz
**Quando** `docker buildx build --platform linux/arm64 .` roda
**Então** o estágio `node:24-alpine`, em `--platform=$BUILDPLATFORM`, executa `npm ci` e `npm run build` (gerando o cliente), e só `dist/catalogo-front/browser` vai para a imagem final
**E** a imagem final é `nginxinc/nginx-unprivileged:stable-alpine` em `linux/arm64`, roda como UID 101, escuta na porta 8080 e não substitui o `nginx.conf` principal
**E** o `.dockerignore` exclui `node_modules`, `dist`, `.angular`, `src/app/api` e `public/config.json`
**E** nenhuma URL de ambiente aparece na imagem, no bundle ou no repositório (FR14)

**Dado** a imagem iniciada com `API_BASE_URL=https://hml-catalogo-api.tcc.altasistemas.com.br`
**Quando** o contêiner sobe
**Então** `docker/entrypoint/40-config-json.sh` (copiado com `COPY --chmod=0755` para `/docker-entrypoint.d/`, rodando com `set -eu`) gera `/tmp/config/config.json` com `envsubst '${API_BASE_URL}'` a partir de `/opt/catalogo/config.json.template`
**E** `GET /config.json` devolve `{"apiBaseUrl":"https://hml-catalogo-api.tcc.altasistemas.com.br"}` com `Cache-Control: no-store`
**E** a mesma imagem, iniciada com outra `API_BASE_URL`, devolve a outra URL (FR14)

**Dado** a imagem iniciada sem `API_BASE_URL`, ou com um valor que não casa com `^https://[^"\\[:space:]]+[^/]$` (por exemplo `http://…`, barra final ou com espaço)
**Quando** o contêiner tenta subir
**Então** o script sai com código ≠ 0 e o contêiner não sobe (FR15)

**Dado** o contêiner rodando com a API fora do ar
**Quando** `GET /healthz` é feito
**Então** a resposta é 200, por `location = /healthz` com `return 200` e `access_log off`, sem tocar disco nem API (FR16)
**E** o `HEALTHCHECK` da imagem é `wget -q -O /dev/null http://127.0.0.1:8080/healthz`, sem instalar pacotes

**Dado** o `docker/default.conf` copiado para `/etc/nginx/conf.d/default.conf`
**Quando** o navegador pede uma rota da SPA, como `/produtos/42`
**Então** `try_files $uri $uri/ /index.html` serve o `index.html` (base do deep link, FR8)
**E** `index.html` sai com `Cache-Control: no-cache`, e os arquivos com hash no nome saem com `max-age=31536000, immutable`

**Dado** o checkout no Windows
**Quando** o repositório é inspecionado
**Então** o `.gitattributes` força `*.sh text eol=lf`
**E** o README documenta o teste local com `docker run` sem `API_BASE_URL` (falha) e com ela (`/healthz` e `/config.json`)

### Story 1.5: Esteira e deploy no cluster

Como operador da plataforma,
Quero que cada push na `develop` ou na `main` teste, escaneie, publique a imagem e atualize o overlay do ambiente correspondente no `tcc-platform` pelo template compartilhado,
Para que o front chegue ao cluster pelo Golden Path, sem nenhuma alteração na infraestrutura comum.

**Acceptance Criteria:**

**Dado** `.github/workflows/ci.yml`
**Quando** ele chama `JhonathanOliveiraa/tcc-pipeline-templates/.github/workflows/frontend-service.yml@main`
**Então** passa `node-version: "24"`, `test-command: "npm test -- --watch=false"` e o `build-command` padrão (`npm run build`), sem alterar o template (AD-9)
**E** usa o secret `PLATFORM_REPO_TOKEN`

**Dado** o `ci.yml`
**Quando** os gatilhos são revisados
**Então** `push` vale para `main` e `develop`, e `pull_request` está ligado
**E** `enable-deploy` fica desligado em `pull_request`

**Dado** um push numa das branches de deploy
**Quando** o `ci.yml` calcula o `overlay-path`
**Então** ele usa a branch: `develop` → `apps/catalogo-front/hml` e `main` → `apps/catalogo-front/prd`, com `apps/catalogo-front/${{ github.ref_name == 'main' && 'prd' || 'hml' }}`
**E** nenhum outro valor de ambiente fica no `ci.yml`

**Dado** um push na `develop`
**Quando** a esteira roda
**Então** os testes passam, o Trivy no código (vulnerabilidades e segredos, CRITICAL) e na imagem (CRITICAL com correção, `ignore-unfixed`) não encontra nada, a imagem `linux/arm64` é publicada no GHCR e a nova tag é gravada no overlay `apps/catalogo-front/hml` do `tcc-platform` (NFR10)
**E** qualquer achado do Trivy ou teste falhando faz a esteira falhar, e nenhuma tag é gravada

**Dado** o overlay `tcc-platform/apps/catalogo-front/hml` (com `API_BASE_URL`, rota Gateway e TLS) e o CORS da API de hml incluindo `https://hml-catalogo.tcc.altasistemas.com.br` (pré-condição externa, no `tcc-platform`)
**Quando** o Argo CD sincroniza a tag gravada pelo push na `develop`
**Então** `https://hml-catalogo.tcc.altasistemas.com.br/healthz` responde 200
**E** `/config.json` aponta para `https://hml-catalogo-api.tcc.altasistemas.com.br`, e a SPA abre a casca em `/produtos`
**E** o README é atualizado: os gatilhos, o mapeamento branch → overlay e a seção de desenvolvimento local (`config.example.json`, geração do cliente)

## Epic 2: Gestão do catálogo

A operadora gerencia o catálogo de ponta a ponta no front já publicado. Ela lista com busca, filtros, ordenação e paginação, abre o detalhe (também por link direto), cadastra e edita com validação e erros claros, e desativa e reativa produtos. A API é a única fonte de estado (AD-6), e toda escrita atualiza a tela só depois da resposta.

### Story 2.1: Detalhe do produto por link direto

Como operadora do catálogo,
Quero abrir o detalhe de um produto, inclusive colando a URL direto no navegador,
Para que eu veja todos os dados de um item e possa compartilhar o link dele.

**Acceptance Criteria:**

**Dado** a rota `/produtos/:id`, carregada por `loadComponent`
**Quando** a operadora abre `/produtos/42` direto no navegador e o produto existe
**Então** a página chama `GET /produtos/42` pelo `ProdutosService`, num pipeline em que a última consulta vence, e mostra um `mat-progress-spinner` centralizado até a resposta
**E** um `mat-card` outlined lista rótulo e valor de ID, Descrição, Preço, Estoque, Status, Criado em e Atualizado em, com o nome do produto como `h1` (FR7, FR8, UX-DR17)
**E** `descricao` nula aparece como "Sem descrição", o preço como `R$ 1.234,56`, o estoque como `1.234` e as datas como `dd/MM/yyyy HH:mm` no fuso do navegador
**E** o título do documento passa a ser "{nome} — Catálogo", definido depois de carregar, sem resolver (UX-DR21)

**Dado** o componente de apresentação chip de status (`produtos/componentes/chip-status`, `mat-chip` não interativo)
**Quando** o produto é `Ativo` ou `Desativado`
**Então** "Ativo" aparece contornado (borda `outline`, radius 8 px), e "Desativado" aparece preenchido `#E0E0E0` com o ícone `block` de 18 px à esquerda (UX-DR5, FR4)

**Dado** um `:id` que não é inteiro positivo (`abc`, `0`, `-1`, `1.5`)
**Quando** a página abre
**Então** `lerIdProduto` (`produtos/dominio`, o único parser de `:id`) rejeita o valor, e a página mostra o estado 404 sem chamar a API (FR9)
**E** há testes unitários de `lerIdProduto`

**Dado** um id inexistente (a API responde 404, `ErroApi` `nao-encontrado`)
**Quando** a página recebe o erro
**Então** o componente `shared/estado-erro` aparece no lugar do painel, com o ícone `search_off` de 48 px, "Produto não encontrado", "Não existe produto com o ID {id}." e o botão "Voltar para a lista" (FR9, UX-DR15)

**Dado** uma falha de rede ou um 5xx na leitura
**Quando** a página recebe o erro
**Então** o estado de erro mostra o ícone `cloud_off` e a mensagem de `descreverErro`, com o botão "Tentar novamente", que chama `recarregar()` e repete a mesma consulta (FR19, UX-DR15)
**E** a barra superior continua utilizável

**Dado** o link "Voltar para a lista" do detalhe e do estado 404
**Quando** a operadora o aciona
**Então** ele navega para `/produtos` com os parâmetros guardados em `UltimaConsulta` (`core/ultima-consulta.ts`), que neste momento ainda não guarda nada, e nunca usa `location.back()` (AD-6)

### Story 2.2: Listagem paginada de produtos

Como operadora do catálogo,
Quero ver os produtos, ativos e desativados, numa tabela paginada com o total,
Para que eu percorra o catálogo inteiro e reconheça na hora os itens desativados.

**Acceptance Criteria:**

**Dado** `produtos/dominio`
**Quando** `lerConsulta(ParamMap)` e `paraQueryParams(parcial)` são implementadas para todos os parâmetros da API (`nome`, `status`, `precoMin`, `precoMax`, `ordenarPor`, `direcao`, `page`, `pageSize`)
**Então** `lerConsulta` canoniza os valores (enums pela grafia da API, números válidos, `pageSize` 1–100), troca um valor inválido ou fora da faixa pelo padrão e deixa o padrão ausente (FR3)
**E** `paraQueryParams` converte valores padrão ou vazios em `null`, e qualquer mudança que não seja de página volta `page` para 1
**E** só elas leem e escrevem esses parâmetros, e há testes unitários de ambas, incluindo valores inválidos (AD-6)

**Dado** a operadora em `/produtos` (substituindo a página provisória da 1.1)
**Quando** a página abre ou a query string muda
**Então** ela chama `GET /produtos` pelo facade só com os parâmetros que têm valor, numa consulta em que a última vence (FR1, FR3)
**E** na primeira carga mostra uma `mat-progress-bar` indeterminada sem mensagem de vazio, e numa nova consulta mantém as linhas anteriores visíveis com a barra e os controles habilitados (UX-DR16)

**Dado** a resposta da API
**Quando** a tabela é renderizada (`produtos/componentes/tabela`, só com `input()`/`output()`)
**Então** ela mostra as colunas Nome, Preço, Estoque, Status e Criado em, com Preço e Estoque alinhados à direita com `tabular-nums` (UX-DR7)
**E** o nome é um link `<a>` para `/produtos/:id`, e a linha em si não é clicável
**E** um produto `Desativado` recebe o fundo `#EEEEEE` (sem opacidade, sem tachado, texto com as cores normais) e o chip "Desativado" (FR4, UX-DR6)

**Dado** o `mat-paginator`
**Quando** a operadora troca de página ou de tamanho de página
**Então** o paginador mostra o total de `total`, com `pageSize` padrão 20, as opções 10/20/50/100 e os botões de primeira e última página (UX-DR9)
**E** a conversão base 0 (paginador) ↔ base 1 (`page`) fica no componente da tabela, que emite o parcial já em base 1
**E** os textos vêm de um `MatPaginatorIntl` pt-BR ("Itens por página", "1 – 20 de 135", "Próxima página", "Página anterior")
**E** toda mudança navega com `router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true })`

**Dado** `total = 0` sem filtro ativo
**Quando** a resposta chega
**Então** o componente `shared/estado-vazio` aparece com o ícone `inventory_2` e "Nenhum produto cadastrado" (o botão "Cadastrar" entra na 2.5)

**Dado** `itens` vazio com `total > 0` (por exemplo, uma URL antiga com `page=99`)
**Quando** a resposta chega
**Então** a página navega automaticamente para a última página válida com `replaceUrl: true` e nunca mostra mensagem de vazio

**Dado** uma falha de rede ou um 5xx
**Quando** a listagem recebe o erro
**Então** o estado de erro aparece no lugar da tabela com a mensagem de `descreverErro` e "Tentar novamente", que repete a mesma consulta, e a barra superior continua utilizável (FR19)

**Dado** a listagem exibida
**Quando** a operadora abre um detalhe e aciona "Voltar para a lista"
**Então** `UltimaConsulta` restaura os parâmetros da última listagem exibida (FR1)

**Dado** uma tela com menos de 600 px
**Quando** a listagem é exibida
**Então** a tabela fica num contêiner com rolagem horizontal e a coluna Nome fixa (`sticky`), e o paginador usa o modo compacto. Entre 600 e 959 px, a tabela tem rolagem horizontal se necessário (UX-DR22)

### Story 2.3: Busca, filtros e ordenação

Como operadora do catálogo,
Quero buscar por nome, filtrar por status e faixa de preço e ordenar a tabela,
Para que eu encontre rapidamente os produtos que preciso revisar.

**Acceptance Criteria:**

**Dado** a barra de filtros (`produtos/componentes/filtros`, só com `input()`/`output()`)
**Quando** a operadora digita em "Buscar por nome"
**Então** a consulta dispara após 300 ms sem digitar, com `nome`, e um campo vazio não envia `nome` (FR2, UX-DR10)

**Dado** o filtro "Status", com as opções Todos, Ativo e Desativado
**Quando** a operadora escolhe uma opção
**Então** "Todos" não envia `status`, e as outras opções enviam o enum pelo nome (`Ativo` / `Desativado`)

**Dado** os campos "Preço mínimo" e "Preço máximo"
**Quando** a operadora digita um valor com vírgula ou ponto e sai do campo ou pressiona Enter
**Então** o valor é convertido por `lerDecimal` (`produtos/dominio`, o único conversor de texto decimal) e aplicado como `precoMin`/`precoMax`
**E** se `precoMin > precoMax`, aparece "O preço máximo deve ser maior ou igual ao mínimo" sob "Preço máximo" e a consulta não é enviada
**E** há testes unitários de `lerDecimal`

**Dado** qualquer mudança de filtro
**Quando** ela é aplicada
**Então** `page` volta para 1, a URL é atualizada só por `paraQueryParams`, e os campos da barra são sobrescritos sempre que a URL muda (por exemplo, pelo botão Voltar do navegador)

**Dado** um filtro ativo
**Quando** a barra é exibida
**Então** aparece o botão "Limpar filtros", que restaura os padrões e mantém a ordenação
**E** com `total = 0` e um filtro ativo, o estado vazio mostra "Nenhum resultado para os filtros" e o botão "Limpar filtros" (UX-DR16)

**Dado** os cabeçalhos da tabela
**Quando** a operadora clica em Nome, Preço ou Criado em
**Então** a ordenação é feita no servidor com `ordenarPor` `Nome`/`Preco`/`CriadoEm` e `direcao` `Asc`/`Desc` (padrão `Nome` `Asc`), alternando só entre Asc e Desc (`disableClear`), e volta para `page=1` (UX-DR8)
**E** Estoque e Status não são ordenáveis
**E** cada cabeçalho tem `sortActionDescription` "Ordenar por {coluna}", e a mudança é anunciada pelo `LiveAnnouncer` (por exemplo, "Ordenado por Nome, crescente")

**Dado** a página `/produtos` usada só pelo teclado
**Quando** a operadora navega com Tab
**Então** a ordem é barra superior → filtros → tabela → paginador, todos os filtros têm `mat-label` visível e o foco do Material fica sempre visível (UX-DR23, NFR8)

**Dado** a largura da tela
**Quando** a barra de filtros é exibida
**Então** a partir de 960 px ela fica numa linha (com wrap), entre 600 e 959 px em duas linhas, e abaixo de 600 px os campos ficam empilhados em largura total (UX-DR22)

### Story 2.4: Formulário e validação do produto

Como operadora do catálogo,
Quero um formulário de produto que aponte os valores inválidos antes de qualquer envio,
Para que eu corrija os dados na hora, com mensagens claras em cada campo.

**Acceptance Criteria:**

**Dado** `produtos/dominio`
**Quando** `LIMITES_PRODUTO`, `lerInteiro` e `formatarDecimalEntrada` são implementados
**Então** `LIMITES_PRODUTO` é a única cópia dos limites do AD-4 da API (nome 1–200 e não só espaços; descrição ≤ 2000; preço 0–9 999 999 999,99 com até 2 casas; estoque 0–2 147 483 647; `pageSize` ≤ 100), e `lerConsulta` (2.2) passa a usar esse `pageSize`
**E** `lerDecimal` (2.3), `lerInteiro` e `formatarDecimalEntrada` são o único conversor entre texto (vírgula ou ponto) e número
**E** há testes unitários dos limites e dos conversores

**Dado** `produtos/formulario`
**Quando** `criarFormularioProduto(produto?)` é chamada
**Então** ela devolve o `FormGroup` tipado `nonNullable` usado por cadastro e edição, com `preco` e `estoque` guardando texto; com produto, preenche os controles usando `formatarDecimalEntrada` (AD-5)
**E** uma função do mesmo módulo monta o corpo da requisição, com os números convertidos e a descrição vazia como `null`, com testes

**Dado** a rota `/produtos/novo` (título "Cadastrar produto — Catálogo", `h1` "Cadastrar produto")
**Quando** a operadora abre o formulário
**Então** ele mostra Nome, Descrição (`textarea` de 4 linhas com o `mat-hint` "n/2000"), Preço (R$) (`inputmode="decimal"`) e Estoque (`inputmode="numeric"`) empilhados com 16 px entre eles, em aparência `outline`, sem o campo Status (UX-DR18)
**E** o rodapé mostra "Cancelar" à esquerda de "Salvar" (`mat-flat-button`, `type=submit`, Enter envia), alinhados à direita, e abaixo de 600 px os botões ficam em largura total (UX-DR22)

**Dado** um valor fora dos limites (por exemplo, Preço "189,905")
**Quando** a operadora sai do campo ou tenta salvar
**Então** o `mat-error` mostra a microcopy exata do EXPERIENCE ("Use no máximo 2 casas decimais"), vinda de `core/erros/mensagens.ts` e ligada ao input por `aria-describedby` (FR6, UX-DR19)
**E** todas as mensagens de campo do cliente funcionam: Nome ("Informe o nome", "Máximo de 200 caracteres", inclusive só espaços), Descrição ("Máximo de 2000 caracteres"), Preço ("Informe o preço", "Informe um valor numérico", "O preço não pode ser negativo", "Use no máximo 2 casas decimais", "Valor máximo: R$ 9.999.999.999,99") e Estoque ("Informe o estoque", "Use um número inteiro", "O estoque não pode ser negativo", "Valor máximo: 2.147.483.647"), com testes

**Dado** campos inválidos
**Quando** a operadora tenta salvar
**Então** o foco vai para o primeiro campo com erro, e nada é enviado (NFR5)

**Dado** o botão "Cancelar"
**Quando** a operadora o aciona
**Então** ela volta para a listagem com `UltimaConsulta`, sem aviso de alterações não salvas
**E** nesta história, um formulário válido ainda não envia nada; o envio entra na 2.5

### Story 2.5: Envio do cadastro e erros da API

Como operadora do catálogo,
Quero salvar um produto novo e, se a API recusar, ver o motivo sem perder o que digitei,
Para que um item novo entre no catálogo e eu caia direto no detalhe dele.

**Acceptance Criteria:**

**Dado** a listagem
**Quando** ela é exibida
**Então** o botão "Cadastrar" (`mat-flat-button`) aparece no cabeçalho e no estado vazio sem filtros, levando a `/produtos/novo`

**Dado** um formulário válido em `/produtos/novo`
**Quando** a operadora pressiona Enter ou clica em "Salvar"
**Então** o facade envia `POST /produtos` com o corpo montado pela função da 2.4 (FR5)
**E** durante a requisição, "Salvar" fica desabilitado com spinner, os campos ficam desabilitados e uma `mat-progress-bar` aparece no topo do formulário, impedindo envio duplo (UX-DR20)

**Dado** a resposta 201
**Quando** o cadastro conclui
**Então** `core/avisos.sucesso("Produto salvo")` mostra o snackbar por 4 s, sem ação, antes de navegar; `core/avisos` é o único código que injeta `MatSnackBar`, e o novo snackbar substitui o anterior (AD-7, UX-DR13)
**E** a página navega para `/produtos/{id}` com `replaceUrl: true`, e o produto aparece na consulta seguinte da listagem (FR5)

**Dado** um 400 com `errors` (por exemplo, `Nome` e uma chave sem campo correspondente)
**Quando** a resposta chega
**Então** `aplicarErrosApi(form, erro)` (`produtos/formulario`) casa as chaves sem diferenciar maiúsculas e ignorando o prefixo `$.` (`Nome`, `nome`, `$.nome` → Nome), aplica `setErrors({ api: msg })` no campo, e o erro some quando o campo é editado (FR17)
**E** as mensagens sem campo correspondente vão para o componente `shared/alerta-geral` (`role="alert"`, fundo `error-container`, ícone `error`, radius 12 px, padding 16 px) no topo do formulário (UX-DR14)
**E** o formulário volta a ficar habilitado com os dados digitados, e há testes unitários de `aplicarErrosApi`

**Dado** outro ProblemDetails, uma falha de rede ou um 5xx ao salvar
**Quando** a resposta chega
**Então** o alerta geral mostra a saída de `descreverErro` (`title` em negrito + `detail`, ou a mensagem fixa), os dados ficam preservados e "Salvar" volta a funcionar (FR18, FR19)
**E** o alerta some ao tentar de novo

### Story 2.6: Edição de produto

Como operadora do catálogo,
Quero editar um produto, ativo ou desativado, num formulário já preenchido,
Para que eu corrija preço, estoque, nome ou descrição sem redigitar o resto.

**Acceptance Criteria:**

**Dado** o detalhe de um produto
**Quando** ele é exibido
**Então** aparece o botão "Editar" (`mat-stroked-button`), que leva a `/produtos/:id/editar`

**Dado** a rota `/produtos/:id/editar` com um id válido
**Quando** a página abre
**Então** ela chama `GET /produtos/{id}`, mostra um `mat-progress-spinner` até a resposta e abre o formulário de `criarFormularioProduto(produto)`, preenchido, com `preco` e `estoque` formatados por `formatarDecimalEntrada` (FR10)
**E** o título do documento é "Editar produto — Catálogo", e o `h1` é "Editar produto"
**E** a validação é a mesma do cadastro (FR6)

**Dado** um `:id` inválido, um 404, ou uma falha de rede/5xx na leitura
**Quando** a página abre
**Então** ela mostra o mesmo estado de erro do detalhe: 404 com "Voltar para a lista", e rede/5xx com "Tentar novamente" (FR9, FR19)

**Dado** a operadora altera o Preço para "209,90" e apaga a Descrição
**Quando** ela salva
**Então** o facade envia `PUT /produtos/{id}` com `nome`, `descricao: null`, `preco: 209.9` e `estoque` (substituição total) (FR11)
**E** o estado "Salvando" e o tratamento de 400, ProblemDetails, rede e 5xx são os mesmos do cadastro (FR17–FR19)
**E** um 404 no `PUT` mostra o ProblemDetails no alerta geral (AD-4)

**Dado** a resposta de sucesso
**Quando** a edição conclui
**Então** o snackbar "Produto salvo" aparece antes da navegação para `/produtos/{id}` com `replaceUrl: true`, e o detalhe mostra os novos valores e o novo "Atualizado em" (FR11)

**Dado** o botão "Cancelar" na edição
**Quando** a operadora o aciona
**Então** ela volta ao detalhe do produto

### Story 2.7: Desativar e reativar produto

Como operadora do catálogo,
Quero desativar ou reativar um produto, com confirmação, pelo detalhe ou pela tabela,
Para que itens fora de linha fiquem marcados sem sumir do catálogo e possam voltar depois.

**Acceptance Criteria:**

**Dado** `produtos/status`
**Quando** `confirmarAlteracaoStatus(produto): Observable<ProdutoResponse | undefined>` é implementada
**Então** ela é a única porta da CAP-5: abre o diálogo de confirmação, passa um callback `executar` que chama `PATCH /produtos/{id}/status` pelo facade com o enum pelo nome (`{ "status": "Desativado" }` ou `"Ativo"`), e emite o produto devolvido no sucesso, ou `undefined` no cancelamento e no erro (FR12, AD-7)
**E** há testes unitários de sucesso, cancelamento e erro

**Dado** um produto `Ativo`
**Quando** o diálogo abre
**Então** ele mostra o título "Desativar produto?", o corpo "“{nome}” continuará visível na listagem, marcado como Desativado. Você pode reativá-lo depois." e os botões "Cancelar" / "Desativar"
**E** para um produto `Desativado`, mostra "Reativar produto?", "“{nome}” voltará a ficar Ativo." e "Cancelar" / "Reativar"
**E** o diálogo é modal, com `autoFocus` em "Cancelar" e o título ligado por `aria-labelledby`; Esc ou clique fora cancela; o botão de confirmação é `mat-flat-button` primário, nunca na cor de erro (UX-DR12)

**Dado** a operadora confirma
**Quando** o `PATCH` está em andamento
**Então** o botão de confirmação mostra spinner e os dois botões ficam desabilitados até a resposta

**Dado** o `PATCH` com sucesso
**Quando** a resposta chega
**Então** o diálogo fecha, o snackbar "Produto desativado" ou "Produto reativado" aparece por 4 s, e o foco volta ao elemento que abriu o diálogo
**E** o status muda na tela só depois da resposta, sem atualização otimista e sem recarregar a página manualmente (FR13)

**Dado** uma falha no `PATCH` (rede, 5xx ou ProblemDetails)
**Quando** a resposta chega
**Então** o diálogo fecha, `core/avisos.erro(erro)` mostra o snackbar com a mensagem de `descreverErro` por 6 s com a ação "Fechar", e o status exibido não muda (FR19, UX-DR13)

**Dado** o detalhe de um produto
**Quando** ele é exibido
**Então** aparece o botão "Desativar" ou "Reativar" (`mat-flat-button`), conforme o status, e após o sucesso o detalhe troca o produto exibido pelo produto emitido (novo chip e novo "Atualizado em")
**E** abaixo de 600 px, os botões de ação do detalhe ficam em largura total (UX-DR22)

**Dado** a tabela da listagem
**Quando** ela é exibida
**Então** cada linha tem um botão ⋮ (`mat-menu`, ícone `more_vert`) com `aria-label="Ações para {nome}"` e um único item, "Desativar" (se Ativo) ou "Reativar" (se Desativado), que chama `confirmarAlteracaoStatus` pela página (UX-DR11)
**E** após o sucesso, a listagem chama `recarregar()` com os mesmos parâmetros, e se um filtro de status fizer o produto sair, ele simplesmente some da página (FR13)
