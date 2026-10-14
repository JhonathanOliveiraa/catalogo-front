---
name: catalogo-front
status: final
sources:
  - _bmad-output/specs/spec-catalogo-front/SPEC.md
  - _bmad-output/specs/spec-catalogo-front/golden-path.md
  - docs/referencia-api/
  - README.md
updated: 2026-10-14
---

# catalogo-front — Experience Spine

## Fundamentos (Foundation)

SPA Angular web responsiva, superfície única, só pt-BR, sem login. Angular Material (M3) faz quase tudo; este documento especifica apenas o delta comportamental sobre os componentes padrão. Visual em `DESIGN.md`. Contrato de dados e erros em `docs/referencia-api/` (`produto.md`, AD-3, AD-4, AD-5); capacidades em `SPEC.md` (CAP-1 a CAP-5 e CAP-8 têm superfície de UI; CAP-6 e CAP-7 são de infraestrutura e não têm tela). Não há mockups nem wireframes; este spine é a referência. Fora de escopo: autenticação, i18n, dark mode, PWA/offline, remoção de produto.

## Arquitetura de informação (Information Architecture)

| Rota / superfície | Chega-se por | Propósito | CAP |
|---|---|---|---|
| `/` | URL raiz | Redireciona para `/produtos` | — |
| `/produtos` — Listagem | Barra superior, raiz, "Voltar para a lista" | Tabela com busca por `nome`, filtros `status` e `precoMin`/`precoMax`, ordenação, paginação, menu ⋮ por linha | CAP-1, CAP-5 |
| `/produtos/novo` — Cadastro | Botão "Cadastrar" (cabeçalho da listagem ou estado vazio) | Formulário de criação → `POST /produtos` | CAP-2, CAP-8 |
| `/produtos/:id` — Detalhe | Link do nome na tabela; após salvar; URL direta | Todos os campos de `ProdutoResponse`; ações Editar e Desativar/Reativar | CAP-3, CAP-5 |
| `/produtos/:id/editar` — Edição | Botão "Editar" no detalhe | Formulário preenchido → `PUT /produtos/{id}` | CAP-4, CAP-8 |
| Diálogo de confirmação | "Desativar"/"Reativar" no detalhe ou no menu ⋮ | Confirma `PATCH /produtos/{id}/status` | CAP-5 |

- **Navegação plana:** sem menu lateral.
- **Rotas desconhecidas:** redirecionam para `/produtos`.
- **Query string:** busca, filtros, ordenação e página ficam refletidos na query string de `/produtos` com os mesmos nomes da API (`nome`, `status`, `precoMin`, `precoMax`, `ordenarPor`, `direcao`, `page`, `pageSize`), para que "Voltar para a lista" e o botão Voltar do navegador restaurem a consulta.
- **Títulos do documento:** por rota, "Produtos", "Cadastrar produto", "{nome}" ou "Editar produto", sempre seguido de " — Catálogo".

## Voz e tom (Voice and Tone)

Direto, impessoal, verbo no infinitivo nos botões, sem exclamação nem emoji. Tom e estética visual em `DESIGN.md`.

| Contexto | Texto exato |
|---|---|
| Título da barra superior | Catálogo de Produtos |
| Títulos de página (h1) | Produtos · Cadastrar produto · Editar produto · (detalhe: o `nome` do produto) |
| Botões | Cadastrar · Salvar · Cancelar · Editar · Desativar · Reativar · Limpar filtros · Tentar novamente · Voltar para a lista |
| Rótulos de campo | Nome · Descrição · Preço (R$) · Estoque |
| Rótulos de filtro | Buscar por nome · Status (opções: Todos, Ativo, Desativado) · Preço mínimo · Preço máximo |
| Colunas | Nome · Preço · Estoque · Status · Criado em |
| Rótulos do detalhe | ID · Descrição · Preço · Estoque · Status · Criado em · Atualizado em; `descricao` nula → "Sem descrição" |
| Chip de status | Ativo · Desativado |
| Snackbar após salvar | Produto salvo |
| Snackbar após mudar status | Produto desativado · Produto reativado |
| Lista vazia (sem filtros) | Nenhum produto cadastrado + botão "Cadastrar" |
| Lista vazia (com filtros) | Nenhum resultado para os filtros + botão "Limpar filtros" |
| Diálogo — desativar | Título "Desativar produto?" · Corpo "“{nome}” continuará visível na listagem, marcado como Desativado. Você pode reativá-lo depois." · Botões "Cancelar" / "Desativar" |
| Diálogo — reativar | Título "Reativar produto?" · Corpo "“{nome}” voltará a ficar Ativo." · Botões "Cancelar" / "Reativar" |
| 404 no detalhe/edição | Produto não encontrado · "Não existe produto com o ID {id}." + botão "Voltar para a lista" |
| Falha de rede (sem resposta) | Não foi possível conectar à API. Verifique a conexão e tente novamente. |
| Erro 5xx | O servidor encontrou um erro. Tente novamente em instantes. |
| Outro ProblemDetails | `title` em negrito + `detail` (texto da API, sem tradução) no alerta geral |
| Erros de campo (cliente) | Nome: "Informe o nome" · "Máximo de 200 caracteres" — Descrição: "Máximo de 2000 caracteres" — Preço: "Informe o preço" · "Informe um valor numérico" · "O preço não pode ser negativo" · "Use no máximo 2 casas decimais" · "Valor máximo: R$ 9.999.999.999,99" — Estoque: "Informe o estoque" · "Use um número inteiro" · "O estoque não pode ser negativo" · "Valor máximo: 2.147.483.647" |
| Erro de faixa no filtro | O preço máximo deve ser maior ou igual ao mínimo |
| Erros de campo (400 da API) | Mensagem vinda em `errors`, exibida como está |

