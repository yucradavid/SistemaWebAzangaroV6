import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '@core/services/data_general/data.service';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { RevealGroupDirective } from '@shared/directives/reveal-group.directive';

@Component({
  selector: 'app-levels-section',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective, RevealGroupDirective],
  templateUrl: './levels-section.component.html',
  styleUrl: './levels-section.component.css'
})
export class LevelsSectionComponent {
  private readonly dataService = inject(DataService);
  readonly levels = this.dataService.levels;
}

