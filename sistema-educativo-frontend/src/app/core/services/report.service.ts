import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StudentAttendanceJustificationData {
  id: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  reason: string;
  review_notes: string | null;
  reviewed_at?: string | null;
}

export interface StudentAttendanceRecord {
  id: string;
  date: string;
  status: 'presente' | 'tarde' | 'falta' | 'justificado';
  justification: string | null;
  course_id: string;
  course_name: string;
  course_code: string;
  justification_data?: StudentAttendanceJustificationData | string | null;
}

export interface StudentAttendanceSummaryResponse {
  student_id: string;
  filters: {
    date_from?: string;
    date_to?: string;
  };
  counts_by_status: Array<{
    status: 'presente' | 'tarde' | 'falta' | 'justificado';
    total: number;
  }>;
  records: StudentAttendanceRecord[];
  recent: StudentAttendanceRecord[];
  daily_records?: StudentDailyAttendanceRecord[];
  today_record?: StudentDailyAttendanceRecord | null;
}

export interface StudentDailyAttendanceRecord {
  id: string;
  student_id: string;
  section_id: string;
  academic_year_id: string;
  date: string;
  entry_status?: 'presente' | 'tarde' | 'falta' | 'justificado' | null;
  entry_note?: string | null;
  entry_marked_at?: string | null;
  entry_source?: string | null;
  exit_status?: 'presente' | 'tarde' | 'falta' | 'justificado' | null;
  exit_note?: string | null;
  exit_marked_at?: string | null;
  exit_source?: string | null;
  effective_status?: 'presente' | 'tarde' | 'falta' | 'justificado' | null;
}

export interface StudentReportCardCompetency {
  evaluation_id: string;
  competency_id: string;
  competency_name: string;
  grade: 'AD' | 'A' | 'B' | 'C' | null;
  status: 'borrador' | 'publicada' | 'cerrada' | string;
  comments: string;
}

export interface StudentReportCardCourse {
  course_id: string;
  course_name: string;
  course_code?: string | null;
  period_id: string;
  period_name: string;
  competencies: StudentReportCardCompetency[];
}

export interface StudentReportCardResponse {
  student: {
    id: string;
    full_name?: string | null;
    dni?: string | null;
    student_code?: string | null;
  };
  filters: {
    period_id?: string | null;
  };
  report: StudentReportCardCourse[];
}

export interface StudentFinancialCharge {
  id: string;
  student_id: string;
  academic_year_id?: string | null;
  concept_id?: string | null;
  concept_name: string;
  type: string;
  status: 'pendiente' | 'pagado_parcial' | 'pagado' | 'vencido' | 'anulado' | string;
  amount: number;
  discount_amount: number;
  paid_amount: number;
  due_date?: string | null;
  notes: string;
  voided_at?: string | null;
  void_reason?: string | null;
  created_at?: string | null;
}

export interface StudentFinancialPayment {
  id: string;
  student_id: string;
  charge_id?: string | null;
  academic_year_id?: string | null;
  concept_name: string;
  amount: number;
  method: string;
  reference?: string | null;
  paid_at?: string | null;
  notes: string;
  voided_at?: string | null;
  void_reason?: string | null;
  receipt_number?: string | null;
  receipt_total?: number | null;
  receipt_issued_at?: string | null;
  created_at?: string | null;
}

export interface StudentFinancialSummaryResponse {
  student_id: string;
  filters: {
    academic_year_id?: string | null;
  };
  totals: {
    total_amount: number;
    total_discount: number;
    net_total: number;
    paid_total: number;
    pending_total: number;
  };
  charges: StudentFinancialCharge[];
  payments: StudentFinancialPayment[];
}

export interface SectionAttendanceReportRow {
  student_id: string;
  student_code: string;
  student_name: string;
  attendance_percentage: number;
  total_absences: number;
  total_tardies: number;
  total_justifications: number;
}

export interface SectionAttendanceReportResponse {
  section: {
    id: string;
    label: string;
  };
  filters: {
    academic_year_id?: string | null;
    period_id?: string | null;
    period_name?: string | null;
    date_from?: string | null;
    date_to?: string | null;
  };
  stats: {
    students_count: number;
    avg_attendance: number;
    total_absences: number;
    total_tardies: number;
    total_justifications: number;
  };
  rows: SectionAttendanceReportRow[];
}

export interface SectionEvaluationReportCompetency {
  id: string;
  description: string;
  course_name?: string;
}

export interface SectionEvaluationReportRow {
  student_id: string;
  student_code: string;
  student_name: string;
  competencies: Record<string, string>;
  final_grade: string;
}

export interface SectionEvaluationReportResponse {
  section: {
    id: string;
    label: string;
  };
  filters: {
    academic_year_id?: string | null;
    period_id?: string | null;
    course_id?: string | null;
  };
  stats: {
    students_count: number;
    students_at_risk: number;
    grade_distribution: {
      AD: number;
      A: number;
      B: number;
      C: number;
    };
  };
  competencies: SectionEvaluationReportCompetency[];
  rows: SectionEvaluationReportRow[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  getReportCard(studentId: string, periodId?: string): Observable<StudentReportCardResponse> {
    let params = new HttpParams();
    if (periodId) params = params.set('period_id', periodId);
    return this.http.get<StudentReportCardResponse>(`${this.apiUrl}/reports/students/${studentId}/report-card`, { params });
  }

  getAttendanceSummary(studentId: string, dateFrom?: string, dateTo?: string): Observable<StudentAttendanceSummaryResponse> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('date_from', dateFrom);
    if (dateTo) params = params.set('date_to', dateTo);
    return this.http.get<StudentAttendanceSummaryResponse>(`${this.apiUrl}/reports/students/${studentId}/attendance`, { params });
  }

  getFinancialSummary(studentId: string, academicYearId?: string): Observable<StudentFinancialSummaryResponse> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academic_year_id', academicYearId);
    return this.http.get<StudentFinancialSummaryResponse>(`${this.apiUrl}/reports/students/${studentId}/financial`, { params });
  }

  getSectionAttendanceReport(
    sectionId: string,
    params: Record<string, string | null | undefined> = {}
  ): Observable<SectionAttendanceReportResponse> {
    return this.http.get<SectionAttendanceReportResponse>(
      `${this.apiUrl}/reports/sections/${sectionId}/attendance-summary`,
      { params: this.buildParams(params) }
    );
  }

  getSectionEvaluationReport(
    sectionId: string,
    params: Record<string, string | null | undefined> = {}
  ): Observable<SectionEvaluationReportResponse> {
    return this.http.get<SectionEvaluationReportResponse>(
      `${this.apiUrl}/reports/sections/${sectionId}/evaluation-summary`,
      { params: this.buildParams(params) }
    );
  }

  private buildParams(values: Record<string, string | null | undefined>): HttpParams {
    let params = new HttpParams();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return params;
  }
}
