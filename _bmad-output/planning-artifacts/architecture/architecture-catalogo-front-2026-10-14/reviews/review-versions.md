# Review — versões e decisões técnicas verificadas (lente: realidade vs. memória de treino)

- **Artefato:** `ARCHITECTURE-SPINE.md` (catalogo-front, 2026-10-14)
- **Data da verificação:** 2026-10-14
- **Método:** consulta direta ao npm registry (dist-tags, `engines`, `peerDependencies`), download e leitura dos tarballs publicados (`@angular/core@22.2.2`, `@angular/build@22.2.2`, `@schematics/angular@22.2.2`, `ng-openapi-gen@1.1.0`), **execução real** do `ng-openapi-gen@1.1.0` sobre um OpenAPI 3.1 mínimo no formato do ASP.NET Core 10, `nodejs.org/dist/index.json` + `nodejs/Release/schedule.json`, Docker Hub API, fonte do `nginx/docker-nginx-unprivileged` no GitHub, e o template `frontend-service.yml` via `gh api`.

## Veredito

**Aprovado com ajustes.** Todas as versões e quase todas as premissas técnicas do spine batem com a realidade em 2026-10-14. Há **um achado de alta severidade** (o `ng-openapi-gen` 1.x gera Promises por padrão, o que quebra a regra "a última consulta vence" do AD-6) e **dois de média** (bit de execução / CRLF do script de entrypoint; escopo do `docker/nginx.conf` frente aos ajustes não-root da imagem). O resto são precisões.

## Tabela de verificação

