# Contrato do Golden Path — catalogo-front

Obrigações da plataforma que o `catalogo-front` precisa cumprir.

| Artefato | Exigência | Onde |
|---|---|---|
| Dockerfile | padronizado; `linux/arm64`; servidor estático não-root (ex.: `nginx-unprivileged`); health check | `Dockerfile` (raiz) |
| Health check | `/healthz` servido pelo servidor estático, 200 sem depender da API | config do servidor |
| Configuração | `API_BASE_URL` (https, sem barra final), vinda do overlay. No start, `envsubst` em `/docker-entrypoint.d` gera `/config.json`. Sem a variável, o contêiner não sobe. Nada no build | entrypoint do contêiner |
| CI | chama o template compartilhado `frontend-service.yml` | `.github/workflows/ci.yml` |
| Observabilidade | sem trace no navegador; logs e métricas do contêiner ficam com a plataforma | `tcc-platform` |
| Check sintético | Grafana Cloud Synthetic Monitoring faz HTTP GET em `https://<host-do-front>/healthz` (e em `https://<host-da-api>/health`); configurado pela plataforma | `tcc-platform` |
| CORS | o overlay da API inclui a URL do front do mesmo ambiente em `Cors__OrigensPermitidas` | `tcc-platform/apps/catalogo-api` |
| Manifestos | overlay Kustomize, fora deste repo | `tcc-platform/apps/catalogo-front` |
| Segredos | OCI Vault via `ExternalSecret`, fora deste repo | `tcc-platform` |

## Ambientes e hosts

Autoridade: README do `tcc-platform`, seção "Ambientes e hosts". Valores definidos nos overlays `apps/<app>/<ambiente>` do `tcc-platform`, nunca no front.

| Ambiente | Front | API |
|---|---|---|
| hml | `https://hml-catalogo.tcc.altasistemas.com.br` | `https://hml-catalogo-api.tcc.altasistemas.com.br` |
| prd | `https://catalogo.tcc.altasistemas.com.br` | `https://catalogo-api.tcc.altasistemas.com.br` |

Em cada ambiente, `API_BASE_URL` do front recebe a URL da API, e `Cors__OrigensPermitidas` da API recebe a URL do front.

## Esteira

`ci.yml` → `JhonathanOliveiraa/tcc-pipeline-templates/.github/workflows/frontend-service.yml@main`:

testes → Trivy → imagem `linux/arm64` no GHCR → commit da nova tag em `tcc-platform/apps/catalogo-front` → Argo CD sincroniza.

- Comando de teste da esteira: `npm test -- --watch=false` (Vitest + jsdom), passado pelo `ci.yml` em `test-command`, junto com `node-version: "24"`. O padrão do template (`--browsers=ChromeHeadless`, Node 22) não serve a este front.
- Trivy no código (vulnerabilidades e segredos, CRITICAL) e na imagem (CRITICAL com correção disponível, `ignore-unfixed`): qualquer achado falha a esteira.
- O deploy fica desligado em `pull_request` (`enable-deploy`).
- Secret do repositório: `PLATFORM_REPO_TOKEN` (fine-grained, só `tcc-platform`, Contents: Read and write).
- Hoje só existe `workflow_dispatch`. Ativar os gatilhos `push`/`pull_request` (bloco comentado) assim que existirem código e Dockerfile faz parte da entrega.
- O template compartilhado não é alterado.
