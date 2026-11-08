import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Avisos } from '../../core/avisos/avisos';
import { ErroApi } from '../../core/erros/erro-api';
import { ProdutoResponse, ProdutosService } from '../produtos.service';
import { AlteracaoStatus } from './alteracao-status';
import { DadosDialogoStatus, ResultadoDialogoStatus } from './dialogo-status';

const ATIVO: ProdutoResponse = {
  id: 7,
  nome: 'Moedor Manual Clássico',
  descricao: null,
  preco: 99.9,
  estoque: 3,
  status: 'Ativo',
  criadoEm: '2026-10-01T10:00:00Z',
  atualizadoEm: '2026-10-01T10:00:00Z',
};
const DESATIVADO: ProdutoResponse = { ...ATIVO, status: 'Desativado', atualizadoEm: '2026-10-20T10:00:00Z' };

/** Diálogo falso: guarda os dados e deixa o teste decidir como ele fecha. */
class DialogFalso {
  dados?: DadosDialogoStatus;
  private readonly fechado = new Subject<ResultadoDialogoStatus>();

  open(_componente: unknown, config: { data: DadosDialogoStatus }) {
    this.dados = config.data;
    return { afterClosed: (): Observable<ResultadoDialogoStatus> => this.fechado };
  }

  /** Simula "Confirmar": roda o callback executar e fecha com o resultado, como o DialogoStatus. */
  confirmar(): void {
    this.dados!.executar().subscribe({
      next: (produto) => this.fechar({ produto }),
      error: (erro: ErroApi) => this.fechar({ erro }),
    });
  }

  fechar(resultado: ResultadoDialogoStatus): void {
    this.fechado.next(resultado);
    this.fechado.complete();
  }
}

describe('AlteracaoStatus.confirmarAlteracaoStatus', () => {
  let dialog: DialogFalso;
  let alterarStatus: ReturnType<typeof vi.fn>;
  let avisos: { sucesso: ReturnType<typeof vi.fn>; erro: ReturnType<typeof vi.fn> };
  let servico: AlteracaoStatus;

  beforeEach(() => {
    dialog = new DialogFalso();
    alterarStatus = vi.fn();
    avisos = { sucesso: vi.fn(), erro: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: ProdutosService, useValue: { alterarStatus } },
        { provide: Avisos, useValue: avisos },
      ],
    });
    servico = TestBed.inject(AlteracaoStatus);
  });

  function resultado(produto: ProdutoResponse, acao: () => void): ProdutoResponse | undefined | 'nada' {
    let emitido: ProdutoResponse | undefined | 'nada' = 'nada';
    servico.confirmarAlteracaoStatus(produto).subscribe((p) => (emitido = p));
    acao();
    return emitido;
  }

  it('sucesso: PATCH com o enum pelo nome, avisa e emite o produto devolvido', () => {
    alterarStatus.mockReturnValue(of(DESATIVADO));
    const emitido = resultado(ATIVO, () => dialog.confirmar());
    expect(alterarStatus).toHaveBeenCalledWith(7, 'Desativado');
    expect(avisos.sucesso).toHaveBeenCalledWith('Produto desativado');
    expect(avisos.erro).not.toHaveBeenCalled();
    expect(emitido).toEqual(DESATIVADO);
  });

  it('reativar envia Ativo e avisa "Produto reativado"', () => {
    alterarStatus.mockReturnValue(of(ATIVO));
    const emitido = resultado(DESATIVADO, () => dialog.confirmar());
    expect(alterarStatus).toHaveBeenCalledWith(7, 'Ativo');
    expect(avisos.sucesso).toHaveBeenCalledWith('Produto reativado');
    expect(emitido).toEqual(ATIVO);
  });

  it('não chama a API antes de confirmar', () => {
    servico.confirmarAlteracaoStatus(ATIVO).subscribe();
    expect(alterarStatus).not.toHaveBeenCalled();
    expect(dialog.dados?.produto).toEqual(ATIVO);
  });

  it('cancelamento: não chama a API, não avisa e emite undefined', () => {
    const emitido = resultado(ATIVO, () => dialog.fechar(undefined));
    expect(alterarStatus).not.toHaveBeenCalled();
    expect(avisos.sucesso).not.toHaveBeenCalled();
    expect(avisos.erro).not.toHaveBeenCalled();
    expect(emitido).toBeUndefined();
  });

  it('erro: avisa o erro e emite undefined', () => {
    const erro: ErroApi = { tipo: 'rede' };
    alterarStatus.mockReturnValue(throwError(() => erro));
    const emitido = resultado(ATIVO, () => dialog.confirmar());
    expect(avisos.erro).toHaveBeenCalledWith(erro);
    expect(avisos.sucesso).not.toHaveBeenCalled();
    expect(emitido).toBeUndefined();
  });
});
