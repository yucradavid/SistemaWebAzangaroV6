import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials-section.component.html',
  styleUrl: './testimonials-section.component.css'
})
export class TestimonialsSectionComponent implements OnInit, OnDestroy {

  private readonly dataService = inject(DataService);
  private intervalId?: number;

  readonly testimonials = this.dataService.testimonials;
  readonly currentIndex = signal(0);

 
readonly currentTestimonial = computed(() => {
  const list = this.testimonials();
  return list.length ? list[this.currentIndex()] : null;
});

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    this.intervalId = undefined;

  }

  startAutoPlay(): void {
    this.intervalId = window.setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextSlide(): void {
    this.currentIndex.update(i => (i + 1) % this.testimonials().length);
  }

  prevSlide(): void {
    this.currentIndex.update(i => 
      i === 0 ? this.testimonials().length - 1 : i - 1
    );
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
    this.stopAutoPlay();
    this.startAutoPlay();
  }

}

