# Produto

Entidade única da API (CAP-1..CAP-5). Os limites exatos de cada campo estão no AD-4 do `ARCHITECTURE-SPINE.md`.

| Campo | Tipo | Regra |
|---|---|---|
| Id | inteiro gerado pelo servidor | imutável |
| Nome | texto | obrigatório |
| Descricao | texto | opcional; vazio vira nulo |
| Preco | decimal, 2 casas | ≥ 0 |
| Estoque | inteiro | ≥ 0 |
| Status | enum `StatusProduto`: `Ativo`, `Desativado` | `Ativo` na criação; muda só pela operação de status (CAP-5) |
| CriadoEm | data/hora UTC | definido pelo servidor na criação |
| AtualizadoEm | data/hora UTC | definido pelo servidor na criação, a cada edição e a cada mudança efetiva de status |

Produtos desativados continuam visíveis na listagem e na consulta e podem ser editados. Não existe remoção.

## Rotas

| Rota | Capability |
|---|---|
| `POST /produtos` | CAP-1 |
| `GET /produtos` | CAP-2 |
| `GET /produtos/{id}` | CAP-3 |
| `PUT /produtos/{id}` | CAP-4 (substituição total) |
| `PATCH /produtos/{id}/status` com `{ "status": "Ativo" \| "Desativado" }` | CAP-5 |
| `GET /health` (readiness) · `GET /health/live` (liveness) | CAP-6 |

## Listagem (CAP-2)

| Parâmetro | Valores | Padrão |
|---|---|---|
| `page` | inteiro ≥ 1 | 1 |
| `pageSize` | 1–100 | 20 |
| `nome` | texto; contém, sem diferenciar maiúsculas | — |
| `precoMin` / `precoMax` | decimal ≥ 0, inclusivos, `precoMin ≤ precoMax` | — |
| `status` | enum `StatusProduto` | todos |
| `ordenarPor` | enum `CampoOrdenacao`: `Nome`, `Preco`, `CriadoEm` | `Nome` |
| `direcao` | enum `DirecaoOrdenacao`: `Asc`, `Desc` | `Asc` |

A resposta traz os itens da página e o total de registros que atendem ao filtro. Um valor fora do domínio ou do enum, inclusive um enum enviado como número, retorna 400.

Os enums trafegam pelo nome, sem diferenciar maiúsculas, e aparecem como enum de strings no OpenAPI.
