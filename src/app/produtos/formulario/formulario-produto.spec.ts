import { ProdutoResponse } from '../produtos.service';
import { criarFormularioProduto, mensagemErro, montarCorpo } from './formulario-produto';

const PRODUTO: ProdutoResponse = {
  id: 42,
  nome: 'Cafeteira Italiana 6 xícaras',
  descricao: 'Alumínio',
  preco: 189.9,
  estoque: 12,
  status: 'Ativo',
  criadoEm: '2026-10-14T12:00:00Z',
  atualizadoEm: '2026-10-14T12:00:00Z',
};

describe('criarFormularioProduto', () => {
  it('cadastro começa vazio e inválido', () => {
    const form = criarFormularioProduto();
    expect(form.getRawValue()).toEqual({ nome: '', descricao: '', preco: '', estoque: '' });
    expect(form.invalid).toBe(true);
  });

  it('edição abre preenchida, com números formatados como texto', () => {
    const form = criarFormularioProduto(PRODUTO);
    expect(form.getRawValue()).toEqual({ nome: PRODUTO.nome, descricao: 'Alumínio', preco: '189,90', estoque: '12' });
    expect(form.valid).toBe(true);
  });

  it('mostra a microcopy exata dos erros de campo', () => {
    const form = criarFormularioProduto(PRODUTO);
    form.controls.preco.setValue('189,905');
    expect(mensagemErro(form.controls.preco)).toBe('Use no máximo 2 casas decimais');
    form.controls.preco.setValue('');
    expect(mensagemErro(form.controls.preco)).toBe('Informe o preço');
    form.controls.estoque.setValue('1,5');
    expect(mensagemErro(form.controls.estoque)).toBe('Use um número inteiro');
    form.controls.estoque.setValue('2147483648');
    expect(mensagemErro(form.controls.estoque)).toBe('Valor máximo: 2.147.483.647');
    form.controls.nome.setValue('   ');
    expect(mensagemErro(form.controls.nome)).toBe('Informe o nome');
    form.controls.descricao.setValue('x'.repeat(2001));
    expect(mensagemErro(form.controls.descricao)).toBe('Máximo de 2000 caracteres');
  });
});

describe('montarCorpo', () => {
  it('converte números e envia descrição vazia como null', () => {
    const form = criarFormularioProduto(PRODUTO);
    form.controls.preco.setValue('209,90');
    form.controls.descricao.setValue('');
    expect(montarCorpo(form)).toEqual({ nome: PRODUTO.nome, descricao: null, preco: 209.9, estoque: 12 });
  });

  it('mantém a descrição preenchida', () => {
    const form = criarFormularioProduto(PRODUTO);
    expect(montarCorpo(form).descricao).toBe('Alumínio');
  });
});
