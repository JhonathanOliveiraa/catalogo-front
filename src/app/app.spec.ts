import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ConfigEstado } from './core/config/config-estado';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
  });

  it('mostra a barra superior com link para /produtos', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector('mat-toolbar a');
    expect(link?.textContent?.trim()).toBe('Catálogo de Produtos');
    expect(link?.getAttribute('href')).toBe('/produtos');
  });

  it('com a config ok renderiza o router-outlet', async () => {
    TestBed.inject(ConfigEstado).estado.set('ok');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('com a config falhou renderiza a tela fatal no lugar do router-outlet', async () => {
    TestBed.inject(ConfigEstado).estado.set('falhou');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).toBeNull();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar a configuração da aplicação. Tente recarregar a página. Se o problema continuar, contate o administrador.',
    );
  });
});