| # | Afirmação do spine | Status | Evidência |
|---|---|---|---|
| 1 | Angular 22.2.x é o estável atual | **Confirmado** | `@angular/core` `latest` = 22.2.2 (2026-10-08); `next` = 22.3.0-next.1. CLI, build e Material também 22.2.2. https://registry.npmjs.org/@angular/core |
| 2 | CLI 22 cria standalone + zoneless por padrão | **Confirmado** | `@schematics/angular@22.2.2` `application/schema.json`: `zoneless` default `true`, `standalone` default `true`; sem zoneless não adiciona `zone.js` nem polyfill. |
| 3 | Builder `@angular/build:application` | **Confirmado** | `Builders.BuildApplication = "@angular/build:application"` (schematic `application/index.js`). |
| 4 | Nomes sem sufixo (`lista.ts` → `Lista`) | **Confirmado** | `fileNameStyleGuide` default `"2025"` em `ng-new` e `application`. |
| 5 | Runner padrão Vitest + jsdom, sem Karma | **Confirmado** | `testRunner` default `vitest`; `utility/dependencies.js` instala `['vitest','jsdom']`; alvo `test` = `@angular/build:unit-test` com `options: {}`; `browsers` ausente ⇒ "tests are run in a Node.js environment using jsdom". Versões: vitest `^5.0.0`, jsdom `^30.0.0`. |
| 6 | `npm test -- --watch=false` funciona | **Confirmado** | `package.json.template`: `"test": "ng test"`; `unit-test/schema.json` tem `watch` (boolean; default true só em TTY). `--browsers=ChromeHeadless` do default do template ligaria modo navegador (exige provider `@vitest/browser-*`), por isso o override é necessário. |
| 7 | Saída em `dist/catalogo-front/browser` | **Confirmado** | `application/options.js`: `outputPath ?? join(workspaceRoot,'dist',projectName)`; subpasta `browser` default. (Vale só se o projeto se chamar `catalogo-front`.) |
| 8 | `provideAppInitializer` estável | **Confirmado** | `types/core.d.ts` `@publicApi`; aceita `() => Observable | Promise | void`. |
| 9 | `toSignal`, `input()`, `output()`, `model()` estáveis | **Confirmado** | `toSignal` `@publicApi 20.0`; `input` `@publicAPI`; `output`/`model` `@publicApi 19.0`. |
| 10 | TypeScript ≥ 6.0 < 6.1 | **Confirmado** | peer de `@angular/build@22.2.2`: `typescript: ">=6.0 <6.1"`; CLI instala `~6.0.2`. Atenção: `typescript` `latest` no npm é **7.0.2** — um `npm i -D typescript` sem versão quebra. |
| 11 | ng-openapi-gen 1.1.0, OpenAPI 3.1 | **Confirmado** | `latest` = 1.1.0 (2026-09-23). README: "OpenAPI 3.0 and 3.1 … Support for OpenAPI 3.1 was added since 1.0". Geração real de um 3.1 funcionou. |
| 12 | `enumStyle: alias` | **Confirmado** (e já é default) | schema: default `"alias"`; gera `type StatusProduto = 'Ativo' \| 'Desativado'` (testado). `enumArray` default `true` com alias. |
| 13 | `ApiConfiguration.rootUrl` definível em runtime | **Confirmado** | `ApiConfiguration` é `@Injectable({providedIn:'root'})` com `rootUrl` público; `Api.rootUrl` é getter que lê `config.rootUrl` a cada chamada. README seção "Specifying the root URL". Fallback, se nunca definido: o `servers[0].url` do spec. |
| 14 | ng-openapi-gen compatível com Angular 22 | **Confirmado (peer)** | peer `@angular/core: ">=16.0.0"`, `rxjs >=6.5.0`. Código gerado usa só `HttpClient`/`HttpContext`/`@Injectable`. Não houve build com Angular 22 nesta revisão. |
| 15 | **Implícito:** cliente gerado retorna Observable (cancelável) | **Refutado** | 1.x mudou o default para `"promises": true` (`invoke()` vira `async` + `Promise<R>`). Ver achado F1. |
| 16 | Node 24 LTS, 24.21.0 em 2026-10-14 | **Confirmado, com nuance** | `v24.21.0` (2026-09-07, `lts: Krypton`) é o último 24.x. Schedule: Node 24 entra em **maintenance em 2026-10-20** e **Node 26 vira LTS em 2026-10-28**. https://github.com/nodejs/Release/blob/main/schedule.json |
| 17 | Faixa de engine do Angular 22 aceita Node 24 | **Confirmado** | `engines.node: "^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0"` (core, cli, build). |
| 18 | `node:24-alpine` multi-arch | **Confirmado** | Docker Hub: amd64, arm64/v8, s390x. |
| 19 | `nginx-unprivileged:stable-alpine` arm64 | **Confirmado** | Docker Hub tag atualizada 2026-10-12; arquiteturas incluem `arm64`. |
| 20 | Alpine 3.24, UID 101, porta 8080 | **Confirmado** | `stable/alpine-slim/Dockerfile`: `ARG IMAGE=alpine:3.24`, `ARG UID=101`, `EXPOSE 8080`, `USER $UID`; nginx 1.30.5. `stable/alpine` herda de `…:1.30.5-alpine-slim`. |
| 21 | `/docker-entrypoint.d` aborta o start se um script sair ≠ 0 | **Confirmado, com condição** | `docker-entrypoint.sh` tem `set -e`; scripts `*.sh` rodam dentro de `find … \| while read` — falha sai do subshell com status ≠ 0, que é o status do pipeline ⇒ `set -e` encerra antes do `exec nginx`. **Mas** um `*.sh` **sem bit de execução é ignorado em silêncio** ("Ignoring …, not executable"). Ver F2. |
| 22 | `envsubst` disponível | **Confirmado** | `apk add --no-cache gettext-envsubst` no `alpine-slim` (herdado). |
| 23 | busybox `wget` disponível | **Confirmado** | Imagem base `alpine:3.24` traz busybox com `wget`; nenhum pacote extra. |
| 24 | ASP.NET Core 10 emite números como `number \| string` | **Confirmado** | dotnet/aspnetcore#64501 (template .NET 10 gera `"type": ["integer","string"]` + `pattern`), causa: `JsonSerializerDefaults.Web` ⇒ `NumberHandling = AllowReadingFromString`. Geração real: `preco: (number \| string)`, `page?: (number \| string)`. https://github.com/dotnet/aspnetcore/issues/64501 |
| 25 | Inputs `node-version` e `test-command` do template; `build-command` default `npm run build` | **Confirmado** | `frontend-service.yml@main`: `node-version` (default `"22"`), `test-command` (default `npm test -- --watch=false --browsers=ChromeHeadless`), `build-command` (default `npm run build`). |
| 26 | `ci.yml` atual | **Confirmado (estado)** | Hoje só `workflow_dispatch`, sem `node-version`/`test-command` — coerente com "ligados na história que entrega código". |
| 27 | Hooks `prestart`/`pretest`/`prebuild` | **Confirmado** | npm roda `pre<script>` para `start`, `test` e `run build`; o template chama `npm test` e `npm run build`. |

