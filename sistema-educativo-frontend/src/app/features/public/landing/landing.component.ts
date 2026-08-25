import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollTopModule } from 'primeng/scrolltop';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService } from '@core/services/data_general/data.service';
import { HorizontalScrollDirective } from '@shared/directives/horizontal-scroll.directive';
import { SplashScreenComponent } from './splash-screen/splash-screen.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { LevelsSectionComponent } from './levels-section/levels-section.component';
import { NewsSectionComponent } from './news-section/news-section.component';
import { TestimonialsSectionComponent } from './testimonials-section/testimonials-section.component';
import { GallerySectionComponent } from './gallery-section/gallery-section.component';
import { MapSectionComponent } from './map-section/map-section.component';
import { FooterComponent } from '@shared/components/public-layout/footer/footer.component';
import { JourneyNavComponent } from './journey-nav/journey-nav.component';
import { JourneyStateService } from './journey-state.service';

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
    ScrollTopModule,
    HorizontalScrollDirective,
    SplashScreenComponent,
    HeroSectionComponent,
    LevelsSectionComponent,
    NewsSectionComponent,
    TestimonialsSectionComponent,
    GallerySectionComponent,
    MapSectionComponent,
    FooterComponent,
    JourneyNavComponent
  ],
  providers: [JourneyStateService],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly seoService = inject(SeoService);

  constructor() {
    // Fondo navy a nivel canvas: elimina el bloque blanco que asoma al final
    // del documento (overscroll/seams tras el pin-spacer de GSAP).
    document.body.classList.add('landing-page');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('landing-page');
  }

  ngOnInit(): void {
    this.seoService.updateTitle('CERMAT SCHOOL - Inicio | Colegio Privado en Azángaro');
    this.seoService.updateMetaTags({
      description: 'Colegio privado de excelencia en Azángaro, Puno. Educación inicial, primaria y secundaria con formación bilingüe, robótica educativa y valores.',
      keywords: 'colegio privado Azángaro, educación Puno, colegio bilingüe, mejor colegio Azángaro',
      type: 'website'
    });
    this.seoService.addOrganizationSchema();
  }
}
