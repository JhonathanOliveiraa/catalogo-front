import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import type { StatusProduto } from '../../produtos.service';

/** Chip de status, só leitura (UX-DR5). O texto é sempre presente: a cor nunca é o único sinal. */
@Component({
  selector: 'app-chip-status',
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-status.html',
  styleUrl: './chip-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipStatus {
  readonly status = input.required<StatusProduto>();
}
