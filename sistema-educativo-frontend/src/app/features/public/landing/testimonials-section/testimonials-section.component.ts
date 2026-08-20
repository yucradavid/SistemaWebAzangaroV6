import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { DataService } from '@core/services/data_general/data.service';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule, CarouselModule, ScrollRevealDirective],
  templateUrl: './testimonials-section.component.html',
})
export class TestimonialsSectionComponent {

  private readonly dataService = inject(DataService);

  readonly testimonials = this.dataService.testimonials;

  readonly responsiveOptions = [
    { breakpoint: '768px', numVisible: 1, numScroll: 1 }
  ];

}