import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErroApi } from './erro-api';

function lerCorpo(corpo: unknown): Record<string, unknown> | null {
  if (typeof corpo === 'string') {
    try {
      return lerCorpo(JSON.parse(corpo));
    } catch {
      return null;
    }
  }
  return typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo) ? (corpo as Record<string, unknown>) : null;
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

function lerErrors(valor: unknown): Record<string, string[]> | null {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    return null;
  }
  const errors: Record<string, string[]> = {};
  for (const [chave, mensagens] of Object.entries(valor)) {
    const lista = Array.isArray(mensagens) ? mensagens : [mensagens];
    errors[chave] = lista.filter((m): m is string => typeof m === 'string');
  }
  return errors;
}

/** Converte uma `HttpErrorResponse` em `ErroApi` (AD-4). */
export function paraErroApi(resposta: HttpErrorResponse): ErroApi {
  if (resposta.status === 0) {
    return { tipo: 'rede' };
  }
  if (resposta.status >= 500) {
    return { tipo: 'servidor' };
  }
  const corpo = lerCorpo(resposta.error);
  const title = texto(corpo?.['title']);
  const detail = texto(corpo?.['detail']);
  if (resposta.status === 400) {
    const errors = lerErrors(corpo?.['errors']);
    if (errors) {
      return { tipo: 'validacao', errors, title };
    }
  }
  if (resposta.status === 404) {
    return { tipo: 'nao-encontrado', title, detail };
  }
  return { tipo: 'problema', title, detail };
}

/**
 * Interceptor único de erros (AD-4): normaliza e relança. Não exibe nada,
 * não faz retry e não navega — quem decide onde mostrar é a página.
 */
export const errosInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((erro: unknown) => throwError(() => (erro instanceof HttpErrorResponse ? paraErroApi(erro) : erro))),
  );