## Padrões de componentes (Component Patterns)

Comportamental. Visual em `DESIGN.md` › Components. Todo componente não listado segue o comportamento padrão do Angular Material.

| Componente | Uso | Regras de comportamento |
|---|---|---|
| Barra superior (`mat-toolbar`) | Todas as rotas | Título é link para `/produtos` (limpa filtros). Sem outras ações. |
| Tabela de produtos (`mat-table` + `mat-sort-header`) | `/produtos` | Detalhada abaixo. |
| Linha desativada | `/produtos` | Produto com `status=Desativado` recebe a classe de linha desativada e o chip "Desativado". Continua navegável e com menu ⋮. |
| Paginador (`mat-paginator`) | `/produtos` | `pageSize` padrão 20, opções 10/20/50/100; `page` da API é base 1 (paginador é base 0 — converter). Mostra total vindo de `total`. Textos pt-BR via `MatPaginatorIntl` ("Itens por página", "1 – 20 de 135", "Próxima página", "Página anterior"). Primeira/última página visíveis. |
| Barra de filtros (`mat-form-field` + `matInput` / `mat-select`) | `/produtos` | Detalhada abaixo. |
| Botões (`mat-flat-button`, `mat-stroked-button`, `mat-button`, `mat-icon-button`) | Todas as rotas | Ação principal da superfície (Cadastrar, Salvar, Desativar/Reativar, confirmação do diálogo) na variante principal; variantes em `DESIGN.md` › Components. Durante a requisição, o botão que a disparou fica desabilitado com spinner. Botões desabilitados nunca são a única indicação de erro. |
| Menu de ações da linha (`mat-menu`) | `/produtos` | Botão ⋮ com `aria-label="Ações para {nome}"`. Um único item conforme o status: "Desativar" (se Ativo) ou "Reativar" (se Desativado). Abre o diálogo de confirmação. |
| Chip de status (`mat-chip`) | Tabela, detalhe | Não interativo, só leitura. Texto sempre presente. |
| Campo de formulário (`mat-form-field` + `matInput`) | Cadastro, edição | Detalhado abaixo. |
| Formulário de produto | Cadastro, edição | Detalhado abaixo. |
| Mapeamento de erros 400 | Cadastro, edição | Cada chave de `errors` é casada com o campo sem diferenciar maiúsculas e ignorando prefixo `$.` (`Nome`, `nome`, `$.nome` → Nome); a mensagem vai para o `mat-error` do campo (via `setErrors({api: msg})`); o erro é limpo quando o campo é editado. Chaves sem campo correspondente → alerta geral. |
| Alerta geral | Topo do formulário, topo do detalhe | `role="alert"`. Mostra 400 sem campo, outros ProblemDetails (`title` + `detail`) e falha de rede/5xx em operações de escrita. Some ao tentar de novo. |
| Painel de detalhe (`mat-card`) | `/produtos/:id` | Lista rótulo/valor de todos os campos de `ProdutoResponse`. Ações: "Editar" (`mat-stroked-button`) e "Desativar"/"Reativar" (`mat-flat-button`). Link "Voltar para a lista". Funciona por URL direta. |
| Diálogo de confirmação (`mat-dialog`) | Detalhe, menu ⋮ | Modal, `autoFocus` no primeiro botão ("Cancelar"); Esc ou clique fora cancela. Ao confirmar: botão mostra spinner e ambos ficam desabilitados até a resposta; sucesso fecha o diálogo; erro fecha o diálogo e mostra snackbar com a mensagem de erro. Foco volta ao elemento que abriu. |
| Snackbar (`mat-snack-bar`) | Global | Sucesso: 4 s, sem ação. Erro ao mudar status (escrita fora de formulário): 6 s, ação "Fechar". Um por vez; o novo substitui o anterior. |
| Indicador de carregamento (`mat-progress-bar` / `mat-progress-spinner`) | Listagem, detalhe, formulários | Ver Padrões de estado. |
| Estado vazio / estado de erro | Listagem, detalhe, edição | Ver Padrões de estado; visual em `DESIGN.md` › Components. |

