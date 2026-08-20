import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-hero-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-stats.component.html',
})
export class HeroStatsComponent {
  private readonly dataService = inject(DataService);
  readonly schoolInfo = this.dataService.schoolInfo;
  readonly yearsOfExperience = this.dataService.yearsOfExperience;
}
