import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
import { DataService } from '@core/services/data_general/data.service';
import { RevealGroupDirective } from '@shared/directives/reveal-group.directive';

@Component({
  selector: 'app-gallery-section',
  standalone: true,
  imports: [CommonModule, RouterLink, GalleriaModule, ImageModule, RevealGroupDirective],
  templateUrl: './gallery-section.component.html',
})
export class GallerySectionComponent {

  private readonly dataService = inject(DataService);

  readonly galleryImages = this.dataService.galleryImages;
  readonly isLightboxOpen = signal(false);
  readonly activeIndex = signal(0);

  /** Spans del mosaico editorial (grid-cols-4 / auto-rows). Total celdas: 12 (3 filas) */
  readonly mosaicClasses = [
    'md:col-span-2 md:row-span-2',
    '',
    '',
    'md:row-span-2',
    'md:col-span-2',
    '',
    '',
    ''
  ];

  mosaicClass(index: number): string {
    return this.mosaicClasses[index % this.mosaicClasses.length];
  }

  openLightbox(index: number): void {
    this.activeIndex.set(index);
    this.isLightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }
}
