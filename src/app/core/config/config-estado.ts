import { Injectable, signal } from '@angular/core';

export type EstadoConfig = 'carregando' | 'ok' | 'falhou';

/** Estado da configuração em tempo de execução (AD-3). A raiz mostra a tela fatal em `falhou`. */
@Injectable({ providedIn: 'root' })
export class ConfigEstado {
  readonly estado = signal<EstadoConfig>('carregando');
}
