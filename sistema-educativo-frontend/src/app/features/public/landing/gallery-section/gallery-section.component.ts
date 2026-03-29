import { Component, signal} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-section.component.html',
  styleUrl: './gallery-section.component.css'
})
export class GallerySectionComponent {
 readonly isLightboxOpen = signal(false);
  readonly currentImageIndex = signal(0);

  readonly galleryImages = [
    {
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=800&fit=crop',
      title: 'Estudiantes en clase',
      category: 'Actividades Académicas'
    },
    {
      url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=600&fit=crop',
      title: 'Laboratorio de ciencias',
      category: 'Infraestructura'
    },
    {
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=600&fit=crop',
      title: 'Deportes',
      category: 'Actividades Deportivas'
    },
    {
      url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=600&fit=crop',
      title: 'Graduación',
      category: 'Eventos Especiales'
    },
    {
      url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=600&fit=crop',
      title: 'Biblioteca moderna',
      category: 'Infraestructura'
    },
    {
      url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=600&fit=crop',
      title: 'Nivel inicial',
      category: 'Niveles Educativos'
    },
    {
      url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&h=600&fit=crop',
      title: 'Arte y creatividad',
      category: 'Talleres'
    },
    {
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop',
      title: 'Robótica educativa',
      category: 'Tecnología'
    }
  ];

  openLightbox(index: number): void {
    this.currentImageIndex.set(index);
    this.isLightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    if (this.currentImageIndex() < this.galleryImages.length - 1) {
      this.currentImageIndex.update(i => i + 1);
    }
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    if (this.currentImageIndex() > 0) {
      this.currentImageIndex.update(i => i - 1);
    }
  }
}