### Tabela de produtos

- Colunas Nome, Preço, Estoque, Status, Criado em, ⋮.
- Ordenáveis só Nome (`Nome`), Preço (`Preco`), Criado em (`CriadoEm`); padrão `ordenarPor=Nome&direcao=Asc`.
- Clique alterna Asc/Desc (`disableClear`, sem terceiro estado).
- A ordenação é feita no servidor: mudar a ordenação volta para `page=1`.
- O nome é um link (`<a>`) para `/produtos/:id`; a linha em si não é clicável.
- Formatos: preço `R$ 1.234,56`, estoque `1.234`, data `dd/MM/yyyy HH:mm` no fuso do navegador.

### Barra de filtros

- "Buscar por nome": dispara a consulta após 300 ms sem digitar; vazio não envia `nome`.
- "Status": Todos (não envia `status`) / Ativo / Desativado.
- "Preço mínimo"/"Preço máximo": aceitam vírgula e aplicam no blur ou Enter; se `precoMin > precoMax`, erro abaixo de "Preço máximo" e a consulta não é enviada.
- Qualquer mudança de filtro volta para `page=1`.
- "Limpar filtros" aparece quando há filtro ativo e restaura os padrões (mantém a ordenação).
- Só envia parâmetros com valor.

### Campo de formulário

- Validação espelha AD-4:
  - Nome: obrigatório, 1–200, não pode ser só espaços.
  - Descrição: opcional, ≤ 2000 (`mat-hint` contador "n/2000"), `textarea`.
  - Preço: obrigatório, `inputmode="decimal"`, aceita vírgula ou ponto, 0 a 9.999.999.999,99, ≤ 2 casas.
  - Estoque: obrigatório, `inputmode="numeric"`, inteiro 0 a 2.147.483.647.
- O erro aparece no blur ou ao tentar salvar; ao tentar salvar com campos inválidos, o foco vai para o primeiro campo com erro e nada é enviado.
- Descrição vazia é enviada como `null`.

### Formulário de produto

- O formulário de edição abre preenchido com o resultado atual de `GET /produtos/{id}`.
- `PUT` envia sempre `nome`, `descricao`, `preco`, `estoque` (substituição total), então apagar a Descrição a limpa.
- Status não aparece no formulário.
- "Salvar" (`mat-flat-button`, `type=submit`, Enter envia o formulário) e "Cancelar" (volta ao detalhe na edição, à listagem no cadastro).
- Sem aviso de alterações não salvas.
- Sucesso → navega para `/produtos/:id` + snackbar "Produto salvo".

## Padrões de estado (State Patterns)

