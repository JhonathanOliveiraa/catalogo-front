---
review-of: ../ARCHITECTURE-SPINE.md
lens: adversário (pares de unidades que obedecem a todos os ADs e ainda assim não encaixam)
date: 2026-10-14
companions-lidos:
  - _bmad-output/planning-artifacts/ux-designs/ux-catalogo-front-2026-10-14/EXPERIENCE.md
  - _bmad-output/specs/spec-catalogo-front/SPEC.md
  - docs/referencia-api/ARCHITECTURE-SPINE.md
  - docs/referencia-api/produto.md
---

# Revisão adversária — Architecture Spine do catalogo-front

## Veredito

**Precisa de ajustes antes de quebrar em histórias.** As camadas, o caminho de erro (AD-4), a config em tempo de execução (AD-3/AD-7) e o "sem store" (AD-6) estão bem fechados no nível de *pacote*. Um nível abaixo (página × componente, página × página, Dockerfile × script) há **10 pares** em que dois agentes podem seguir cada AD ao pé da letra e entregar peças que não se encaixam. Quatro são bloqueantes (H1, H2, H3, H4): produzem tela quebrada ou comportamento oposto ao EXPERIENCE sem que nenhum AD seja violado. Os demais são divergências reais, mas de raio menor.

Cada furo abaixo traz: o par, como diverge, por que nenhum AD impede e a regra proposta (texto pronto para colar no spine).

---

## H1 — `dialogo-status` × páginas lista/detalhe: quem faz o `PATCH`, quem mostra o snackbar, o que volta [BLOQUEANTE]

**Par:** história do `componentes/dialogo-status` (agente A) × histórias de `paginas/lista` e `paginas/detalhe` (agentes B e C).

**Divergência:**
- O EXPERIENCE exige que o diálogo **fique aberto com spinner** até a resposta e só então feche. Logo, a chamada precisa acontecer *enquanto o diálogo está aberto*.
- AD-1 diz que componentes em `produtos/componentes` não injetam services de dados. O agente A, obediente, faz um diálogo burro que fecha com `true` ao confirmar. Aí o spinner dentro do diálogo é impossível.
- O agente B (lista) assume o contrário: passa `{ produto }` em `MAT_DIALOG_DATA` e espera que o diálogo faça o `PATCH` e devolva `ProdutoResponse` em `afterClosed()`.
- O agente C (detalhe) passa uma função `executar: () => Observable<ProdutoResponse>` e espera `afterClosed()` com `ProdutoResponse | ErroApi`.
- Snackbar: A mostra "Produto desativado" dentro do diálogo; B também mostra na página → dois snackbars (ou o segundo substitui o primeiro com outro texto). Erro: o EXPERIENCE diz "diálogo fecha e mostra snackbar" — ninguém é dono.
- Pós-sucesso: a lista precisa "reconsultar com os mesmos parâmetros" (AD-6), mas a consulta é derivada de `queryParamMap`; navegar para a mesma URL não reemite. B pode resolver com `onSameUrlNavigation: 'reload'`, C com um signal de recarga — duas mecânicas.

**Por que os ADs não impedem:** AD-1 proíbe o diálogo de chamar o facade, mas não diz como o spinner do EXPERIENCE é atendido; o mapa de capacidades diz só "chamado da lista e do detalhe".

**Regra proposta (novo AD-9 ou item em AD-6):**
> **Fluxo de status.** Uma única função `confirmarAlteracaoStatus(produto: ProdutoResponse): Observable<ProdutoResponse | undefined>` em `produtos/` (não em `componentes/`) é a única porta do CAP-5. Ela abre `DialogoStatus` passando `{ produto, executar: (s) => produtosService.alterarStatus(produto.id, s) }`; o diálogo só chama `executar`, controla o spinner e fecha com `ProdutoResponse` (sucesso) ou `undefined` (cancelado ou erro). A função é **dona dos dois snackbars** (sucesso e erro, via `Avisos` — H2). Lista e detalhe só reagem ao valor: detalhe substitui o produto exibido; lista chama `recarregar()` do seu recurso (H6). Nenhuma página abre `MatDialog` nem snackbar para status.

---

## H2 — Snackbar "Produto salvo": página de formulário × página de detalhe; configuração do snackbar espalhada [BLOQUEANTE]

**Par:** `paginas/formulario` (salva e navega) × `paginas/detalhe` (destino).

