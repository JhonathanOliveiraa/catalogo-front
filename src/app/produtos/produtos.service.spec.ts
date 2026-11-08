import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../api/api-configuration';
import { errosInterceptor } from '../core/erros/erros.interceptor';
import { PaginaProdutos, ProdutoResponse, ProdutosService } from './produtos.service';

const BASE = 'https://api.exemplo.test';

describe('ProdutosService', () => {
  let servico: ProdutosService;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([errosInterceptor])), provideHttpClientTesting()],
    });
    TestBed.inject(ApiConfiguration).rootUrl = BASE;
    servico = TestBed.inject(ProdutosService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('listar envia só os parâmetros com valor e normaliza números', () => {
    let pagina: PaginaProdutos | undefined;
    servico.listar({ nome: 'café', status: 'Ativo', page: 2 }).subscribe((p) => (pagina = p));
    const req = controle.expectOne((r) => r.url === `${BASE}/produtos`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['nome', 'page', 'status']);
    expect(req.request.params.get('status')).toBe('Ativo');
    expect(req.request.withCredentials).toBe(false);
    req.flush({ itens: [{ id: '1', preco: '10.5', estoque: '3' }], total: '1', page: '2', pageSize: '20' });
    expect(pagina?.total).toBe(1);
    expect(pagina?.itens[0].preco).toBe(10.5);
    expect(pagina?.itens[0].estoque).toBe(3);
  });

  it('consulta padrão não envia parâmetro nenhum', () => {
    servico.listar({}).subscribe();
    const req = controle.expectOne(`${BASE}/produtos`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ itens: [], total: 0, page: 1, pageSize: 20 });
  });

  it('criar faz POST com números JSON', () => {
    servico.criar({ nome: 'X', descricao: null, preco: 189.9, estoque: 12 }).subscribe();
    const req = controle.expectOne(`${BASE}/produtos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nome: 'X', descricao: null, preco: 189.9, estoque: 12 });
    req.flush({} as ProdutoResponse, { status: 201, statusText: 'Created' });
  });

  it('atualizar faz PUT em /produtos/{id}', () => {
    servico.atualizar(42, { nome: 'X', descricao: null, preco: 1, estoque: 1 }).subscribe();
    const req = controle.expectOne(`${BASE}/produtos/42`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('alterarStatus faz PATCH com o enum pelo nome', () => {
    servico.alterarStatus(42, 'Desativado').subscribe();
    const req = controle.expectOne(`${BASE}/produtos/42/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'Desativado' });
    req.flush({});
  });

  it('erros chegam como ErroApi', () => {
    let erro: unknown;
    servico.obter(9).subscribe({ error: (e: unknown) => (erro = e) });
    controle.expectOne(`${BASE}/produtos/9`).flush({ title: 'Not Found', detail: 'x' }, { status: 404, statusText: 'Not Found' });
    expect(erro).toEqual({ tipo: 'nao-encontrado', title: 'Not Found', detail: 'x' });
  });
});
