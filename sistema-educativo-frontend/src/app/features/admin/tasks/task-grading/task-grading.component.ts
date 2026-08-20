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
import { AcademicService, Course, Section } from '@core/services/academic.service';

@Component({
  selector: 'app-task-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  templateUrl: './task-grading.component.html',
  styleUrls: ['./task-grading.component.css']
})
export class TaskGradingComponent implements OnInit {
  private taskService = inject(TaskService);
  private academicService = inject(AcademicService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  rows: AssignmentSubmissionSummaryRow[] = [];
  courses: Course[] = [];
  sections: Section[] = [];
  assignments: Assignment[] = [];
  metrics: AssignmentMetrics | null = null;

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
    this.selectedAssignmentId = queryMap.get('assignment_id') || '';
    this.selectedStatus = queryMap.get('status') || '';

    this.academicService.getCourses().subscribe({
      next: (response) => this.courses = response.data || response || [],
      error: () => undefined,
    });

    this.academicService.getSections().subscribe({
      next: (response) => this.sections = response.data || response || [],
      error: () => undefined,
    });

    this.loadAssignments();
    this.loadRows();
  }

  get filteredSections(): Section[] {
    if (!this.selectedCourseId) {
      return this.sections;
    }

    const sectionIds = new Set(
      this.assignments.filter((a) => a.course_id === this.selectedCourseId).map((a) => a.section_id)
    );

    return this.sections.filter((section) => sectionIds.has(section.id));
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

  onCourseFilterChange(): void {
    const sectionStillAvailable = this.filteredSections.some((section) => section.id === this.selectedSectionId);
    if (!sectionStillAvailable) {
      this.selectedSectionId = '';
    }

    this.selectedAssignmentId = '';
    this.metrics = null;
    this.loadAssignments();
    this.loadRows();
  }

  onSectionFilterChange(): void {
    this.selectedAssignmentId = '';
    this.metrics = null;
    this.loadAssignments();
    this.loadRows();
  }

  onAssignmentFilterChange(): void {
    this.loadRows();
  }

  onStatusFilterChange(): void {
    this.loadRows();
  }

  openManagement(): void {
    const queryParams: Record<string, string> = {};

    if (this.selectedCourseId) {
      queryParams['course_id'] = this.selectedCourseId;
    }
    if (this.selectedSectionId) {
      queryParams['section_id'] = this.selectedSectionId;
    }

    this.router.navigate(['/app/tasks/management'], { queryParams });
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

  getSubmissionStudentName(submission: TaskSubmission): string {
    return submission.student?.full_name
      || `${submission.student?.first_name || ''} ${submission.student?.last_name || ''}`.trim()
      || 'Estudiante';
  }

  private loadAssignments(): void {
    const params: { course_id?: string; section_id?: string } = {};
    if (this.selectedCourseId) {
      params.course_id = this.selectedCourseId;
    }
    if (this.selectedSectionId) {
      params.section_id = this.selectedSectionId;
    }

    this.taskService.getAssignments(params).subscribe({
      next: (response) => {
        this.assignments = response.data || [];

        if (this.selectedAssignmentId && !this.assignments.some((a) => a.id === this.selectedAssignmentId)) {
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
    if (this.selectedAssignmentId) {
      this.loadingRows = true;
      this.error = '';

      this.taskService.getAssignmentSubmissionsSummary(this.selectedAssignmentId).subscribe({
        next: (response) => {
          this.metrics = response.summary;
          this.rows = this.filterRows(response.rows);
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

    this.loadingRows = true;
    this.error = '';

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
          (response.data || []).map((submission) => this.mapSubmissionToRow(submission))
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
