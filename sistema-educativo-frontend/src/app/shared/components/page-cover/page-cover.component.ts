import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SitePageCover, SitePageCoverService } from '@core/services/site-page-cover.service';

@Component({
  selector: 'app-page-cover',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full overflow-hidden">
      <ng-container *ngIf="cover?.urls; else fallback">
        <div class="absolute inset-0 bg-gradient-to-br from-cermat-blue-100 to-cermat-blue-50 animate-pulse transition-opacity duration-500"
             [class.opacity-0]="imageLoaded()"></div>

        <picture>
          <source media="(min-width: 1200px)" [srcset]="cover!.urls!.large" type="image/webp">
          <source media="(min-width: 600px)" [srcset]="cover!.urls!.medium" type="image/webp">
          <img
            [src]="cover!.urls!.small"
            [alt]="cover?.alt_text || 'Portada'"
            [style.object-position]="cover?.object_position || 'center center'"
            class="relative w-full h-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out will-change-[opacity,transform]"
            [class.opacity-0]="!imageLoaded()"
            [class.opacity-100]="imageLoaded()"
            [class.scale-105]="!imageLoaded()"
            [class.scale-100]="imageLoaded()"
            (load)="onImageLoad()"
            width="1920" height="421"
            [attr.loading]="priority ? 'eager' : 'lazy'">
        </picture>
      </ng-container>

      <ng-template #fallback>
        <img *ngIf="fallbackImageUrl; else fallbackColor"
             [src]="fallbackImageUrl"
             alt="Portada"
             class="w-full h-full object-cover">
        <ng-template #fallbackColor>
          <div [class]="fallbackGradient" class="w-full h-full"></div>
        </ng-template>
      </ng-template>
    </div>
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
  readonly imageLoaded = signal(false);

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

  onImageLoad(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.imageLoaded.set(true);
      });
    });
  }
}
