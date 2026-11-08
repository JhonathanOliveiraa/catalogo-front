import { ParamMap, Params } from '@angular/router';
import {
  CAMPOS_ORDENACAO,
  CampoOrdenacao,
  DIRECOES_ORDENACAO,
  DirecaoOrdenacao,
  STATUS_PRODUTO,
  StatusProduto,
} from '../produtos.service';
import { LIMITES_PRODUTO } from './limites';
import { casasDecimais, lerDecimal, lerInteiro } from './numeros';

/**
 * Parâmetros da listagem, com os mesmos nomes e valores da API.
 * Propriedade ausente = valor padrão da API (e ausente da query string).
 */
export interface Consulta {
  nome?: string;
  status?: StatusProduto;
  precoMin?: number;
  precoMax?: number;
  ordenarPor?: CampoOrdenacao;
  direcao?: DirecaoOrdenacao;
  page?: number;
  pageSize?: number;
}

export const PADROES_CONSULTA = {
  ordenarPor: 'Nome' as CampoOrdenacao,
  direcao: 'Asc' as DirecaoOrdenacao,
  page: 1,
  pageSize: 20,
} as const;

const CHAVES: (keyof Consulta)[] = ['nome', 'status', 'precoMin', 'precoMax', 'ordenarPor', 'direcao', 'page', 'pageSize'];

function lerEnum<T extends string>(valor: string | null, opcoes: readonly T[]): T | undefined {
  if (valor == null) {
    return undefined;
  }
  const minusculo = valor.trim().toLowerCase();
  return opcoes.find((opcao) => opcao.toLowerCase() === minusculo);
}

function lerPreco(valor: string | null): number | undefined {
  const numero = lerDecimal(valor);
  const { min, max, casasDecimais: casas } = LIMITES_PRODUTO.preco;
  if (numero === null || numero < min || numero > max || casasDecimais(valor) > casas) {
    return undefined;
  }
  return numero;
}

function lerFaixa(valor: string | null, min: number, max: number): number | undefined {
  const numero = lerInteiro(valor);
  return numero === null || numero < min || numero > max ? undefined : numero;
}

/** Normaliza o que o usuário pediu: tira valores vazios e padrões, para não irem à URL nem à API. */
function canonizar(consulta: Consulta): Consulta {
  const c: Consulta = {};
  const nome = consulta.nome?.trim() ? consulta.nome : undefined;
  if (nome !== undefined) c.nome = nome;
  if (consulta.status !== undefined) c.status = consulta.status;
  if (consulta.precoMin !== undefined) c.precoMin = consulta.precoMin;
  if (consulta.precoMax !== undefined) c.precoMax = consulta.precoMax;
  if (consulta.ordenarPor !== undefined && consulta.ordenarPor !== PADROES_CONSULTA.ordenarPor) c.ordenarPor = consulta.ordenarPor;
  if (consulta.direcao !== undefined && consulta.direcao !== PADROES_CONSULTA.direcao) c.direcao = consulta.direcao;
  if (consulta.page !== undefined && consulta.page !== PADROES_CONSULTA.page) c.page = consulta.page;
  if (consulta.pageSize !== undefined && consulta.pageSize !== PADROES_CONSULTA.pageSize) c.pageSize = consulta.pageSize;
  return c;
}

/**
 * Lê a query string da listagem (AD-6). Enums ficam na grafia da API, números só se válidos;
 * valor inválido ou fora da faixa cai no padrão, e o padrão fica ausente.
 */
export function lerConsulta(params: ParamMap): Consulta {
  const precoMin = lerPreco(params.get('precoMin'));
  let precoMax = lerPreco(params.get('precoMax'));
  if (precoMin !== undefined && precoMax !== undefined && precoMin > precoMax) {
    precoMax = undefined;
  }
  return canonizar({
    nome: params.get('nome') ?? undefined,
    status: lerEnum(params.get('status'), STATUS_PRODUTO),
    precoMin,
    precoMax,
    ordenarPor: lerEnum(params.get('ordenarPor'), CAMPOS_ORDENACAO),
    direcao: lerEnum(params.get('direcao'), DIRECOES_ORDENACAO),
    page: lerFaixa(params.get('page'), 1, 2_147_483_647),
    pageSize: lerFaixa(params.get('pageSize'), LIMITES_PRODUTO.pageSize.min, LIMITES_PRODUTO.pageSize.max),
  });
}

/**
 * Converte uma mudança parcial em query params para `router.navigate` com
 * `queryParamsHandling: 'merge'`: valor padrão ou vazio vira `null` (sai da URL).
 * Qualquer mudança que não seja de página volta `page` para 1.
 */
export function paraQueryParams(parcial: Partial<Consulta>): Params {
  const chaves = Object.keys(parcial) as (keyof Consulta)[];
  const canonica = canonizar(parcial);
  const params: Params = {};
  for (const chave of chaves) {
    params[chave] = canonica[chave] ?? null;
  }
  if (chaves.some((chave) => chave !== 'page')) {
    params['page'] = null;
  }
  return params;
}

/** Query params completos de uma consulta já canônica (para `UltimaConsulta`). */
export function consultaParaParams(consulta: Consulta): Params {
  const canonica = canonizar(consulta);
  const params: Params = {};
  for (const chave of CHAVES) {
    if (canonica[chave] !== undefined) {
      params[chave] = canonica[chave];
    }
  }
  return params;
}

/** Há busca ou filtro ativo (ordenação e paginação não contam). */
export function temFiltroAtivo(consulta: Consulta): boolean {
  return (
    consulta.nome !== undefined ||
    consulta.status !== undefined ||
    consulta.precoMin !== undefined ||
    consulta.precoMax !== undefined
  );
}
