import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcademicYear } from '../models/AcademicYear';

export interface ApiMessageResponse {
  message: string;
}

export interface ApiDataResponse<T> extends ApiMessageResponse {
  data: T;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from?: number | null;
  next_page_url?: string | null;
  path?: string;
  per_page?: number;
  prev_page_url?: string | null;
  to?: number | null;
}

export type CollectionApiResponse<T> =
  | T[]
  | { data: T[] }
  | PaginatedResponse<T>
  | { data: PaginatedResponse<T> };

export interface GradeLevel {
  id: string;
  name: string;
  level: string;
  grade: number;
  sections_count?: number;
  courses_count?: number;
}

export interface Section {
  id: string;
  name?: string;
  section_letter?: string;
  academic_year_id: string;
  grade_level_id: string;
  capacity: number;
  vacancies?: number;
  is_active: boolean;
  students_count?: number;
  student_course_enrollments_count?: number;
  teacher_course_assignments_count?: number;
  course_schedules_count?: number;
  assignments_count?: number;
  announcements_count?: number;
  attendances_count?: number;
  grade_level?: GradeLevel;
  academic_year?: AcademicYear;
}

export interface Period {
  id: string;
  name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  period_number: number;
  academic_year?: AcademicYear;
  academicYear?: AcademicYear;
}

export interface AcademicPeriodHistorySummary {
  period?: {
    id: string;
    name: string;
    period_number: number;
    is_closed: boolean;
  };
  academic_year?: {
    id: string;
    year?: number | string;
  };
  totals?: {
    students_count: number;
    evaluations_count: number;
    attendance_count: number;
    assignments_count: number;
    task_submissions_count: number;
    assignment_submissions_count: number;
    messages_count: number;
  };
  coverage?: {
    students_with_evaluations: number;
    students_with_attendance: number;
    students_with_assignments: number;
    students_with_messages: number;
    evaluation_coverage_rate: number;
    attendance_coverage_rate: number;
    assignment_coverage_rate: number;
    message_coverage_rate: number;
  };
  notes?: string[];
}

export interface AcademicPeriodHistory {
  id: string;
  period_id: string;
  academic_year_id: string;
  generated_by?: number | null;
  generated_at: string;
  is_finalized: boolean;
  students_count: number;
  evaluations_count: number;
  attendance_count: number;
  assignments_count: number;
  task_submissions_count: number;
  assignment_submissions_count: number;
  messages_count: number;
  summary?: AcademicPeriodHistorySummary | null;
  period?: Period;
  academic_year?: AcademicYear;
  academicYear?: AcademicYear;
}

export interface AcademicPeriodStudentSnapshot {
  id: string;
  academic_period_history_id: string;
  student_id: string;
  section_id?: string | null;
  student_code?: string | null;
  student_name: string;
  snapshot: any;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  grade_level_id: string;
  hours_per_week: number;
  weekly_hours?: number;
  color?: string;
}

export interface Competency {
  id: string;
  course_id: string;
  code?: string;
  name?: string;
  description: string;
  order?: number;
  order_index?: number;
}

export interface TeacherCourseAssignment {
  id: string;
  user_id?: string;
  teacher_id?: string;
  course_id: string;
  section_id: string;
  academic_year_id: string;
  is_active?: boolean;
  assigned_at?: string;
  teacher?: any;
  course?: Course;
  section?: Section;
  academic_year?: any;
  academicYear?: any;
}

export interface StudentCourseEnrollment {
  id: string;
  student_id: string;
  user_id?: string;
  course_id: string;
  section_id?: string;
  academic_year_id: string;
  status: string;
  enrollment_date?: string;
  student?: any;
  user?: any;
  course?: any;
  section?: any;
  academic_year?: any;
  academicYear?: any;
}

export interface StudentRecordLite {
  id: string;
  user_id?: string | null;
  student_code?: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
}

export interface GuardianRecordLite {
  id: string;
  user_id?: string | null;
  first_name?: string;
  last_name?: string;
  dni?: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAcademicYears(params?: Record<string, string | number | boolean>): Observable<CollectionApiResponse<AcademicYear>> {
    return this.http.get<CollectionApiResponse<AcademicYear>>(`${this.apiUrl}/academic-years`, { params });
  }

  createAcademicYear(data: Partial<AcademicYear>): Observable<ApiDataResponse<AcademicYear>> {
    return this.http.post<ApiDataResponse<AcademicYear>>(`${this.apiUrl}/academic-years`, data);
  }

  updateAcademicYear(id: string, data: Partial<AcademicYear>): Observable<ApiDataResponse<AcademicYear>> {
    return this.http.put<ApiDataResponse<AcademicYear>>(`${this.apiUrl}/academic-years/${id}`, data);
  }

  deleteAcademicYear(id: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/academic-years/${id}`);
  }

  getGradeLevels(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/grade-levels`, { params });
  }

  createGradeLevel(data: Partial<GradeLevel>): Observable<any> {
    return this.http.post(`${this.apiUrl}/grade-levels`, data);
  }

  updateGradeLevel(id: string, data: Partial<GradeLevel>): Observable<any> {
    return this.http.put(`${this.apiUrl}/grade-levels/${id}`, data);
  }

  deleteGradeLevel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/grade-levels/${id}`);
  }

  getSections(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/sections`, { params });
  }

  createSection(data: Partial<Section>): Observable<any> {
    return this.http.post(`${this.apiUrl}/sections`, data);
  }

  updateSection(id: string, data: Partial<Section>): Observable<any> {
    return this.http.put(`${this.apiUrl}/sections/${id}`, data);
  }

  deleteSection(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sections/${id}`);
  }

  getPeriods(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/periods`, { params });
  }

  createPeriod(data: Partial<Period>): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods`, data);
  }

  updatePeriod(id: string, data: Partial<Period>): Observable<any> {
    return this.http.put(`${this.apiUrl}/periods/${id}`, data);
  }

  deletePeriod(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/periods/${id}`);
  }

  getPeriodHistory(periodId: string, params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/periods/${periodId}/history`, { params });
  }

  regeneratePeriodHistory(periodId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods/${periodId}/history/regenerate`, {});
  }

  getCourses(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses`, { params });
  }

  createCourse(data: Partial<Course>): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses`, data);
  }

  updateCourse(id: string, data: Partial<Course>): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${id}`, data);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }

  getCompetencies(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/competencies`, { params });
  }

  createCompetency(data: Partial<Competency>): Observable<any> {
    return this.http.post(`${this.apiUrl}/competencies`, data);
  }

  updateCompetency(id: string, data: Partial<Competency>): Observable<any> {
    return this.http.put(`${this.apiUrl}/competencies/${id}`, data);
  }

  deleteCompetency(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/competencies/${id}`);
  }

  getTeacherCourseAssignments(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/teacher-course-assignments`, { params });
  }

  createTeacherCourseAssignment(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/teacher-course-assignments`, data);
  }

  updateTeacherCourseAssignment(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/teacher-course-assignments/${id}`, data);
  }

  deleteTeacherCourseAssignment(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/teacher-course-assignments/${id}`);
  }

  getTeachers(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/teachers`, { params });
  }

  getStudentCourseEnrollments(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/student-course-enrollments`, { params });
  }

  createStudentCourseEnrollment(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/student-course-enrollments`, data);
  }

  updateStudentCourseEnrollment(id: string, data: any): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/student-course-enrollments/${id}`, data);
  }

  getEnrolledStudents(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/student-course-enrollments`, { params });
  }

  getStudents(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/students`, { params });
  }

  getGuardians(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/guardians`, { params });
  }
}