**Divergência:**
- Agente do formulário abre o snackbar e depois navega para `/produtos/:id`.
- Agente do detalhe, para "garantir" o feedback, lê `history.state.salvo` (ou `?salvo=1`) e mostra o snackbar ao chegar. Resultado: dois snackbars, ou nenhum se cada um achar que o outro faz.
- Duração e ação (4 s sem ação × 6 s com "Fechar") e "um por vez" ficam a cargo de cada chamada `MatSnackBar.open(...)`: quatro lugares (salvar, desativar, reativar, erro de status) com quatro configurações.
- Texto de erro no snackbar: AD-4 diz que textos fixos vêm de `mensagens.ts`, mas não diz como transformar um `ErroApi` em **uma linha** de snackbar (para `problema`: `title`? `title + detail`? para `validacao` num `PATCH`: a primeira mensagem? `title`?).

**Regra proposta (em AD-4):**
> **Avisos.** `core/avisos` expõe `Avisos.sucesso(texto)` (4 s, sem ação) e `Avisos.erro(erro: ErroApi)` (6 s, "Fechar"); ninguém mais injeta `MatSnackBar`. Quem executou a escrita chama `Avisos` **depois da resposta e antes de navegar**; a página de destino nunca mostra aviso de algo que não executou e não lê estado de navegação para isso. `Avisos.erro` usa `descreverErro` (H3) achatado numa linha (`titulo` + primeira linha).

---

## H3 — Forma do erro exibido: `aplicarErrosApi` × `shared/alerta-geral` × `estado-erro` × snackbar [BLOQUEANTE]

**Par:** `produtos/formulario/aplicarErrosApi` (agente A) × `shared/alerta-geral` (agente B) × página de formulário (agente C).

**Divergência:**
- AD-5 diz que `aplicarErrosApi` "devolve as **chaves** sem campo correspondente para o alerta geral". O alerta precisa de **mensagens**, não de chaves. C precisa recompor `erro.errors[chave]` — ou A devolve mensagens contrariando o texto do AD.
- O diagrama não tem seta de `shared/` para `core/erros`. B, obediente ao AD-1, não pode importar `ErroApi` nem `mensagens.ts`; declara `input<{ titulo?: string; mensagens: string[] }>()`. Outro agente de `estado-erro` declara `input<ErroApi>()` e resolve o texto dentro (violando a seta, ou não). Página passa `ErroApi` para um e objeto plano para o outro → não compila ou duplica a tradução erro→texto em três páginas.
- Para o mesmo `ErroApi` `rede`, a lista mostra o texto via `estado-erro` e o formulário via `alerta-geral`: duas traduções diferentes do mesmo `tipo` se cada uma for escrita localmente.

**Regra proposta (em AD-4):**
> **Uma tradução erro→texto.** `core/erros` exporta `descreverErro(erro: ErroApi): ErroExibivel` com `ErroExibivel = { titulo?: string; linhas: string[] }` (rede/servidor → texto de `mensagens.ts`; problema/nao-encontrado → `title` + `detail`; validacao → todas as mensagens de `errors`). `alerta-geral`, `estado-erro` e `Avisos.erro` recebem só `ErroExibivel` (adicionar seta `shared → core/erros` apenas para esse tipo). `aplicarErrosApi` devolve `string[]` de **mensagens** sem campo, que a página passa como `{ linhas }` ao alerta.

---

## H4 — Config que falha: initializer × `main.ts`/`App` raiz; ninguém renderiza a "tela fatal" [BLOQUEANTE]

**Par:** `core/config` (initializer) × `main.ts` + `app.ts` (raiz).

**Divergência:**
- Agente A faz o `provideAppInitializer` **rejeitar** quando a config falha, presumindo que alguém mostra a tela. Com initializer rejeitado o bootstrap aborta: nenhum componente Angular é criado. O `main.ts` padrão da CLI faz `.catch(err => console.error(err))` → página em branco.
- Agente B faz o initializer **resolver** com um flag, e a raiz continua renderizando `<router-outlet>`: a lista abre e chama a API com `rootUrl` vazio — chamada relativa ao host do front, que devolve `index.html` com 200 (por `try_files`) e quebra o parse. AD-3 ("não faz nenhuma chamada à API") é violado sem que nenhuma unidade tenha errado isoladamente.

**Regra proposta (em AD-3):**
> O initializer **nunca rejeita**. Ele grava o resultado num signal `ConfigEstado` (`ok | falha`) em `core/config`. O componente raiz renderiza `<app-erro-config>` **no lugar** do `<router-outlet>` quando `falha`; nenhuma rota tem resolver/guard que chame a API. `ProdutosService` lança se for chamado sem `rootUrl` definido (defesa em profundidade, coberta por teste).

---

## H5 — Query string da listagem: `componentes/filtros` + `componentes/tabela` × `paginas/lista` × facade

