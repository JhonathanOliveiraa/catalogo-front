/**
 * Único conversor entre texto digitado e número (AD-5), usado por filtros e formulário.
 * Aceita um único separador decimal, vírgula ou ponto ("189,9", "189.9"). Separador de
 * milhar não é aceito: "1.234,5" é inválido, sempre do mesmo jeito em qualquer tela.
 */
const DECIMAL = /^-?\d+(?:[.,]\d+)?$/;
const INTEIRO = /^-?\d+$/;

/** Converte texto em número decimal; `null` se o texto não for um número. */
export function lerDecimal(texto: string | null | undefined): number | null {
  const limpo = (texto ?? '').trim();
  if (!DECIMAL.test(limpo)) {
    return null;
  }
  return Number(limpo.replace(',', '.'));
}

/** Converte texto em inteiro; `null` se o texto não for um inteiro. */
export function lerInteiro(texto: string | null | undefined): number | null {
  const limpo = (texto ?? '').trim();
  if (!INTEIRO.test(limpo)) {
    return null;
  }
  return Number(limpo);
}

/** Quantidade de casas decimais digitadas (0 se não houver separador). */
export function casasDecimais(texto: string | null | undefined): number {
  const limpo = (texto ?? '').trim();
  const separador = limpo.search(/[.,]/);
  return separador < 0 ? 0 : limpo.length - separador - 1;
}

/** Formata um número para preencher um campo de texto: inteiro sem casas, decimal com 2 casas e vírgula. */
export function formatarDecimalEntrada(valor: number | string | null | undefined): string {
  const numero = paraNumero(valor);
  if (numero === null) {
    return '';
  }
  return Number.isInteger(numero) ? String(numero) : numero.toFixed(2).replace('.', ',');
}

/**
 * Normaliza um número vindo da API. O OpenAPI do .NET 10 tipa números como
 * `number | string`; na leitura o front sempre trabalha com `number` (AD-2).
 */
export function paraNumero(valor: number | string | null | undefined): number | null {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }
  if (typeof valor === 'string' && valor.trim() !== '') {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
}
