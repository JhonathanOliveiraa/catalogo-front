import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ErroExibivel } from '../../core/erros/erro-api';

/** Estado de erro no lugar do conteúdo (UX-DR15). O botão é projetado pela página. */
@Component({
  selector: 'app-estado-erro',
  imports: [MatIconModule],
  templateUrl: './estado-erro.html',
  styleUrl: './estado-erro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoErro {
  readonly erro = input.required<ErroExibivel>();
  /** `cloud_off` para falha de rede/5xx, `search_off` para 404. */
  readonly icone = input<'cloud_off' | 'search_off'>('cloud_off');
}
