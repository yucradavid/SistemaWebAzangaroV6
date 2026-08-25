import { Component, inject } from '@angular/core';
import { JourneyStateService } from '../journey-state.service';

/**
 * Navegación lateral del recorrido horizontal del landing.
 *
 * - Dots verticales a la derecha, uno por cara del track (incluido el footer).
 * - El dot activo lo alimenta el ScrollTrigger vía JourneyStateService.
 * - Clic = salto suave a esa cara.
 * - Visible solo en desktop con movimiento permitido (misma media query que
 *   el directive), y con mix-blend-difference para contrastar sobre fondos
 *   claros (cream/white) y oscuros (navy) sin duplicar lógica de color.
 */
@Component({
  selector: 'app-journey-nav',
  standalone: true,
  templateUrl: './journey-nav.component.html',
  styleUrl: './journey-nav.component.css',
})
export class JourneyNavComponent {
  private readonly journey = inject(JourneyStateService);

  readonly panelCount = this.journey.panelCount;
  readonly activeIndex = this.journey.activeIndex;

  /** Etiquetas por cara, en orden; sirven como aria-label/title de cada dot */
  readonly labels = [
    'Inicio',
    'Niveles educativos',
    'Noticias',
    'Galería',
    'Testimonios',
    'Ubicación',
    'Contacto',
  ];

  labelFor(index: number): string {
    return `Ir a: ${this.labels[index] ?? `Sección ${index + 1}`}`;
  }

  goTo(index: number): void {
    this.journey.goTo(index);
  }
}
