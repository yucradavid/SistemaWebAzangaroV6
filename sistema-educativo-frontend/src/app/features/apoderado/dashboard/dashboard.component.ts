import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { APODERADO_MODULES } from '@core/constants/apoderado-modules';
import { AdminModuleEntry } from '@core/constants/admin-modules';

@Component({
  selector: 'app-apoderado-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  modules: AdminModuleEntry[] = APODERADO_MODULES;

  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const role = this.authService.getRole();
    if (!['apoderado', 'guardian'].includes((role || '') as string)) {
      this.router.navigateByUrl(this.authService.getHomeRoute(role));
    }
  }

  sanitizeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
