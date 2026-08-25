import { Injectable, signal } from '@angular/core';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Estado compartido del recorrido horizontal del landing.
 *
 * El HorizontalScrollDirective registra su ScrollTrigger aquí cuando el
 * track está activo (solo desktop + motion-safe); JourneyNavComponent lo
 * consume para pintar el dot activo y saltar a cada cara.
 *
 * Se provee a nivel de HomeComponent → ciclo de vida limpio por navegación.
 */
@Injectable()
export class JourneyStateService {
  readonly panelCount = signal(0);
  readonly activeIndex = signal(0);

  private trigger: ScrollTrigger | null = null;

  register(trigger: ScrollTrigger, panelCount: number): void {
    this.trigger = trigger;
    this.panelCount.set(panelCount);
    this.activeIndex.set(0);
  }

  unregister(): void {
    this.trigger = null;
    this.panelCount.set(0);
    this.activeIndex.set(0);
  }

  /** Llamado por el onUpdate del ScrollTrigger (fuera de la zona de Angular) */
  setActiveFromProgress(progress: number): void {
    const last = this.panelCount() - 1;
    if (last < 1) return;
    const index = Math.round(progress * last);
    if (index !== this.activeIndex()) {
      // Escritura fuera de zona → Angular 18 con zone.js la detecta en el
      // siguiente tick; los signals notifican al template sin problema.
      this.activeIndex.set(index);
    }
  }

  /** Salto suave a una cara concreta (scroll vertical que alimenta el scrub) */
  goTo(index: number): void {
    const st = this.trigger;
    const last = this.panelCount() - 1;
    if (!st || last < 1) return;

    const clamped = Math.min(Math.max(index, 0), last);
    const target = st.start + (st.end - st.start) * (clamped / last);

    window.scrollTo({ top: target, behavior: 'smooth' });
  }
}
