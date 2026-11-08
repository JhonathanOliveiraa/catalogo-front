import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { descreverErro, erroEmTexto } from '../erros/descrever-erro';
import { ErroApi } from '../erros/erro-api';
import { MENSAGENS } from '../erros/mensagens';

/**
 * Único dono do `MatSnackBar` (AD-7). Um snackbar por vez: o novo substitui o anterior.
 * Quem executa a escrita avisa depois da resposta e antes de navegar.
 */
@Injectable({ providedIn: 'root' })
export class Avisos {
  private readonly snackBar = inject(MatSnackBar);

  sucesso(texto: string): void {
    this.snackBar.open(texto, undefined, { duration: 4000 });
  }

  erro(erro: ErroApi): void {
    this.snackBar.open(erroEmTexto(descreverErro(erro)), MENSAGENS.avisos.fechar, { duration: 6000 });
  }
}
