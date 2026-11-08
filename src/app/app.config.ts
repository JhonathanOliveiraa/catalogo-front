import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TitleStrategy, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideConfig } from './core/config/carregar-config';
import { errosInterceptor } from './core/erros/erros.interceptor';
import { PaginadorIntl } from './core/paginador-intl';
import { TituloCatalogo } from './core/titulo';

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Sem withCredentials nem cabeçalhos próprios: CORS simples ou com preflight padrão (AD-1).
    provideHttpClient(withInterceptors([errosInterceptor])),
    provideConfig(),
    { provide: TitleStrategy, useExisting: TituloCatalogo },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    { provide: MatPaginatorIntl, useClass: PaginadorIntl },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  ],
};
