import { convertToParamMap } from '@angular/router';
import { consultaParaParams, lerConsulta, paraQueryParams, temFiltroAtivo } from './consulta';

describe('lerConsulta', () => {
  it('URL vazia é a consulta padrão (tudo ausente)', () => {
    expect(lerConsulta(convertToParamMap({}))).toEqual({});
  });

  it('lê todos os parâmetros válidos', () => {
    const consulta = lerConsulta(
      convertToParamMap({
        nome: 'cafeteira',
        status: 'Ativo',
        precoMin: '100',
        precoMax: '250.5',
        ordenarPor: 'Preco',
        direcao: 'Desc',
        page: '3',
        pageSize: '50',
      }),
    );
    expect(consulta).toEqual({
      nome: 'cafeteira',
      status: 'Ativo',
      precoMin: 100,
      precoMax: 250.5,
      ordenarPor: 'Preco',
      direcao: 'Desc',
      page: 3,
      pageSize: 50,
    });
  });

  it('canoniza enums para a grafia da API', () => {
    expect(lerConsulta(convertToParamMap({ status: 'desativado', ordenarPor: 'criadoem', direcao: 'DESC' }))).toEqual({
      status: 'Desativado',
      ordenarPor: 'CriadoEm',
      direcao: 'Desc',
    });
  });

  it('valores padrão ficam ausentes', () => {
    expect(
      lerConsulta(convertToParamMap({ ordenarPor: 'Nome', direcao: 'asc', page: '1', pageSize: '20' })),
    ).toEqual({});
  });

  it('valores inválidos ou fora da faixa caem no padrão', () => {
    expect(
      lerConsulta(
        convertToParamMap({
          nome: '   ',
          status: '1',
          precoMin: '-5',
          precoMax: 'abc',
          ordenarPor: 'Estoque',
          direcao: 'para-cima',
          page: '0',
          pageSize: '101',
        }),
      ),
    ).toEqual({});
    expect(lerConsulta(convertToParamMap({ page: '2.5', pageSize: '0', precoMin: '1,234' }))).toEqual({});
  });

  it('precoMin maior que precoMax descarta o máximo', () => {
    expect(lerConsulta(convertToParamMap({ precoMin: '200', precoMax: '100' }))).toEqual({ precoMin: 200 });
  });
});

describe('paraQueryParams', () => {
  it('mudança de filtro volta page para 1 (null)', () => {
    expect(paraQueryParams({ status: 'Ativo' })).toEqual({ status: 'Ativo', page: null });
  });

  it('mudança só de página mantém a página', () => {
    expect(paraQueryParams({ page: 3 })).toEqual({ page: 3 });
  });

  it('página 1 é padrão e sai da URL', () => {
    expect(paraQueryParams({ page: 1 })).toEqual({ page: null });
  });

  it('valores vazios ou padrão viram null', () => {
    expect(
      paraQueryParams({ nome: '  ', status: undefined, ordenarPor: 'Nome', direcao: 'Asc', pageSize: 20 }),
    ).toEqual({ nome: null, status: null, ordenarPor: null, direcao: null, pageSize: null, page: null });
  });

  it('ordenação volta para a página 1', () => {
    expect(paraQueryParams({ ordenarPor: 'Preco', direcao: 'Desc' })).toEqual({
      ordenarPor: 'Preco',
      direcao: 'Desc',
      page: null,
    });
  });

  it('faixa de preço', () => {
    expect(paraQueryParams({ precoMin: 100, precoMax: undefined })).toEqual({
      precoMin: 100,
      precoMax: null,
      page: null,
    });
  });
});

describe('consultaParaParams e temFiltroAtivo', () => {
  it('só parâmetros com valor', () => {
    expect(consultaParaParams({ nome: 'x', page: 2, ordenarPor: 'Nome' })).toEqual({ nome: 'x', page: 2 });
  });

  it('filtro ativo ignora ordenação e paginação', () => {
    expect(temFiltroAtivo({ ordenarPor: 'Preco', page: 2 })).toBe(false);
    expect(temFiltroAtivo({ precoMax: 10 })).toBe(true);
  });
});
