
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data_general/data.service';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  templateUrl: './stats-section.component.html',
})
export class StatsSectionComponent {
  private readonly dataService = inject(DataService);

  readonly schoolInfo = this.dataService.schoolInfo;
  readonly yearsOfExperience = this.dataService.yearsOfExperience;
}

