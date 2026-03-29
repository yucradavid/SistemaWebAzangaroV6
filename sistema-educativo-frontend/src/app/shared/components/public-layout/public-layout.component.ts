import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/public-layout/header/header.component';
import { FooterComponent } from '../../components/public-layout/footer/footer.component';
import { WhatsappButtonComponent } from '../../components/whatsapp/whatsapp-button.component';
import { SeoService } from '../../../core/services/seo/seo.service';

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
  template: `
    <div class="flex flex-col min-h-screen">
      <app-header />
      
      <main class="flex-grow">
        <router-outlet />
      </main>
      
      <app-footer />
      
      <app-whatsapp-button />
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PublicLayoutComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    // Añadir schema de organización (solo una vez)
    this.seoService.addOrganizationSchema();
  }
}