import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, shareReplay } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  category: 'institucional' | 'academico' | 'eventos' | 'comunicados';
  author: string;
  status: 'borrador' | 'publicado' | 'archivado';
  featured: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  createdBy?: string;
  updatedBy?: string;
}

export interface NewsResponse {
  data: NewsItem[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private http = inject(HttpClient);
  private baseUrl = '/api/public/news';
  private adminBaseUrl = '/api/public-news';

  private newsCache$ = new BehaviorSubject<NewsItem[] | null>(null);

  /**
   * Obtener noticias publicadas (público, sin autenticación)
   */
  getPublishedNews(params?: {
    page?: number;
    per_page?: number;
    category?: string;
    featured?: boolean;
    q?: string;
  }): Observable<NewsResponse> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.featured !== undefined) httpParams = httpParams.set('featured', params.featured.toString());
    if (params?.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<NewsResponse>(this.baseUrl, { params: httpParams }).pipe(
      tap(response => {
        if (response?.data) {
          this.newsCache$.next(response.data);
        }
      }),
      catchError(error => {
        console.error('Error fetching published news:', error);
        throw error;
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtener noticia por slug (público)
   */
  getNewsBySlug(slug: string): Observable<{ data: NewsItem }> {
    return this.http.get<{ data: NewsItem }>(`${this.baseUrl}/${slug}`).pipe(
      catchError(error => {
        console.error(`Error fetching news with slug ${slug}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtener todas las noticias (admin, con autenticación)
   */
  getAllNews(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    category?: string;
    is_featured?: boolean;
    q?: string;
  }): Observable<NewsResponse> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.is_featured !== undefined) httpParams = httpParams.set('is_featured', params.is_featured.toString());
    if (params?.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<NewsResponse>(this.adminBaseUrl, { params: httpParams });
  }

  /**
   * Obtener una noticia por ID (admin)
   */
  getNewsById(id: string): Observable<{ data: NewsItem }> {
    return this.http.get<{ data: NewsItem }>(`${this.adminBaseUrl}/${id}`);
  }

  /**
   * Crear noticia (admin)
   */
  createNews(data: {
    title: string;
    excerpt: string;
    content?: string;
    image_url?: string;
    category?: string;
    author?: string;
    status?: string;
    is_featured?: boolean;
    published_at?: string;
  }): Observable<{ data: NewsItem }> {
    return this.http.post<{ data: NewsItem }>(this.adminBaseUrl, data).pipe(
      tap(() => this.newsCache$.next(null)), // Invalidate cache
      catchError(error => {
        console.error('Error creating news:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar noticia (admin)
   */
  updateNews(id: string, data: Partial<{
    title: string;
    excerpt: string;
    content: string;
    image_url: string;
    category: string;
    author: string;
    status: string;
    is_featured: boolean;
    published_at: string;
  }>): Observable<{ data: NewsItem }> {
    return this.http.put<{ data: NewsItem }>(`${this.adminBaseUrl}/${id}`, data).pipe(
      tap(() => this.newsCache$.next(null)), // Invalidate cache
      catchError(error => {
        console.error(`Error updating news ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Eliminar noticia (admin)
   */
  deleteNews(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminBaseUrl}/${id}`).pipe(
      tap(() => this.newsCache$.next(null)), // Invalidate cache
      catchError(error => {
        console.error(`Error deleting news ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtener caché de noticias
   */
  getCachedNews(): Observable<NewsItem[] | null> {
    return this.newsCache$.asObservable();
  }

  /**
   * Limpiar caché
   */
  clearCache(): void {
    this.newsCache$.next(null);
  }
}
