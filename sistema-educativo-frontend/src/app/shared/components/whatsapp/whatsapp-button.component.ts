import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data_general/data.service';

/**
 * Botón flotante de WhatsApp con animación y tooltip
 */
@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-button.component.html',
  styleUrls: ['./whatsapp-button.component.css']
})
export class WhatsappButtonComponent {
  private readonly dataService = inject(DataService);

  readonly isVisible = signal(false);
  readonly showTooltip = signal(false);
  private tooltipShown = false;

  get whatsappUrl(): string {
    const phone = this.dataService.schoolInfo().whatsapp;
    const message = encodeURIComponent('Hola, quisiera información sobre CERMAT SCHOOL');
    return `https://wa.me/${phone}?text=${message}`;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    // Mostrar el botón después de hacer scroll de 300px
    this.isVisible.set(window.scrollY > 300);

    // Mostrar tooltip automáticamente la primera vez
    if (!this.tooltipShown && window.scrollY > 500) {
      this.showTooltip.set(true);
      this.tooltipShown = true;
      
      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        this.showTooltip.set(false);
      }, 5000);
    }
  }

  onHover(): void {
    if (!this.tooltipShown) {
      this.showTooltip.set(true);
    }
  }

  closeTooltip(): void {
    this.showTooltip.set(false);
    this.tooltipShown = true;
  }
}