**Par:** filtros/tabela (emitem mudanças) × página lista (deriva consulta e navega) × `ProdutosService.listar`.

**Divergências concretas:**
1. **Remoção de padrões.** A convenção diz "valor padrão ou vazio não aparece na URL nem na requisição", mas não diz *quem* remove. Filtros emitem `{ nome: '' }`; a página repassa a `navigate(..., merge)` → `?nome=` na URL. Ou a página preenche padrões (`page: 1, pageSize: 20, ordenarPor: 'Nome'`) para alimentar o paginador e passa esse objeto ao facade, que presume receber só o não-padrão → requisição com padrões. Cada um acha que o outro limpa.
2. **URL inválida/forasteira.** `?page=abc`, `?pageSize=500`, `?status=ativo` (minúsculo), `?precoMin=50&precoMax=10`, `?precoMin=10,5`. Um agente repassa à API (400 → a lista não tem estado definido para 400 de leitura); outro saneia. `status=ativo` é aceito pela API (case-insensitive) mas não casa com o `mat-select` (`Ativo`) → filtro ativo invisível e "Limpar filtros" aparece sem filtro visível.
3. **Base do paginador e reset de página.** Quem converte base 0→1: tabela ou página? Quem zera `page` quando muda filtro/ordem/`pageSize`? Se a tabela emite `pageIndex` cru e a página também soma 1 → off-by-one.
4. **Correção automática "página além do fim"** sem `replaceUrl: true` empilha histórico: Voltar retorna à página inválida, que redireciona de novo — armadilha no botão Voltar, que o EXPERIENCE promete funcionar.

**Regra proposta (na convenção "Query string", com teste obrigatório já previsto):**
> Um único par de funções puras em `produtos/` é o dono da query string: `lerConsulta(ParamMap): ConsultaListagem` (todos os campos resolvidos com padrão; valor inválido, fora da faixa ou de `pageSize` ∉ {10,20,50,100} vira o padrão; enums canonizados para a grafia exata; `precoMin > precoMax` descarta ambos; decimais lidos com ponto) e `paraQueryParams(mudanca: Partial<ConsultaListagem>): Params` (valor padrão ou vazio vira `null` para o `merge` remover; qualquer mudança que não seja só `page` põe `page: null`). O facade recebe `ConsultaListagem` completa e omite padrões na requisição pela mesma tabela de padrões. Filtros e tabela emitem `Partial<ConsultaListagem>` em base 1. Mudanças do usuário empilham histórico; correções automáticas usam `replaceUrl: true`.

---

## H6 — Forma do facade: Observable × Promise × resource; "última vence" e "Tentar novamente"

**Par:** `ProdutosService` (agente A) × páginas (agentes B, C, D).

**Divergência:**
- O `ng-openapi-gen` 1.x gera tanto services com `Observable` quanto funções + `Api.invoke(...)` que devolve **Promise**. A, seguindo o caminho mais novo, expõe `Promise<ProdutoResponse>`: a lista não consegue cancelar a consulta anterior (AD-6 "última vence" exige cancelamento) e o `rxResource` da página B não se aplica.
- B usa `rxResource({ params: consulta, stream })`; C usa `toSignal(route.paramMap.pipe(switchMap(...)))`; D faz `subscribe` manual com signals de loading. Cada página reinventa loading/erro/retry; "Tentar novamente" (EXPERIENCE: "repete a mesma requisição") vira `reload()` num lugar e re-navegação em outro; com H1 a lista precisa de `recarregar()` explícito.
- Tipo devolvido: `StrictHttpResponse<T>` (variante `$Response`) × corpo `T`.

**Regra proposta (em AD-1):**
> `ProdutosService` expõe só `listar(c: ConsultaListagem)`, `obter(id)`, `criar(dados)`, `atualizar(id, dados)`, `alterarStatus(id, status)`, todos `Observable<T>` frios com o **corpo** tipado do cliente gerado (variantes sem `$Response`) e erro `ErroApi`. Leituras nas páginas usam `rxResource` (estado `isLoading`/`error`/`value` e `reload()` para "Tentar novamente" e recarga pós-status); escritas usam `subscribe` com signal `salvando` local.

---

## H7 — "Voltar para a lista": detalhe/edição/404 × lista; como restaurar a consulta

**Par:** `paginas/detalhe` e estado 404 (agente A) × `paginas/lista` (agente B).

