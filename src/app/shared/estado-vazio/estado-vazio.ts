import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Estado vazio da listagem (UX-DR15). O botão é projetado pela página. */
@Component({
  selector: 'app-estado-vazio',
  imports: [MatIconModule],
  templateUrl: './estado-vazio.html',
  styleUrl: './estado-vazio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoVazio {
  readonly mensagem = input.required<string>();
}
