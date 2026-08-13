import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SitePageCover, SitePageCoverService } from '@core/services/site-page-cover.service';

@Component({
  selector: 'app-page-cover',
  standalone: true,
  imports: [CommonModule],
  template: `
    <picture *ngIf="cover?.urls; else fallback">
      <source media="(min-width: 1200px)" [srcset]="cover!.urls!.large" type="image/webp">
      <source media="(min-width: 600px)" [srcset]="cover!.urls!.medium" type="image/webp">
      <img
        [src]="cover!.urls!.small"
        [alt]="cover?.alt_text || 'Portada'"
        [style.object-position]="cover?.object_position || 'center center'"
        class="w-full h-full object-cover"
        width="1920" height="421"
        [attr.loading]="priority ? 'eager' : 'lazy'">
    </picture>

    <ng-template #fallback>
      <img *ngIf="fallbackImageUrl; else fallbackColor"
           [src]="fallbackImageUrl"
           alt="Portada"
           class="w-full h-full object-cover">
      <ng-template #fallbackColor>
        <div [class]="fallbackGradient" class="w-full h-full"></div>
      </ng-template>
    </ng-template>
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
    }
  `]
})
export class PageCoverComponent implements OnInit {
  @Input({ required: true }) pageKey!: string;
  @Input() fallbackGradient = '';
  @Input() fallbackImageUrl?: string;
  @Input() priority = true;

  cover: SitePageCover | null = null;

  constructor(private coverService: SitePageCoverService) {}

  ngOnInit(): void {
    this.coverService.getPublicCovers().subscribe({
      next: (res) => {
        this.cover = res.data.find(c => c.page_key === this.pageKey) ?? null;
      },
      error: () => {
        this.cover = null;
      }
    });
  }
}
