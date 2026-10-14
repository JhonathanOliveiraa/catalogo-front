---
review-of: ../ARCHITECTURE-SPINE.md
type: rubric-and-reconciliation
reviewed: '2026-10-14'
inputs:
  - _bmad-output/specs/spec-catalogo-front/SPEC.md
  - _bmad-output/specs/spec-catalogo-front/golden-path.md
  - _bmad-output/planning-artifacts/ux-designs/ux-catalogo-front-2026-10-14/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-catalogo-front-2026-10-14/DESIGN.md
  - docs/referencia-api/ARCHITECTURE-SPINE.md
  - docs/referencia-api/produto.md
  - .github/workflows/ci.yml
  - ../tcc-pipeline-templates/.github/workflows/frontend-service.yml (verified, read-only)
  - ../tcc-platform (README, golden-path/base, platform/gateway, apps) (verified, read-only)
---

# Review — ARCHITECTURE-SPINE catalogo-front (rubric + reconciliation)

## Verdict

**Needs revision (minor-to-moderate).** The spine is strong. It covers all eight CAPs, the Golden Path, the
runtime config chain, error normalization, and the toolchain, and most AD rules are concrete enough to check.
What is wrong:

- One explicit SPEC constraint, the test command, is contradicted without the deviation being recorded.
- Two real divergence points are left open: how the fatal config screen actually renders, and who performs the
  `PATCH` inside the confirmation dialog.
- AD-6 (listing URL as the single source of truth) has gaps where builders will diverge: history push vs.
  replace, "página além do fim", invalid query values, and filter input buffers.

None of these needs a new paradigm. Each one is a sentence or a small rule added to an existing AD.

## Findings (ordered by severity)

### F1 — HIGH — Test command contradicts SPEC Constraint (unrecorded deviation)

- **SPEC › Constraints:** "Os testes unitários rodam e passam com `npm test -- --watch=false --browsers=ChromeHeadless`,
  que é o comando da esteira. **O runner de testes precisa aceitar essas flags.**" golden-path.md › Esteira repeats the
  command.
- **Spine AD-8:** picks Vitest + jsdom with no browser provider and overrides `test-command: "npm test -- --watch=false"`.
  The override itself is valid, because `frontend-service.yml` exposes a `test-command` input and the template is not
  altered. SPEC › Assumptions also leaves the runner to the architecture.
- **Problem:** the spine silently changes the "comando da esteira" that the SPEC says is fixed. A validator or story
  builder checking against the SPEC will flag it, and anyone who runs the SPEC command locally gets a failure: with the
  Vitest builder, `--browsers` switches on browser mode and needs a provider.
- **Fix:** pick one of these and record it in AD-8.
  - (a) **Preferred:** keep the override and add an explicit line, "Desvio deliberado do SPEC › Constraints: o comando da
    esteira passa a ser `npm test -- --watch=false`, via input `test-command`; motivo …". Then run correct-course to
    update SPEC Constraint + golden-path.md › Esteira, so the contract and the spine agree.
  - (b) Make the SPEC command pass as written: Vitest browser mode with `@vitest/browser-playwright` + Chromium, where the
    Angular builder maps `ChromeHeadless`. This drops the "sem navegador real" goal.

### F2 — HIGH/MEDIUM — Fatal config screen has no defined mechanism (AD-3)

- AD-3 says a failed `provideAppInitializer` leads to "a app mostra uma tela fatal … e não faz nenhuma chamada à API".
  When an app initializer rejects, `bootstrapApplication` rejects and **no component renders**, so the user gets a blank
  page.
- Builders will diverge three ways:
  - (i) let it reject, which gives a blank page;
  - (ii) swallow the error and set a flag, but then the router still loads `/produtos`, which calls the API with an
    empty `rootUrl` and breaks the "nenhuma chamada" rule;
  - (iii) catch in `main.ts` and write HTML into the DOM.
- **Fix:** pin one mechanism. For example: "`main.ts` faz `carregarConfig()` antes de `bootstrapApplication`. Em falha,
  `mostrarTelaFatal()` escreve um bloco estático (`role="alert"`, texto de `mensagens.ts`) no `<body>` e não faz o
  bootstrap." Or keep the initializer, but rule that it never rejects, a `configOk` flag blocks the routes through a
  guard, and the root component renders the fatal screen.
