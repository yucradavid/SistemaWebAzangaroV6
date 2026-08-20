import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/backend.models';

export * from '../models/attendance.models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTeacherAttendanceContext(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/my-context`);
  }

  getStudentsForAttendance(courseId: string, sectionId: string, academicYearId?: string): Observable<PaginatedResponse<any>> {
    const params: Record<string, string | number> = {
      course_id: courseId,
      section_id: sectionId,
      status: 'active',
      per_page: 200,
    };
    if (academicYearId) {
      params['academic_year_id'] = academicYearId;
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/student-course-enrollments`, {
      params: this.buildParams(params),
    });
  }

  getStudentsForSectionAttendance(sectionId: string, academicYearId?: string): Observable<PaginatedResponse<any>> {
    const params: Record<string, string | number> = {
      section_id: sectionId,
      status: 'active',
      per_page: 400,
    };
    if (academicYearId) {
      params['academic_year_id'] = academicYearId;
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/student-course-enrollments`, {
      params: this.buildParams(params),
    });
  }

  getAttendanceHistory(params: any): Observable<PaginatedResponse<any>> {
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/attendance`, {
      params: this.buildParams(params),
    });
  }

  saveBatchAttendance(data: {
    date: string;
    course_id: string;
    section_id: string;
    records: Array<{ student_id: string; status: string; justification?: string | null }>;
  }): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(`${this.apiUrl}/attendance/batch`, data);
  }

  getJustifications(params?: any): Observable<PaginatedResponse<any>> {
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/attendance-justifications`, {
      params: this.buildParams(params),
    });
  }

  getAdminOverview(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/admin-overview`, {
      params: this.buildParams(params),
    });
  }

  getDailySectionAttendance(sectionId: string, academicYearId: string, date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/daily`, {
      params: this.buildParams({
        section_id: sectionId,
        academic_year_id: academicYearId,
        date,
      }),
    });
  }

  saveDailySectionAttendance(data: {
    section_id: string;
    academic_year_id: string;
    date: string;
    checkpoint: string;
    records: Array<{ student_id: string; status: string; note?: string | null }>;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/daily/batch`, data);
  }

  createDailyQrSession(data: {
    section_id: string;
    academic_year_id: string;
    date: string;
    checkpoint: string;
    expires_in_minutes?: number;
    late_after_minutes?: number;
    notes?: string | null;
  }): Observable<{ message: string; data: any }> {
    return this.http.post<{ message: string; data: any }>(`${this.apiUrl}/attendance/daily/qr-sessions`, data);
  }

  getDailyQrSessions(params: {
    section_id: string;
    academic_year_id: string;
    date?: string;
  }): Observable<PaginatedResponse<any> | { data: any[] }> {
    return this.http.get<PaginatedResponse<any> | { data: any[] }>(
      `${this.apiUrl}/attendance/daily/qr-sessions`,
      { params: this.buildParams(params) }
    );
  }

  closeDailyQrSession(id: string): Observable<{ message: string; data: any }> {
    return this.http.post<{ message: string; data: any }>(`${this.apiUrl}/attendance/daily/qr-sessions/${id}/close`, {});
  }

  submitStudentDailyQr(sessionCode: string): Observable<{
    message: string;
    checkpoint: string;
    session: any;
    processed_count: number;
  }> {
    return this.http.post<{
      message: string;
      checkpoint: string;
      session: any;
      processed_count: number;
    }>(`${this.apiUrl}/attendance/daily/self-checkpoint`, { session_code: sessionCode });
  }

  getMyDailyHistory(dateFrom?: string, dateTo?: string): Observable<any> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('date_from', dateFrom);
    if (dateTo) params = params.set('date_to', dateTo);
    return this.http.get(`${this.apiUrl}/attendance/daily/my-history`, { params });
  }

  createJustification(payload: {
    attendance_id: string;
    reason: string;
    guardian_id?: string;
    status?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance-justifications`, payload);
  }

  approveJustification(id: string, payload?: { review_notes?: string | null }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance-justifications/${id}/approve`, payload ?? {});
  }

  rejectJustification(id: string, payload: { review_notes: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance-justifications/${id}/reject`, payload);
  }

  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
