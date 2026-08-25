import { AfterViewInit, DestroyRef, Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import gsap from 'gsap';

export type RevealVariant = 'fadeUp' | 'fadeIn' | 'clip' | 'mask';

/**
 * Anima los hijos del elemento host al entrar en viewport (una sola vez).
 * Variantes:
 *  - fadeUp: sube con fade
 *  - fadeIn: solo opacidad
 *  - clip: revelado con clip-path + zoom sutil (ideal para imágenes)
 *  - mask: deslizamiento vertical tipo máscara (requiere wrapper overflow-hidden)
 * Respeta prefers-reduced-motion: sin estados iniciales ni animación.
 */
@Directive({
  selector: '[appRevealGroup]',
  standalone: true,
})
export class RevealGroupDirective implements AfterViewInit {
  private readonly elementRef = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  /** Variante de entrada (valor directo de la directiva) */
  @Input() appRevealGroup: RevealVariant = 'fadeUp';
  /** Segundos entre hijos */
  @Input() stagger = 0.12;
  /** Duración por hijo (segundos) */
  @Input() duration = 0.9;
  /** Selector de los elementos a animar */
  @Input() revealSelector = ':scope > *';
  /** Retardo inicial (segundos) */
  @Input() delay = 0;

  private observer: IntersectionObserver | null = null;
  private played = false;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const host = this.elementRef.nativeElement as HTMLElement;
    const items = Array.from(host.querySelectorAll<HTMLElement>(this.revealSelector));
    if (!items.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      return;
    }

    this.zone.runOutsideAngular(() => this.setup(items));
    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }

  private setup(items: HTMLElement[]): void {
    switch (this.appRevealGroup) {
      case 'clip':
        gsap.set(items, { clipPath: 'inset(0% 100% 0% 0%)', scale: 1.12, opacity: 0 });
        break;
      case 'mask':
        gsap.set(items, { yPercent: 120 });
        break;
      case 'fadeIn':
        gsap.set(items, { opacity: 0 });
        break;
      default:
        gsap.set(items, { y: 48, opacity: 0 });
    }

    const play = (): void => {
      if (this.played) return;
      this.played = true;

      const common: gsap.TweenVars = {
        duration: this.duration,
        ease: 'power3.out',
        stagger: this.stagger,
        delay: this.delay,
        overwrite: true,
        onComplete: () => gsap.set(items, { clearProps: 'all' }),
      };

      switch (this.appRevealGroup) {
        case 'clip':
          gsap.to(items, { ...common, clipPath: 'inset(0% 0% 0% 0%)', scale: 1, opacity: 1 });
          break;
        case 'mask':
          gsap.to(items, { ...common, yPercent: 0 });
          break;
        case 'fadeIn':
          gsap.to(items, { ...common, opacity: 1 });
          break;
        default:
          gsap.to(items, { ...common, y: 0, opacity: 1 });
      }
    };

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            play();
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    this.observer.observe(this.elementRef.nativeElement as HTMLElement);
  }
}

