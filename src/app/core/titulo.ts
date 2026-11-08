import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const SUFIXO = ' — Catálogo';

export function formatarTitulo(titulo: string): string {
  return `${titulo}${SUFIXO}`;
}

/** Acrescenta " — Catálogo" ao `title` da rota. */
@Injectable({ providedIn: 'root' })
export class TituloCatalogo extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const titulo = this.buildTitle(snapshot);
    if (titulo !== undefined) {
      this.title.setTitle(formatarTitulo(titulo));
    }
  }

  /** Para páginas que só sabem o título depois de carregar o produto (detalhe). */
  definir(titulo: string): void {
    this.title.setTitle(formatarTitulo(titulo));
  }
}
