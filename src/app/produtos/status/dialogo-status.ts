import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { ErroApi, comoErroApi } from '../../core/erros/erro-api';
import type { ProdutoResponse } from '../produtos.service';

export interface DadosDialogoStatus {
  produto: ProdutoResponse;
  /** Executa o PATCH; o diálogo mostra o spinner até a resposta. */
  executar: () => Observable<ProdutoResponse>;
}

/** Resultado ao fechar: `undefined` = cancelado. */
export type ResultadoDialogoStatus = { produto: ProdutoResponse } | { erro: ErroApi } | undefined;

/** Diálogo de confirmação de desativar/reativar (UX-DR12). Aberto só por `AlteracaoStatus`. */
@Component({
  selector: 'app-dialogo-status',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dialogo-status.html',
  styleUrl: './dialogo-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoStatus {
  protected readonly dados = inject<DadosDialogoStatus>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<DialogoStatus, ResultadoDialogoStatus>>(MatDialogRef);

  protected readonly desativar = this.dados.produto.status === 'Ativo';
  protected readonly executando = signal(false);

  protected confirmar(): void {
    if (this.executando()) return;
    this.executando.set(true);
    this.ref.disableClose = true;
    this.dados.executar().subscribe({
      next: (produto) => this.ref.close({ produto }),
      error: (erro: unknown) => this.ref.close({ erro: comoErroApi(erro) }),
    });
  }
}
