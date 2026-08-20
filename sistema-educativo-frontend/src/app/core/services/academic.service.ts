import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcademicYear } from '../models/AcademicYear';
import { PaginatedResponse, CollectionResponse } from '../models/backend.models';

export * from '../models/academic.models';

export type CollectionApiResponse<T> = CollectionResponse<T>;

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAcademicYears(params?: Record<string, string | number | boolean>): Observable<CollectionResponse<AcademicYear>> {
    return this.http.get<CollectionResponse<AcademicYear>>(`${this.apiUrl}/academic-years`, { params });
  }

  createAcademicYear(data: Partial<AcademicYear>): Observable<{ message: string; data: AcademicYear }> {
    return this.http.post<{ message: string; data: AcademicYear }>(`${this.apiUrl}/academic-years`, data);
  }

  updateAcademicYear(id: string, data: Partial<AcademicYear>): Observable<{ message: string; data: AcademicYear }> {
    return this.http.put<{ message: string; data: AcademicYear }>(`${this.apiUrl}/academic-years/${id}`, data);
  }

  deleteAcademicYear(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/academic-years/${id}`);
  }

  getGradeLevels(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/grade-levels`, { params });
  }

  createGradeLevel(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/grade-levels`, data);
  }

  updateGradeLevel(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/grade-levels/${id}`, data);
  }

  deleteGradeLevel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/grade-levels/${id}`);
  }

  getSections(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/sections`, { params });
  }

  createSection(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sections`, data);
  }

  updateSection(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sections/${id}`, data);
  }

  deleteSection(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sections/${id}`);
  }

  getPeriods(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/periods`, { params });
  }

  createPeriod(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods`, data);
  }

  updatePeriod(id: string, data: any): Observable<any> {
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

  createCourse(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses`, data);
  }

  updateCourse(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${id}`, data);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }

  getCompetencies(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/competencies`, { params });
  }

  createCompetency(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/competencies`, data);
  }

  updateCompetency(id: string, data: any): Observable<any> {
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

  checkScheduleConflict(data: { teacher_id: string; section_id: string; course_id: string; academic_year_id: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/teacher-course-assignments/check-schedule-conflict`, data);
  }

  getAssignedTeachersByCourseSection(params: { course_id: string; section_id: string; academic_year_id: string }): Observable<any> {
    return this.http.get(`${environment.apiUrl}/teacher-course-assignments/by-course-section`, { params });
  }

  getMaxCoursesPerTeacher(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/system-settings/max-courses-per-teacher`);
  }

  updateMaxCoursesPerTeacher(value: number): Observable<any> {
    return this.http.put(`${environment.apiUrl}/system-settings/max-courses-per-teacher`, { value });
  }

  updateTeacherMaxCoursesOverride(teacherId: string, value: number | null): Observable<any> {
    return this.http.put(`${environment.apiUrl}/teachers/${teacherId}/max-courses-override`, { max_courses_override: value });
  }

  confirmTeacherMaxCoursesOverride(teacherId: string, data: {
    max_courses_override: number | null;
    remove_course_ids: string[];
    reassignments: { assignment_id: string; new_teacher_id: string }[];
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/teachers/${teacherId}/max-courses-override/confirm`, data);
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
}
