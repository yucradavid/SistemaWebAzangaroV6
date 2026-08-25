import { AfterViewInit, DestroyRef, Directive, ElementRef, NgZone, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { JourneyStateService } from '../../features/public/landing/journey-state.service';

/**
 * Convierte el contenido del elemento en una pista horizontal controlada por
 * el scroll vertical mediante GSAP ScrollTrigger (patrón "pinned horizontal scroll").
 * Solo se activa en escritorio (>=1024px) y sin prefers-reduced-motion; en
 * móvil y con movimiento reducido la página mantiene su scroll vertical normal.
 *
 * Si existe un JourneyStateService en el inyector (lo provee el landing),
 * registra ahí el trigger y el progreso para alimentar la navegación por dots.
 */
@Directive({
  selector: '[appHorizontalScroll]',
  standalone: true,
})
export class HorizontalScrollDirective implements AfterViewInit {
  private readonly elementRef = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly journey = inject(JourneyStateService, { optional: true });

  private matchMedia: gsap.MatchMedia | null = null;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const track = this.elementRef.nativeElement as HTMLElement;

    this.zone.runOutsideAngular(() => {
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const panelCount = track.children.length;

        const tween = gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: track.parentElement,
            start: 'top top',
            end: () => '+=' + getDistance(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: self => this.journey?.setActiveFromProgress(self.progress),
            // Snap suave a cada cara (solo con más de un panel)
            ...(panelCount > 1
              ? {
                  snap: {
                    snapTo: 1 / (panelCount - 1),
                    duration: { min: 0.15, max: 0.4 },
                    delay: 0.08,
                    ease: 'power2.out',
                  },
                }
              : {}),
          },
        });

        this.journey?.register(tween.scrollTrigger!, panelCount);

        const onLoad = () => ScrollTrigger.refresh();

        window.addEventListener('load', onLoad);
        const refreshTimeout = setTimeout(onLoad, 1500);

        // Re-medición cuando las webfonts terminen de cargar: evita alturas
        // obsoletas que dejan un hueco o solape entre paneles y el footer
        if (typeof document !== 'undefined' && 'fonts' in document) {
          document.fonts.ready.then(onLoad).catch(() => {});
        }

        return () => {
          clearTimeout(refreshTimeout);
          window.removeEventListener('load', onLoad);
          this.journey?.unregister();
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: 'x' });
        };
      });

      this.matchMedia = mm;
    });

    this.destroyRef.onDestroy(() => this.matchMedia?.revert());
  }
}
