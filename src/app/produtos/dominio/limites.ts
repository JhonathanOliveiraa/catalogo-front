/**
 * Única cópia, no front, dos limites do AD-4 da API (docs/referencia-api/ARCHITECTURE-SPINE.md).
 * Formulário e filtros validam a partir daqui; a API continua sendo a fonte da verdade.
 */
export const LIMITES_PRODUTO = {
  nome: { min: 1, max: 200 },
  descricao: { max: 2000 },
  preco: { min: 0, max: 9_999_999_999.99, casasDecimais: 2 },
  estoque: { min: 0, max: 2_147_483_647 },
  pageSize: { min: 1, max: 100 },
} as const;
