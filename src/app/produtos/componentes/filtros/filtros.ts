import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime } from 'rxjs';
import { MENSAGENS } from '../../../core/erros/mensagens';
import { Consulta, temFiltroAtivo } from '../../dominio/consulta';
import { formatarDecimalEntrada, lerDecimal } from '../../dominio/numeros';
import { validarPreco } from '../../dominio/validacao';
import type { StatusProduto } from '../../produtos.service';

/**
 * Barra de filtros (UX-DR10). Os campos são buffers de edição, sobrescritos sempre que a
 * consulta (URL) muda; emite parciais de `Consulta`.
 */
@Component({
  selector: 'app-filtros',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './filtros.html',
  styleUrl: './filtros.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Filtros {
  readonly consulta = input.required<Consulta>();
  readonly alterar = output<Partial<Consulta>>();
  readonly limpar = output<void>();

  protected readonly nome = new FormControl('', { nonNullable: true });
  protected readonly status = new FormControl<StatusProduto | ''>('', { nonNullable: true });
  protected readonly precoMin = new FormControl('', { nonNullable: true });
  protected readonly precoMax = new FormControl('', { nonNullable: true });

  protected readonly filtroAtivo = computed(() => temFiltroAtivo(this.consulta()));

  constructor() {
    effect(() => {
      const c = this.consulta();
      this.nome.setValue(c.nome ?? '', { emitEvent: false });
      this.status.setValue(c.status ?? '', { emitEvent: false });
      this.precoMin.setValue(formatarDecimalEntrada(c.precoMin), { emitEvent: false });
      this.precoMax.setValue(formatarDecimalEntrada(c.precoMax), { emitEvent: false });
    });

    const destroyRef = inject(DestroyRef);
    this.nome.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(destroyRef)).subscribe((texto) => {
      const nome = texto.trim() ? texto : undefined;
      if (nome !== this.consulta().nome) {
        this.alterar.emit({ nome });
      }
    });
    this.status.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((status) => {
      this.alterar.emit({ status: status || undefined });
    });
  }

  /** Aplica a faixa de preço no blur ou Enter. Com erro, mostra no campo e não consulta. */
  protected aplicarPreco(): void {
    const textoMin = this.precoMin.value;
    const textoMax = this.precoMax.value;
    const erroMin = validarPreco(textoMin, false);
    const erroMax = validarPreco(textoMax, false);
    this.marcarErro(this.precoMin, erroMin ? MENSAGENS.campos.preco[erroMin] : null);
    this.marcarErro(this.precoMax, erroMax ? MENSAGENS.campos.preco[erroMax] : null);
    if (erroMin || erroMax) {
      return;
    }
    const precoMin = lerDecimal(textoMin) ?? undefined;
    const precoMax = lerDecimal(textoMax) ?? undefined;
    if (precoMin !== undefined && precoMax !== undefined && precoMin > precoMax) {
      this.marcarErro(this.precoMax, MENSAGENS.filtros.faixaPreco);
      return;
    }
    const atual = this.consulta();
    if (precoMin !== atual.precoMin || precoMax !== atual.precoMax) {
      this.alterar.emit({ precoMin, precoMax });
    }
  }

  protected mensagem(controle: FormControl<string>): string {
    return (controle.errors?.['msg'] as string | undefined) ?? '';
  }

  private marcarErro(controle: FormControl<string>, msg: string | null): void {
    controle.setErrors(msg ? { msg } : null);
    controle.markAsTouched();
  }
}
