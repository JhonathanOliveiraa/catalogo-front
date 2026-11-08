# catalogo-front

Frontend de Catálogo — SPA em Angular que consome a API de Produtos (cadastro, listagem com busca,
filtros, ordenação e paginação, detalhe, edição, desativar/reativar), servida como conteúdo estático
por um contêiner nginx não-root.

Aplicação de validação do TCC. Segue o **contrato do Golden Path** da plataforma:

| Artefato | Onde |
|---|---|
| Dockerfile padronizado (`linux/arm64`, usuário não-root, health check) | `Dockerfile`, `docker/` |
| Esteira de CI (chama o template compartilhado) | `.github/workflows/ci.yml` |
| Observabilidade (sem trace no navegador; logs e métricas do contêiner + check sintético em `/healthz` no Grafana Cloud) | **não fica aqui**: coletada e configurada pelo `tcc-platform` |
| Endpoint de health check | `GET /healthz` no nginx (200 sem depender da API) |
| URL da API | variável `API_BASE_URL`, lida no start do contêiner (ver Configuração) |
| Manifestos | **não ficam aqui**: overlay em `tcc-platform/apps/catalogo-front` |
| Segredos | **não ficam aqui**: OCI Vault, declarados por `ExternalSecret` no `tcc-platform` |

## Stack

Angular 22.2 (standalone, zoneless, signals) · Angular Material 22.2 (M3) · TypeScript 6.0 ·
Vitest + jsdom (runner padrão do Angular) · ng-openapi-gen 1.1.0 · Node 24 ·
`nginxinc/nginx-unprivileged:stable-alpine`. Decisões em
`_bmad-output/planning-artifacts/architecture/architecture-catalogo-front-2026-10-14/ARCHITECTURE-SPINE.md`.

## Rodar local

Pré-requisito: Node 24 (`nvm install 24 && nvm use 24`).

```bash
npm ci
cp public/config.example.json public/config.json   # aponte apiBaseUrl para a API (padrão: http://localhost:8080)
npm start                                          # http://localhost:4200
```

`public/config.json` é ignorado pelo git e pelo `.dockerignore`. A API precisa liberar a origem
`http://localhost:4200` no CORS (`Cors__OrigensPermitidas` da `catalogo-api`). Sem `config.json`
(ou com JSON inválido / sem `apiBaseUrl`) a SPA mostra a tela fatal de configuração em vez de uma
página em branco.

| Comando | O que faz |
|---|---|
| `npm start` | servidor de desenvolvimento |
| `npm test -- --watch=false` | testes unitários (Vitest + jsdom) — o mesmo comando da esteira |
| `npm run build` | build de produção em `dist/catalogo-front/browser` |
| `npm run lint` | ESLint (inclui a regra que só deixa o facade importar o cliente gerado) |
| `npm run gerar-api` | gera `src/app/api/` a partir de `openapi/catalogo-api.json` |

`prestart`, `pretest`, `prebuild` e `prelint` rodam `gerar-api`, então o cliente é sempre gerado
antes; `src/app/api/` está no `.gitignore` e nunca é editado à mão.

### Contrato da API (OpenAPI)

`openapi/catalogo-api.json` é a cópia versionada do `/openapi/v1.json` da `catalogo-api`.

Para atualizar quando o contrato da API mudar (commit deliberado):

```bash
npm run openapi:atualizar -- https://hml-catalogo-api.tcc.altasistemas.com.br
# equivale a: curl https://hml-catalogo-api.tcc.altasistemas.com.br/openapi/v1.json, removendo "servers"
npm test -- --watch=false && npm run build
```

> O script remove `servers`: o ng-openapi-gen usaria `servers[0].url` como `rootUrl` padrão, e
> nenhuma URL de ambiente pode entrar no bundle. Se o arquivo real mudar nomes de operação (ex.:
> `operationId` explícito) ou de parâmetros, ajuste só `src/app/produtos/produtos.service.ts`.

## Configuração (contêiner)

| Variável | Obrigatória | Formato |
|---|---|---|
| `API_BASE_URL` | sim | URL absoluta `https`, sem barra final (ex.: `https://hml-catalogo-api.tcc.altasistemas.com.br`) |

