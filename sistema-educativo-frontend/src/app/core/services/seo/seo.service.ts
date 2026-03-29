import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Servicio para gestionar SEO dinámico
 * Maneja títulos, meta tags y datos estructurados
 */
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly router = inject(Router);

  private readonly defaultTitle = 'CERMAT SCHOOL - Colegio Privado en Azángaro, Puno';
  private readonly defaultDescription = 'Colegio privado de excelencia en Azángaro, Puno. Educación inicial, primaria y secundaria con formación bilingüe, robótica educativa y valores.';
  private readonly defaultImage = 'https://cermatschool.edu.pe/assets/og-image.jpg';
  private readonly siteUrl = 'https://cermatschool.edu.pe';

  constructor() {
    this.initRouteListener();
  }

  /**
   * Escucha cambios de ruta para actualizar SEO
   */
  private initRouteListener(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCanonicalUrl();
      });
  }

  /**
   * Actualiza el título de la página
   */
  updateTitle(title: string): void {
    this.title.setTitle(title || this.defaultTitle);
  }

  /**
   * Actualiza los meta tags básicos
   */
  updateMetaTags(config: MetaTagConfig): void {
    const description = config.description || this.defaultDescription;
    const image = config.image || this.defaultImage;
    const url = config.url || this.siteUrl + this.router.url;
    const title = config.title || this.defaultTitle;
    const type = config.type || 'website';

    // Meta tags básicos
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: config.keywords || this.getDefaultKeywords() });
    this.meta.updateTag({ name: 'author', content: 'CERMAT SCHOOL' });

    // Open Graph (Facebook)
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:site_name', content: 'CERMAT SCHOOL' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    // Datos adicionales
    if (config.publishedTime) {
      this.meta.updateTag({ property: 'article:published_time', content: config.publishedTime });
    }
    if (config.modifiedTime) {
      this.meta.updateTag({ property: 'article:modified_time', content: config.modifiedTime });
    }
  }

  /**
   * Actualiza la URL canónica
   */
  private updateCanonicalUrl(): void {
    const url = this.siteUrl + this.router.url;
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    
    link.setAttribute('href', url);
  }

  /**
   * Añade datos estructurados (JSON-LD)
   */
  addStructuredData(data: any): void {
    let script: HTMLScriptElement | null = document.querySelector('script[type="application/ld+json"]');
    
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(data);
  }

  /**
   * Añade el schema de organización
   */
  addOrganizationSchema(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      'name': 'CERMAT SCHOOL',
      'alternateName': 'Colegio CERMAT',
      'url': this.siteUrl,
      'logo': `${this.siteUrl}/assets/logo.png`,
      'description': this.defaultDescription,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Jr. Los Andes 456',
        'addressLocality': 'Azángaro',
        'addressRegion': 'Puno',
        'postalCode': '21531',
        'addressCountry': 'PE'
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+51-999-888-777',
        'contactType': 'Admissions',
        'email': 'informes@cermatschool.edu.pe',
        'areaServed': 'PE',
        'availableLanguage': ['es', 'en']
      },
      'sameAs': [
        'https://facebook.com/cermatschool',
        'https://instagram.com/cermatschool',
        'https://youtube.com/@cermatschool'
      ]
    };

    this.addStructuredData(schema);
  }

  /**
   * Añade el schema de breadcrumbs
   */
  addBreadcrumbSchema(items: BreadcrumbItem[]): void {
    const itemListElement = items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': `${this.siteUrl}${item.url}`
    }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': itemListElement
    };

    this.addStructuredData(schema);
  }

  /**
   * Keywords por defecto
   */
  private getDefaultKeywords(): string {
    return 'colegio privado Azángaro, educación Puno, colegio bilingüe, educación inicial Azángaro, primaria Azángaro, secundaria Azángaro, mejor colegio Puno, CERMAT SCHOOL, robótica educativa';
  }
}

/**
 * Interfaces para tipado
 */
export interface MetaTagConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}