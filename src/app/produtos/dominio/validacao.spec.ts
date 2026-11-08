import { LIMITES_PRODUTO } from './limites';
import { validarDescricao, validarEstoque, validarNome, validarPreco } from './validacao';

describe('LIMITES_PRODUTO', () => {
  it('espelha o AD-4 da API', () => {
    expect(LIMITES_PRODUTO).toEqual({
      nome: { min: 1, max: 200 },
      descricao: { max: 2000 },
      preco: { min: 0, max: 9999999999.99, casasDecimais: 2 },
      estoque: { min: 0, max: 2147483647 },
      pageSize: { min: 1, max: 100 },
    });
  });
});

describe('validarNome', () => {
  it('exige nome não vazio e não só espaços', () => {
    expect(validarNome('')).toBe('obrigatorio');
    expect(validarNome('   ')).toBe('obrigatorio');
    expect(validarNome('a')).toBeNull();
  });

  it('aceita 200 e rejeita 201 caracteres', () => {
    expect(validarNome('x'.repeat(200))).toBeNull();
    expect(validarNome('x'.repeat(201))).toBe('maximo');
  });
});

describe('validarDescricao', () => {
  it('aceita até 2000 caracteres', () => {
    expect(validarDescricao('')).toBeNull();
    expect(validarDescricao('x'.repeat(2000))).toBeNull();
    expect(validarDescricao('x'.repeat(2001))).toBe('maximo');
  });
});

describe('validarPreco', () => {
  it.each([
    ['', true, 'obrigatorio'],
    ['', false, null],
    ['abc', true, 'numerico'],
    ['-1', true, 'negativo'],
    ['189,905', true, 'casasDecimais'],
    ['10000000000', true, 'maximo'],
    ['9999999999,99', true, null],
    ['0', true, null],
    ['189,90', true, null],
  ] as const)('%s (obrigatório=%s) → %s', (texto, obrigatorio, esperado) => {
    expect(validarPreco(texto, obrigatorio)).toBe(esperado);
  });
});

describe('validarEstoque', () => {
  it.each([
    ['', 'obrigatorio'],
    ['1,5', 'inteiro'],
    ['abc', 'inteiro'],
    ['-1', 'negativo'],
    ['2147483648', 'maximo'],
    ['2147483647', null],
    ['0', null],
  ] as const)('%s → %s', (texto, esperado) => {
    expect(validarEstoque(texto)).toBe(esperado);
  });
});
