// Atualiza openapi/catalogo-api.json a partir do /openapi/v1.json publicado pela API.
// Uso: npm run openapi:atualizar -- https://hml-catalogo-api.tcc.altasistemas.com.br
//
// Remove `servers`: o ng-openapi-gen usaria servers[0].url como rootUrl padrão do
// ApiConfiguration, e nenhuma URL de ambiente pode entrar no bundle (AD-3).
import { writeFile } from 'node:fs/promises';

const base = process.argv[2];
if (!base || !/^https?:\/\/[^\s]+[^/]$/.test(base)) {
  console.error('Informe a URL base da API, sem barra final. Ex.: npm run openapi:atualizar -- https://hml-catalogo-api.tcc.altasistemas.com.br');
  process.exit(1);
}

const resposta = await fetch(`${base}/openapi/v1.json`);
if (!resposta.ok) {
  console.error(`GET ${base}/openapi/v1.json respondeu ${resposta.status}`);
  process.exit(1);
}

const spec = await resposta.json();
delete spec.servers;
await writeFile(new URL('../openapi/catalogo-api.json', import.meta.url), JSON.stringify(spec, null, 2) + '\n');
console.log('openapi/catalogo-api.json atualizado (servers removido). Revise o diff antes de commitar.');
