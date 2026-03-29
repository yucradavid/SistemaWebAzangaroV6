import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import {
  Assignment,
  AssignmentMetrics,
  AssignmentSubmissionSummaryRow,
  TaskService,
  TaskSubmission,
} from '@core/services/task.service';
import { AcademicService, Course, Section, TeacherCourseAssignment } from '@core/services/academic.service';

@Component({
  selector: 'app-teacher-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  templateUrl: './teacher-grading.component.html',
  styleUrls: ['./teacher-grading.component.css']
})
export class TeacherGradingComponent implements OnInit {
  private taskService = inject(TaskService);
  private academicService = inject(AcademicService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  teacherAssignments: TeacherCourseAssignment[] = [];
  assignments: Assignment[] = [];
  rows: AssignmentSubmissionSummaryRow[] = [];
  metrics: AssignmentMetrics | null = null;

  loadingContext = true;
  loadingRows = false;
  grading = false;
  showGradeModal = false;

  error = '';
  selectedCourseId = '';
  selectedSectionId = '';
  selectedAssignmentId = '';
  selectedStatus = '';
  private requestedAssignmentId = '';

  gradingSubmission: TaskSubmission | null = null;
  gradeForm = {
    grade: null as number | null,
    grade_letter: '',
    feedback: '',
  };

  ngOnInit(): void {
    const queryMap = this.route.snapshot.queryParamMap;
    this.selectedCourseId = queryMap.get('course_id') || '';
    this.selectedSectionId = queryMap.get('section_id') || '';
    this.selectedStatus = queryMap.get('status') || '';
    this.requestedAssignmentId = queryMap.get('assignment_id') || '';

    this.loadTeacherAssignments();
  }

  get courseOptions(): Course[] {
    const map = new Map<string, Course>();

    for (const assignment of this.teacherAssignments) {
      if (assignment.course?.id) {
        map.set(assignment.course.id, assignment.course);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  get sectionOptions(): Section[] {
    const map = new Map<string, Section>();

    for (const assignment of this.filteredTeacherAssignmentsByCourse()) {
      if (assignment.section?.id) {
        map.set(assignment.section.id, assignment.section);
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.section_letter || '').localeCompare(b.section_letter || ''));
  }

  get selectedAssignment(): Assignment | null {
    return this.assignments.find((assignment) => assignment.id === this.selectedAssignmentId) || null;
  }

  get submittedCount(): number {
    return this.rows.filter((row) => row.status === 'submitted' || row.status === 'graded').length;
  }

  get pendingReviewCount(): number {
    return this.rows.filter((row) => row.status === 'submitted').length;
  }

  get gradedCount(): number {
    return this.rows.filter((row) => row.status === 'graded').length;
  }

  get missingCount(): number {
    return this.rows.filter((row) => row.status === 'missing').length;
  }

  get missingRequiresAssignment(): boolean {
    return this.selectedStatus === 'missing' && !this.selectedAssignmentId;
  }

  get orderedRows(): AssignmentSubmissionSummaryRow[] {
    return [...this.rows].sort((left, right) => {
      const priorityDiff = this.getRowPriority(left) - this.getRowPriority(right);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const submissionDiff = this.getSubmissionTimestamp(right) - this.getSubmissionTimestamp(left);
      if (submissionDiff !== 0) {
        return submissionDiff;
      }

      return this.getStudentName(left).localeCompare(this.getStudentName(right));
    });
  }

  onCourseChange(): void {
    const sectionStillAvailable = this.sectionOptions.some((section) => section.id === this.selectedSectionId);
    if (!sectionStillAvailable) {
      this.selectedSectionId = '';
    }

    this.selectedAssignmentId = '';
    this.metrics = null;
    this.loadAssignments();
    this.loadRows();
  }

  onSectionChange(): void {
    this.selectedAssignmentId = '';
    this.metrics = null;
    this.loadAssignments();
    this.loadRows();
  }

  onAssignmentChange(): void {
    this.loadRows();
  }

  onStatusChange(): void {
    this.loadRows();
  }

  applyQuickStatusFilter(status: '' | 'submitted' | 'graded' | 'missing'): void {
    this.selectedStatus = status;
    this.loadRows();
  }

  openGradeModal(submission: TaskSubmission): void {
    this.gradingSubmission = submission;
    this.gradeForm = {
      grade: submission.grade !== undefined && submission.grade !== null ? Number(submission.grade) : null,
      grade_letter: submission.grade_letter || '',
      feedback: submission.feedback || '',
    };
    this.showGradeModal = true;
  }

  closeGradeModal(): void {
    this.showGradeModal = false;
    this.gradingSubmission = null;
  }

  openManagement(): void {
    const queryParams: Record<string, string> = {};

    if (this.selectedCourseId) {
      queryParams['course_id'] = this.selectedCourseId;
    }
    if (this.selectedSectionId) {
      queryParams['section_id'] = this.selectedSectionId;
    }

    this.router.navigate(['/app/tasks/teacher'], { queryParams });
  }

  submitGrade(): void {
    if (!this.gradingSubmission || this.gradeForm.grade === null || this.grading) {
      return;
    }

    this.grading = true;
    this.error = '';

    this.taskService.gradeSubmission(this.gradingSubmission.id, {
      status: 'graded',
      grade: this.gradeForm.grade,
      grade_letter: this.gradeForm.grade_letter || undefined,
      feedback: this.gradeForm.feedback.trim() || undefined,
    }).subscribe({
      next: () => {
        this.grading = false;
        this.closeGradeModal();
        this.loadRows();
      },
      error: (error) => {
        this.grading = false;
        this.error = this.extractError(error, 'No se pudo guardar la calificacion.');
      },
    });
  }

  getStudentName(row: AssignmentSubmissionSummaryRow): string {
    return row.student?.full_name
      || `${row.student?.first_name || ''} ${row.student?.last_name || ''}`.trim()
      || 'Estudiante';
  }

  getStudentInitials(row: AssignmentSubmissionSummaryRow): string {
    return this.getStudentName(row)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'E';
  }

  getAssignmentTitle(row: AssignmentSubmissionSummaryRow): string {
    return row.submission?.assignment?.title || this.selectedAssignment?.title || 'Tarea';
  }

  getCourseName(row: AssignmentSubmissionSummaryRow): string {
    return row.submission?.assignment?.course?.name || this.selectedAssignment?.course?.name || 'Curso';
  }

  getSectionLabel(assignment?: Assignment | null): string {
    const sectionLetter = assignment?.section?.section_letter;
    const gradeLevel = (assignment?.section as any)?.grade_level;
    const sectionText = sectionLetter ? `Seccion ${sectionLetter}` : 'Seccion';

    if (gradeLevel?.grade && gradeLevel?.level) {
      return `${gradeLevel.grade} ${gradeLevel.level} - ${sectionText}`;
    }

    return sectionText;
  }

  getStatusLabel(status: AssignmentSubmissionSummaryRow['status']): string {
    const labels: Record<AssignmentSubmissionSummaryRow['status'], string> = {
      graded: 'Calificado',
      submitted: 'Entregado',
      missing: 'Sin entrega',
    };

    return labels[status];
  }

  getStatusClass(status: AssignmentSubmissionSummaryRow['status']): string {
    const classes: Record<AssignmentSubmissionSummaryRow['status'], string> = {
      graded: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      submitted: 'bg-amber-50 text-amber-700 border border-amber-200',
      missing: 'bg-rose-50 text-rose-700 border border-rose-200',
    };

    return classes[status];
  }

  isLate(row: AssignmentSubmissionSummaryRow): boolean {
    const submissionDate = row.submission?.submission_date;
    const dueDate = row.submission?.assignment?.due_date || this.selectedAssignment?.due_date;

    if (!submissionDate || !dueDate) {
      return false;
    }

    return new Date(submissionDate).getTime() > new Date(dueDate).getTime();
  }

  private loadTeacherAssignments(): void {
    this.loadingContext = true;
    this.error = '';

    this.academicService.getTeacherCourseAssignments({ is_active: true, per_page: 200 }).subscribe({
      next: (response) => {
        this.teacherAssignments = this.extractRows<TeacherCourseAssignment>(response)
          .filter((assignment) => assignment.course_id && assignment.section_id);
        this.loadingContext = false;
        this.loadAssignments();
        this.loadRows();
      },
      error: (error) => {
        this.teacherAssignments = [];
        this.assignments = [];
        this.rows = [];
        this.loadingContext = false;
        this.error = this.extractError(error, 'No se pudo cargar la carga academica del docente.');
      },
    });
  }

  private loadAssignments(): void {
    if (!this.teacherAssignments.length) {
      this.assignments = [];
      return;
    }

    const params: { course_id?: string; section_id?: string } = {};
    if (this.selectedCourseId) {
      params.course_id = this.selectedCourseId;
    }
    if (this.selectedSectionId) {
      params.section_id = this.selectedSectionId;
    }

    this.taskService.getAssignments(params).subscribe({
      next: (response) => {
        this.assignments = (response.data || []).filter((assignment) =>
          this.isAllowedPair(assignment.course_id, assignment.section_id)
        );

        if (this.requestedAssignmentId && this.assignments.some((assignment) => assignment.id === this.requestedAssignmentId)) {
          this.selectedAssignmentId = this.requestedAssignmentId;
          this.requestedAssignmentId = '';
        }

        if (this.selectedAssignmentId && !this.assignments.some((assignment) => assignment.id === this.selectedAssignmentId)) {
          this.selectedAssignmentId = '';
        }
      },
      error: () => {
        this.assignments = [];
        this.selectedAssignmentId = '';
      },
    });
  }

  private loadRows(): void {
    if (!this.teacherAssignments.length) {
      this.rows = [];
      this.metrics = null;
      this.loadingRows = false;
      return;
    }

    if (this.missingRequiresAssignment) {
      this.rows = [];
      this.metrics = null;
      this.loadingRows = false;
      return;
    }

    this.loadingRows = true;
    this.error = '';

    if (this.selectedAssignmentId) {
      this.taskService.getAssignmentSubmissionsSummary(this.selectedAssignmentId).subscribe({
        next: (response) => {
          this.metrics = response.summary;
          this.rows = this.filterRows(response.rows.filter((row) =>
            this.isAllowedPair(
              response.assignment.course_id,
              response.assignment.section_id
            )
          ));
          this.loadingRows = false;
        },
        error: (error) => {
          this.rows = [];
          this.metrics = null;
          this.loadingRows = false;
          this.error = this.extractError(error, 'No se pudo cargar el resumen de la tarea.');
        },
      });
      return;
    }

    const params: { course_id?: string; section_id?: string; status?: string } = {};
    if (this.selectedCourseId) {
      params.course_id = this.selectedCourseId;
    }
    if (this.selectedSectionId) {
      params.section_id = this.selectedSectionId;
    }
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    this.taskService.getSubmissions(params).subscribe({
      next: (response) => {
        this.rows = this.filterRows(
          (response.data || [])
            .filter((submission) => this.isAllowedPair(
              submission.assignment?.course_id || '',
              submission.assignment?.section_id || ''
            ))
            .map((submission) => this.mapSubmissionToRow(submission))
        );
        this.metrics = null;
        this.loadingRows = false;
      },
      error: (error) => {
        this.rows = [];
        this.metrics = null;
        this.loadingRows = false;
        this.error = this.extractError(error, 'No se pudieron cargar las entregas.');
      },
    });
  }

  private filteredTeacherAssignmentsByCourse(courseId?: string): TeacherCourseAssignment[] {
    if (!courseId) {
      return this.teacherAssignments;
    }

    return this.teacherAssignments.filter((assignment) => assignment.course_id === courseId);
  }

  private isAllowedPair(courseId: string, sectionId: string): boolean {
    return this.teacherAssignments.some((assignment) =>
      assignment.course_id === courseId && assignment.section_id === sectionId
    );
  }

  private filterRows(rows: AssignmentSubmissionSummaryRow[]): AssignmentSubmissionSummaryRow[] {
    if (!this.selectedStatus) {
      return rows;
    }

    return rows.filter((row) => row.status === this.selectedStatus);
  }

  private getRowPriority(row: AssignmentSubmissionSummaryRow): number {
    if (row.status === 'missing') {
      return 0;
    }

    if (row.status === 'submitted') {
      return 1;
    }

    return 2;
  }

  private getSubmissionTimestamp(row: AssignmentSubmissionSummaryRow): number {
    if (!row.submission?.submission_date) {
      return 0;
    }

    const timestamp = new Date(row.submission.submission_date).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private mapSubmissionToRow(submission: TaskSubmission): AssignmentSubmissionSummaryRow {
    return {
      student_id: submission.student_id,
      student: submission.student || { id: submission.student_id },
      submission,
      status: submission.status === 'graded' ? 'graded' : 'submitted',
    };
  }

  private extractRows<T>(response: { data?: T[] } | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data || [];
  }

  private extractError(error: any, fallback: string): string {
    const validationErrors = error?.error?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstKey = Object.keys(validationErrors)[0];
      const firstValue = validationErrors[firstKey];
      if (Array.isArray(firstValue) && firstValue[0]) {
        return firstValue[0];
      }
    }

    return error?.error?.message || fallback;
  }
}
