import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-cta-buttons',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-cta-buttons.component.html',
})
export class HeroCtaButtonsComponent {}
