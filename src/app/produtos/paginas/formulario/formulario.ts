import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { Avisos } from '../../../core/avisos/avisos';
import { descreverErro } from '../../../core/erros/descrever-erro';
import { ErroApi, ErroExibivel, comoErroApi } from '../../../core/erros/erro-api';
import { MENSAGENS } from '../../../core/erros/mensagens';
import { UltimaConsulta } from '../../../core/ultima-consulta';
import { AlertaGeral } from '../../../shared/alerta-geral/alerta-geral';
import { EstadoErro } from '../../../shared/estado-erro/estado-erro';
import { LIMITES_PRODUTO } from '../../dominio/limites';
import { lerIdProduto } from '../../dominio/id-produto';
import { aplicarErrosApi } from '../../formulario/aplicar-erros-api';
import { FormularioProduto, criarFormularioProduto, mensagemErro, montarCorpo } from '../../formulario/formulario-produto';
import { ProdutoResponse, ProdutosService } from '../../produtos.service';

type Carga =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; form: FormularioProduto; id: number | null }
  | { tipo: 'nao-encontrado'; idTexto: string }
  | { tipo: 'erro'; erro: ErroApi };

/** `/produtos/novo` e `/produtos/:id/editar` — cadastro e edição (CAP-2, CAP-4, CAP-8). */
@Component({
  selector: 'app-formulario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    AlertaGeral,
    EstadoErro,
  ],
  templateUrl: './formulario.html',
  styleUrl: './formulario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Formulario {
  private readonly produtos = inject(ProdutosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly avisos = inject(Avisos);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ultimaConsulta = inject(UltimaConsulta);

  protected readonly limiteDescricao = LIMITES_PRODUTO.descricao.max;
  protected readonly mensagemErro = mensagemErro;

  private readonly idTexto = this.route.snapshot.paramMap.get('id');
  protected readonly edicao = this.idTexto !== null;
  private readonly cargas = new Subject<void>();

  protected readonly carga = signal<Carga>({ tipo: 'carregando' });
  protected readonly salvando = signal(false);
  protected readonly alerta = signal<ErroExibivel | null>(null);
  /** Contador "n/2000" da descrição (o FormControl não é signal). */
  protected readonly tamanhoDescricao = signal(0);

  protected readonly naoEncontrado = computed((): ErroExibivel | null => {
    const c = this.carga();
    return c.tipo === 'nao-encontrado'
      ? { titulo: MENSAGENS.naoEncontrado.titulo, linhas: [MENSAGENS.naoEncontrado.detalhe(c.idTexto)] }
      : null;
  });
  protected readonly falha = computed((): ErroExibivel | null => {
    const c = this.carga();
    return c.tipo === 'erro' ? descreverErro(c.erro) : null;
  });

  constructor() {
    this.cargas
      .pipe(
        switchMap(() => this.carregar()),
        takeUntilDestroyed(),
      )
      .subscribe((carga) => {
        if (carga.tipo === 'pronto') {
          this.tamanhoDescricao.set(carga.form.controls.descricao.value.length);
          carga.form.controls.descricao.valueChanges.subscribe((v) => this.tamanhoDescricao.set(v.length));
        }
        this.carga.set(carga);
      });
    this.recarregar();
  }

  recarregar(): void {
    this.carga.set({ tipo: 'carregando' });
    this.cargas.next();
  }

  protected salvar(form: FormularioProduto, id: number | null): void {
    if (this.salvando()) return;
    this.alerta.set(null);
    if (form.invalid) {
      form.markAllAsTouched();
      this.focarPrimeiroInvalido();
      return;
    }
    const corpo = montarCorpo(form);
    this.salvando.set(true);
    form.disable();
    const requisicao: Observable<ProdutoResponse> =
      id === null ? this.produtos.criar(corpo) : this.produtos.atualizar(id, corpo);
    requisicao.subscribe({
      next: (produto) => {
        this.avisos.sucesso(MENSAGENS.avisos.produtoSalvo);
        void this.router.navigate(['/produtos', produto.id], { replaceUrl: true });
      },
      error: (erro: unknown) => {
        this.salvando.set(false);
        form.enable();
        this.mostrarErro(form, comoErroApi(erro));
      },
    });
  }

  protected cancelar(id: number | null): void {
    if (id === null) {
      void this.router.navigate(['/produtos'], { queryParams: this.ultimaConsulta.params() });
    } else {
      void this.router.navigate(['/produtos', id]);
    }
  }

  private carregar(): Observable<Carga> {
    if (!this.edicao) {
      return of<Carga>({ tipo: 'pronto', form: criarFormularioProduto(), id: null });
    }
    const id = lerIdProduto(this.idTexto);
    if (id === null) {
      return of<Carga>({ tipo: 'nao-encontrado', idTexto: this.idTexto ?? '' });
    }
    return this.produtos.obter(id).pipe(
      map((produto): Carga => ({ tipo: 'pronto', form: criarFormularioProduto(produto), id })),
      catchError((erro: unknown) => {
        const erroApi = comoErroApi(erro);
        return of<Carga>(
          erroApi.tipo === 'nao-encontrado'
            ? { tipo: 'nao-encontrado', idTexto: this.idTexto ?? '' }
            : { tipo: 'erro', erro: erroApi },
        );
      }),
    );
  }

  /** 400 → campos + alerta com o que sobrar; demais (inclusive 404 no PUT) → alerta geral (AD-4). */
  private mostrarErro(form: FormularioProduto, erro: ErroApi): void {
    if (erro.tipo === 'validacao') {
      const semCampo = aplicarErrosApi(form, erro);
      if (semCampo.length > 0) {
        this.alerta.set(erro.title ? { titulo: erro.title, linhas: semCampo } : { linhas: semCampo });
      }
      this.focarPrimeiroInvalido();
      return;
    }
    this.alerta.set(descreverErro(erro));
  }

  private focarPrimeiroInvalido(): void {
    setTimeout(() => {
      this.elemento.nativeElement.querySelector<HTMLElement>('input.ng-invalid, textarea.ng-invalid')?.focus();
    });
  }
}
