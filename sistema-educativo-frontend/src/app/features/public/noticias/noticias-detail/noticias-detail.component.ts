import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { NewsService, NewsItem } from '@core/services/news.service';

@Component({
  selector: 'app-noticias-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './noticias-detail.component.html',
  styleUrl: './noticias-detail.component.css'
})
export class NoticiasDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly newsService = inject(NewsService);

  noticia: NewsItem | null = null;
  otherNews: NewsItem[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? this.route.snapshot.paramMap.get('id');
    if (!slug) {
      this.error = 'No se encontró la noticia.';
      return;
    }

    this.loadNoticia(slug);
  }

  private loadNoticia(slug: string): void {
    this.loading = true;
    this.error = null;

    this.newsService.getNewsBySlug(slug).subscribe({
      next: (res) => {
        this.noticia = res.data;
        this.seoService.updateTitle(`${this.noticia.title} - CERMAT SCHOOL`);
        this.loading = false;
        this.loadOtherNews(this.noticia.slug);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudo cargar la noticia.';
        this.loading = false;
      }
    });
  }

  private loadOtherNews(currentSlug: string): void {
    this.newsService.getPublishedNews({ per_page: 4 }).subscribe({
      next: (res) => {
        this.otherNews = res.data.filter(n => n.slug !== currentSlug).slice(0, 3);
      },
      error: () => {
        this.otherNews = [];
      }
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

}

