import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { descreverErro } from '../../../core/erros/descrever-erro';
import { ErroApi, comoErroApi } from '../../../core/erros/erro-api';
import { UltimaConsulta } from '../../../core/ultima-consulta';
import { EstadoErro } from '../../../shared/estado-erro/estado-erro';
import { EstadoVazio } from '../../../shared/estado-vazio/estado-vazio';
import { Filtros } from '../../componentes/filtros/filtros';
import { Tabela } from '../../componentes/tabela/tabela';
import { Consulta, PADROES_CONSULTA, consultaParaParams, lerConsulta, paraQueryParams, temFiltroAtivo } from '../../dominio/consulta';
import { PaginaProdutos, ProdutoResponse, ProdutosService } from '../../produtos.service';
import { AlteracaoStatus } from '../../status/alteracao-status';

type Resultado = { pagina: PaginaProdutos; consulta: Consulta } | { erro: ErroApi };

/** `/produtos` — listagem com busca, filtros, ordenação e paginação (CAP-1, CAP-5). */
@Component({
  selector: 'app-lista',
  imports: [RouterLink, MatButtonModule, MatProgressBarModule, Filtros, Tabela, EstadoVazio, EstadoErro],
  templateUrl: './lista.html',
  styleUrl: './lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lista {
  private readonly produtos = inject(ProdutosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly ultimaConsulta = inject(UltimaConsulta);
  private readonly alteracaoStatus = inject(AlteracaoStatus);

  private readonly consultas = new Subject<Consulta>();

  protected readonly consulta = signal<Consulta>({});
  protected readonly carregando = signal(true);
  protected readonly pagina = signal<PaginaProdutos | null>(null);
  protected readonly erro = signal<ErroApi | null>(null);

  protected readonly erroExibivel = computed(() => {
    const erro = this.erro();
    return erro ? descreverErro(erro) : null;
  });
  protected readonly vazio = computed(() => {
    const pagina = this.pagina();
    return !this.carregando() && pagina !== null && Number(pagina.total) === 0;
  });
  protected readonly comFiltro = computed(() => temFiltroAtivo(this.consulta()));

  constructor() {
    // A consulta nova cancela a anterior: a última vence (AD-6).
    this.consultas
      .pipe(
        switchMap((consulta) =>
          this.produtos.listar(consulta).pipe(
            map((pagina): Resultado => ({ pagina, consulta })),
            catchError((erro: unknown) => of<Resultado>({ erro: comoErroApi(erro) })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => this.receber(resultado));

    this.route.queryParamMap.pipe(map(lerConsulta), takeUntilDestroyed()).subscribe((consulta) => {
      this.consulta.set(consulta);
      this.ultimaConsulta.guardar(consultaParaParams(consulta));
      this.consultar(consulta);
    });
  }

  /** Repete a mesma consulta ("Tentar novamente", depois de mudar status). */
  recarregar(): void {
    this.consultar(this.consulta());
  }

  protected alterar(parcial: Partial<Consulta>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: paraQueryParams(parcial),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected limparFiltros(): void {
    this.alterar({ nome: undefined, status: undefined, precoMin: undefined, precoMax: undefined });
  }

  protected alterarStatus(produto: ProdutoResponse): void {
    this.alteracaoStatus.confirmarAlteracaoStatus(produto).subscribe((alterado) => {
      if (alterado) {
        this.recarregar();
      }
    });
  }

  private consultar(consulta: Consulta): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.consultas.next(consulta);
  }

  private receber(resultado: Resultado): void {
    this.carregando.set(false);
    if ('erro' in resultado) {
      this.erro.set(resultado.erro);
      return;
    }
    const { pagina, consulta } = resultado;
    // Página além do fim: vai para a última página válida, sem mostrar vazio.
    if (pagina.itens.length === 0 && Number(pagina.total) > 0) {
      const pageSize = consulta.pageSize ?? PADROES_CONSULTA.pageSize;
      this.carregando.set(true);
      this.alterar({ page: Math.max(1, Math.ceil(Number(pagina.total) / pageSize)) });
      return;
    }
    this.pagina.set(pagina);
  }
}
