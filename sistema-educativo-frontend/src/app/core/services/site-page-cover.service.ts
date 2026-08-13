import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SitePageCoverUrls {
  large: string;
  medium: string;
  small: string;
}

export interface SitePageCover {
  page_key: string;
  image_path: string | null;
  alt_text: string | null;
  object_position: string;
  urls: SitePageCoverUrls | null;
  updated_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class SitePageCoverService {
  private http = inject(HttpClient);

  private readonly adminUrl = `${environment.apiUrl}/site-page-covers`;
  private readonly publicUrl = `${environment.apiUrl}/public/site-page-covers`;

  private publicCovers$: Observable<{ data: SitePageCover[] }> | null = null;

  /** GET /api/site-page-covers — requiere rol admin|director */
  getCovers(): Observable<{ data: SitePageCover[] }> {
    return this.http.get<{ data: SitePageCover[] }>(this.adminUrl);
  }

  /** GET /api/public/site-page-covers — sin autenticación, cacheado en memoria */
  getPublicCovers(): Observable<{ data: SitePageCover[] }> {
    if (!this.publicCovers$) {
      this.publicCovers$ = this.http.get<{ data: SitePageCover[] }>(this.publicUrl).pipe(
        shareReplay(1)
      );
    }
    return this.publicCovers$;
  }

  uploadCover(pageKey: string, file: File, altText?: string, objectPosition?: string): Observable<{ data: SitePageCover }> {
    const formData = new FormData();
    formData.append('image', file);
    if (altText) {
      formData.append('alt_text', altText);
    }
    if (objectPosition) {
      formData.append('object_position', objectPosition);
    }

    return this.http.post<{ data: SitePageCover }>(`${this.adminUrl}/${pageKey}`, formData).pipe(
      tap(() => this.clearCache())
    );
  }

  updatePosition(pageKey: string, objectPosition: string): Observable<{ data: SitePageCover }> {
    return this.http.patch<{ data: SitePageCover }>(`${this.adminUrl}/${pageKey}/position`, {
      object_position: objectPosition,
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteCover(pageKey: string): Observable<{ data: SitePageCover }> {
    return this.http.delete<{ data: SitePageCover }>(`${this.adminUrl}/${pageKey}`).pipe(
      tap(() => this.clearCache())
    );
  }

  clearCache(): void {
    this.publicCovers$ = null;
  }
}