- Either way, add the fatal-screen text to `mensagens.ts`. "Não foi possível carregar a configuração" does not appear in
  EXPERIENCE, so this is the one microcopy the spine itself owns. Say so, or have UX add it.

### F3 — MEDIUM — AD-6 listing/URL rules leave divergence points open

These are all quiet requirements from EXPERIENCE that interact with the "query string é a única fonte" rule. A builder
following only the spine will get them inconsistent.

1. **"Página além do fim"** (EXPERIENCE › Padrões de estado): when `itens` is empty and `total > 0`, the page must
   auto-navigate to the last valid page and never show an empty state. The spine never mentions it. It is architectural
   because it is a URL write. It needs `replaceUrl: true`, otherwise browser Back returns to the invalid page and bounces
   again. It also belongs in the mandatory test list next to "derivação query string → parâmetros".
2. **History policy is undecided.** Should `router.navigate` for filter, sort, page or debounced search push or replace?
   EXPERIENCE requires that "o botão Voltar do navegador restaurem a consulta", while debounced typing could create one
   history entry per pause. Decide it, for example: push for page, sort, status and price changes; replace for the
   debounced `nome` updates and for the beyond-end correction.
3. **Invalid or hand-edited query values** (`?page=abc`, `?status=foo`, `?pageSize=500`, `precoMin>precoMax`, an enum
   given as a number): the API answers 400, and EXPERIENCE defines no 400 state for a listing *read*. Rule that the
   query-string → params derivation normalizes the values. Invalid or out-of-domain values fall back to the default and
   are dropped. Test cases go in the mandatory derivation spec.
4. **Filter edit buffers vs. "Nenhum signal duplica filtro".** The `nome` input (300 ms debounce) and the price inputs
   (applied on blur or Enter, blocked while `precoMin > precoMax`) need local control state that briefly differs from
   the URL. As worded, the rule bans this, so builders will either break it or each invent their own sync. Reword it:
   filter `FormControl`s are edit buffers only. They are overwritten from `queryParamMap` on every change (the URL
   wins). They write to the URL only through `navigate`. The API request derives only from the URL.
5. **"Tentar novamente" with the URL as the source:** retrying "a mesma requisição" needs a reload trigger, because the
   URL does not change. Name the mechanism, for example a `recarregar` counter signal combined with the URL-derived
   params, using the same `switchMap`/`rxResource` that gives "a última consulta vence". Also pin which of the two
   (`rxResource` or `toObservable` + `switchMap`) is used, so the list and the detail do it the same way.

### F4 — MEDIUM — Status dialog: who performs the PATCH? (AD-1 vs. EXPERIENCE)

- EXPERIENCE requires the dialog to stay open with a spinner and both buttons disabled until the response. On success it
  closes; on error it closes and the page shows a snackbar. Focus then returns to the trigger.
- AD-1 says presentation components (the seed lists `componentes/dialogo-status` there) "não injetam services de dados".
- So either the dialog injects `ProdutosService`, which breaks AD-1, or the PATCH runs after the dialog closes, which
  breaks EXPERIENCE. The dialog is also opened from two pages, list and detail, which invites two copies of the
  open → PATCH → snackbar → refresh logic.
- **Fix:** add to AD-1 or AD-6:
  - "`dialogo-status` recebe por `MAT_DIALOG_DATA` `{ produto, confirmar: () => Observable<ProdutoResponse> }`. Fecha com
    o resultado ou com o `ErroApi`."
  - "Um único helper (ex.: `produtos/alterar-status.ts`) abre o diálogo e devolve o resultado. Cada página só decide o
    pós-sucesso: o detalhe usa a resposta e a lista reconsulta."
  - Snackbar text for a `problema`/`nao-encontrado` error should be fixed too (e.g. `title` + `detail` joined), so the
    list and the detail do not format it differently.

### F5 — MEDIUM/LOW — AD-1 rule text is not enforceable as written

- "Ninguém injeta `HttpClient` fora de `core/`" is broken by the generated client in `src/app/api`, which injects
  `HttpClient`. Change it to "fora de `core/` e do código gerado em `api/`".
- "As dependências seguem só as setas do diagrama" is broken by `aplicarErrosApi(form, erro: ErroApi)`, because the
  diagram has no **Formulário → core/erros** arrow. `shared/estado-erro` and `alerta-geral` probably need
  `core/erros/mensagens` too, and there is no **C → E** arrow. Add the arrows, or relax the rule to "nunca para cima".
