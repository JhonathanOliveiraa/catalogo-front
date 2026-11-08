import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import type { ProdutoResponse } from '../../produtos.service';
import { ChipStatus } from '../chip-status/chip-status';

/** Rótulo/valor de todos os campos de `ProdutoResponse` (UX-DR17). Ações ficam na página. */
@Component({
  selector: 'app-painel-detalhe',
  imports: [MatCardModule, ChipStatus, CurrencyPipe, DecimalPipe, DatePipe],
  templateUrl: './painel-detalhe.html',
  styleUrl: './painel-detalhe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelDetalhe {
  readonly produto = input.required<ProdutoResponse>();
}
