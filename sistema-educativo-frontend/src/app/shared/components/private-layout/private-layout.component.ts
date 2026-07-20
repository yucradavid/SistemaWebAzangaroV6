import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { PeriodContextService } from '../../../core/services/period-context.service';
import { Period } from '../../../core/services/academic.service';
import { NotificationsBellComponent } from '../notifications-bell/notifications-bell.component';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsBellComponent],
  templateUrl: './private-layout.component.html'
})
export class PrivateLayoutComponent implements OnInit {
  currentUser: User | null = null;
  isSidebarOpen = true;

  private periodCtx = inject(PeriodContextService);
  periods: Period[] = [];
  selectedPeriodId: string | null = null;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Cargar periodos al entrar al area privada y reflejar la seleccion global.
    this.periodCtx.loadPeriods();
    this.periodCtx.periods$.subscribe(periods => {
      this.periods = periods;
    });
    this.periodCtx.selectedPeriod$.subscribe(period => {
      this.selectedPeriodId = period?.id ?? null;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Role-based redirection logic for initial landing on /app or accidental admin landing
      if (user && user.role === 'student' && 
          (this.router.url === '/app' || this.router.url === '/app/dashboard')) {
        this.router.navigate(['/app/dashboard/student']);
      }
      if (user && user.role === 'teacher' && 
          (this.router.url === '/app' || this.router.url === '/app/dashboard')) {
        this.router.navigate(['/app/dashboard/teacher']);
      }
      if (user && user.role === 'apoderado' && 
          (this.router.url === '/app' || this.router.url === '/app/dashboard')) {
        this.router.navigate(['/app/dashboard/apoderado']);
      }
      if (user && user.role === 'administrative' &&
          (this.router.url === '/app' || this.router.url === '/app/dashboard')) {
        this.router.navigate(['/app/attendance/approvals']);
      }
    });
  }

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const period = this.periods.find(p => p.id === select.value);
    if (period) {
      this.periodCtx.selectPeriod(period);
    }
  }

  logout() {
    this.authService.logout();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
