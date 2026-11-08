import { descreverErro, erroEmTexto } from './descrever-erro';
import { MENSAGENS } from './mensagens';

describe('descreverErro', () => {
  it('rede usa a mensagem fixa do EXPERIENCE', () => {
    expect(descreverErro({ tipo: 'rede' })).toEqual({
      linhas: ['Não foi possível conectar à API. Verifique a conexão e tente novamente.'],
    });
  });

  it('servidor usa a mensagem fixa do EXPERIENCE', () => {
    expect(descreverErro({ tipo: 'servidor' })).toEqual({
      linhas: ['O servidor encontrou um erro. Tente novamente em instantes.'],
    });
  });

  it('problema passa title e detail sem tradução', () => {
    expect(descreverErro({ tipo: 'problema', title: 'Conflict', detail: 'Already exists' })).toEqual({
      titulo: 'Conflict',
      linhas: ['Already exists'],
    });
  });

  it('problema sem title nem detail cai numa mensagem genérica', () => {
    expect(descreverErro({ tipo: 'problema', title: '', detail: '' })).toEqual({
      linhas: [MENSAGENS.problemaSemDetalhe],
    });
  });

  it('nao-encontrado passa title e detail', () => {
    expect(descreverErro({ tipo: 'nao-encontrado', title: 'Not Found', detail: 'Produto 9' })).toEqual({
      titulo: 'Not Found',
      linhas: ['Produto 9'],
    });
  });

  it('validacao usa title e todas as mensagens de errors', () => {
    expect(
      descreverErro({ tipo: 'validacao', title: 'Erros', errors: { Nome: ['a', 'b'], $: ['c'] } }),
    ).toEqual({ titulo: 'Erros', linhas: ['a', 'b', 'c'] });
  });

  it('erroEmTexto junta título e linhas', () => {
    expect(erroEmTexto({ titulo: 'T', linhas: ['a', 'b'] })).toBe('T a b');
    expect(erroEmTexto({ linhas: ['a'] })).toBe('a');
  });
});
