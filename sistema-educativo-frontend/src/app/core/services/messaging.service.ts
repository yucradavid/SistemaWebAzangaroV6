import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: 'borrador' | 'pendiente_aprobacion' | 'publicado' | 'archivado';
  audience: 'todos' | 'docentes' | 'estudiantes' | 'apoderados' | 'seccion_especifica';
  priority?: string | null;
  attachment_url?: string | null;
  section_id?: string;
  created_by?: string;
  approved_by?: string;
  published_at?: string;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
  creator?: any;
  approver?: any;
  section?: any;
}

export type MessageSenderRole =
  | 'admin'
  | 'director'
  | 'coordinator'
  | 'secretary'
  | 'teacher'
  | 'guardian';

export interface Message {
  id: string;
  student_id: string;
  sender_role: MessageSenderRole;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at?: string;
  student?: any;
  sender?: any;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  status: 'no_leida' | 'leida';
  title?: string | null;
  message?: string | null;
  data?: Record<string, unknown> | null;
  link?: string | null;
  created_at?: string;
  read_at?: string | null;
}

export interface AnnouncementFilters {
  status?: string;
  audience?: string;
}

export interface MessageFilters {
  student_id?: string;
  sender_role?: MessageSenderRole;
  is_read?: boolean;
}

export interface NotificationFilters {
  status?: 'no_leida' | 'leida';
  type?: string;
}

export interface MessageThreadSummary {
  student_id: string;
  student?: {
    id: string;
    student_code?: string;
    full_name?: string;
    section?: {
      id: string;
      section_letter?: string;
      grade_level?: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
  last_message?: {
    id: string;
    content: string;
    sender_role: MessageSenderRole;
    sender_id: string;
    created_at?: string;
    sender?: any;
  } | null;
  last_message_at?: string;
  last_message_preview?: string;
  last_sender_role?: MessageSenderRole;
  total_messages: number;
  unread_count: number;
}

export interface MessageThreadFilters {
  student_id?: string;
  course_id?: string;
  section_id?: string;
  academic_year_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Announcements ---
  getAnnouncements(filters?: AnnouncementFilters): Observable<PaginatedResponse<Announcement>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.audience) params = params.set('audience', filters.audience);
    }
    return this.http.get<PaginatedResponse<Announcement>>(`${this.apiUrl}/announcements`, { params });
  }

  getAnnouncement(id: string): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/announcements/${id}`);
  }

  createAnnouncement(data: Partial<Announcement>): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/announcements`, data);
  }

  updateAnnouncement(id: string, data: Partial<Announcement>): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.apiUrl}/announcements/${id}`, data);
  }

  deleteAnnouncement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/announcements/${id}`);
  }

  requestApproval(id: string): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/announcements/${id}/request-approval`, {});
  }

  approveAnnouncement(id: string): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/announcements/${id}/approve`, {});
  }

  archiveAnnouncement(id: string, data: { review_comment?: string } = {}): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/announcements/${id}/archive`, data);
  }

  // --- Messages ---
  getMessages(filters?: MessageFilters): Observable<PaginatedResponse<Message>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.student_id) params = params.set('student_id', filters.student_id);
      if (filters.sender_role) params = params.set('sender_role', filters.sender_role);
      if (filters.is_read !== undefined) params = params.set('is_read', String(filters.is_read));
    }
    return this.http.get<PaginatedResponse<Message>>(`${this.apiUrl}/messages`, { params });
  }

  getMessageThreads(filters?: MessageThreadFilters): Observable<PaginatedResponse<MessageThreadSummary>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.student_id) params = params.set('student_id', filters.student_id);
      if (filters.course_id) params = params.set('course_id', filters.course_id);
      if (filters.section_id) params = params.set('section_id', filters.section_id);
      if (filters.academic_year_id) params = params.set('academic_year_id', filters.academic_year_id);
    }

    return this.http.get<PaginatedResponse<MessageThreadSummary>>(`${this.apiUrl}/messages/threads`, { params });
  }

  sendMessage(data: Pick<Message, 'student_id' | 'content'>): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, data);
  }

  markAsRead(id: string, data: { is_read: boolean }): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/messages/${id}`, data);
  }

  // --- Notifications ---
  getNotifications(filters?: NotificationFilters): Observable<PaginatedResponse<NotificationItem>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.type) params = params.set('type', filters.type);
    }

    return this.http.get<PaginatedResponse<NotificationItem>>(`${this.apiUrl}/notifications`, { params });
  }

  createNotification(data: Partial<NotificationItem>): Observable<NotificationItem> {
    return this.http.post<NotificationItem>(`${this.apiUrl}/notifications`, data);
  }

  markNotificationAsRead(id: string): Observable<NotificationItem> {
    return this.http.put<NotificationItem>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/notifications/read-all`, {});
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notifications/${id}`);
  }
}
