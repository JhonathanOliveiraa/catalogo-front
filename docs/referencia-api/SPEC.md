---
id: SPEC-catalogo-api
companions:
  - produto.md
  - golden-path.md
  - ../../planning-artifacts/architecture/architecture-catalogo-api-2026-10-13/ARCHITECTURE-SPINE.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# catalogo-api — API de Produtos

## Why

**Mandato do TCC.** A plataforma define um contrato de Golden Path (build, segurança, deploy GitOps, observabilidade) e precisa de um serviço real que o percorra de ponta a ponta para validá-lo. O `catalogo-api` é esse serviço: um CRUD de produtos simples o bastante para que o foco fique no contrato, não no domínio.

## Capabilities

- **CAP-1**
  - **intent:** Cliente cadastra um produto via HTTP.
  - **success:** Uma requisição válida persiste o produto como `Ativo` e retorna 201 com o recurso. Uma inválida retorna 400.
- **CAP-2**
  - **intent:** Cliente lista os produtos, ativos e desativados, com paginação, filtro e ordenação.
  - **success:** Retorna 200 com a página pedida e o total. Sem o filtro `status`, vêm todos os produtos. Filtros e ordenação seguem `produto.md`, e um parâmetro inválido retorna 400.
- **CAP-3**
  - **intent:** Cliente consulta um produto pelo id.
  - **success:** Um id existente retorna 200 com o produto, inclusive se estiver desativado. Um inexistente retorna 404.
- **CAP-4**
  - **intent:** Cliente edita um produto existente, ativo ou desativado.
  - **success:** A alteração persiste e aparece na consulta seguinte. Um id inexistente retorna 404 e dados inválidos retornam 400.
- **CAP-5**
  - **intent:** Cliente desativa ou reativa um produto.
  - **success:** A troca de status persiste, retorna 200 com o produto e aparece na listagem e na consulta. Repetir o status atual não altera nada. Um id inexistente retorna 404 e um status inválido retorna 400.
- **CAP-6**
  - **intent:** A plataforma verifica a saúde do serviço.
  - **success:** O endpoint de readiness retorna 200 com o serviço saudável e não-200 com o banco indisponível. O endpoint de liveness retorna 200 enquanto o processo atende, independente do banco.
- **CAP-7**
  - **intent:** O operador observa o serviço no Grafana Cloud.
  - **success:** Uma requisição HTTP gera um trace OTLP com spans de ASP.NET Core e EF Core.

## Constraints

- A stack é .NET 10 LTS (ASP.NET Core) com EF Core sobre PostgreSQL 18. O banco roda no cluster, provisionado por ApplicationSet do Argo CD no `tcc-platform`.
- Todo o contrato do Golden Path em `golden-path.md` é obrigatório: imagem `linux/arm64` não-root, OTel/OTLP, CI compartilhada, manifestos e segredos fora do repo.
- A configuração vem só do ambiente: connection string via ExternalSecret e telemetria pelas variáveis `OTEL_*` padrão. Nenhum endpoint fica fixo no código e nenhum segredo fica no repositório.
- As migrations do EF Core são aplicadas no startup. A aplicação precisa de permissão DDL e o startup precisa tolerar réplicas concorrentes.
- Todo parâmetro ou campo com conjunto fechado de valores (`ordenarPor`, `direcao`, `status`) é enum tipado no contrato e no código.
- A esteira roda testes automatizados e Trivy antes de publicar, e os dois precisam passar. O Trivy bloqueia vulnerabilidades CRITICAL que tenham correção disponível.
- O `catalogo-front` consome a API a partir de outro host, então a API precisa de CORS com origens configuráveis por ambiente.
- As decisões de arquitetura AD-1..AD-13 no `ARCHITECTURE-SPINE.md` são obrigatórias.

## Non-goals

- Autenticação e autorização.
- Manifestos Kubernetes e segredos neste repositório (vivem no `tcc-platform`).
- Domínio além do produto (categorias, pedidos, estoque transacional, UI).
- Remoção de produto, física ou lógica. Um produto é apenas desativado.

## Success signal

- Um push na `main` dispara a esteira, que publica a imagem no GHCR. O Argo CD sincroniza e o serviço sobe no cluster com os health checks em 200. Um ciclo completo de produto via HTTP funciona (cadastrar, listar, consultar, editar, desativar e reativar), e o trace correspondente aparece no Grafana Cloud.

## Assumptions

- Os padrões e limites de paginação, filtro e validação em `produto.md` foram inferidos e fixados na arquitetura (AD-4), sem confirmação explícita do usuário.

## Open Questions

- O `golden-path/base` precisa apontar a liveness para `/health/live` e a readiness para `/health`. Isso depende do `tcc-platform`.
