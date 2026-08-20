import { Component } from '@angular/core';
import { HeroAchievementBadgeComponent } from '../hero-achievement-badge/hero-achievement-badge.component';

@Component({
  selector: 'app-hero-floating-cards',
  standalone: true,
  imports: [HeroAchievementBadgeComponent],
  templateUrl: './hero-floating-cards.component.html',
})
export class HeroFloatingCardsComponent {}
