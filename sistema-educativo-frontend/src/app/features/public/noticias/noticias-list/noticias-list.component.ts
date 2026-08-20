//src/app/features/public/noticias/noticias-list/noticias-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { NewsService, NewsItem as ApiNewsItem } from '@core/services/news.service';

interface PublicNewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  featured: boolean;
}

@Component({
  selector: 'app-noticias-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './noticias-list.component.html',
  styleUrl: './noticias-list.component.css'
})
export class NoticiasListComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly newsService = inject(NewsService);

  readonly news = signal<PublicNewsItem[]>([]);
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.seoService.updateTitle('Noticias y Eventos - CERMAT SCHOOL');
    this.loadNews();
  }

  private loadNews(): void {
    this.loading = true;
    this.error = null;

    this.newsService.getPublishedNews({ per_page: 6 }).subscribe({
      next: (res) => {
        this.news.set(res.data.map(item => this.mapNewsItem(item)));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudieron cargar las noticias.';
        this.loading = false;
      }
    });
  }

  private mapNewsItem(item: ApiNewsItem): PublicNewsItem {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      image: item.imageUrl ?? '',
      date: item.date ?? item.publishedAt ?? '',
      category: item.category,
      featured: item.featured,
    };
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}



