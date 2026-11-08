import { aplicarErrosApi } from './aplicar-erros-api';
import { criarFormularioProduto } from './formulario-produto';

describe('aplicarErrosApi', () => {
  it('casa chaves sem diferenciar maiúsculas e ignorando $.', () => {
    const form = criarFormularioProduto();
    const semCampo = aplicarErrosApi(form, {
      tipo: 'validacao',
      title: 'Erros',
      errors: { Nome: ['Nome inválido'], '$.preco': ['Preço inválido'], ESTOQUE: ['a', 'b'] },
    });
    expect(semCampo).toEqual([]);
    expect(form.controls.nome.errors).toEqual({ api: 'Nome inválido' });
    expect(form.controls.preco.errors).toEqual({ api: 'Preço inválido' });
    expect(form.controls.estoque.errors).toEqual({ api: 'a b' });
    expect(form.controls.nome.touched).toBe(true);
  });

  it('devolve as mensagens sem campo correspondente', () => {
    const form = criarFormularioProduto();
    const semCampo = aplicarErrosApi(form, {
      tipo: 'validacao',
      title: 'Erros',
      errors: { nome: ['n'], $: ['JSON inválido'], Outro: ['x', 'y'] },
    });
    expect(semCampo).toEqual(['JSON inválido', 'x', 'y']);
    expect(form.controls.nome.errors).toEqual({ api: 'n' });
  });

  it('o erro da API some quando o campo é editado', () => {
    const form = criarFormularioProduto();
    aplicarErrosApi(form, { tipo: 'validacao', title: '', errors: { Nome: ['Já existe'] } });
    form.controls.nome.setValue('Outro nome');
    expect(form.controls.nome.errors).toBeNull();
  });

  it('ignora erros que não são de validação', () => {
    const form = criarFormularioProduto();
    expect(aplicarErrosApi(form, { tipo: 'rede' })).toEqual([]);
  });
});
