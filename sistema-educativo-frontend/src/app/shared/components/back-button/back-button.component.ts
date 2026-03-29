import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div (click)="navigate()"
         class="back-button-pill fixed left-6 top-24 z-40 group flex items-center rounded-full p-0 cursor-pointer active:scale-95">
      <!-- Icon Container -->
      <div class="icon-container flex items-center justify-center w-9 h-9 rounded-full text-white shadow-[0_0_0_1px_#0E3A8A] group-hover:shadow-none">
        <svg class="w-3.5 h-3.5 transition-transform duration-500 group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5">
          <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
        </svg>
      </div>

      <!-- Text Container -->
      <div class="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-500 group-hover:max-w-xs group-hover:ml-3">
        <span class="back-button-text text-[13px] font-semibold tracking-wide antialiased">{{ text }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .back-button-pill {
      background-color: white;
      transition: background-color 0s 0.5s, padding 0.5s;
    }
    .back-button-pill:hover {
      background-color: #0E3A8A !important;
      padding-right: 1.5rem;
      transition: background-color 0s, padding 0.5s;
    }
    .icon-container {
      background-color: #0E3A8A;
      transition: background-color 0s 0.5s;
    }
    .back-button-pill:hover .icon-container {
      background-color: transparent;
      transition: background-color 0s;
    }
    .back-button-text {
      color: #0E3A8A;
      transition: color 0s 0.5s;
    }
    .back-button-pill:hover .back-button-text {
      color: white;
      transition: color 0s;
    }
  `]
})
export class BackButtonComponent {
  @Input() link: any[] | string | null = null;
  @Input() text: string = 'Volver al Panel';
  @Output() onClick = new EventEmitter<void>();

  router = inject(Router);

  navigate() {
    if (this.onClick.observed) {
      this.onClick.emit();
      return;
    }

    const targetLink = this.link || ['/app/dashboard'];
    if (Array.isArray(targetLink)) {
      this.router.navigate(targetLink);
    } else {
      this.router.navigateByUrl(targetLink);
    }
  }
}