| Estado | Superfície | Tratamento |
|---|---|---|
| Carregando (primeira carga) | `/produtos` | `mat-progress-bar` indeterminada no topo da tabela; corpo vazio sem mensagem de vazio até a resposta. |
| Carregando (nova consulta) | `/produtos` | Mesma barra; linhas anteriores permanecem visíveis até a resposta; paginador e filtros continuam habilitados (a última consulta vence). |
| Carregando | `/produtos/:id`, `/produtos/:id/editar` | `mat-progress-spinner` centralizado no lugar do painel/formulário. |
| Vazio — sem produtos | `/produtos` | `total = 0` e nenhum filtro ativo: estado vazio com texto e botão de Voz e tom › Lista vazia (sem filtros). |
| Vazio — com filtros | `/produtos` | `total = 0` com filtro ativo: estado vazio com texto e botão de Voz e tom › Lista vazia (com filtros). |
| Página além do fim | `/produtos` | `itens` vazio mas `total > 0` (ex.: URL antiga, produto saiu do filtro): navega automaticamente para a última página válida. Nunca mostra mensagem de vazio nesse caso. |
| Falha de conexão / 5xx na leitura | `/produtos`, `/produtos/:id`, `/produtos/:id/editar` | Estado de erro no lugar do conteúdo com a mensagem de rede ou de 5xx + "Tentar novamente" (repete a mesma requisição). Barra superior, filtros e navegação continuam utilizáveis. |
| 404 | `/produtos/:id`, `/produtos/:id/editar` | Estado de erro com texto e botão de Voz e tom › 404 no detalhe/edição. `:id` não numérico recebe o mesmo tratamento. |
| Salvando | Cadastro, edição | "Salvar" desabilitado com spinner interno, campos desabilitados, `mat-progress-bar` no topo do formulário; impede envio duplo. |
| Erro de campo (cliente) | Cadastro, edição, filtro de preço | `mat-error` sob o campo; envio bloqueado. |
| Erro de campo (400 da API) | Cadastro, edição | `mat-error` no campo mapeado; o resto no alerta geral; formulário reabilitado com os dados digitados. |
| Falha de conexão / 5xx / outro ProblemDetails ao salvar | Cadastro, edição | Alerta geral com a mensagem; dados preservados; "Salvar" volta a funcionar para nova tentativa. 404 no `PUT` mostra o ProblemDetails no alerta geral. |
| Status alterado com sucesso (CAP-5) | Detalhe, listagem | Após `PATCH` com sucesso: no detalhe, a tela é atualizada com o produto retornado (ou novo `GET`); na listagem, a página atual é consultada de novo com os mesmos parâmetros — se um filtro de status fizer o produto sair, ele simplesmente some da página. Nenhum recarregamento manual. |
| Falha ao mudar status | Detalhe, listagem | Diálogo fecha; snackbar de erro com a mensagem correspondente; status exibido não muda. |

## Primitivas de interação (Interaction Primitives)

- **Mouse/toque:** clique em links e botões; nenhuma ação por hover, arraste ou duplo clique.
- **Teclado:** Tab segue a ordem visual (barra superior → filtros → Cadastrar → tabela → paginador). Enter envia o formulário e aplica o filtro de preço. Esc fecha diálogo e menu. Setas navegam itens de `mat-menu` e `mat-select`. Sem atalhos próprios.
- **Confirmação:** só Desativar e Reativar pedem confirmação. Salvar não pede.
- **Feedback:** toda escrita com sucesso gera snackbar; toda falha gera mensagem visível no ponto da ação (campo, alerta geral ou snackbar).
- **Proibido:** rolagem infinita (só paginação), edição inline na tabela, ações só no hover, diálogo sobre diálogo, atualização otimista da UI (o status só muda após a resposta da API).

## Piso de acessibilidade (Accessibility Floor)

Comportamental. Contraste em `DESIGN.md` › Colors (todas as combinações de texto ≥ 4,5:1).

- WCAG 2.1 AA.
- Todo campo e filtro tem `mat-label` visível; botões de ícone têm `aria-label` ("Ações para {nome}", "Voltar para a lista").
- Tudo operável por teclado; foco visível padrão do Material, nunca removido.
- Desativado comunicado por texto (chip "Desativado"), nunca só por cor.
- `mat-sort-header` com `sortActionDescription` ("Ordenar por Nome") e anúncio via `LiveAnnouncer` ("Ordenado por Nome, crescente").
- Erros de campo ligados ao input (`aria-describedby` do `mat-error`); alerta geral com `role="alert"`; snackbar anunciado pelo `LiveAnnouncer` do Material.
- Diálogo prende o foco e o devolve ao gatilho ao fechar; título ligado por `aria-labelledby`.
- Um `h1` por rota e título do documento por rota (ver Arquitetura de informação).
- `lang="pt-BR"` no documento.

## Responsivo e plataforma (Responsive & Platform)

| Largura | Comportamento |
|---|---|
| ≥ 960 px | Filtros em uma linha (wrap). Tabela completa. |
| 600–959 px | Filtros em duas linhas. Tabela completa com rolagem horizontal se necessário. |
| < 600 px | Filtros empilhados, largura total. Tabela dentro de contêiner com rolagem horizontal e coluna Nome fixa (`sticky`). Paginador em modo compacto (Material). Botões de ação do formulário e do detalhe em largura total. |

Navegadores desktop e mobile atuais. Sem PWA, sem offline, sem dark mode.

## Fluxos principais (Key Flows)

### Fluxo 1 — Cadastrar produto (Carla, operadora de catálogo, chegada de um item novo)

