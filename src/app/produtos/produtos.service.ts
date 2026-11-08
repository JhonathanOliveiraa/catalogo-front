import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
// Única porta para o cliente gerado (AD-1). O ESLint bloqueia imports de `app/api` fora daqui
// (e de core/config, que só define o rootUrl).
import { Api } from '../api/api';
import { produtosGet, produtosIdGet, produtosIdPut, produtosIdStatusPatch, produtosPost } from '../api/functions';
import type {
  CampoOrdenacao,
  CriarProdutoRequest,
  DirecaoOrdenacao,
  PaginaResponseOfProdutoResponse,
  ProdutoResponse,
  StatusProduto,
} from '../api/models';
import { CAMPO_ORDENACAO } from '../api/models/campo-ordenacao-array';
import { DIRECAO_ORDENACAO } from '../api/models/direcao-ordenacao-array';
import { STATUS_PRODUTO as STATUS_GERADOS } from '../api/models/status-produto-array';
import type { Consulta } from './dominio/consulta';
import { paraNumero } from './dominio/numeros';

// Tipos e enums vêm só do código gerado (AD-2); o resto do app os importa daqui.
export type { CampoOrdenacao, DirecaoOrdenacao, ProdutoResponse, StatusProduto };
export type PaginaProdutos = PaginaResponseOfProdutoResponse;
/** Corpo de POST e PUT (os dois DTOs da API têm os mesmos campos). */
export type DadosProduto = CriarProdutoRequest;

export const STATUS_PRODUTO: readonly StatusProduto[] = STATUS_GERADOS;
export const CAMPOS_ORDENACAO: readonly CampoOrdenacao[] = CAMPO_ORDENACAO;
export const DIRECOES_ORDENACAO: readonly DirecaoOrdenacao[] = DIRECAO_ORDENACAO;

function normalizarProduto(produto: ProdutoResponse): ProdutoResponse {
  return {
    ...produto,
    id: paraNumero(produto.id) ?? 0,
    preco: paraNumero(produto.preco) ?? 0,
    estoque: paraNumero(produto.estoque) ?? 0,
  };
}

function normalizarPagina(pagina: PaginaProdutos): PaginaProdutos {
  return {
    itens: (pagina.itens ?? []).map(normalizarProduto),
    total: paraNumero(pagina.total) ?? 0,
    page: paraNumero(pagina.page) ?? 1,
    pageSize: paraNumero(pagina.pageSize) ?? 20,
  };
}

/**
 * Facade de dados de produto (AD-1, AD-2). Devolve só `Observable` do corpo, já com os
 * números normalizados; não guarda estado nem produtos (AD-6).
 */
@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private readonly api = inject(Api);

  /** `GET /produtos`. A consulta já vem canônica: só parâmetros com valor e diferentes do padrão. */
  listar(consulta: Consulta): Observable<PaginaProdutos> {
    return this.api.invoke(produtosGet, { ...consulta }).pipe(map(normalizarPagina));
  }

  obter(id: number): Observable<ProdutoResponse> {
    return this.api.invoke(produtosIdGet, { id }).pipe(map(normalizarProduto));
  }

  criar(dados: DadosProduto): Observable<ProdutoResponse> {
    return this.api.invoke(produtosPost, { body: dados }).pipe(map(normalizarProduto));
  }

  /** `PUT /produtos/{id}`: substituição total. */
  atualizar(id: number, dados: DadosProduto): Observable<ProdutoResponse> {
    return this.api.invoke(produtosIdPut, { id, body: dados }).pipe(map(normalizarProduto));
  }

  alterarStatus(id: number, status: StatusProduto): Observable<ProdutoResponse> {
    return this.api.invoke(produtosIdStatusPatch, { id, body: { status } }).pipe(map(normalizarProduto));
  }
}
