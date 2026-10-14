# catalogo-front

Frontend de Catálogo — SPA em Angular que consome a API de Produtos (cadastro e listagem com busca e filtragem), servida como conteúdo estático por um contêiner.

Aplicação de validação do TCC. Segue o **contrato do Golden Path** da plataforma:

| Artefato | Onde |
|---|---|
| Dockerfile padronizado (`linux/arm64`, usuário não-root, health check) | `Dockerfile` |
| Esteira de CI (chama o template compartilhado) | `.github/workflows/ci.yml` |
| Observabilidade (sem trace no navegador; logs e métricas do contêiner + check sintético em `/healthz` no Grafana Cloud) | **não fica aqui**: coletada e configurada pelo `tcc-platform` |
| Endpoint de health check | `/healthz (servidor estático)` |
| URL da API | variável `API_BASE_URL`, lida no start do contêiner (ver Configuração) |
| Manifestos | **não ficam aqui**: overlay em `tcc-platform/apps/catalogo-front` |
| Segredos | **não ficam aqui**: OCI Vault, declarados por `ExternalSecret` no `tcc-platform` |

## Configuração

A URL da API vem só da variável de ambiente `API_BASE_URL`: URL absoluta `https`, sem barra final (ex.: `https://api.<dominio>`).
No start, um template do nginx processado por `envsubst` em `/docker-entrypoint.d` gera `/config.json`, que a SPA lê antes do bootstrap.
Sem a variável, o contêiner não sobe. O valor vem do overlay `tcc-platform/apps/catalogo-front`; a mesma imagem serve qualquer ambiente.

## CI/CD

`ci.yml` chama `frontend-service.yml` do repositório `tcc-pipeline-templates`: testes → Trivy → imagem
`linux/arm64` no GHCR → commit da nova tag em `tcc-platform/apps/catalogo-front` → Argo CD sincroniza.

O gatilho `push` está desligado até existirem código e `Dockerfile` — hoje o workflow só roda manualmente
(`workflow_dispatch`). Para ligar, descomente o bloco `push`/`pull_request` no `ci.yml`.

Secret necessário: `PLATFORM_REPO_TOKEN` (fine-grained token, só o `tcc-platform`, Contents: Read and write).

## Desenvolvimento

Planejado com o **BMAD Method** (ver `docs/` depois da instalação).