## Achados

### F1 — [ALTA] ng-openapi-gen 1.x gera Promises por padrão; AD-6 exige cancelamento

- **Afirmação afetada:** AD-6 "Uma nova consulta cancela a anterior, e a última vence"; AD-1 (só o facade fala com `src/app/api`, ninguém injeta `HttpClient` fora de `core/`).
- **Realidade:** desde 1.0, `"promises": true` é default (`ng-openapi-gen-schema.json`; README "Migrating … 1.0+"). `Api.invoke()` vira `async` e devolve `Promise<R>`. Promise não cancela a requisição HTTP; `switchMap`/`toSignal` não conseguem abortar a anterior, e a "última vence" passaria a depender de guarda manual. Também o 1.x gera, por default, `services: false` + um serviço `Api` com `invoke(fn, params)`, e não classes por tag.
- **Fonte:** https://github.com/cyclosproject/ng-openapi-gen (README, seção "Migrating from previous versions to 1.0+"); `ng-openapi-gen-schema.json` no tarball 1.1.0.
- **Correção sugerida:** no AD-2, fixar no `ng-openapi-gen.json`: `"promises": false` (além de `enumStyle: alias`), e dizer que o facade usa `Api.invoke(fn, params)` → `Observable` (testado: com `promises:false` a assinatura é `Observable<R>`). Opcionalmente registrar `services: false` e `apiService: "Api"` como escolha explícita.

### F2 — [MÉDIA] Script de entrypoint sem bit de execução (ou com CRLF) não falha: é ignorado ou quebra de forma confusa

- **Afirmação afetada:** AD-7 "falha com exit ≠ 0 (o contêiner não sobe) se `API_BASE_URL` estiver ausente…".
- **Realidade:** o `docker-entrypoint.sh` só executa `*.sh` com `-x`; sem ele, loga "Ignoring … not executable" e **sobe o nginx sem `config.json`** — exatamente o modo de falha que o AD-7 quer impedir (a app cairia na tela fatal do AD-3 em vez de o pod não subir). O repositório vive em Windows/OneDrive (WSL em `/mnt/c`), onde o bit +x e o fim de linha LF não são garantidos; `#!/bin/sh\r` dá "not found" (ainda falha, mas com erro enganoso).
- **Fonte:** https://github.com/nginx/docker-nginx-unprivileged/blob/main/stable/alpine-slim/docker-entrypoint.sh
- **Correção sugerida:** no AD-7, exigir `COPY --chmod=0755 docker/entrypoint/40-config-json.sh /docker-entrypoint.d/` e um `.gitattributes` com `*.sh text eol=lf` (e `docker/* eol=lf`). O script deve começar com `set -eu` e fazer `mkdir -p /tmp/config`.

### F3 — [MÉDIA] `docker/nginx.conf`: substituir o `nginx.conf` principal perde os ajustes não-root da imagem

- **Afirmação afetada:** AD-7 "nginx (`docker/nginx.conf`)…".
- **Realidade:** a imagem unprivileged adapta o `/etc/nginx/nginx.conf` via `sed`: remove `user nginx;`, move o pid para `/tmp/nginx.pid` e os `*_temp_path` para `/tmp/…`. Um `nginx.conf` próprio copiado por cima precisa repetir tudo isso, senão o nginx (UID 101) falha ao gravar `/run/nginx.pid`. O spine não diz para onde o arquivo vai.
- **Fonte:** https://github.com/nginx/docker-nginx-unprivileged/blob/main/stable/alpine-slim/Dockerfile (linhas `RUN sed -i …`).
- **Correção sugerida:** declarar que o arquivo é um bloco `server { listen 8080; … }` copiado para `/etc/nginx/conf.d/default.conf` (mantendo o `nginx.conf` da imagem). Isso também faz o `10-listen-on-ipv6-by-default.sh` detectar arquivo alterado e não mexer nele.

