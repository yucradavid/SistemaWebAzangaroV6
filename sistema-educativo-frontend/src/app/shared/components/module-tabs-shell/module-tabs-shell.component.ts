import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModuleTab } from '@core/constants/apoderado-modules';

@Component({
  selector: 'app-module-tabs-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-tabs-shell.component.html'
})
export class ModuleTabsShellComponent {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  get tabs(): ModuleTab[] {
    return this.route.snapshot.data['tabs'] || [];
  }

  get title(): string {
    return this.route.snapshot.data['moduleTitle'] || '';
  }

  sanitizeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