1. Carla abre o endereço do catálogo; `/` redireciona para `/produtos`. A barra de progresso aparece e some; a tabela mostra a primeira página ordenada por Nome.
2. Clica em "Cadastrar" no cabeçalho e cai em `/produtos/novo`.
3. Preenche Nome "Cafeteira Italiana 6 xícaras", Preço "189,9", Estoque "12" e deixa Descrição vazia.
4. Digita por engano "189,905" no Preço; ao sair do campo vê "Use no máximo 2 casas decimais" e corrige para "189,90".
5. Pressiona Enter. "Salvar" mostra o spinner; os campos ficam desabilitados.
6. **Clímax:** a API responde 201 e Carla é levada a `/produtos/42`: o detalhe mostra o produto com chip "Ativo", "Sem descrição", "R$ 189,90" e as datas de criação e atualização, enquanto o snackbar diz "Produto salvo". Ela não precisa procurar o item na lista — está diante dele.
7. Clica em "Voltar para a lista"; a cafeteira aparece na consulta.

Falha: ver Fluxo 4.

### Fluxo 2 — Buscar, filtrar e editar (Carla, o fornecedor reajustou preços)

1. Em `/produtos`, Carla digita "cafeteira" em "Buscar por nome"; após uma pausa, a tabela mostra só os itens que contêm o termo, e o paginador informa "1 – 3 de 3".
2. Escolhe Status "Ativo" e preenche Preço mínimo "100"; a consulta volta para a página 1.
3. Clica no cabeçalho "Preço" duas vezes para ordenar do mais caro ao mais barato.
4. Clica no nome "Cafeteira Italiana 6 xícaras" e chega a `/produtos/42`.
5. Clica em "Editar"; `/produtos/42/editar` abre preenchido.
6. Altera o Preço para "209,90" e apaga a Descrição antiga.
7. Clica em "Salvar".
8. **Clímax:** de volta ao detalhe, o preço é "R$ 209,90", a descrição mostra "Sem descrição" e "Atualizado em" tem o horário de agora; snackbar "Produto salvo". Ao clicar em "Voltar para a lista", a busca, os filtros e a ordenação estão exatamente como ela deixou, com o novo preço na linha.
9. Para recomeçar, clica em "Limpar filtros".

### Fluxo 3 — Desativar e reativar (Carla, item fora de linha que volta ao estoque)

1. Na listagem, Carla abre o menu ⋮ da linha "Moedor Manual Clássico" e escolhe "Desativar".
2. O diálogo pergunta "Desativar produto?" e explica que o item continuará visível. O foco está em "Cancelar".
3. Ela clica em "Desativar"; o botão mostra o spinner.
4. **Clímax:** o diálogo fecha, o snackbar diz "Produto desativado" e, sem recarregar nada, a linha fica com fundo acinzentado e o chip "Desativado" — o produto continua ali, apenas marcado.
5. Semanas depois, filtra Status "Desativado", clica no nome do moedor e chega ao detalhe.
6. Clica em "Reativar" e confirma no diálogo "Reativar produto?".
7. O detalhe passa a mostrar o chip "Ativo" e um novo "Atualizado em"; snackbar "Produto reativado". Ao voltar à lista filtrada por "Desativado", o moedor já não aparece.

Falha: a API não responde ao confirmar → o diálogo fecha, snackbar "Não foi possível conectar à API. Verifique a conexão e tente novamente."; o chip continua como estava e Carla pode repetir a ação.

### Fluxo 4 — Recuperar-se de erros (Carla, numa manhã de rede instável)

1. Carla abre `/produtos`; a API está fora do ar. No lugar da tabela aparece "Não foi possível conectar à API. Verifique a conexão e tente novamente." com "Tentar novamente". A barra superior e os filtros continuam respondendo.
2. Após a rede voltar, clica em "Tentar novamente" e a tabela carrega.
3. Cadastra um produto em `/produtos/novo`; a validação do cliente passa, mas a API responde 400 com `errors` contendo `Nome` e uma chave sem campo correspondente.
4. A mensagem da API aparece sob o campo Nome, e a da chave sem campo correspondente, no alerta geral no topo do formulário; tudo o que ela digitou continua lá.
5. **Clímax:** Carla ajusta o Nome, a mensagem do campo some assim que ela edita, e "Salvar" leva ao detalhe com "Produto salvo" — ela recuperou o cadastro sem redigitar nada nem recarregar a página.
6. Mais tarde, abre pelo histórico do navegador um link antigo `/produtos/9999`; vê "Produto não encontrado" e "Não existe produto com o ID 9999.", e volta pela ação "Voltar para a lista".

## Padrões confirmados (Open Questions resolvidas)

Nenhuma questão em aberto. Os padrões propostos como suposições foram confirmados pelo usuário em 2026-10-14; o registro fica em `.memlog.md`.
