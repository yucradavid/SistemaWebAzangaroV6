import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course, GradeLevel, Section } from './academic.service';

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AssignmentSection extends Section {
  grade_level?: GradeLevel;
}

export interface AssignmentMetrics {
  expected_count: number;
  submitted_count: number;
  graded_count: number;
  pending_count: number;
  missing_count: number;
  average_grade?: number | null;
}

export interface Assignment {
  id: string;
  course_id: string;
  section_id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  due_date?: string | null;
  max_score?: number | null;
  attachment_url?: string | null;
  created_by?: string;
  created_at?: string;
  course?: Pick<Course, 'id' | 'code' | 'name'>;
  section?: AssignmentSection;
  metrics?: AssignmentMetrics;
  timing_status?: 'overdue' | 'due_today' | 'upcoming' | 'undated';
  requires_attention?: boolean;
}

export interface TaskSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date?: string;
  content?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  status: 'submitted' | 'graded' | 'pending';
  grade?: number | null;
  grade_letter?: string | null;
  feedback?: string | null;
  graded_by?: string;
  graded_at?: string;
  assignment?: Assignment;
  student?: {
    id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    student_code?: string;
    section?: AssignmentSection;
  };
  grader?: {
    id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
}

export interface AssignmentSubmissionSummaryRow {
  student_id: string;
  student: {
    id: string;
    student_code?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    section?: AssignmentSection;
  };
  enrollment?: {
    id: string;
    status?: string;
    enrollment_date?: string;
  };
  submission?: TaskSubmission | null;
  status: 'missing' | 'submitted' | 'graded';
}

export interface AssignmentSubmissionSummaryResponse {
  assignment: Assignment;
  summary: AssignmentMetrics;
  rows: AssignmentSubmissionSummaryRow[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAssignments(params?: {
    course_id?: string;
    section_id?: string;
    student_id?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    history_scope?: boolean;
  }): Observable<PaginatedResponse<Assignment>> {
    return this.http.get<PaginatedResponse<Assignment>>(`${this.apiUrl}/assignments`, { params: params as any });
  }

  getAssignment(id: string): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.apiUrl}/assignments/${id}`);
  }

  getAssignmentSubmissionsSummary(id: string): Observable<AssignmentSubmissionSummaryResponse> {
    return this.http.get<AssignmentSubmissionSummaryResponse>(`${this.apiUrl}/assignments/${id}/submissions-summary`);
  }

  createAssignment(data: Partial<Assignment>): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.apiUrl}/assignments`, data);
  }

  updateAssignment(id: string, data: Partial<Assignment>): Observable<Assignment> {
    return this.http.put<Assignment>(`${this.apiUrl}/assignments/${id}`, data);
  }

  deleteAssignment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assignments/${id}`);
  }

  getSubmissions(params?: {
    assignment_id?: string;
    student_id?: string;
    course_id?: string;
    section_id?: string;
    status?: string;
  }): Observable<PaginatedResponse<TaskSubmission>> {
    return this.http.get<PaginatedResponse<TaskSubmission>>(`${this.apiUrl}/task-submissions`, { params: params as any });
  }

  gradeSubmission(submissionId: string, data: {
    grade: number;
    grade_letter?: string;
    feedback?: string;
    status?: string;
  }): Observable<{ message: string; data: TaskSubmission }> {
    return this.http.post<{ message: string; data: TaskSubmission }>(`${this.apiUrl}/task-submissions/${submissionId}/grade`, data);
  }

  createSubmission(data: Partial<TaskSubmission>): Observable<{ message: string; data: TaskSubmission }> {
    return this.http.post<{ message: string; data: TaskSubmission }>(`${this.apiUrl}/task-submissions`, data);
  }

  updateSubmission(id: string, data: Partial<TaskSubmission>): Observable<{ message: string; data: TaskSubmission }> {
    return this.http.put<{ message: string; data: TaskSubmission }>(`${this.apiUrl}/task-submissions/${id}`, data);
  }
}
