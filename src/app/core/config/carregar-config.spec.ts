import { ApiConfiguration } from '../../api/api-configuration';
import { carregarConfig } from './carregar-config';
import { ConfigEstado } from './config-estado';

function resposta(corpo: string, status = 200): Response {
  return new Response(corpo, { status, headers: { 'Content-Type': 'application/json' } });
}

describe('carregarConfig', () => {
  let estado: ConfigEstado;
  let apiConfig: ApiConfiguration;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    estado = new ConfigEstado();
    apiConfig = new ApiConfiguration();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('com config válida define o rootUrl e fica ok', async () => {
    fetchMock.mockResolvedValue(resposta('{"apiBaseUrl":"https://api.exemplo.test"}'));
    await carregarConfig(estado, apiConfig);
    expect(fetchMock).toHaveBeenCalledWith('/config.json', { cache: 'no-store' });
    expect(apiConfig.rootUrl).toBe('https://api.exemplo.test');
    expect(estado.estado()).toBe('ok');
  });

  it('remove barra final do apiBaseUrl', async () => {
    fetchMock.mockResolvedValue(resposta('{"apiBaseUrl":"https://api.exemplo.test/"}'));
    await carregarConfig(estado, apiConfig);
    expect(apiConfig.rootUrl).toBe('https://api.exemplo.test');
  });

  it('arquivo ausente (404) fica falhou sem rejeitar', async () => {
    fetchMock.mockResolvedValue(resposta('', 404));
    await expect(carregarConfig(estado, apiConfig)).resolves.toBeUndefined();
    expect(estado.estado()).toBe('falhou');
    expect(apiConfig.rootUrl).toBe('');
  });

  it('JSON inválido fica falhou sem rejeitar', async () => {
    fetchMock.mockResolvedValue(resposta('{nao é json'));
    await expect(carregarConfig(estado, apiConfig)).resolves.toBeUndefined();
    expect(estado.estado()).toBe('falhou');
  });

  it('sem apiBaseUrl fica falhou', async () => {
    fetchMock.mockResolvedValue(resposta('{"outra":"coisa"}'));
    await carregarConfig(estado, apiConfig);
    expect(estado.estado()).toBe('falhou');
  });

  it('apiBaseUrl vazio fica falhou', async () => {
    fetchMock.mockResolvedValue(resposta('{"apiBaseUrl":"  "}'));
    await carregarConfig(estado, apiConfig);
    expect(estado.estado()).toBe('falhou');
  });

  it('falha de rede no fetch fica falhou sem rejeitar', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(carregarConfig(estado, apiConfig)).resolves.toBeUndefined();
    expect(estado.estado()).toBe('falhou');
  });
});
