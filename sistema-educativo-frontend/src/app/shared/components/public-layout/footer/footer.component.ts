import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../../core/services/data_general/data.service';

interface FooterLink {
  label: string;
  route?: string;
  /** Texto secundario (ej. rango de edades en niveles) */
  hint?: string;
}

/**
 * Pie de página del sitio público.
 *
 * Arquitectura:
 * - Standalone + control flow nativo (@for/@if), sin CommonModule.
 * - Todos los datos provienen de DataService (signals): cero estado local mutable.
 * - Sin lógica de scroll propia: el "volver arriba" lo resuelve p-scrollTop en
 *   el landing; aquí no se duplica para no chocar con el FAB de WhatsApp.
 *
 * Doble instancia controlada:
 * - Layout (todas las rutas): instancia normal.
 * - Landing desktop: instancia con la clase `as-panel`, que vive como última
 *   cara del track horizontal. La visibilidad de cada una la resuelve CSS
 *   (misma media query que gsap.matchMedia del directive) → nunca hay dos
 *   footers visibles ni cero footers.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  private readonly dataService = inject(DataService);

  /** ID único para aria-labelledby cuando coexisten dos instancias en el DOM */
  readonly headingId = input<string>('footer-title');

  readonly schoolInfo = this.dataService.schoolInfo;
  readonly yearsOfExperience = this.dataService.yearsOfExperience;

  readonly currentYear = new Date().getFullYear();

  /** Sección 2 · Enlaces rápidos */
  readonly quickLinks: FooterLink[] = [
    { label: 'Proceso de Admisión', route: '/admision' },
    { label: 'Plana Docente', route: '/docentes' },
    { label: 'Transparencia', route: '/transparencia' },
    { label: 'Noticias y Eventos', route: '/noticias' },
    { label: 'Contáctanos', route: '/contacto' },
  ];

  /** Columna de niveles generada desde la señal centralizada `levels()` */
  readonly levelLinks = computed<FooterLink[]>(() =>
    this.dataService.levels().map(level => ({
      label: level.name,
      route: `/niveles/${level.id}`,
      hint: level.ages,
    })),
  );

  /** Sección 4 · Legales (sin route => enlace deshabilitado "próximamente") */
  readonly legalLinks: FooterLink[] = [
    { label: 'Declaración de Transparencia', route: '/transparencia' },
    { label: 'Libro de Reclamaciones', route: '/contacto' },
    { label: 'Política de Privacidad' },
  ];

  telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  admissionEmailHref(): string {
    return `mailto:${this.schoolInfo().email}?subject=${encodeURIComponent('Consultas de admisión')}`;
  }
}
