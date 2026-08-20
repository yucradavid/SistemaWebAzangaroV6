import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.css']
})
export class BackButtonComponent {
  @Input() link: any[] | string | null = null;
  @Input() text: string = 'Volver';
  @Input() fallback: string | any[] = 'history';
  @Output() onClick = new EventEmitter<void>();

  private router = inject(Router);
  private location = inject(Location);

  handleNavigation() {
    if (this.onClick.observed) {
      this.onClick.emit();
      return;
    }

    if (this.link) {
      Array.isArray(this.link)
        ? this.router.navigate(this.link)
        : this.router.navigateByUrl(this.link);
      return;
    }

    if (this.fallback === 'history') {
      this.location.back();
    } else if (Array.isArray(this.fallback)) {
      this.router.navigate(this.fallback);
    } else {
      this.router.navigateByUrl(this.fallback);
    }
  }
}
