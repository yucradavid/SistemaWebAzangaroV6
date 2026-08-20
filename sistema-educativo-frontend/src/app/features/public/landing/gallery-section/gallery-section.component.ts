import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
import { DataService } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-gallery-section',
  standalone: true,
  imports: [CommonModule, RouterLink, GalleriaModule, ImageModule],
  templateUrl: './gallery-section.component.html',
})
export class GallerySectionComponent {

  private readonly dataService = inject(DataService);

  readonly galleryImages = this.dataService.galleryImages;
  readonly isLightboxOpen = signal(false);
  readonly activeIndex = signal(0);

  openLightbox(index: number): void {
    this.activeIndex.set(index);
    this.isLightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }
}
