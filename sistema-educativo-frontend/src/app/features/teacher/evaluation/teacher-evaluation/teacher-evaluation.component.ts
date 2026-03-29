import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { createIcons, icons } from 'lucide';
import { AcademicService, Competency } from '@core/services/academic.service';
import { EvaluationService } from '@core/services/evaluation.service';

type GradeValue = 'AD' | 'A' | 'B' | 'C' | null;
type EvaluationStatus = 'borrador' | 'publicada' | 'cerrada';

interface TeacherEvaluationStudent {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  initials: string;
}

interface EvaluationCellState {
  id?: string;
  grade: GradeValue;
  observations: string;
  status: EvaluationStatus;
  dirty: boolean;
  publishedAt?: string | null;
}

interface TeacherEvaluationPeriod {
  id: string;
  name: string;
  is_closed?: boolean;
  period_number?: number;
}

@Component({
  selector: 'app-teacher-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-evaluation.component.html',
  styleUrls: ['./teacher-evaluation.component.css']
})
export class TeacherEvaluationComponent implements OnInit, AfterViewInit {
  private academicService = inject(AcademicService);
  private evaluationService = inject(EvaluationService);

  loading = false;
  saving = false;
  error = '';
  success = '';

  teacher: any = null;
  assignments: any[] = [];
  periods: TeacherEvaluationPeriod[] = [];
  competencies: Competency[] = [];
  students: TeacherEvaluationStudent[] = [];
  evaluations: Record<string, EvaluationCellState> = {};

  activeAcademicYearId = '';
  activeAcademicYearLabel = '';
  selectedAssignmentId = '';
  selectedCourseId = '';
  selectedSectionId = '';
  selectedPeriodId = '';

  readonly grades: Array<Exclude<GradeValue, null>> = ['AD', 'A', 'B', 'C'];

  ngOnInit(): void {
    this.loadContext();
  }

  ngAfterViewInit(): void {
    this.initIcons();
  }

  get selectedAssignment(): any | null {
    return this.assignments.find((assignment) => assignment.id === this.selectedAssignmentId) || null;
  }

  get isPeriodClosed(): boolean {
    return !!this.periods.find((period) => period.id === this.selectedPeriodId)?.is_closed;
  }

  get hasGradebook(): boolean {
    return this.students.length > 0 && this.competencies.length > 0;
  }

  get gradedCellsCount(): number {
    return Object.values(this.evaluations).filter((cell) => cell.grade !== null).length;
  }

  get publishedCellsCount(): number {
    return Object.values(this.evaluations).filter((cell) => cell.status === 'publicada' || cell.status === 'cerrada').length;
  }

  get isPlanillaPublished(): boolean {
    return this.gradedCellsCount > 0 && this.publishedCellsCount === this.gradedCellsCount;
  }

