---
id: SPEC-catalogo-front
companions:
  - golden-path.md
  - ../../../docs/referencia-api/SPEC.md
  - ../../../docs/referencia-api/produto.md
  - ../../../docs/referencia-api/ARCHITECTURE-SPINE.md
sources:
  - ../../../README.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# catalogo-front — SPA do Catálogo de Produtos

## Why

**Mandato do TCC.** A plataforma Kubernetes/GitOps define um contrato de Golden Path também para frontends e precisa de uma aplicação real que o percorra de ponta a ponta. O `catalogo-front` é essa aplicação: uma SPA Angular sobre a `catalogo-api`. O escopo é mínimo porque o foco do TCC é a plataforma, não a interface.

## Capabilities

- **CAP-1**
  - **intent:** Usuário lista os produtos, ativos e desativados, com busca por nome, filtros por status e faixa de preço, ordenação e paginação.
  - **success:** A tela envia à API só os parâmetros e valores definidos em `produto.md` e mostra os itens da página, o total e a navegação entre páginas. Um produto desativado se distingue visualmente de um ativo por algo além da cor.
- **CAP-2**
  - **intent:** Usuário cadastra um produto.
  - **success:** O formulário bloqueia o envio de valores fora dos limites do AD-4 e mostra o erro no campo. Um formulário válido gera `POST /produtos`, e o produto criado aparece na consulta seguinte.
- **CAP-3**
  - **intent:** Usuário vê o detalhe de um produto.
  - **success:** O detalhe mostra todos os campos de `ProdutoResponse`. Abrir a URL do detalhe direto no navegador funciona. Um id inexistente (404) mostra uma mensagem de produto não encontrado.
- **CAP-4**
  - **intent:** Usuário edita um produto, ativo ou desativado.
  - **success:** O formulário abre preenchido com os dados atuais e aplica a mesma validação do CAP-2. Ele envia `PUT /produtos/{id}` como substituição total, e a alteração aparece na consulta seguinte.
- **CAP-5**
  - **intent:** Usuário desativa ou reativa um produto.
  - **success:** A ação gera `PATCH /produtos/{id}/status` com o enum pelo nome, e o novo status aparece na listagem e no detalhe sem recarregar a página manualmente.
- **CAP-6**
  - **intent:** O operador aponta o front para a API de cada ambiente sem gerar nova imagem.
  - **success:** A mesma imagem, iniciada com dois valores diferentes de `API_BASE_URL`, chama duas APIs diferentes. Sem a variável, o contêiner não sobe. Nenhuma URL de ambiente aparece no bundle nem no código-fonte ou configuração da aplicação.
- **CAP-7**
  - **intent:** A plataforma verifica a saúde do contêiner.
  - **success:** `GET /healthz` no servidor estático retorna 200, inclusive com a API fora do ar.
- **CAP-8**
  - **intent:** Usuário entende por que uma operação falhou.
  - **success:** Num 400, cada erro de `errors` aparece junto ao campo correspondente, e um erro sem campo correspondente aparece numa mensagem geral. Os demais erros ProblemDetails mostram `title`/`detail`. Uma falha de rede ou um 5xx mostra uma mensagem própria, e a tela continua utilizável.

## Constraints

- A SPA é Angular e consome a `catalogo-api` exatamente pelo contrato de `docs/referencia-api/`: rotas, enums trafegando pelo nome, erros em ProblemDetails, OpenAPI em `/openapi/v1.json`. O front não redefine nem estende esse contrato.
- A URL da API vem só de `API_BASE_URL`: URL absoluta `https`, sem barra final, definida pelo overlay `tcc-platform/apps/catalogo-front/<ambiente>` com esse nome exato (hosts por ambiente em `golden-path.md`). No start, um template do nginx processado por `envsubst` em `/docker-entrypoint.d` gera `/config.json`, e a SPA lê esse arquivo antes do bootstrap. Se a variável estiver ausente, o contêiner não sobe. A URL nunca fica no build nem no código-fonte ou configuração da aplicação.
- O navegador chama a API direto, em outro host, via CORS, e o front não faz proxy. A API é a dona do CORS (AD-8). **Dependência externa:** o overlay `tcc-platform/apps/catalogo-api` inclui a URL do front do mesmo ambiente em `Cors__OrigensPermitidas`, e os hosts de cada ambiente são definidos no `tcc-platform`.
- Todo o contrato do Golden Path em `golden-path.md` é obrigatório: imagem `linux/arm64`, servidor estático não-root com `/healthz`, CI pelo template compartilhado, e manifestos e segredos fora do repo.
- Não há OpenTelemetry no navegador.
- Os formulários validam antes de enviar, espelhando os limites do AD-4. A API continua sendo a fonte da verdade.
- Os testes unitários rodam e passam com `npm test -- --watch=false --browsers=ChromeHeadless`, que é o comando da esteira. O runner de testes precisa aceitar essas flags.
- O layout é simples e responsivo. A acessibilidade básica é obrigatória: todo campo tem rótulo, tudo funciona pelo teclado, e o contraste é adequado.

## Non-goals

- Login, autenticação e autorização.
- Internacionalização (i18n).
- Trace no navegador.
- PWA e modo offline.
- Remoção de produto (a API não oferece).
- Alterações na infraestrutura comum (template de esteira, `golden-path/base`).
- Manifestos Kubernetes e segredos neste repositório.

## Success signal

- Publicado pela esteira e servido pelo cluster, o front executa todas as operações da API (listar com busca, filtro, ordenação e paginação; cadastrar; consultar; editar; desativar; reativar) sem nenhuma alteração na infraestrutura comum.

## Assumptions

- A interface fica só em pt-BR, porque i18n é non-goal.
- "Contraste adequado" quer dizer WCAG 2.1 AA (4.5:1 para texto normal).
- O servidor estático escuta na porta 8080 (padrão do `nginx-unprivileged`), serve a SPA na raiz do próprio host e devolve `index.html` para as rotas da SPA.
- O `frontend-service.yml` roda o Trivy com a mesma regra da API: bloqueia vulnerabilidades CRITICAL que têm correção. O template não foi verificado.
- Os logs e métricas do contêiner citados no README são coletados pela plataforma, sem código no front.
- O comando de teste pressupõe Karma + ChromeHeadless. A versão do Angular e o runner ficam para a arquitetura.

