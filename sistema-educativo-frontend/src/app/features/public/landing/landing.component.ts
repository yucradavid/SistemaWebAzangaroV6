import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService } from '@core/services/data_general/data.service';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { AboutSectionComponent } from './about-section/about-section.component';
import { LevelsSectionComponent } from './levels-section/levels-section.component';
import { NewsSectionComponent } from './news-section/news-section.component';
import { TestimonialsSectionComponent } from './testimonials-section/testimonials-section.component';
import { GallerySectionComponent } from './gallery-section/gallery-section.component';
import { StatsSectionComponent } from './stats-section/stats-section.component';
import { MapSectionComponent } from './map-section/map-section.component';

/**
 * Página principal del sitio web
 * Contiene todas las secciones de la home
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroSectionComponent,
    AboutSectionComponent,
    LevelsSectionComponent,
    NewsSectionComponent,
    TestimonialsSectionComponent,
    GallerySectionComponent,
    StatsSectionComponent,
    MapSectionComponent
  ],
  template: `
    <div class="home-page">
      <app-hero-section />
      <app-stats-section />
      <app-about-section />
      <app-levels-section />
      <app-news-section />
      <app-gallery-section />
      <app-testimonials-section />
      <app-map-section />
    </div>
  `
})
export class HomeComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTitle('CERMAT SCHOOL - Inicio | Colegio Privado en Azángaro');
    this.seoService.updateMetaTags({
      description: 'Colegio privado de excelencia en Azángaro, Puno. Educación inicial, primaria y secundaria con formación bilingüe, robótica educativa y valores.',
      keywords: 'colegio privado Azángaro, educación Puno, colegio bilingüe, mejor colegio Azángaro',
      type: 'website'
    });
  }
}