**Divergência:** O EXPERIENCE (Fluxo 2, passo 8) exige que, depois de lista?filtros → detalhe → editar → salvar → detalhe, "Voltar para a lista" mostre "a busca, os filtros e a ordenação exatamente como ela deixou". O detalhe não conhece a query da lista.
- A escreve `routerLink="/produtos"` → perde filtros.
- A' usa `location.back()` → volta para a tela de **edição** (ela está no histórico), e num deep link sai do site.
- AD-6 proíbe signal que duplique filtro *na listagem*, mas não diz onde a última consulta vive para outras páginas.

**Regra proposta (em AD-6):**
> A lista guarda a última `Params` aplicada em `UltimaConsulta` (service em `produtos/`, estado transversal permitido; guarda só parâmetros, nunca produtos). Todo "Voltar para a lista" é `routerLink="/produtos"` com `[queryParams]="ultimaConsulta()"`; o link da barra superior e o fallback `**` vão para `/produtos` sem parâmetros. Ninguém usa `location.back()`. Após salvar, o formulário navega com `replaceUrl: true` para que o Voltar do navegador não reabra a edição.

---

## H8 — Números digitados: helper do formulário × filtro de preço; formato de exibição na edição

**Par:** `produtos/formulario` (helper de conversão, AD-5) × `componentes/filtros` (preço mínimo/máximo).

**Divergência:**
- AD-5 coloca o helper em `produtos/formulario`; o diagrama não tem seta de `componentes/` para `formulario/`. O agente dos filtros, obediente, escreve o próprio parser. Um trata `.` como decimal ("1.234" → 1,234), o outro como milhar ("1.234" → 1234). O mesmo texto digitado vira valores diferentes no cadastro e no filtro.
- Validação de faixa no filtro (≥ 0, máx. 9 999 999 999,99, 2 casas) também não pode usar `LIMITES_PRODUTO` pelo mesmo motivo.
- Na edição, o valor da API (`189.9`) é posto no campo como `"189.9"` por um agente e `"189,90"` por outro; o filtro lido da URL (`precoMin=10.5`) aparece como `10.5` ou `10,5`.

**Regra proposta (em AD-5):**
> `lerDecimal(texto): number | null` e `formatarDecimalEntrada(n): string` vivem em `shared/numeros` (seta `componentes → shared`), assim como `LIMITES_PRODUTO`. Regra única: aceita **um** separador decimal (`,` ou `.`), sem separador de milhar; qualquer outra forma é "Informe um valor numérico". Campos de entrada exibem com vírgula, sem milhar; URL e requisição usam número JSON/ponto.

---

## H9 — `:id` da rota: detalhe × edição × facade

**Par:** `paginas/detalhe` × `paginas/formulario` (modo edição).

**Divergência:** cada página converte `:id` sozinha. `Number('1e3') = 1000`, `Number(' 12') = 12`, `Number('0x10') = 16`, `parseInt('12abc') = 12`, `Number('99999999999')` passa do `int` da API (que devolve 404 do framework por `{id:int}`). O detalhe trata `/produtos/12abc` como 404 local; a edição abre o produto 12. "`:id` não numérico recebe o estado 404" está na convenção, mas sem o parser.

**Regra proposta (na convenção Rotas):**
> Uma única `lerIdProduto(paramMap): number | null` (`/^[1-9]\d{0,9}$/` e ≤ 2 147 483 647). `null` → a página mostra o estado `nao-encontrado` **sem chamar a API**, com o mesmo componente e texto do 404 vindo da API.

---

## H10 — Título do documento: rotas × detalhe × estratégia de título

**Par:** `app.routes.ts` (agente A) × `paginas/detalhe` (agente B).

**Divergência:** a convenção diz "título por rota via `title` da rota", mas o detalhe precisa de "{nome} — Catálogo". A escreve um `ResolveFn` de título que chama o facade → dois `GET` por detalhe e, num 404, o resolver falha e a navegação nem acontece (o estado 404 nunca aparece). B usa `Title.setTitle` na página. Sufixo " — Catálogo": um agente escreve em cada `title` de rota, outro faz `TitleStrategy` que acrescenta → "Produtos — Catálogo — Catálogo".

**Regra proposta (na convenção Rotas):**
> Um `TitleStrategy` em `core/` acrescenta " — Catálogo"; `title` das rotas é o texto puro. O detalhe não tem `title` na rota nem resolver: a página chama `Title` (via o mesmo helper de sufixo) depois de carregar, e usa "Produto não encontrado" no 404. Nenhuma rota tem resolver que chame a API (ver H4).

---

## H11 — Contêiner: `Dockerfile` × `nginx.conf` × `40-config-json.sh`

**Par:** Dockerfile (agente A) × `docker/nginx.conf` (agente B) × script de entrada (agente C).