- Consider stating how the rule is checked, for example an ESLint `no-restricted-imports` pattern for `**/api/**` outside
  `produtos.service.ts`. That turns AD-1 from a convention into something CI enforces.

### F6 — LOW — Form value types and edit prefill are unpinned (AD-5)

- `criarFormularioProduto()` is shared, but the spine does not say whether the `preco` and `estoque` controls hold a
  `string` (needed to accept a comma and to check "≤ 2 casas" on the typed text rather than on a float) or a `number`.
- It also does not say how a `ProdutoResponse` number is formatted when the edit form is prefilled. `189.9` could become
  "189,90", "189,9" or "189.9".
- Pin it: the controls are `string`; the prefill uses a comma with 2 decimals and no thousands separator; the decimal
  check is a regex on the string; the conversion helper runs only on submit.

### F7 — LOW — Dynamic document title needs a mechanism

- EXPERIENCE: titles are "{nome} — Catálogo" etc. The spine convention says "Título por rota via `title` da rota". A
  static route `title` cannot hold `{nome}`, and a resolver that fetches the product would duplicate the page's GET.
- Fix: a custom `TitleStrategy` appends " — Catálogo". The detail page sets its title through `Title` after loading. No
  resolvers fetch products.

### F8 — LOW — Image could carry a local config.json (CAP-6)

- `public/config.json` is gitignored, but a developer's local copy would be picked up by `npm run build` → `dist`. A
  non-ignored `COPY . .` in the Dockerfile would then put it in the image. nginx's `alias` masks it at runtime, but CAP-6
  says no environment URL in the bundle or image.
- Add a rule:
  - `.dockerignore` excludes `public/config.json`, `node_modules`, `src/app/api`, `dist`;
  - the build fails, or the file is deleted from `dist`, if `browser/config.json` exists.
- Also place `config.example.json` in the Structural Seed.

### F9 — LOW — Ops/environment gaps that belong in Open Questions, not Deferred

- **Probe paths:** the API spine raised "a plataforma deve apontar liveness/readiness para …" as an Open Question. Here
  it is buried under Deferred ("Probes … definidos em `golden-path/base`"). The front only answers `/healthz` on 8080.
  Note also that a base probe on `/health` would get **200 from `try_files` → `index.html`**, which silently hides the
  misconfiguration. Move this to Open Questions (owner tcc-platform): "probes do front em `/healthz:8080`".
- **Overlay prerequisite:** `update-manifest` fails if `apps/catalogo-front/kustomization.yaml` does not exist in
  tcc-platform, and today `tcc-platform/apps/` holds only a README. Add this as an Open Question or dependency.
- **Promotion hml → prd:** `ci.yml` writes one tag to `apps/catalogo-front`, while the SPEC talks about overlays
  `apps/catalogo-front/<ambiente>`. Whether both environments deploy every push is not stated. It is owned by the
  platform, but it should be listed (OQ or Deferred with an owner).
- **Diagram accuracy:** the Structural Seed draws "Gateway API" and "Kong" as separate boxes. In tcc-platform the Gateway
  *is* Kong's (`GatewayClass` Kong, HTTPRoute per app, and the API is also exposed by HTTPRoute). Redraw it as one Kong
  Gateway with two HTTPRoutes, so nobody infers a separate ingress or a proxy path.

### F10 — LOW — CORS: state the request shape the front promises

- The API owns CORS. Its AD-8 lists the methods (GET/POST/PUT/PATCH) and the `Location` exposed header, but not the
  allowed request headers. Add to AD-1 or AD-2 that the browser sends:
  - no credentials (`withCredentials` false);
  - no custom headers;
  - only `Content-Type: application/json` and `Accept`.
- This keeps the preflight contract stable and stops a builder from adding, for example, `X-Requested-With`. If the
  API's policy does not allow `Content-Type`, list it as an external dependency next to `Cors__OrigensPermitidas`.
- Minor: AD-7's `API_BASE_URL` check (https prefix, no trailing slash) does not reject `"`, `\` or whitespace, which
  `envsubst` would inject into JSON. Tighten it to a regex such as `^https://[^"\\[:space:]]+[^/]$`.

