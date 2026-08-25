import { AfterViewInit, Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '@core/services/data_general/data.service';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent implements AfterViewInit {
  private readonly dataService = inject(DataService);
  readonly schoolInfo = this.dataService.schoolInfo;
  videoLoaded = false;

  /** Hint "Desliza": se oculta con el primer movimiento de scroll */
  readonly showScrollHint = signal(true);

  private readonly heroVideo = viewChild<ElementRef<HTMLVideoElement>>('heroVideo');

  ngAfterViewInit(): void {
    // Reintentos de play() por si la política de autoplay retrasa el arranque
    [400, 1200, 2500].forEach(delay => setTimeout(() => this.tryPlay(), delay));
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.showScrollHint()) {
      this.showScrollHint.set(false);
    }
  }

  tryPlay(): void {
    const video = this.heroVideo()?.nativeElement;
    if (!video) return;
    video.play()?.then(
      () => console.info('[hero] play() aceptado'),
      (err: unknown) => console.warn('[hero] play() rechazado:', err)
    );
  }

  markAsPlaying(): void {
    if (this.videoLoaded) return;
    this.videoLoaded = true;
    console.info('[hero] video reproduciéndose');
  }

  onVideoEvent(name: string): void {
    console.info(`[hero] evento video: ${name}`);
  }

  onVideoError(): void {
    const video = this.heroVideo()?.nativeElement;
    console.error('[hero] error cargando video:', video?.error);
  }
}
