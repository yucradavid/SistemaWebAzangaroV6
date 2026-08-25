import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '@core/services/data_general/data.service';
import { RevealGroupDirective } from '@shared/directives/reveal-group.directive';

@Component({
  selector: 'app-news-section',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealGroupDirective],
  templateUrl: './news-section.component.html',
  styleUrl: './news-section.component.css'
})
export class NewsSectionComponent {
  private readonly dataService = inject(DataService);
  readonly featuredNews = this.dataService.featuredNews;

  readonly marqueeWords = ['Actualidad', 'Eventos', 'Logros', 'Deportes', 'Ciencia', 'Arte', 'Comunidad'];

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

}

