import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Evaluation {
  id?: string;
  student_id: string;
  course_id: string;
  period_id: string;
  competency_id: string;
  grade: 'AD' | 'A' | 'B' | 'C' | null;
  comments?: string;
  status: 'borrador' | 'publicada' | 'cerrada';
  evaluated_by?: string;
  evaluated_at?: string;
}

export interface FinalCompetencyResult {
  id: string;
  student_id: string;
  academic_year_id: string;
  course_id: string;
  competency_id: string;
  final_level: 'AD' | 'A' | 'B' | 'C' | null;
  current_status?: string;
  requires_support?: boolean;
  has_consecutive_c?: boolean;
  evidence_note?: string;
  course?: {
    id: string;
    code?: string;
    name?: string;
  };
  competency?: {
    id: string;
    name?: string;
    description?: string;
  };
  source_period?: {
    id: string;
    name?: string;
    period_number?: number;
  };
}

export interface StudentFinalStatus {
  id: string;
  student_id: string;
  academic_year_id: string;
  grade_level_id: string;
  final_status: 'promociona' | 'recuperacion' | 'permanece' | 'pendiente';
  pending_competencies_count: number;
  recovery_required: boolean;
  decision_reason?: string;
  decided_at?: string;
}

export interface RecoveryResult {
  id: string;
  competency_id: string;
  course_id?: string;
  initial_level?: string;
  final_level?: string;
  is_resolved?: boolean;
  observations?: string;
  competency?: {
    id: string;
    name?: string;
    description?: string;
  };
  course?: {
    id: string;
    name?: string;
  };
}

export interface RecoveryProcess {
  id: string;
  student_id: string;
  academic_year_id: string;
  grade_level_id: string;
  status: string;
  referral_reason?: string;
  support_plan?: string;
  started_at?: string;
  ended_at?: string;
  results?: RecoveryResult[];
}

export interface DescriptiveConclusion {
  id: string;
  student_id: string;
  competency_id: string;
  period_id: string;
  academic_year_id: string;
  achievement_level: 'AD' | 'A' | 'B' | 'C' | null;
  conclusion_text?: string;
  difficulties?: string;
  recommendations?: string;
  support_actions?: string;
  competency?: {
    id: string;
    name?: string;
    description?: string;
  };
  period?: {
    id: string;
    name?: string;
  };
}

export interface EvaluationSummary {
  student: {
    id: string;
    full_name: string;
    student_code: string;
  };
  academic_year: {
    id: string;
    year: number;
  };
  grade_level?: {
    id: string;
    level: string;
    grade: number;
    name: string;
  } | null;
  rule?: any;
  totals: {
    competencies: number;
    ad: number;
    a: number;
    b: number;
    c: number;
  };
  enrolled_courses?: Array<{
    id: string;
    code?: string;
    name?: string;
  }>;
  areas: Array<{
    course_id: string;
    course_name?: string;
    total: number;
    ad_count: number;
    a_count: number;
    b_count: number;
    c_count: number;
    aad_count: number;
    min_level_value: number;
  }>;
  final_results: FinalCompetencyResult[];
  descriptive_conclusions: DescriptiveConclusion[];
  student_final_status?: StudentFinalStatus | null;
  recovery_process?: RecoveryProcess | null;
}

export interface SectionEvaluationDashboardStudent {
  id: string;
  full_name: string;
  student_code: string;
  section_id?: string | null;
  current_evaluation?: {
    id: string;
    grade: 'AD' | 'A' | 'B' | 'C' | null;
    comments?: string;
    status?: string;
  } | null;
  academic_summary: {
    final_status: 'promociona' | 'recuperacion' | 'permanece' | 'pendiente';
    pending_competencies_count: number;
    recovery_required: boolean;
    totals: {
      competencies: number;
      ad: number;
      a: number;
      b: number;
      c: number;
    };
    recovery_process?: {
      id: string;
      status: string;
      results_count: number;
    } | null;
    descriptive_conclusions: Array<{
      id: string;
      competency_id: string;
      period_id: string;
      conclusion_text?: string;
      recommendations?: string;
    }>;
  };
}

export interface SectionEvaluationDashboard {
  section: {
    id: string;
    label: string;
  };
  filters: {
    course_id?: string | null;
    period_id?: string | null;
    competency_id?: string | null;
  };
  stats: {
    students: number;
    graded: number;
    published: number;
    current_risk: number;
    status_breakdown: {
      promociona: number;
      recuperacion: number;
      permanece: number;
      pendiente: number;
    };
  };
  students: SectionEvaluationDashboardStudent[];
}

export interface TeacherEvaluationContext {
  teacher: any | null;
  active_academic_year: {
    id: string;
    year: number;
    is_active: boolean;
    start_date?: string;
    end_date?: string;
  } | null;
  periods: Array<{
    id: string;
    name: string;
    period_number?: number;
    is_closed?: boolean;
    academic_year_id?: string;
  }>;
  assignments: any[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/evaluations`;

  getEvaluations(params: any = {}): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  getTeacherEvaluationContext(): Observable<TeacherEvaluationContext> {
    return this.http.get<TeacherEvaluationContext>(`${this.apiUrl}/my-context`);
  }

  saveEvaluation(data: Partial<Evaluation>): Observable<Evaluation> {
    // EvaluationController.php uses updateOrCreate
    return this.http.post<Evaluation>(this.apiUrl, data);
  }

  updateEvaluation(id: string, data: Partial<Evaluation>): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${this.apiUrl}/${id}`, data);
  }

  publishEvaluation(id: string): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.apiUrl}/${id}/publish`, {});
  }

  closeEvaluation(id: string): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.apiUrl}/${id}/close`, {});
  }

  getFinalCompetencyResults(params: any = {}): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/final-competency-results`, { params });
  }

  getStudentFinalStatuses(params: any = {}): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/student-final-statuses`, { params });
  }

  getEvaluationSummary(academicYearId: string, studentId: string): Observable<EvaluationSummary> {
    return this.http.get<EvaluationSummary>(`${environment.apiUrl}/academic-years/${academicYearId}/students/${studentId}/evaluation-summary`);
  }

  recalculateStudentEvaluationSummary(academicYearId: string, studentId: string): Observable<EvaluationSummary> {
    return this.http.post<EvaluationSummary>(`${environment.apiUrl}/academic-years/${academicYearId}/students/${studentId}/evaluation-summary/recalculate`, {});
  }

  recalculateSectionEvaluationSummary(academicYearId: string, sectionId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/academic-years/${academicYearId}/sections/${sectionId}/evaluation-summary/recalculate`, {});
  }

  getSectionEvaluationDashboard(academicYearId: string, sectionId: string, params: any = {}): Observable<SectionEvaluationDashboard> {
    return this.http.get<SectionEvaluationDashboard>(`${environment.apiUrl}/academic-years/${academicYearId}/sections/${sectionId}/evaluation-dashboard`, { params });
  }

  deleteEvaluation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
