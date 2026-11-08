import { lerIdProduto } from './id-produto';

describe('lerIdProduto', () => {
  it('aceita inteiro positivo', () => {
    expect(lerIdProduto('42')).toBe(42);
    expect(lerIdProduto('1')).toBe(1);
    expect(lerIdProduto('2147483647')).toBe(2147483647);
  });

  it.each(['abc', '0', '-1', '1.5', '', ' 4', '4 ', '1e3', '2147483648', null, undefined])('rejeita %s', (valor) => {
    expect(lerIdProduto(valor)).toBeNull();
  });
});