  loadContext(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.evaluationService.getTeacherEvaluationContext()
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshIcons();
      }))
      .subscribe({
        next: (response) => {
          this.teacher = response.teacher;
          this.assignments = Array.isArray(response.assignments) ? response.assignments : [];
          this.periods = Array.isArray(response.periods) ? response.periods : [];
          this.activeAcademicYearId = response.active_academic_year?.id || '';
          this.activeAcademicYearLabel = response.active_academic_year?.year
            ? String(response.active_academic_year.year)
            : '';

          if (this.assignments.length === 0) {
            this.error = response.message || 'No tienes asignaciones activas para registrar evaluaciones.';
            return;
          }

          this.selectedAssignmentId = this.assignments[0].id;
          this.syncSelectedAssignment();

          const preferredPeriod = this.periods.find((period) => !period.is_closed) || this.periods[0];
          this.selectedPeriodId = preferredPeriod?.id || '';

          if (!this.selectedPeriodId) {
            this.error = 'No se encontraron periodos disponibles en el ano academico activo.';
            return;
          }

          this.loadGradebook();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.formatApiError(error, 'No se pudo cargar el contexto de evaluacion.');
        }
      });
  }

  onAssignmentChange(): void {
    this.syncSelectedAssignment();
    this.loadGradebook();
  }

  onPeriodChange(): void {
    this.success = '';
    this.error = '';

    if (!this.selectedPeriodId) {
      this.resetGradebook();
      this.refreshIcons();
      return;
    }

    this.loadGradebook();
  }

  recordFor(studentId: string, competencyId: string): EvaluationCellState {
    const key = this.cellKey(studentId, competencyId);

    if (!this.evaluations[key]) {
      this.evaluations[key] = {
        grade: null,
        observations: '',
        status: 'borrador',
        dirty: false,
      };
    }

    return this.evaluations[key];
  }

  updateEvaluation(studentId: string, competencyId: string, field: 'grade' | 'observations', value: string): void {
    const record = this.recordFor(studentId, competencyId);

    if (this.isCellLocked(record)) {
      return;
    }

    if (field === 'grade') {
      record.grade = value as Exclude<GradeValue, null>;
    } else {
      record.observations = value;
    }

    record.status = 'borrador';
    record.dirty = true;
    this.success = '';
  }

  handleSaveDraft(): void {
    this.persistEvaluations('borrador');
  }

  handlePublish(): void {
    if (!this.hasPendingPayload('publicada')) {
      this.error = 'No hay evaluaciones pendientes para publicar.';
      return;
    }

    if (confirm('Estas seguro de publicar las calificaciones cargadas?')) {
      this.persistEvaluations('publicada');
    }
  }

  canSaveDraft(): boolean {
    return !this.isPeriodClosed && this.hasPendingPayload('borrador');
  }

  canPublish(): boolean {
    return !this.isPeriodClosed && this.hasPendingPayload('publicada');
  }

  isCellLocked(record: EvaluationCellState): boolean {
    return this.isPeriodClosed || record.status === 'publicada' || record.status === 'cerrada';
  }

  formatAssignmentLabel(assignment: any): string {
    const courseCode = assignment?.course?.code || '';
    const courseName = assignment?.course?.name || 'Curso';
    const gradeName = assignment?.section?.grade_level?.name || '';
    const sectionLetter = assignment?.section?.section_letter || '';

    return [courseCode, courseName].filter(Boolean).join(' - ')
      + (gradeName || sectionLetter ? ` (${[gradeName, sectionLetter].filter(Boolean).join(' ')})` : '');
  }

  private syncSelectedAssignment(): void {
    const assignment = this.selectedAssignment;

    this.selectedCourseId = assignment?.course_id || '';
    this.selectedSectionId = assignment?.section_id || '';

    if (!assignment) {
      this.resetGradebook();
    }
  }

  private loadGradebook(): void {
    if (!this.selectedCourseId || !this.selectedSectionId || !this.selectedPeriodId || !this.activeAcademicYearId) {
      this.resetGradebook();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    forkJoin({
      competencies: this.academicService.getCompetencies({ course_id: this.selectedCourseId }),
      enrollments: this.academicService.getEnrolledStudents({
        course_id: this.selectedCourseId,
        section_id: this.selectedSectionId,
        academic_year_id: this.activeAcademicYearId,
        status: 'active',
        per_page: 200,
      }),
      evaluations: this.evaluationService.getEvaluations({
        course_id: this.selectedCourseId,
        section_id: this.selectedSectionId,
        period_id: this.selectedPeriodId,
        per_page: 1000,
      }).pipe(
        catchError(() => of({ data: [] }))
      )
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.refreshIcons();
      })
    ).subscribe({
      next: ({ competencies, enrollments, evaluations }) => {
        this.competencies = this.normalizeCollection<Competency>(competencies);
        this.students = this.mapStudents(enrollments);
        this.evaluations = {};
        this.applyExistingEvaluations(evaluations);

        if (this.students.length === 0) {
          this.error = 'No se encontraron estudiantes matriculados para el curso y seccion seleccionados.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.resetGradebook();
        this.error = this.formatApiError(error, 'No se pudo cargar la planilla de evaluacion.');
      }
    });
  }

  private mapStudents(response: any): TeacherEvaluationStudent[] {
    const rows = this.normalizeCollection<any>(response)
      .filter((row) => !row?.status || row.status === 'active');

    const seen = new Set<string>();
    const students: TeacherEvaluationStudent[] = [];

    rows.forEach((row) => {
      const student = row?.student ?? row?.students ?? null;
      if (!student?.id || seen.has(student.id)) {
        return;
      }

      const firstName = String(student.first_name || '').trim();
      const lastName = String(student.last_name || '').trim();
      const fullName = String(student.full_name || [lastName, firstName].filter(Boolean).join(', ') || 'Sin nombre');

      seen.add(student.id);
      students.push({
        id: String(student.id),
        student_code: String(student.student_code || ''),
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        initials: this.getInitials(fullName),
      });
    });

    return students.sort((left, right) => left.full_name.localeCompare(right.full_name));
  }

  private applyExistingEvaluations(response: any): void {
    this.normalizeCollection<any>(response).forEach((evaluation) => {
      const key = this.cellKey(String(evaluation.student_id), String(evaluation.competency_id));

      this.evaluations[key] = {
        id: evaluation.id,
        grade: evaluation.grade ?? null,
        observations: evaluation.comments || evaluation.observations || '',
        status: evaluation.status || 'borrador',
        dirty: false,
        publishedAt: evaluation.published_at || null,
      };
    });
  }

  private persistEvaluations(targetStatus: EvaluationStatus): void {
    const payloads = this.collectPayloads(targetStatus);

    if (payloads.length === 0) {
      this.error = targetStatus === 'publicada'
        ? 'No hay evaluaciones pendientes para publicar.'
        : 'No hay cambios pendientes por guardar.';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    forkJoin(
      payloads.map((payload) =>
        this.evaluationService.saveEvaluation(payload).pipe(
          catchError((error: HttpErrorResponse) => of({ __error: true, payload, error }))
        )
      )
    ).pipe(
      finalize(() => {
        this.saving = false;
        this.refreshIcons();
      })
    ).subscribe((results: any[]) => {
      const failures = results.filter((result) => result?.__error);

      if (failures.length > 0) {
        this.error = `No se pudieron procesar ${failures.length} registro(s). ${this.formatApiError(failures[0]?.error)}`;
        return;
      }

      results.forEach((result) => {
        const key = this.cellKey(String(result.student_id), String(result.competency_id));
        const record = this.recordFor(String(result.student_id), String(result.competency_id));

        record.id = result.id;
        record.grade = result.grade ?? record.grade;
        record.observations = result.comments || result.observations || record.observations;
        record.status = result.status || targetStatus;
        record.publishedAt = result.published_at || record.publishedAt || null;
        record.dirty = false;

        this.evaluations[key] = record;
      });

      this.success = targetStatus === 'publicada'
        ? 'Calificaciones publicadas correctamente.'
        : 'Borrador guardado correctamente.';
    });
  }

  private collectPayloads(targetStatus: EvaluationStatus): any[] {
    if (!this.selectedCourseId || !this.selectedPeriodId) {
      return [];
    }

    const payloads: any[] = [];

    this.students.forEach((student) => {
      this.competencies.forEach((competency) => {
        const record = this.evaluations[this.cellKey(student.id, competency.id)];

        if (!record || record.grade === null || record.status === 'cerrada') {
          return;
        }

        if (this.isCellLocked(record) && targetStatus !== 'publicada') {
          return;
        }

        if (!record.dirty && record.id && record.status === targetStatus) {
          return;
        }

        if (record.status === 'publicada' && targetStatus === 'publicada' && !record.dirty) {
          return;
        }

        payloads.push({
          student_id: student.id,
          course_id: this.selectedCourseId,
          period_id: this.selectedPeriodId,
          competency_id: competency.id,
          grade: record.grade,
          comments: record.observations,
          status: targetStatus,
        });
      });
    });

    return payloads;
  }

  private hasPendingPayload(targetStatus: EvaluationStatus): boolean {
    return this.collectPayloads(targetStatus).length > 0;
  }

  private resetGradebook(): void {
    this.competencies = [];
    this.students = [];
    this.evaluations = {};
  }

  private normalizeCollection<T = any>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    return [];
  }

  private cellKey(studentId: string, competencyId: string): string {
    return `${studentId}-${competencyId}`;
  }

  private getInitials(name: string): string {
    return name
      .split(/[ ,]+/)
      .filter((part) => !!part)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'NA';
  }

  private formatApiError(error: HttpErrorResponse | any, fallback = 'Error al procesar la solicitud.'): string {
    const validationErrors = error?.error?.errors
      ? Object.values(error.error.errors).flat().join(' ')
      : '';

    return validationErrors || error?.error?.message || fallback;
  }

  private initIcons(): void {
    createIcons({ icons });
  }

  private refreshIcons(): void {
    setTimeout(() => this.initIcons(), 0);
  }
}
