import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Consulta, PADROES_CONSULTA } from '../../dominio/consulta';
import type { CampoOrdenacao, ProdutoResponse } from '../../produtos.service';
import { ChipStatus } from '../chip-status/chip-status';

const ROTULOS_ORDENACAO: Record<CampoOrdenacao, string> = { Nome: 'Nome', Preco: 'Preço', CriadoEm: 'Criado em' };

/**
 * Tabela + paginador da listagem (UX-DR7–UX-DR9, UX-DR11). Só `input()`/`output()`; emite
 * parciais de `Consulta` já em base 1 (a conversão do `mat-paginator`, base 0, fica aqui).
 */
@Component({
  selector: 'app-tabela',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ChipStatus,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './tabela.html',
  styleUrl: './tabela.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tabela {
  private readonly announcer = inject(LiveAnnouncer);

  readonly itens = input.required<ProdutoResponse[]>();
  readonly total = input.required<number>();
  readonly consulta = input.required<Consulta>();

  readonly alterar = output<Partial<Consulta>>();
  readonly alterarStatus = output<ProdutoResponse>();

  protected readonly colunas = ['Nome', 'Preco', 'Estoque', 'Status', 'CriadoEm', 'acoes'];
  protected readonly opcoesPagina = [10, 20, 50, 100];

  protected readonly ordenarPor = computed(() => this.consulta().ordenarPor ?? PADROES_CONSULTA.ordenarPor);
  protected readonly direcao = computed(() => (this.consulta().direcao ?? PADROES_CONSULTA.direcao) === 'Asc' ? 'asc' : 'desc');
  protected readonly pageSize = computed(() => this.consulta().pageSize ?? PADROES_CONSULTA.pageSize);
  protected readonly pageIndex = computed(() => (this.consulta().page ?? PADROES_CONSULTA.page) - 1);

  /** Abaixo de 600 px o paginador fica compacto (sem o seletor de tamanho). */
  protected readonly compacto = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 599.98px)')
      .pipe(map((estado) => estado.matches)),
    { initialValue: false },
  );

  protected ordenar(sort: Sort): void {
    const campo = sort.active as CampoOrdenacao;
    const crescente = sort.direction !== 'desc';
    this.alterar.emit({ ordenarPor: campo, direcao: crescente ? 'Asc' : 'Desc' });
    void this.announcer.announce(`Ordenado por ${ROTULOS_ORDENACAO[campo]}, ${crescente ? 'crescente' : 'decrescente'}`);
  }

  protected paginar(evento: PageEvent): void {
    if (evento.pageSize !== this.pageSize()) {
      this.alterar.emit({ pageSize: evento.pageSize });
    } else {
      this.alterar.emit({ page: evento.pageIndex + 1 });
    }
  }
}
