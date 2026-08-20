import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroCtaButtonsComponent } from './hero-cta-buttons/hero-cta-buttons.component';
import { HeroStatsComponent } from './hero-stats/hero-stats.component';
import { HeroFloatingCardsComponent } from './hero-floating-cards/hero-floating-cards.component';
import { DataService } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, HeroCtaButtonsComponent, HeroStatsComponent, HeroFloatingCardsComponent],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent {
  private readonly dataService = inject(DataService);
  readonly schoolInfo = this.dataService.schoolInfo;
  readonly yearsOfExperience = this.dataService.yearsOfExperience;
}
