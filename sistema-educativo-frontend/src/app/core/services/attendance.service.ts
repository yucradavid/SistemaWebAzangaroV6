import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';
export type JustificationStatus = 'pendiente' | 'aprobada' | 'rechazada';
export type DailyAttendanceCheckpoint = 'entrada' | 'salida';

export interface GradeLevelSummary {
  id: string;
  name: string;
  level?: string;
  grade?: number;
}

export interface SectionSummary {
  id: string;
  section_letter?: string;
  grade_level?: GradeLevelSummary | null;
}

export interface CourseSummary {
  id: string;
  code?: string;
  name?: string;
}

export interface TeacherSummary {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface StudentSummary {
  id: string;
  first_name?: string;
  last_name?: string;
  student_code?: string;
}

export interface GuardianSummary {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface AcademicYearSummary {
  id: string;
  year?: number;
  is_active?: boolean;
}

export interface AttendanceAssignment {
  id: string;
  course_id: string;
  section_id: string;
  academic_year_id?: string;
  teacher_id?: string;
  is_active?: boolean;
  teacher?: TeacherSummary | null;
  course?: CourseSummary | null;
  section?: SectionSummary | null;
  academic_year?: AcademicYearSummary | null;
}

export interface TeacherAttendanceContextResponse {
  teacher: TeacherSummary | null;
  assignments: AttendanceAssignment[];
  message?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  section_id: string;
  date: string;
  status: AttendanceStatus;
  justification?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  student?: StudentSummary | null;
  course?: CourseSummary | null;
  section?: SectionSummary | null;
  justifications?: AttendanceJustification[];
}

export interface AttendanceJustification {
  id: string;
  attendance_id: string;
  guardian_id: string;
  reason: string;
  status: JustificationStatus;
  created_at: string;
  reviewed_at?: string | null;
  review_notes?: string | null;
  attendance?: AttendanceRecord | null;
  guardian?: GuardianSummary | null;
}

export interface AdminAttendanceAssignmentStatus {
  assignment_id: string;
  teacher_id?: string | null;
  teacher?: TeacherSummary | null;
  course_id: string;
  course?: CourseSummary | null;
  section_id: string;
  section?: SectionSummary | null;
  academic_year_id?: string | null;
  student_count: number;
  recorded_count: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  justified_count: number;
  pending_justifications_count: number;
  is_registered: boolean;
  completion_rate: number;
  last_recorded_at?: string | null;
}

export interface AdminAttendanceTeacherStatus {
  teacher_id?: string | null;
  teacher?: TeacherSummary | null;
  total_assignments: number;
  registered_assignments: number;
  pending_assignments: number;
  is_complete: boolean;
  pending_details: Array<{
    assignment_id: string;
    course?: CourseSummary | null;
    section?: SectionSummary | null;
    student_count: number;
  }>;
}

export interface AdminAttendanceOverview {
  date: string;
  summary: {
    assignments_total: number;
    assignments_registered: number;
    assignments_pending: number;
    students_expected: number;
    records_captured: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    justified_count: number;
    pending_justifications_count: number;
    coverage_rate: number;
  };
  teacher_statuses: AdminAttendanceTeacherStatus[];
  assignment_statuses: AdminAttendanceAssignmentStatus[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface AttendanceHistoryFilters {
  date?: string;
  date_from?: string;
  date_to?: string;
  student_id?: string;
  course_id?: string;
  section_id?: string;
  status?: AttendanceStatus;
  per_page?: number;
  history_scope?: boolean;
}

export interface AttendanceJustificationFilters {
  status?: JustificationStatus | '';
  guardian_id?: string;
  attendance_id?: string;
  student_id?: string;
  course_id?: string;
  section_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
}

export interface AdminAttendanceOverviewFilters {
  date?: string;
  course_id?: string;
  section_id?: string;
  teacher_id?: string;
}

export interface DailyAttendanceStudentRecord {
  student_id: string;
  student?: StudentSummary | null;
  entry_status?: AttendanceStatus | null;
  entry_note?: string | null;
  entry_marked_at?: string | null;
  entry_source?: string | null;
  exit_status?: AttendanceStatus | null;
  exit_note?: string | null;
  exit_marked_at?: string | null;
  exit_source?: string | null;
  effective_status?: AttendanceStatus | null;
}

export interface DailyAttendanceQrSession {
  id: string;
  section_id: string;
  academic_year_id: string;
  date: string;
  checkpoint_type: DailyAttendanceCheckpoint;
  session_code: string;
  token: string;
  status: 'activo' | 'cerrado' | 'expirado' | string;
  late_after_minutes: number;
  opened_at?: string | null;
  expires_at?: string | null;
  closed_at?: string | null;
  notes?: string | null;
  qr_payload: string;
}

export interface DailyAttendanceSectionResponse {
  date: string;
  section_id: string;
  academic_year_id: string;
  summary: {
    students_total: number;
    entry_present_count: number;
    entry_late_count: number;
    entry_absent_count: number;
    entry_justified_count: number;
    exit_recorded_count: number;
  };
  students: DailyAttendanceStudentRecord[];
  scheduled_courses: Array<{
    course_id: string;
    course_name?: string;
    course_code?: string;
    start_time?: string;
    end_time?: string;
  }>;
  uses_schedule: boolean;
  qr_sessions: DailyAttendanceQrSession[];
}

export interface DailyAttendanceBatchResponse {
  message: string;
  processed_count: number;
  skipped_count: number;
  propagated_records_count: number;
  skipped_students: Array<{
    student_id: string;
    reason: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTeacherAttendanceContext(): Observable<TeacherAttendanceContextResponse> {
    return this.http.get<TeacherAttendanceContextResponse>(`${this.apiUrl}/attendance/my-context`);
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

  getAttendanceHistory(params: AttendanceHistoryFilters): Observable<PaginatedResponse<AttendanceRecord>> {
    return this.http.get<PaginatedResponse<AttendanceRecord>>(`${this.apiUrl}/attendance`, {
      params: this.buildParams(params),
    });
  }

  saveBatchAttendance(data: {
    date: string;
    course_id: string;
    section_id: string;
    records: Array<{ student_id: string; status: AttendanceStatus; justification?: string | null }>;
  }): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(`${this.apiUrl}/attendance/batch`, data);
  }

  getJustifications(params?: AttendanceJustificationFilters): Observable<PaginatedResponse<AttendanceJustification>> {
    return this.http.get<PaginatedResponse<AttendanceJustification>>(`${this.apiUrl}/attendance-justifications`, {
      params: this.buildParams(params),
    });
  }

  getAdminOverview(params?: AdminAttendanceOverviewFilters): Observable<AdminAttendanceOverview> {
    return this.http.get<AdminAttendanceOverview>(`${this.apiUrl}/attendance/admin-overview`, {
      params: this.buildParams(params),
    });
  }

  getDailySectionAttendance(sectionId: string, academicYearId: string, date: string): Observable<DailyAttendanceSectionResponse> {
    return this.http.get<DailyAttendanceSectionResponse>(`${this.apiUrl}/attendance/daily`, {
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
    checkpoint: DailyAttendanceCheckpoint;
    records: Array<{ student_id: string; status: AttendanceStatus; note?: string | null }>;
  }): Observable<DailyAttendanceBatchResponse> {
    return this.http.post<DailyAttendanceBatchResponse>(`${this.apiUrl}/attendance/daily/batch`, data);
  }

  createDailyQrSession(data: {
    section_id: string;
    academic_year_id: string;
    date: string;
    checkpoint: DailyAttendanceCheckpoint;
    expires_in_minutes?: number;
    late_after_minutes?: number;
    notes?: string | null;
  }): Observable<{ message: string; data: DailyAttendanceQrSession }> {
    return this.http.post<{ message: string; data: DailyAttendanceQrSession }>(`${this.apiUrl}/attendance/daily/qr-sessions`, data);
  }

  getDailyQrSessions(params: {
    section_id: string;
    academic_year_id: string;
    date?: string;
  }): Observable<PaginatedResponse<DailyAttendanceQrSession> | { data: DailyAttendanceQrSession[] }> {
    return this.http.get<PaginatedResponse<DailyAttendanceQrSession> | { data: DailyAttendanceQrSession[] }>(
      `${this.apiUrl}/attendance/daily/qr-sessions`,
      { params: this.buildParams(params) }
    );
  }

  closeDailyQrSession(id: string): Observable<{ message: string; data: DailyAttendanceQrSession }> {
    return this.http.post<{ message: string; data: DailyAttendanceQrSession }>(`${this.apiUrl}/attendance/daily/qr-sessions/${id}/close`, {});
  }

  submitStudentDailyQr(sessionCode: string): Observable<{
    message: string;
    checkpoint: DailyAttendanceCheckpoint;
    session: DailyAttendanceQrSession;
    processed_count: number;
  }> {
    return this.http.post<{
      message: string;
      checkpoint: DailyAttendanceCheckpoint;
      session: DailyAttendanceQrSession;
      processed_count: number;
    }>(`${this.apiUrl}/attendance/daily/self-checkpoint`, { session_code: sessionCode });
  }

  createJustification(payload: {
    attendance_id: string;
    reason: string;
    guardian_id?: string;
    status?: JustificationStatus;
  }): Observable<AttendanceJustification> {
    return this.http.post<AttendanceJustification>(`${this.apiUrl}/attendance-justifications`, payload);
  }

  approveJustification(id: string, payload?: { review_notes?: string | null }): Observable<AttendanceJustification> {
    return this.http.post<AttendanceJustification>(`${this.apiUrl}/attendance-justifications/${id}/approve`, payload ?? {});
  }

  rejectJustification(id: string, payload: { review_notes: string }): Observable<AttendanceJustification> {
    return this.http.post<AttendanceJustification>(`${this.apiUrl}/attendance-justifications/${id}/reject`, payload);
  }

  private buildParams(
    params?:
      | Record<string, string | number | boolean | null | undefined>
      | AttendanceHistoryFilters
      | AttendanceJustificationFilters
      | AdminAttendanceOverviewFilters
  ): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
