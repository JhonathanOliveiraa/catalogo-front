import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
// core/config é o único ponto, além do facade, que toca o cliente gerado: só define o rootUrl (AD-3).
import { ApiConfiguration } from '../../api/api-configuration';
import { ConfigEstado } from './config-estado';

/**
 * Lê `/config.json` com `fetch` nativo (sem HttpClient) e define o `rootUrl` da API.
 * Nunca rejeita: qualquer falha deixa `ConfigEstado` em `falhou`, e a raiz renderiza
 * a tela fatal no lugar do router-outlet (AD-3).
 */
export async function carregarConfig(estado: ConfigEstado, apiConfig: ApiConfiguration): Promise<void> {
  try {
    const resposta = await fetch('/config.json', { cache: 'no-store' });
    if (!resposta.ok) {
      throw new Error(`/config.json respondeu ${resposta.status}`);
    }
    const config: unknown = await resposta.json();
    const apiBaseUrl = (config as { apiBaseUrl?: unknown } | null)?.apiBaseUrl;
    if (typeof apiBaseUrl !== 'string' || apiBaseUrl.trim() === '') {
      throw new Error('/config.json sem apiBaseUrl');
    }
    apiConfig.rootUrl = apiBaseUrl.trim().replace(/\/+$/, '');
    estado.estado.set('ok');
  } catch (erro) {
    console.error('Falha ao carregar /config.json', erro);
    estado.estado.set('falhou');
  }
}

export function provideConfig(): EnvironmentProviders {
  return provideAppInitializer(() => carregarConfig(inject(ConfigEstado), inject(ApiConfiguration)));
}
