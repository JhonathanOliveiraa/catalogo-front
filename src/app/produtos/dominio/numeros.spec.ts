import { casasDecimais, formatarDecimalEntrada, lerDecimal, lerInteiro, paraNumero } from './numeros';

describe('lerDecimal', () => {
  it.each([
    ['189,9', 189.9],
    ['189.9', 189.9],
    ['0', 0],
    [' 12,50 ', 12.5],
    ['-1', -1],
    ['9999999999,99', 9999999999.99],
  ])('lê %s como %s', (texto, esperado) => {
    expect(lerDecimal(texto)).toBe(esperado);
  });

  it.each(['', '   ', 'abc', '1.234,5', '1,2,3', '1e3', ',5', '5,', null, undefined])('rejeita %s', (texto) => {
    expect(lerDecimal(texto)).toBeNull();
  });
});

describe('lerInteiro', () => {
  it('lê inteiros', () => {
    expect(lerInteiro('12')).toBe(12);
    expect(lerInteiro(' 0 ')).toBe(0);
    expect(lerInteiro('-3')).toBe(-3);
  });

  it.each(['', '1,5', '1.0', 'x', null])('rejeita %s', (texto) => {
    expect(lerInteiro(texto)).toBeNull();
  });
});

describe('casasDecimais', () => {
  it('conta as casas depois do separador', () => {
    expect(casasDecimais('189,905')).toBe(3);
    expect(casasDecimais('189.9')).toBe(1);
    expect(casasDecimais('189')).toBe(0);
  });
});

describe('formatarDecimalEntrada', () => {
  it('formata com vírgula e duas casas quando há decimais', () => {
    expect(formatarDecimalEntrada(189.9)).toBe('189,90');
    expect(formatarDecimalEntrada('209.9')).toBe('209,90');
  });

  it('formata inteiros sem casas', () => {
    expect(formatarDecimalEntrada(12)).toBe('12');
    expect(formatarDecimalEntrada(0)).toBe('0');
  });

  it('vazio para ausente', () => {
    expect(formatarDecimalEntrada(undefined)).toBe('');
    expect(formatarDecimalEntrada(null)).toBe('');
  });

  it('faz ida e volta com lerDecimal', () => {
    expect(lerDecimal(formatarDecimalEntrada(1234.56))).toBe(1234.56);
  });
});

describe('paraNumero', () => {
  it('normaliza number | string vindos da API', () => {
    expect(paraNumero(10)).toBe(10);
    expect(paraNumero('10.5')).toBe(10.5);
    expect(paraNumero('')).toBeNull();
    expect(paraNumero('x')).toBeNull();
    expect(paraNumero(Number.NaN)).toBeNull();
  });
});
