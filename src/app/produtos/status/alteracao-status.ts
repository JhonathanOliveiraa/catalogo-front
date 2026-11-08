import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { Avisos } from '../../core/avisos/avisos';
import { MENSAGENS } from '../../core/erros/mensagens';
import { ProdutoResponse, ProdutosService } from '../produtos.service';
import { DadosDialogoStatus, DialogoStatus, ResultadoDialogoStatus } from './dialogo-status';

/** Única porta da CAP-5 (AD-7), usada pelo detalhe e pela listagem. */
@Injectable({ providedIn: 'root' })
export class AlteracaoStatus {
  private readonly dialog = inject(MatDialog);
  private readonly produtos = inject(ProdutosService);
  private readonly avisos = inject(Avisos);

  /**
   * Abre o diálogo de confirmação; ao confirmar, faz `PATCH /produtos/{id}/status` com o enum
   * pelo nome. Emite o produto devolvido no sucesso (já avisado) ou `undefined` no
   * cancelamento e no erro (erro já avisado). Nada muda na tela antes da resposta.
   */
  confirmarAlteracaoStatus(produto: ProdutoResponse): Observable<ProdutoResponse | undefined> {
    const novoStatus = produto.status === 'Ativo' ? 'Desativado' : 'Ativo';
    const ref = this.dialog.open<DialogoStatus, DadosDialogoStatus, ResultadoDialogoStatus>(DialogoStatus, {
      data: {
        produto,
        executar: () => this.produtos.alterarStatus(Number(produto.id), novoStatus),
      },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '480px',
    });
    return ref.afterClosed().pipe(
      map((resultado) => {
        if (resultado && 'produto' in resultado) {
          this.avisos.sucesso(
            novoStatus === 'Desativado' ? MENSAGENS.avisos.produtoDesativado : MENSAGENS.avisos.produtoReativado,
          );
          return resultado.produto;
        }
        if (resultado && 'erro' in resultado) {
          this.avisos.erro(resultado.erro);
        }
        return undefined;
      }),
    );
  }
}
