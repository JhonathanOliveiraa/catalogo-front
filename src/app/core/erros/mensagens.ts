/**
 * Textos fixos de erro e de aviso, com a microcopy exata do EXPERIENCE (UX-DR25).
 * Os demais textos de tela ficam nos templates.
 */
export const MENSAGENS = {
  rede: 'Não foi possível conectar à API. Verifique a conexão e tente novamente.',
  servidor: 'O servidor encontrou um erro. Tente novamente em instantes.',
  configFalhou:
    'Não foi possível carregar a configuração da aplicação. Tente recarregar a página. Se o problema continuar, contate o administrador.',
  /** Fallback para um 4xx sem corpo ProblemDetails (não previsto no EXPERIENCE). */
  problemaSemDetalhe: 'A API recusou a operação.',

  naoEncontrado: {
    titulo: 'Produto não encontrado',
    detalhe: (id: string | number) => `Não existe produto com o ID ${id}.`,
  },

  avisos: {
    produtoSalvo: 'Produto salvo',
    produtoDesativado: 'Produto desativado',
    produtoReativado: 'Produto reativado',
    fechar: 'Fechar',
  },

  campos: {
    nome: {
      obrigatorio: 'Informe o nome',
      maximo: 'Máximo de 200 caracteres',
    },
    descricao: {
      maximo: 'Máximo de 2000 caracteres',
    },
    preco: {
      obrigatorio: 'Informe o preço',
      numerico: 'Informe um valor numérico',
      negativo: 'O preço não pode ser negativo',
      casasDecimais: 'Use no máximo 2 casas decimais',
      maximo: 'Valor máximo: R$ 9.999.999.999,99',
    },
    estoque: {
      obrigatorio: 'Informe o estoque',
      inteiro: 'Use um número inteiro',
      negativo: 'O estoque não pode ser negativo',
      maximo: 'Valor máximo: 2.147.483.647',
    },
  },

  filtros: {
    faixaPreco: 'O preço máximo deve ser maior ou igual ao mínimo',
  },
} as const;
