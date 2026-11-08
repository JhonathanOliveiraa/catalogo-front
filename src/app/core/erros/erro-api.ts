/** Erro de API normalizado pelo interceptor (AD-4). Páginas, facade e helpers só tratam este tipo. */
export type ErroApi =
  | { tipo: 'validacao'; errors: Record<string, string[]>; title: string }
  | { tipo: 'nao-encontrado'; title: string; detail: string }
  | { tipo: 'problema'; title: string; detail: string }
  | { tipo: 'servidor' }
  | { tipo: 'rede' };

/** Erro pronto para exibir: alerta geral, estado de erro e snackbar recebem só isto. */
export interface ErroExibivel {
  titulo?: string;
  linhas: string[];
}

const TIPOS = new Set(['validacao', 'nao-encontrado', 'problema', 'servidor', 'rede']);

export function ehErroApi(valor: unknown): valor is ErroApi {
  return typeof valor === 'object' && valor !== null && TIPOS.has((valor as { tipo?: string }).tipo ?? '');
}

/** Garante um `ErroApi` para qualquer falha de um Observable (erros fora do HTTP viram `servidor`). */
export function comoErroApi(valor: unknown): ErroApi {
  return ehErroApi(valor) ? valor : { tipo: 'servidor' };
}