No start, `docker/entrypoint/40-config-json.sh` (em `/docker-entrypoint.d/`) valida a variável e gera
`/tmp/config/config.json` com `envsubst` a partir de `docker/config.json.template`; o nginx serve esse
arquivo em `/config.json` com `Cache-Control: no-store`, e a SPA o lê antes do bootstrap. **Sem a
variável, ou com valor inválido (`http://`, barra final, espaço, aspas), o contêiner não sobe.**
O valor vem do overlay `tcc-platform/apps/catalogo-front/<ambiente>`; a mesma imagem serve qualquer
ambiente e nenhuma URL de ambiente fica no build.

### Health check

`GET /healthz` → `200 ok`, servido pelo nginx (`return 200`, sem log, sem disco, sem API). O
`HEALTHCHECK` da imagem usa `wget` em `http://127.0.0.1:8080/healthz`. As probes do pod devem
apontar para `/healthz` (um `/health` cairia no fallback da SPA e daria 200 sempre).

### Docker

```bash
docker buildx build --platform linux/arm64 -t catalogo-front:local --load .
# (em máquina amd64 sem QEMU, use --platform linux/amd64 para testar localmente)

# sem API_BASE_URL: deve falhar e sair
docker run --rm catalogo-front:local

# com API_BASE_URL: sobe na porta 8080
docker run --rm -p 8080:8080 -e API_BASE_URL=https://hml-catalogo-api.tcc.altasistemas.com.br catalogo-front:local
curl -i http://localhost:8080/healthz        # 200 ok
curl -i http://localhost:8080/config.json    # {"apiBaseUrl":"https://hml-catalogo-api..."} + Cache-Control: no-store
curl -i http://localhost:8080/produtos/42    # index.html (deep link)

# como no cluster: raiz somente leitura + /tmp e /var/cache/nginx graváveis
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp --tmpfs /var/cache/nginx \
  -e API_BASE_URL=https://hml-catalogo-api.tcc.altasistemas.com.br catalogo-front:local
```

Imagem final: `nginxinc/nginx-unprivileged:stable-alpine`, UID 101, porta 8080. O `nginx.conf`
principal da imagem não é substituído (ele já põe pid e temporários em `/tmp`); só
`conf.d/default.conf` vem de `docker/default.conf`. `index.html` sai com `no-cache` e os arquivos com
hash no nome com `max-age=31536000, immutable`.

## CI/CD

`ci.yml` chama `frontend-service.yml` do repositório `tcc-pipeline-templates`, com `node-version: "24"`
e `test-command: "npm test -- --watch=false"`: testes → build → Trivy (código) → imagem `linux/arm64`
no GHCR → Trivy (imagem) → commit da nova tag em `tcc-platform/apps/catalogo-front/hml` → Argo CD
sincroniza.

Gatilhos: `push` na `main`, `pull_request` (só testa e analisa: `enable-deploy` desligado) e
`workflow_dispatch`.

Secret necessário: `PLATFORM_REPO_TOKEN` (fine-grained token, só o `tcc-platform`, Contents: Read and write).

## Estrutura

```text
src/app/
  app.ts / app.config.ts / app.routes.ts   raiz (tela fatal ou router-outlet), providers, rotas
  api/                                     GERADO (gitignored)
  core/config/                             initializer do /config.json + ConfigEstado
  core/erros/                              interceptor → ErroApi, descreverErro, mensagens.ts (microcopy)
  core/avisos/                             único dono do MatSnackBar
  shared/                                  alerta-geral, estado-erro, estado-vazio
  produtos/produtos.service.ts             facade; único importador de app/api
  produtos/dominio/                        limites, conversores, lerConsulta/paraQueryParams, lerIdProduto
  produtos/formulario/                     criarFormularioProduto, montarCorpo, aplicarErrosApi
  produtos/status/                         confirmarAlteracaoStatus + diálogo
  produtos/componentes/ e paginas/         tabela, filtros, chip, painel; lista, detalhe, formulário
```

## Desenvolvimento

Planejado com o **BMAD Method**: SPEC em `_bmad-output/specs/spec-catalogo-front/`, arquitetura e UX
em `_bmad-output/planning-artifacts/`, histórias em `_bmad-output/planning-artifacts/epics.md` e
status em `_bmad-output/implementation-artifacts/sprint-status.yaml`.
