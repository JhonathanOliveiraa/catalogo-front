import { LIMITES_PRODUTO } from './limites';
import { casasDecimais, lerDecimal, lerInteiro } from './numeros';

/** Códigos de erro de campo; as mensagens ficam em `core/erros/mensagens.ts` (mesmas chaves). */
export type ErroNome = 'obrigatorio' | 'maximo';
export type ErroDescricao = 'maximo';
export type ErroPreco = 'obrigatorio' | 'numerico' | 'negativo' | 'casasDecimais' | 'maximo';
export type ErroEstoque = 'obrigatorio' | 'inteiro' | 'negativo' | 'maximo';

export function validarNome(texto: string): ErroNome | null {
  if (texto.trim().length < LIMITES_PRODUTO.nome.min) return 'obrigatorio';
  if (texto.length > LIMITES_PRODUTO.nome.max) return 'maximo';
  return null;
}

export function validarDescricao(texto: string): ErroDescricao | null {
  return texto.length > LIMITES_PRODUTO.descricao.max ? 'maximo' : null;
}

/** Preço digitado (formulário e filtros de faixa). Vazio só é erro se obrigatório. */
export function validarPreco(texto: string, obrigatorio: boolean): ErroPreco | null {
  if (texto.trim() === '') return obrigatorio ? 'obrigatorio' : null;
  const valor = lerDecimal(texto);
  if (valor === null) return 'numerico';
  if (valor < LIMITES_PRODUTO.preco.min) return 'negativo';
  if (casasDecimais(texto) > LIMITES_PRODUTO.preco.casasDecimais) return 'casasDecimais';
  if (valor > LIMITES_PRODUTO.preco.max) return 'maximo';
  return null;
}

export function validarEstoque(texto: string): ErroEstoque | null {
  if (texto.trim() === '') return 'obrigatorio';
  const valor = lerInteiro(texto);
  if (valor === null) return 'inteiro';
  if (valor < LIMITES_PRODUTO.estoque.min) return 'negativo';
  if (valor > LIMITES_PRODUTO.estoque.max) return 'maximo';
  return null;
}
