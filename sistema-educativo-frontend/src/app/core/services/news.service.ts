// src/app/core/services/news.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';


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
  date: string | null;         
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


export interface PublicNewsParams {
  page?: number;
  per_page?: number;
  category?: string;
  featured?: boolean;
  q?: string;
}

export interface AdminNewsParams {
  page?: number;
  per_page?: number;
  status?: string;
  category?: string;

  is_featured?: boolean;

  q?: string;
}

export interface CreateNewsPayload {
  title: string;
  excerpt: string;
  content?: string;
  image_url?: string;
  category?: 'institucional' | 'academico' | 'eventos' | 'comunicados';
  author?: string;
  status?: 'borrador' | 'publicado' | 'archivado';
  is_featured?: boolean;
  published_at?: string;
}

export type UpdateNewsPayload = Partial<CreateNewsPayload>;


@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);

  /** Rutas según Postman collection */
private readonly adminUrl = 'http://localhost:8000/api/public-news';
private readonly publicUrl = 'http://localhost:8000/api/public/news';
  /** Cache simple para el módulo público */
  private newsCache$ = new BehaviorSubject<NewsItem[] | null>(null);

  // ──────────────────────────────────────────────
  // PÚBLICO — sin autenticación
  // ──────────────────────────────────────────────

  /**
   * GET /api/public/news
   * Lista solo noticias con status=publicado y published_at <= ahora.
   * Filtros: category, featured, q, per_page, page
   */
  getPublishedNews(params?: PublicNewsParams): Observable<NewsResponse> {
    const httpParams = this.buildParams(params ?? {});

    return this.http.get<NewsResponse>(this.publicUrl, { params: httpParams }).pipe(
      tap(res => { if (res?.data) this.newsCache$.next(res.data); }),
      catchError(err => { console.error('[NewsService] getPublishedNews:', err); throw err; }),
      shareReplay(1)
    );
  }

  /**
   * GET /api/public/news/:slug
   * Obtiene una noticia por slug (route model binding).
   */
  getNewsBySlug(slug: string): Observable<{ data: NewsItem }> {
    return this.http.get<{ data: NewsItem }>(`${this.publicUrl}/${slug}`).pipe(
      catchError(err => { console.error('[NewsService] getNewsBySlug:', err); throw err; })
    );
  }

  // ──────────────────────────────────────────────
  // ADMIN — requiere Bearer token
  // ──────────────────────────────────────────────

  /**
   * GET /api/public-news
   * Lista noticias de cualquier estado.
   * Requiere rol: admin | director | coordinator | secretary | web_editor
   */
  getAllNews(params?: AdminNewsParams): Observable<NewsResponse> {
    const httpParams = this.buildParams(params ?? {});
    return this.http.get<NewsResponse>(this.adminUrl, { params: httpParams });
  }

  /**
   * GET /api/public-news/:id
   * Obtiene una noticia por UUID.
   */
  getNewsById(id: string): Observable<{ data: NewsItem }> {
    return this.http.get<{ data: NewsItem }>(`${this.adminUrl}/${id}`);
  }

  /**
   * POST /api/public-news
   * Crea una noticia nueva. Si status=publicado y no envías published_at,
   * el backend lo completa con la fecha/hora actual.
   */
  createNews(data: CreateNewsPayload): Observable<{ data: NewsItem }> {
    return this.http.post<{ data: NewsItem }>(this.adminUrl, data).pipe(
      tap(() => this.newsCache$.next(null)),
      catchError(err => { console.error('[NewsService] createNews:', err); throw err; })
    );
  }

  /**
   * PUT /api/public-news/:id
   * Actualización completa. El backend acepta actualización parcial aunque uses PUT.
   * Si envías title sin slug, el backend regenera el slug.
   */
  updateNews(id: string, data: UpdateNewsPayload): Observable<{ data: NewsItem }> {
    return this.http.put<{ data: NewsItem }>(`${this.adminUrl}/${id}`, data).pipe(
      tap(() => this.newsCache$.next(null)),
      catchError(err => { console.error('[NewsService] updateNews:', err); throw err; })
    );
  }

  /**
   * PATCH /api/public-news/:id
   * Actualización parcial. Útil para cambios rápidos como publicar o destacar.
   *
   * Ejemplos comunes del Postman:
   *   patchNews(id, { status: 'publicado' })       → Publicar noticia
   *   patchNews(id, { status: 'archivado' })        → Archivar noticia
   *   patchNews(id, { is_featured: true })          → Destacar noticia
   *   patchNews(id, { status: 'publicado', is_featured: true })
   */
  patchNews(id: string, data: UpdateNewsPayload): Observable<{ data: NewsItem }> {
    return this.http.patch<{ data: NewsItem }>(`${this.adminUrl}/${id}`, data).pipe(
      tap(() => this.newsCache$.next(null)),
      catchError(err => { console.error('[NewsService] patchNews:', err); throw err; })
    );
  }

  /**
   * DELETE /api/public-news/:id
   * Elimina la noticia. La respuesta esperada es 204 No Content.
   */
  deleteNews(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`).pipe(
      tap(() => this.newsCache$.next(null)),
      catchError(err => { console.error('[NewsService] deleteNews:', err); throw err; })
    );
  }

  // ──────────────────────────────────────────────
  // Helpers de acceso directo (shortcuts del Postman)
  // ──────────────────────────────────────────────

  /** Publica una noticia (PATCH status=publicado) */
  publishNews(id: string): Observable<{ data: NewsItem }> {
    return this.patchNews(id, { status: 'publicado' });
  }

  /** Archiva una noticia (PATCH status=archivado) */
  archiveNews(id: string): Observable<{ data: NewsItem }> {
    return this.patchNews(id, { status: 'archivado' });
  }

  /** Marca/desmarca como destacada (PATCH is_featured) */
  toggleFeatured(id: string, featured: boolean): Observable<{ data: NewsItem }> {
    return this.patchNews(id, { is_featured: featured });
  }

  // ──────────────────────────────────────────────
  // Cache
  // ──────────────────────────────────────────────

  getCachedNews(): Observable<NewsItem[] | null> {
    return this.newsCache$.asObservable();
  }

  clearCache(): void {
    this.newsCache$.next(null);
  }

  // ──────────────────────────────────────────────
  // Util privado
  // ──────────────────────────────────────────────

  private buildParams<T extends Record<string, any>>(params: T): HttpParams {
  let p = new HttpParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      p = p.set(key, String(val));
    }
  });
  return p;
}
}
