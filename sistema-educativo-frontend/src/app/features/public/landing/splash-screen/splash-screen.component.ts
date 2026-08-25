import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const AUTO_DISMISS_MS = 3000;
const ZOOM_SCALE = 42;

/**
 * Pantalla de bienvenida con recorte tipográfico ("CERMAT") sobre velo blanco.
 * A través del recorte se ve la página real detrás y, tras un tiempo o
 * interacción del usuario, hace zoom atravesando el texto para revelarla.
 * Aparece cada vez que se carga la página principal.
 */
@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [],
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.css',
})
export class SplashScreenComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly maskSvg = viewChild<ElementRef<SVGSVGElement>>('maskSvg');
  private readonly hint = viewChild<ElementRef<HTMLParagraphElement>>('hint');

  readonly visible = signal(true);

  private timeline?: gsap.core.Timeline;
  private intro?: gsap.core.Timeline;
  private autoTimer?: ReturnType<typeof setTimeout>;
  private detachListeners: (() => void) | null = null;
  private exiting = false;

  ngOnInit(): void {
    if (this.visible()) this.lockScroll();
  }

  ngAfterViewInit(): void {
    if (!this.visible() || typeof window === 'undefined') return;

    this.zone.runOutsideAngular(() => {
      gsap.registerPlugin(ScrollTrigger);
      this.playIntro();
      this.autoTimer = setTimeout(() => this.dismiss(), AUTO_DISMISS_MS);
      this.armInteractionListeners();
    });

    this.destroyRef.onDestroy(() => this.teardown());
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private armInteractionListeners(): void {
    const trigger = () => this.dismiss();
    const events: Array<[string, EventListener]> = [
      ['pointerdown', trigger],
      ['wheel', trigger],
      ['touchstart', trigger],
      ['keydown', trigger],
    ];
    events.forEach(([type, fn]) => window.addEventListener(type, fn, { passive: true }));
    this.detachListeners = () =>
      events.forEach(([type, fn]) => window.removeEventListener(type, fn));
  }

  /** Entrada: velo blanco opaco desde el primer frame; las letras se recortan solas */
  private playIntro(): void {
    const svgEl = this.maskSvg()?.nativeElement;
    const textEl = svgEl?.querySelector('#splash-text') as unknown as SVGGraphicsElement | null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!svgEl || !textEl) return;

    if (reducedMotion) {
      gsap.set(textEl, { scale: 1 });
      return;
    }

    gsap.set(textEl, { scale: 0, transformOrigin: '50% 50%', smoothOrigin: true });
    this.intro = gsap.timeline();
    this.intro.to(textEl, { scale: 1, duration: 1.05, ease: 'power3.out' });
  }

  private dismiss(): void {
    if (this.exiting || !this.visible()) return;
    this.exiting = true;

    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.detachListeners?.();
    this.detachListeners = null;
    this.intro?.kill();

    const svgEl = this.maskSvg()?.nativeElement;
    const hintEl = this.hint()?.nativeElement;
    const landing = document.querySelector<HTMLElement>('.home-page');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.zone.runOutsideAngular(() => {
      const tl = gsap.timeline({ onComplete: () => this.finish() });

      if (hintEl) hintEl.style.animation = 'none';

      const introText = svgEl?.querySelector('#splash-text');
      if (introText) gsap.set(introText, { scale: 1 });

      if (reducedMotion || !svgEl) {
        tl.to(this.host.nativeElement, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.set(svgEl, { transformOrigin: this.computeZoomOrigin(svgEl), force3D: true });
        tl.to(hintEl ?? [], { autoAlpha: 0, y: -12, duration: 0.25, ease: 'power2.out' }, 0)
          .to(svgEl, { scale: ZOOM_SCALE, duration: 1.15, ease: 'power4.in' }, 0)
          .to(
            this.host.nativeElement,
            { autoAlpha: 0, duration: 0.35, ease: 'power2.out' },
            '-=0.3'
          );
      }

      if (landing) {
        tl.fromTo(
          landing,
          { scale: 1.12 },
          { scale: 1, duration: 1.4, ease: 'power2.out', clearProps: 'transform' },
          reducedMotion ? 0 : 0.15
        );
      }

      this.timeline = tl;
    });
  }

  /** Centro exacto del contador de la letra "E" para atravesarlo con el zoom */
  private computeZoomOrigin(svg: SVGSVGElement): string {
    try {
      const textEl = svg.querySelector('#splash-text') as unknown as SVGTextContentElement;
      const start = textEl.getStartPositionOfChar(1);
      const end = textEl.getEndPositionOfChar(1);
      return `${(start.x + end.x) / 2}px ${(start.y + end.y) / 2}px`;
    } catch {
      return '36% 52%';
    }
  }

  private finish(): void {
    this.zone.run(() => {
      this.unlockScroll();
      this.visible.set(false);
      if (typeof window !== 'undefined') ScrollTrigger.refresh();
    });
  }

  private lockScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }

  private teardown(): void {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.detachListeners?.();
    this.detachListeners = null;
    this.intro?.kill();
    this.timeline?.kill();
    if (this.exiting || !this.visible()) return;
    this.unlockScroll();
  }
}
