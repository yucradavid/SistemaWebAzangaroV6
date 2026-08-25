<<<<<<<< HEAD:sistema-educativo-frontend/src/app/features/public/landing/hero-section/hero-stats/hero-stats.component.ts
========

>>>>>>>> 8dd8fffbf765b12337a10c106763610450f7c00b:sistema-educativo-frontend/src/app/features/public/landing/stats-section/stats-section.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data_general/data.service';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-hero-stats',
  standalone: true,
<<<<<<<< HEAD:sistema-educativo-frontend/src/app/features/public/landing/hero-section/hero-stats/hero-stats.component.ts
  imports: [CommonModule],
  templateUrl: './hero-stats.component.html',
})
export class HeroStatsComponent {
  private readonly dataService = inject(DataService);
========
  imports: [CommonModule, ScrollRevealDirective],
  templateUrl: './stats-section.component.html',
})
export class StatsSectionComponent {
  private readonly dataService = inject(DataService);

>>>>>>>> 8dd8fffbf765b12337a10c106763610450f7c00b:sistema-educativo-frontend/src/app/features/public/landing/stats-section/stats-section.component.ts
  readonly schoolInfo = this.dataService.schoolInfo;
  readonly yearsOfExperience = this.dataService.yearsOfExperience;
}
