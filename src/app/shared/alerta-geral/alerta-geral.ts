import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ErroExibivel } from '../../core/erros/erro-api';

/** Alerta geral de erro no topo do formulário ou do detalhe (UX-DR14). */
@Component({
  selector: 'app-alerta-geral',
  imports: [MatIconModule],
  templateUrl: './alerta-geral.html',
  styleUrl: './alerta-geral.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertaGeral {
  readonly erro = input.required<ErroExibivel>();
}
