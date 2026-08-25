import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ChevronRight } from 'lucide-angular';

/**
 * Hero editorial compartido para todas las páginas públicas.
 * Paleta navy + dorado, sin franjas tricolor ni gradientes ajenos
 * al sistema de diseño del landing.
 */
@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-hero.component.html',
  styleUrl: './page-hero.component.css'
})
export class PageHeroComponent {
  /** Etiqueta corta superior (ej. "Admisión 2026") */
  readonly label = input.required<string>();
  /** Título principal */
  readonly title = input.required<string>();
  /** Subtítulo descriptivo opcional */
  readonly subtitle = input<string>('');
  /** Nombre de la página actual para el breadcrumb (por defecto usa title) */
  readonly crumb = input<string>('');

  readonly ChevronRight = ChevronRight;
}
