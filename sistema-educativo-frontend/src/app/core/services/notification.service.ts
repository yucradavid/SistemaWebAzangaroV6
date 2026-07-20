import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  message?: string;
  status: 'no_leida' | 'leida';
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  created_at?: string;
  read_at?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  getNotifications(params: any = {}): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.put<AppNotification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/read-all`, {});
  }
}