## Rubric

| Criterion | Result | Notes |
|---|---|---|
| Fixes the real divergence points for story builders | Mostly | Strong: single API port, generated client, one interceptor, `ErroApi` union, `LIMITES_PRODUTO`, `aplicarErrosApi`, the query string as the source, no optimistic updates, the container contract. Missing: F2, F3, F4, F6, F7. |
| Every AD Rule is enforceable and prevents its stated divergence | Mostly | AD-1 text contradicts itself (F5). AD-3's "tela fatal" cannot be built as worded (F2). AD-6's "nenhum signal duplica filtro" conflicts with the debounce/blur UX (F3.4). AD-2, AD-4, AD-5, AD-7 and AD-8 are concrete and testable. |
| Deferred cannot let two units diverge | OK, with one exception | E2E, CSP/HSTS and OpenAPI auto-sync are safe to defer. "Probes" hides a cross-repo dependency with a silent-failure mode (F9) and should be an Open Question. |
| Every structural dimension is decided, deferred or open | Mostly | Decided: layering, state, errors, forms, config, build, container, CI, toolchain, locale, theming, tests, a11y floor (via companion). Missing or unclear: browser history policy (F3), the fatal bootstrap path (F2), environment promotion and the overlay prerequisite (F9), `.dockerignore` (F8). |
| CAP-1..CAP-8 covered | Yes | All are in the Capability Map. CAP-1 "beyond color" is covered by the Visual convention + DESIGN. CAP-3 deep link is covered by `try_files`, and 404 by AD-4 + the Rotas convention. CAP-6 by AD-3 + AD-7. CAP-7 by AD-7. CAP-8 by AD-4 + AD-5. |

## Reconciliation checklist (quiet requirements)

| Requirement (source) | Spine | Status |
|---|---|---|
| Test command `npm test -- --watch=false --browsers=ChromeHeadless`; runner must accept the flags (SPEC Constraints, golden-path) | AD-8 overrides it to `--watch=false` | **Contradiction (F1)** |
| "A última consulta vence" (EXPERIENCE) | AD-6 "nova consulta cancela a anterior" | Covered; mechanism unpinned (F3.5) |
| "Página além do fim" → last valid page, never the empty state (EXPERIENCE) | Absent | **Gap (F3.1)** |
| `:id` not numeric → 404 state (EXPERIENCE) | Rotas convention | Covered. Optional: state "sem chamada à API; `^\d+$` e ≤ int32" |
| 404 on `PUT` → ProblemDetails in the general alert (EXPERIENCE) | AD-4 "a tela decide" | Consistent |
| Network/5xx error on read keeps the toolbar and filters usable; "Tentar novamente" repeats the request | AD-4/AD-6 | Covered; retry trigger unpinned (F3.5) |
| Browser calls the API directly via CORS, no proxy (SPEC) | AD-7 "não faz proxy" | Covered; request shape unstated (F10) |
| `API_BASE_URL` https, no trailing slash, container fails without it (SPEC, golden-path) | AD-7 entrypoint | Covered; character validation (F10) |
| No URL in bundle/source/config (CAP-6) | AD-3 | Covered; `.dockerignore` gap (F8) |
| `/healthz` 200 without the API (CAP-7) | AD-7 | Covered; probe path is an OQ (F9) |
| Enums by name; numbers as JSON numbers (API AD-7) | AD-2 | Covered |
| Descrição vazia → `null`; PUT is a full replacement | AD-5 | Covered |
| Writes update only after the response; no optimistic UI | AD-6 | Covered |
| Dialog keeps a spinner until the response, closes on error + snackbar | — | **Conflict with AD-1 (F4)** |
| Document title "{nome} — Catálogo" | Rotas convention "title da rota" | **Insufficient (F7)** |
| `lang="pt-BR"`, WCAG AA, Desativado shown not by color alone | Conventions + DESIGN | Covered |
| No OpenTelemetry in the browser (SPEC) | Deferred "trace no navegador" | Covered |
| Template unchanged; triggers `push`/`pull_request` turned on with code | AD-8 | Covered |
| Node 24 in CI = Docker build stage | AD-8 | Covered (the template default is 22, overridden) |
| Trivy CRITICAL with a fix blocks the build (SPEC Assumption) | Seed diagram | Verified in the template; nothing further needed |
