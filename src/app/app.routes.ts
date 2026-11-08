import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'produtos' },
  {
    path: 'produtos',
    title: 'Produtos',
    loadComponent: () => import('./produtos/paginas/lista/lista').then((m) => m.Lista),
  },
  {
    path: 'produtos/novo',
    title: 'Cadastrar produto',
    loadComponent: () => import('./produtos/paginas/formulario/formulario').then((m) => m.Formulario),
  },
  {
    // O título definitivo ({nome}) é definido pela página depois de carregar o produto.
    path: 'produtos/:id',
    title: 'Produto',
    loadComponent: () => import('./produtos/paginas/detalhe/detalhe').then((m) => m.Detalhe),
  },
  {
    path: 'produtos/:id/editar',
    title: 'Editar produto',
    loadComponent: () => import('./produtos/paginas/formulario/formulario').then((m) => m.Formulario),
  },
  { path: '**', redirectTo: 'produtos' },
];
