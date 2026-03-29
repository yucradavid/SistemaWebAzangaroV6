import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { ADMIN_MODULES_LIST, AdminModuleEntry } from '@core/constants/admin-modules';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  modules: AdminModuleEntry[] = ADMIN_MODULES_LIST;
  activeModule: AdminModuleEntry | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    const role = this.authService.getRole();
    if (!this.authService.isAdminWorkspaceRole(role)) {
      this.router.navigateByUrl(this.authService.getHomeRoute(role));
      return;
    }

    this.modules = ADMIN_MODULES_LIST.filter((module) => module.roles.includes((role || '') as string));
  }

  sanitizeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  openModule(module: AdminModuleEntry, event: Event): void {
    if (module.submodules && module.submodules.length > 0) {
      event.preventDefault();
      this.activeModule = module;
    }
  }

  backToMain(): void {
    this.activeModule = null;
  }
}

