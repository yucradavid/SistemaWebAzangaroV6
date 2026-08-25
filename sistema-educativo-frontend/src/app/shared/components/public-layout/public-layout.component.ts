import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/public-layout/header/header.component';
import { FooterComponent } from '../../components/public-layout/footer/footer.component';
import { WhatsappButtonComponent } from '../../components/whatsapp/whatsapp-button.component';
import { SeoService } from '../../../core/services/seo/seo.service';
import { filter } from 'rxjs/operators';

/**
 * Layout principal del sitio público
 * Contiene header, footer y botón de WhatsApp flotante
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    WhatsappButtonComponent
  ],
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.css']
})
export class PublicLayoutComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly router = inject(Router);

  /**
   * En el landing (desktop) el footer vive como última cara del scroll
   * horizontal dentro del track pineado; el footer del layout se oculta
   * para evitar duplicado. En móvil y en el resto de rutas se muestra normal.
   */
  readonly isLanding = signal(this.router.url === '/');

  ngOnInit(): void {
    // Añadir schema de organización (solo una vez)
    this.seoService.addOrganizationSchema();

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.isLanding.set(e.url === '/' || e.urlAfterRedirects === '/'));
  }
}
