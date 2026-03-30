import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './private-layout.component.html'
})
export class PrivateLayoutComponent implements OnInit {
  currentUser: User | null = null;
  isSidebarOpen = true;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
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

  logout() {
    this.authService.logout();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  get dashboardRoute(): string {
    const role = this.authService.getRole();
    if (role === 'administrative') return '/app/attendance/approvals';
    if (role === 'student') return '/app/dashboard/student';
    if (role === 'teacher') return '/app/dashboard/teacher';
    if (role === 'apoderado') return '/app/dashboard/apoderado';
    return '/app/dashboard';
  }
}
