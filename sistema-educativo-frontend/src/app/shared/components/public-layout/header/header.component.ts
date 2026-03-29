import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DataService } from '../../../../core/services/data_general/data.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
   private readonly dataService = inject(DataService);
  private readonly router = inject(Router);

  readonly schoolInfo = this.dataService.schoolInfo;
  readonly isScrolled = signal(false);
  readonly isMobileMenuOpen = signal(false);

  readonly menuItems = [
    { label: 'Inicio', route: '/' },
    { label: 'Admisión', route: '/admision' },
    { label: 'Niveles', route: '/niveles' },
    { label: 'Docentes', route: '/docentes' },
    { label: 'Noticias', route: '/noticias' },
    { label: 'Transparencia', route: '/transparencia' },
    { label: 'Contacto', route: '/contacto' }
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

}
