import { Directive, ElementRef, OnInit, OnDestroy, Input, NgZone } from '@angular/core';

export type RevealAnimation = 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'fadeIn';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input('appScrollReveal') animation: RevealAnimation = 'fadeUp';
  @Input() delay = 0;
  @Input() threshold = 0.15;

  private observer: IntersectionObserver | null = null;
  private readonly el: HTMLElement;
  private prefersReducedMotion = false;

  constructor(private elementRef: ElementRef, private ngZone: NgZone) {
    this.el = this.elementRef.nativeElement;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngOnInit(): void {
    if (this.prefersReducedMotion) {
      this.el.classList.add('scroll-reveal-visible', `reveal-${this.animation}`);
      return;
    }

    this.el.classList.add('scroll-reveal-hidden');

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                this.el.classList.remove('scroll-reveal-hidden');
                this.el.classList.add('scroll-reveal-visible', `reveal-${this.animation}`);
              }, this.delay);
              this.observer?.unobserve(this.el);
            }
          });
        },
        { threshold: this.threshold, rootMargin: '0px 0px -60px 0px' }
      );
      this.observer.observe(this.el);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
