import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { descreverErro } from '../../../core/erros/descrever-erro';
import { ErroApi, ErroExibivel, comoErroApi } from '../../../core/erros/erro-api';
import { MENSAGENS } from '../../../core/erros/mensagens';
import { TituloCatalogo } from '../../../core/titulo';
import { UltimaConsulta } from '../../../core/ultima-consulta';
import { EstadoErro } from '../../../shared/estado-erro/estado-erro';
import { PainelDetalhe } from '../../componentes/painel-detalhe/painel-detalhe';
import { lerIdProduto } from '../../dominio/id-produto';
import { ProdutoResponse, ProdutosService } from '../../produtos.service';
import { AlteracaoStatus } from '../../status/alteracao-status';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; produto: ProdutoResponse }
  | { tipo: 'nao-encontrado'; idTexto: string }
  | { tipo: 'erro'; erro: ErroApi };

/** `/produtos/:id` — detalhe, também por link direto (CAP-3, CAP-5). */
@Component({
  selector: 'app-detalhe',
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule, PainelDetalhe, EstadoErro],
  templateUrl: './detalhe.html',
  styleUrl: './detalhe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detalhe {
  private readonly produtos = inject(ProdutosService);
  private readonly route = inject(ActivatedRoute);
  private readonly titulo = inject(TituloCatalogo);
  private readonly alteracaoStatus = inject(AlteracaoStatus);
  protected readonly ultimaConsulta = inject(UltimaConsulta);

  private readonly ids = new Subject<string | null>();
  private idTexto: string | null = null;

  protected readonly estado = signal<Estado>({ tipo: 'carregando' });
  protected readonly alterandoStatus = signal(false);

  protected readonly naoEncontrado = computed((): ErroExibivel | null => {
    const e = this.estado();
    return e.tipo === 'nao-encontrado'
      ? { titulo: MENSAGENS.naoEncontrado.titulo, linhas: [MENSAGENS.naoEncontrado.detalhe(e.idTexto)] }
      : null;
  });
  protected readonly falha = computed((): ErroExibivel | null => {
    const e = this.estado();
    return e.tipo === 'erro' ? descreverErro(e.erro) : null;
  });

  constructor() {
    this.ids
      .pipe(
        switchMap((idTexto) => {
          const id = lerIdProduto(idTexto);
          if (id === null) {
            return of<Estado>({ tipo: 'nao-encontrado', idTexto: idTexto ?? '' });
          }
          return this.produtos.obter(id).pipe(
            map((produto): Estado => ({ tipo: 'ok', produto })),
            catchError((erro: unknown) => {
              const erroApi = comoErroApi(erro);
              return of<Estado>(
                erroApi.tipo === 'nao-encontrado'
                  ? { tipo: 'nao-encontrado', idTexto: idTexto ?? '' }
                  : { tipo: 'erro', erro: erroApi },
              );
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((estado) => this.exibir(estado));

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.idTexto = params.get('id');
      this.recarregar();
    });
  }

  recarregar(): void {
    this.estado.set({ tipo: 'carregando' });
    this.ids.next(this.idTexto);
  }

  protected alterarStatus(produto: ProdutoResponse): void {
    this.alterandoStatus.set(true);
    this.alteracaoStatus.confirmarAlteracaoStatus(produto).subscribe((alterado) => {
      this.alterandoStatus.set(false);
      if (alterado) {
        this.exibir({ tipo: 'ok', produto: alterado });
      }
    });
  }

  private exibir(estado: Estado): void {
    this.estado.set(estado);
    if (estado.tipo === 'ok') {
      this.titulo.definir(estado.produto.nome);
    }
  }
}
