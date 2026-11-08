import { Injectable, signal } from '@angular/core';
import { Params } from '@angular/router';

/**
 * Parâmetros da última listagem exibida (AD-6). Todo "Voltar para a lista" navega com eles;
 * `location.back()` não é usado. Guarda só parâmetros, nunca produtos.
 */
@Injectable({ providedIn: 'root' })
export class UltimaConsulta {
  private readonly valor = signal<Params>({});
  readonly params = this.valor.asReadonly();

  guardar(params: Params): void {
    this.valor.set({ ...params });
  }
}
