import { ErroApi, ErroExibivel } from './erro-api';
import { MENSAGENS } from './mensagens';

/**
 * Única tradução de `ErroApi` para texto (AD-4). `title` e `detail` da API passam sem tradução;
 * os textos fixos vêm de `mensagens.ts`.
 */
export function descreverErro(erro: ErroApi): ErroExibivel {
  switch (erro.tipo) {
    case 'rede':
      return { linhas: [MENSAGENS.rede] };
    case 'servidor':
      return { linhas: [MENSAGENS.servidor] };
    case 'validacao': {
      const linhas = Object.values(erro.errors).flat();
      return comTitulo(erro.title, linhas);
    }
    case 'nao-encontrado':
    case 'problema': {
      const linhas = erro.detail ? [erro.detail] : [];
      if (!erro.title && linhas.length === 0) {
        return { linhas: [MENSAGENS.problemaSemDetalhe] };
      }
      return comTitulo(erro.title, linhas);
    }
  }
}

function comTitulo(titulo: string, linhas: string[]): ErroExibivel {
  return titulo ? { titulo, linhas } : { linhas };
}

/** Texto em uma linha (snackbar). */
export function erroEmTexto(exibivel: ErroExibivel): string {
  return [exibivel.titulo, ...exibivel.linhas].filter(Boolean).join(' ');
}
