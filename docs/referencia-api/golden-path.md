# Contrato do Golden Path

Obrigações da plataforma que o `catalogo-api` precisa cumprir.

| Artefato | Exigência | Onde |
|---|---|---|
| Dockerfile | padronizado; `linux/arm64`; usuário não-root; health check | `Dockerfile` (raiz) |
| CI | chama o template compartilhado | `.github/workflows/ci.yml` |
| Observabilidade | OpenTelemetry SDK .NET + auto-instrumentação ASP.NET Core, HttpClient e EF Core; export OTLP configurado só pelas variáveis `OTEL_*` | código |
| Health check | `/health` (readiness, com banco) e `/health/live` (liveness) | código |
| Manifestos | overlay Kustomize, fora deste repo | `tcc-platform/apps/catalogo-api` |
| Segredos | OCI Vault, declarados por `ExternalSecret`, fora deste repo | `tcc-platform` |
| Banco | PostgreSQL 18 via ApplicationSet do Argo CD | `tcc-platform` |
| Ingress | Kong encaminha na raiz (`strip_path`), sem plugin `cors` | `tcc-platform` |

## Esteira

`ci.yml` → `JhonathanOliveiraa/tcc-pipeline-templates/.github/workflows/backend-service.yml@main`, com `dotnet-version: "10.0.x"`:

testes → Trivy no código → imagem `linux/arm64` no GHCR → Trivy na imagem → commit da nova tag em `tcc-platform/apps/catalogo-api` → Argo CD sincroniza.

- O Trivy (`aquasecurity/trivy-action`, fixado pelo SHA da v0.36.0) falha só em vulnerabilidades CRITICAL com correção disponível. O scan de código também procura segredos.
- O deploy fica desligado em `pull_request` (`enable-deploy`).
- Secret do repositório: `PLATFORM_REPO_TOKEN` (fine-grained, só `tcc-platform`, Contents: Read and write).
- Hoje só existe `workflow_dispatch`. Ativar os gatilhos `push`/`pull_request` (bloco comentado) assim que existirem código e Dockerfile faz parte da entrega.

## Observabilidade

Destino: Grafana Alloy no cluster (`tcc-platform/platform/observability`, receptor OTLP) → Grafana Cloud. O Deployment base (`tcc-platform/golden-path/base`) injeta as variáveis OTel. A app usa só as variáveis padrão do SDK, então funciona com qualquer subconjunto injetado.
