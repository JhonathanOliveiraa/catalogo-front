import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MENSAGENS } from '../../core/erros/mensagens';
import { formatarDecimalEntrada, lerDecimal, lerInteiro } from '../dominio/numeros';
import { validarDescricao, validarEstoque, validarNome, validarPreco } from '../dominio/validacao';
import type { DadosProduto, ProdutoResponse } from '../produtos.service';

/** Erros de validação levam a própria mensagem: `{ msg }` (cliente) ou `{ api }` (400 da API). */
function comMensagem<C extends string>(
  validar: (texto: string) => C | null,
  mensagens: Record<C, string>,
): ValidatorFn {
  return (c: AbstractControl<string>): ValidationErrors | null => {
    const codigo = validar(c.value ?? '');
    return codigo ? { msg: mensagens[codigo] } : null;
  };
}

const VALIDADORES = {
  nome: comMensagem(validarNome, MENSAGENS.campos.nome),
  descricao: comMensagem(validarDescricao, MENSAGENS.campos.descricao),
  preco: comMensagem((t) => validarPreco(t, true), MENSAGENS.campos.preco),
  estoque: comMensagem(validarEstoque, MENSAGENS.campos.estoque),
};

export type FormularioProduto = FormGroup<{
  nome: FormControl<string>;
  descricao: FormControl<string>;
  preco: FormControl<string>;
  estoque: FormControl<string>;
}>;

/**
 * Único formulário de produto, para cadastro e edição (AD-5). `preco` e `estoque` guardam
 * texto; a conversão para número só acontece em `montarCorpo`.
 */
export function criarFormularioProduto(produto?: ProdutoResponse): FormularioProduto {
  return new FormGroup({
    nome: new FormControl(produto?.nome ?? '', { nonNullable: true, validators: VALIDADORES.nome }),
    descricao: new FormControl(produto?.descricao ?? '', { nonNullable: true, validators: VALIDADORES.descricao }),
    preco: new FormControl(produto ? formatarDecimalEntrada(produto.preco) : '', {
      nonNullable: true,
      validators: VALIDADORES.preco,
    }),
    estoque: new FormControl(produto ? formatarDecimalEntrada(produto.estoque) : '', {
      nonNullable: true,
      validators: VALIDADORES.estoque,
    }),
  });
}

/** Corpo de POST/PUT: números JSON e descrição vazia como `null`. Chamar só com o formulário válido. */
export function montarCorpo(form: FormularioProduto): DadosProduto {
  const valor = form.getRawValue();
  return {
    nome: valor.nome,
    descricao: valor.descricao.trim() === '' ? null : valor.descricao,
    preco: lerDecimal(valor.preco) ?? 0,
    estoque: lerInteiro(valor.estoque) ?? 0,
  };
}

/** Mensagem a mostrar no `mat-error` do controle (erro da API tem prioridade). */
export function mensagemErro(controle: AbstractControl): string {
  const erros = controle.errors;
  if (!erros) return '';
  return (erros['api'] as string | undefined) ?? (erros['msg'] as string | undefined) ?? '';
}
