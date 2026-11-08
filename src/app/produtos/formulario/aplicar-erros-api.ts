import { FormGroup } from '@angular/forms';
import { ErroApi } from '../../core/erros/erro-api';

function normalizarChave(chave: string): string {
  return chave.replace(/^\$\./, '').toLowerCase();
}

/**
 * Aplica um `ErroApi` do tipo `validacao` no formulário (AD-5): casa cada chave de `errors`
 * com um controle sem diferenciar maiúsculas e ignorando o prefixo `$.`, e faz
 * `setErrors({ api })`. Devolve as mensagens sem campo correspondente (vão para o alerta geral).
 * O erro some quando o campo é editado, porque a validação recalcula `errors`.
 */
export function aplicarErrosApi(form: FormGroup, erro: ErroApi): string[] {
  if (erro.tipo !== 'validacao') {
    return [];
  }
  const controles = new Map(Object.keys(form.controls).map((nome) => [nome.toLowerCase(), form.controls[nome]]));
  const semCampo: string[] = [];
  for (const [chave, mensagens] of Object.entries(erro.errors)) {
    const controle = controles.get(normalizarChave(chave));
    if (controle && mensagens.length > 0) {
      controle.setErrors({ api: mensagens.join(' ') });
      controle.markAsTouched();
    } else {
      semCampo.push(...mensagens);
    }
  }
  return semCampo;
}
