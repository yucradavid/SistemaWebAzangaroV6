import { Component } from '@angular/core';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './about-section.component.html',
})
export class AboutSectionComponent {}