### F4 — [BAIXA] Open Question de `readOnlyRootFilesystem` está incompleta

- Com raiz somente-leitura, não só o `config.json` precisa de `/tmp` gravável: o pid (`/tmp/nginx.pid`) e os temp paths também estão em `/tmp`, e `/var/cache/nginx` também precisa ser gravável. O script `20-envsubst-on-templates.sh` só escreve se houver `/etc/nginx/templates`.
- **Fonte:** mesmo Dockerfile do F3.
- **Correção sugerida:** reescrever a Open Question: "`emptyDir` em `/tmp` **e** `/var/cache/nginx`".

### F5 — [BAIXA] Node 24 sai de Active LTS em 6 dias

- 24.21.0 é correto e Node 24 continua suportado (maintenance 2026-10-20 → EOL 2028-04-30). Node 26 vira Active LTS em 2026-10-28, e o Angular 22 aceita `>=26.0.0`.
- **Fonte:** https://github.com/nodejs/Release/blob/main/schedule.json ; https://nodejs.org/dist/index.json
- **Correção sugerida:** manter 24 (é escolha defensável para o TCC) e trocar a linha do Stack para "24 LTS (maintenance a partir de 2026-10-20; 26 vira LTS em 2026-10-28)", ou registrar a migração para 26 em Deferred.

### F6 — [BAIXA] Nota do AD-2 cobre só o envio; a leitura também vem tipada `number | string`

- A geração real dá `preco: (number | string)` também no `ProdutoResponse`. Os pipes `currency`/`number` aceitam ambos, mas qualquer aritmética ou comparação (ex.: preencher o formulário de edição, faixa de preço) precisa de conversão.
- **Fonte:** execução local de `ng-openapi-gen@1.1.0`; dotnet/aspnetcore#64501.
- **Correção sugerida:** acrescentar ao AD-2: "ao ler, o helper de conversão do AD-5 normaliza para `number`" (um único lugar). Alternativa do lado da API: schema transformer para tirar `string` dos numéricos (fora do escopo do front).

### F7 — [BAIXA] `ng new` não tem default de estilo; `styles.scss` precisa de `--style=scss`

- `ng-new/schema.json`: `style` sem default (prompt interativo). O spine pressupõe `styles.scss`.
- **Correção sugerida:** no AD-8, registrar o comando de criação, por exemplo `ng new catalogo-front --style=scss --ssr=false --ai-config=none`, para que o nome do projeto (que define `dist/catalogo-front/browser`) e o estilo fiquem fixos.

### F8 — [INFO] Precisões menores

- `--watch=false` é redundante em CI (watch já é `false` fora de TTY), mas inofensivo; o override vale por remover `--browsers=ChromeHeadless`.
- Testes do initializer: `fetch` existe globalmente no Node 24 dentro do ambiente jsdom do Vitest; use `vi.stubGlobal('fetch', …)` para os casos de sucesso e falha.
- `stable-alpine` inclui módulos njs que o front não usa; `stable-alpine-slim` também traz `envsubst` e busybox e é menor (opcional).
- `envsubst` não escapa JSON: a validação do script (prefixo `https://`, sem `/` final) poderia também rejeitar `"` e `\` para evitar JSON inválido.

## O que não foi verificado

- Build real de um projeto Angular 22 com o cliente gerado (só peers e geração foram checados).
- Comportamento exato do busybox `ash` com `set -e` em pipeline. Pela semântica POSIX, o status do pipeline é o do último comando (o `while`), que herda o código de saída do script; esse é o comportamento conhecido da imagem oficial, mas não foi executado aqui.
