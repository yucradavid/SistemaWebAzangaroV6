import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data_general/data.service';
import { RevealGroupDirective } from '@shared/directives/reveal-group.directive';

interface Testimonial {
  name: string;
  role: string;
  level: string;
  text: string;
  rating: number;
  image: string;
}

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule, RevealGroupDirective],
  templateUrl: './testimonials-section.component.html',
})
export class TestimonialsSectionComponent {

  private readonly dataService = inject(DataService);

  readonly testimonials = this.dataService.testimonials;

  /** Fila A: orden original; Fila B: invertido. Repetidas para superar el ancho de pantalla */
  readonly rowA = this.repeat(this.testimonials(), 3);
  readonly rowB = this.repeat([...this.testimonials()].reverse(), 3);

  private repeat<T>(list: T[], times: number): T[] {
    const out: T[] = [];
    for (let i = 0; i < times; i++) {
      out.push(...list);
    }
    return out;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
