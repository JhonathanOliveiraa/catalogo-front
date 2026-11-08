import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ErroApi } from './erro-api';
import { errosInterceptor } from './erros.interceptor';

describe('errosInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([errosInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  function capturar(responder: (req: ReturnType<HttpTestingController['expectOne']>) => void): unknown {
    let capturado: unknown;
    http.get('/produtos').subscribe({ error: (e: unknown) => (capturado = e) });
    responder(controle.expectOne('/produtos'));
    return capturado;
  }

  it('400 com errors vira validacao', () => {
    const erro = capturar((req) =>
      req.flush(
        { title: 'One or more validation errors occurred.', status: 400, errors: { Nome: ['O nome é obrigatório.'] } },
        { status: 400, statusText: 'Bad Request' },
      ),
    );
    expect(erro).toEqual<ErroApi>({
      tipo: 'validacao',
      title: 'One or more validation errors occurred.',
      errors: { Nome: ['O nome é obrigatório.'] },
    });
  });

  it('400 sem errors vira problema', () => {
    const erro = capturar((req) =>
      req.flush({ title: 'Regra violada', detail: 'Detalhe da regra' }, { status: 400, statusText: 'Bad Request' }),
    );
    expect(erro).toEqual<ErroApi>({ tipo: 'problema', title: 'Regra violada', detail: 'Detalhe da regra' });
  });

  it('404 vira nao-encontrado', () => {
    const erro = capturar((req) =>
      req.flush({ title: 'Not Found', detail: 'Produto 9 não existe' }, { status: 404, statusText: 'Not Found' }),
    );
    expect(erro).toEqual<ErroApi>({ tipo: 'nao-encontrado', title: 'Not Found', detail: 'Produto 9 não existe' });
  });

  it('outro 4xx vira problema', () => {
    const erro = capturar((req) =>
      req.flush({ title: 'Unsupported Media Type', detail: 'x' }, { status: 415, statusText: 'Unsupported Media Type' }),
    );
    expect(erro).toEqual<ErroApi>({ tipo: 'problema', title: 'Unsupported Media Type', detail: 'x' });
  });

  it('4xx com corpo que não é ProblemDetails vira problema com title e detail vazios', () => {
    const erro = capturar((req) => req.flush('<html>proxy</html>', { status: 409, statusText: 'Conflict' }));
    expect(erro).toEqual<ErroApi>({ tipo: 'problema', title: '', detail: '' });
  });

  it('ProblemDetails como texto JSON também é lido', () => {
    const erro = capturar((req) =>
      req.flush(JSON.stringify({ title: 'T', errors: { preco: ['inválido'] } }), { status: 400, statusText: 'Bad Request' }),
    );
    expect(erro).toEqual<ErroApi>({ tipo: 'validacao', title: 'T', errors: { preco: ['inválido'] } });
  });

  it('5xx vira servidor', () => {
    const erro = capturar((req) => req.flush({ title: 'boom' }, { status: 503, statusText: 'Service Unavailable' }));
    expect(erro).toEqual<ErroApi>({ tipo: 'servidor' });
  });

  it('status 0 vira rede', () => {
    const erro = capturar((req) => req.error(new ProgressEvent('error')));
    expect(erro).toEqual<ErroApi>({ tipo: 'rede' });
  });

  it('não altera respostas de sucesso', () => {
    let corpo: unknown;
    http.get('/produtos').subscribe((c) => (corpo = c));
    controle.expectOne('/produtos').flush({ ok: true });
    expect(corpo).toEqual({ ok: true });
  });
});