**Divergências concretas:**
1. **Onde vai o `nginx.conf`.** A copia para `/etc/nginx/nginx.conf` (arquivo principal); B escreve só um bloco `server { }` → nginx não sobe ("server directive is not allowed here"). Ou B escreve o arquivo principal completo e esquece `pid /tmp/nginx.pid` e os `*_temp_path` em `/tmp`, que a imagem unprivileged exige → falha de permissão como UID 101.
2. **Bit de execução.** O repo está em Windows/OneDrive com `core.fileMode=false`; o bit `+x` do script não é confiável no checkout. O `docker-entrypoint.sh` da imagem **ignora com aviso** scripts não executáveis: o contêiner sobe **sem** `config.json` e sem validar `API_BASE_URL`, contrariando AD-7 e CAP-6, sem erro de build. (`.gitattributes` já força LF em `*.sh`, então CRLF não é o problema.)
3. **Template no lugar errado.** Se A copiar `config.json.template` para `/etc/nginx/templates/` (convenção da imagem), o `20-envsubst-on-templates.sh` da própria imagem o processa para `/etc/nginx/conf.d/config.json` e o script de C gera outro em `/tmp/config` — duas fontes; se C esperar o primeiro, o `alias` aponta para o arquivo errado.

**Regra proposta (em AD-7):**
> `docker/nginx.conf` contém **só** o bloco `server` (listen 8080) e é copiado para `/etc/nginx/conf.d/default.conf`; o `nginx.conf` principal da imagem não é substituído. O template vai para `/etc/catalogo/config.json.template` (fora de `/etc/nginx/templates`). O script é copiado com `COPY --chmod=0755`. Um teste de fumaça da imagem (na história do Dockerfile) prova: sem `API_BASE_URL` o contêiner sai ≠ 0; com valor, `GET /config.json` devolve o JSON com `no-store` e `GET /healthz` devolve 200.

---

## Observações menores (sem par incompatível forte, registradas para não se perderem)

- **`ErroApi` não é exaustivo:** 4xx sem corpo ProblemDetails e erro que não é `HttpErrorResponse` (ex.: falha de parse) não têm `tipo`. Sugestão: `problema` também cobre 4xx sem corpo (com `title` = mensagem fixa) e a página trata `unknown` como `servidor`.
- **404 no `PUT`:** o interceptor dá `nao-encontrado`; o EXPERIENCE pede alerta geral (não estado 404). Com H3 resolvido (`descreverErro` + o lugar decidido pela operação, não pelo `tipo`), isso fica explícito; vale uma linha no AD-4: "o lugar de exibição depende da operação (leitura → estado; escrita em formulário → campo/alerta; escrita fora de formulário → snackbar), nunca do `tipo`".
- **SPEC × AD-8:** a SPEC ainda diz que o comando da esteira é `--browsers=ChromeHeadless`; o AD-8 troca o `test-command`. Não é um par de unidades, mas a SPEC deve ser atualizada para não induzir uma história a instalar Karma.

## Resumo das regras propostas

| Furo | Onde entra | Regra em uma linha |
|---|---|---|
| H1 | novo AD / AD-6 | `confirmarAlteracaoStatus()` única porta do CAP-5; diálogo recebe `executar`, fecha com `ProdutoResponse \| undefined`; função dona dos snackbars. |
| H2 | AD-4 | `core/avisos` é o único que usa `MatSnackBar`; quem escreve avisa antes de navegar. |
| H3 | AD-4 | `descreverErro(ErroApi): ErroExibivel`; alerta/estado-erro/aviso recebem só isso; `aplicarErrosApi` devolve mensagens. |
| H4 | AD-3 | initializer nunca rejeita; raiz troca o outlet pela tela fatal; sem resolvers com API. |
| H5 | convenção Query string | `lerConsulta`/`paraQueryParams` únicos; saneamento, canonização, reset de página, `replaceUrl` em correções. |
| H6 | AD-1 | facade só `Observable<corpo>`; leituras com `rxResource` + `reload()`. |
| H7 | AD-6 | `UltimaConsulta` guarda params; "Voltar para a lista" usa-os; nada de `location.back()`. |
| H8 | AD-5 | `shared/numeros` com parser/formatador únicos e `LIMITES_PRODUTO` acessível aos filtros. |
| H9 | convenção Rotas | `lerIdProduto()` único; inválido → 404 local sem chamada. |
| H10 | convenção Rotas | `TitleStrategy` com sufixo; detalhe define título após carregar; sem resolvers. |
| H11 | AD-7 | `nginx.conf` = bloco `server` em `conf.d/default.conf`; template fora de `/etc/nginx/templates`; `COPY --chmod=0755`; teste de fumaça. |
