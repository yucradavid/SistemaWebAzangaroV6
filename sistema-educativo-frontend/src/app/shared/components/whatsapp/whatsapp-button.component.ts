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
  template: `
    <div 
      class="fixed bottom-6 right-6 z-40 transition-all duration-300"
      [class.opacity-0]="!isVisible()"
      [class.translate-y-20]="!isVisible()"
      [class.opacity-100]="isVisible()"
      [class.translate-y-0]="isVisible()"
    >
      <!-- Tooltip -->
      <div 
        *ngIf="showTooltip()"
        class="absolute bottom-full right-0 mb-3 animate-bounce-gentle"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-4 max-w-xs">
          <button
            (click)="closeTooltip()"
            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="flex items-start gap-3 pr-4">
            <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900 mb-1">¿Necesitas ayuda?</p>
              <p class="text-sm text-gray-600">Chatea con nosotros en WhatsApp</p>
            </div>
          </div>
          <div class="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45"></div>
        </div>
      </div>

      <!-- Botón Principal -->
      <a
        [href]="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        (mouseenter)="onHover()"
        class="group relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
        aria-label="Contactar por WhatsApp"
      >
        <!-- Ripple Effect -->
        <span class="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
        
        <!-- Icon -->
        <svg class="w-8 h-8 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  `,
  styles: [`
    @keyframes bounce-gentle {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }

    .animate-bounce-gentle {
      animation: bounce-gentle 2s ease-in-out infinite;
    }
  `]
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