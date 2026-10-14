# catalogo-front

Frontend de Catálogo — SPA em Angular que consome a API de Produtos (cadastro e listagem com busca e filtragem), servida como conteúdo estático por um contêiner.

Aplicação de validação do TCC. Segue o **contrato do Golden Path** da plataforma:

| Artefato | Onde |
|---|---|
| Dockerfile padronizado (`linux/arm64`, usuário não-root, health check) | `Dockerfile` |
| Esteira de CI (chama o template compartilhado) | `.github/workflows/ci.yml` |
| Instrumentação OpenTelemetry (sem trace no navegador; logs e métricas do contêiner + check sintético) | código |
| Endpoint de health check | `/healthz (servidor estático)` |
| Manifestos | **não ficam aqui**: overlay em `tcc-platform/apps/catalogo-front` |
| Segredos | **não ficam aqui**: OCI Vault, declarados por `ExternalSecret` no `tcc-platform` |

## CI/CD

`ci.yml` chama `frontend-service.yml` do repositório `tcc-pipeline-templates`: testes → Trivy → imagem
`linux/arm64` no GHCR → commit da nova tag em `tcc-platform/apps/catalogo-front` → Argo CD sincroniza.

O gatilho `push` está desligado até existirem código e `Dockerfile` — hoje o workflow só roda manualmente
(`workflow_dispatch`). Para ligar, descomente o bloco `push`/`pull_request` no `ci.yml`.

Secret necessário: `PLATFORM_REPO_TOKEN` (fine-grained token, só o `tcc-platform`, Contents: Read and write).

## Desenvolvimento

Planejado com o **BMAD Method** (ver `docs/` depois da instalação).
