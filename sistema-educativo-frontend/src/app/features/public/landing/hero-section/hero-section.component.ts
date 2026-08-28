import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '@core/services/data_general/data.service';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { PageCoverComponent } from '@shared/components/page-cover/page-cover.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective, PageCoverComponent],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent {
  private readonly dataService = inject(DataService);
  readonly schoolInfo = this.dataService.schoolInfo;
  videoLoaded = false;
}
