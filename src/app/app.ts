import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ConfigEstado } from './core/config/config-estado';
import { MENSAGENS } from './core/erros/mensagens';

/** Raiz: barra superior + router-outlet, ou a tela fatal se a config falhou (AD-3). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly config = inject(ConfigEstado);
  protected readonly mensagemFatal = MENSAGENS.configFalhou;
}
