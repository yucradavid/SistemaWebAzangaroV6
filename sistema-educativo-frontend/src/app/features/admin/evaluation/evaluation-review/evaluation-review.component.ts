//src/app/features/admin/evaluation/evaluation-review/evaluation-review.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Period } from '@core/services/academic.service';
import {
  Evaluation,
  EvaluationService,
  FinalCompetencyResult,
  StudentFinalStatus,
} from '@core/services/evaluation.service';

interface ReviewKpi {
  label: string;
  value: string;
  suffix?: string;
  icon: string;
  tone: 'slate' | 'blue' | 'green' | 'yellow' | 'red';
}

interface CourseReviewSummary {
  courseId: string;
  courseName: string;
  total: number;
  published: number;
  drafts: number;
  closed: number;
  progress: number;
}

interface RiskStudentItem {
  id: string;
  name: string;
  code: string;
  gradeLevel: string;
  finalStatus: string;
  pendingCompetencies: number;
  recoveryRequired: boolean;
  decisionReason: string;
}

type ReviewStudentFinalStatus = StudentFinalStatus & {
  student?: {
    id: string;
    full_name?: string;
    student_code?: string;
  };
  grade_level?: {
    id: string;
    name?: string;
  };
};

type ReviewFinalCompetencyResult = FinalCompetencyResult & {
  student?: {
    id: string;
    full_name?: string;
    student_code?: string;
  };
};

@Component({
  selector: 'app-evaluation-review',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule],
  templateUrl: './evaluation-review.component.html',
  styles: [`
    :host { display: block; }
  `]
})
export class EvaluationReviewComponent implements OnInit {
  private academicService = inject(AcademicService);
  private evaluationService = inject(EvaluationService);

  periods: Period[] = [];
  selectedPeriodId = '';
  selectedPeriod: Period | null = null;
  activeAcademicYearId = '';
  activeAcademicYearLabel = '';

  loading = false;
  closing = false;
  errorMessage = '';
  successMessage = '';

  evaluations: Evaluation[] = [];
  studentStatuses: ReviewStudentFinalStatus[] = [];
  finalResults: ReviewFinalCompetencyResult[] = [];
  courseSummaries: CourseReviewSummary[] = [];
  riskStudents: RiskStudentItem[] = [];

  pendingEvaluations = 0;
  supportRequiredCount = 0;
  consecutiveCCount = 0;

  statusBreakdown = {
    promociona: 0,
    recuperacion: 0,
    permanece: 0,
    pendiente: 0,
  };

  kpis: ReviewKpi[] = [
    { label: 'Evaluaciones del periodo', value: '0', icon: '<path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M11 16V9"/><path d="M15 16V5"/><path d="M19 16v-7"/>', tone: 'slate' },
    { label: 'Publicadas o cerradas', value: '0', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', tone: 'green' },
    { label: 'Borradores pendientes', value: '0', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', tone: 'yellow' },
    { label: 'Avance de cierre', value: '0', suffix: '%', icon: '<path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M11 16V9"/><path d="M15 16V5"/><path d="M19 16v-7"/>', tone: 'blue' },
    { label: 'Estudiantes en recuperacion', value: '0', icon: '<path d="M12 2v6"/><path d="M12 16v6"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M2 12h6"/><path d="M16 12h6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M14.83 9.17l4.24-4.24"/>', tone: 'yellow' },
    { label: 'Competencias con soporte', value: '0', icon: '<path d="M9 12l2 2 4-4"/><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 1 0 0 1.996A.953.953 0 0 0 21 12Z"/>', tone: 'red' },
  ];

  ngOnInit() {
    this.loadInitialData();
  }

  get readyToClose(): boolean {
    return !!this.selectedPeriod && !this.selectedPeriod.is_closed && this.pendingEvaluations === 0;
  }

  get currentPeriodLabel(): string {
    if (!this.selectedPeriod) {
      return 'Sin periodo seleccionado';
    }

    return `${this.selectedPeriod.name} (${this.selectedPeriod.start_date} - ${this.selectedPeriod.end_date})`;
  }

  loadInitialData() {
    this.academicService.getAcademicYears().subscribe({
      next: (response) => {
        const years = this.normalizeCollection(response);
        const activeYear = years.find((year: any) => year.is_active) || years[0];

        console.log('[evaluation-review] academic years:', response);
        console.log('[evaluation-review] academic years normalized:', years);

        if (!activeYear) {
          this.errorMessage = 'No se encontro un ano academico activo.';
          return;
        }

        this.activeAcademicYearId = activeYear.id;
        this.activeAcademicYearLabel = String(activeYear.year || '');

        this.academicService.getPeriods({ academic_year_id: activeYear.id }).subscribe({
          next: (periodResponse) => {
            this.periods = this.normalizeCollection<Period>(periodResponse);
            console.log('[evaluation-review] periods:', periodResponse);
            console.log('[evaluation-review] periods normalized:', this.periods);

            const openPeriod = this.periods.find((period) => !period.is_closed);
            this.selectedPeriodId = openPeriod?.id || this.periods[0]?.id || '';
            this.onPeriodChange();
          },
          error: (error) => {
            console.error('[evaluation-review] periods error:', error);
            this.errorMessage = 'No se pudieron cargar los periodos.';
          }
        });
      },
      error: (error) => {
        console.error('[evaluation-review] academic years error:', error);
        this.errorMessage = 'No se pudieron cargar los anos academicos.';
      }
    });
  }

  onPeriodChange() {
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedPeriod = this.periods.find((period) => period.id === this.selectedPeriodId) || null;

    if (!this.selectedPeriodId || !this.activeAcademicYearId) {
      this.resetDashboard();
      return;
    }

    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      evaluations: this.evaluationService.getEvaluations({ period_id: this.selectedPeriodId, per_page: 500 }),
      statuses: this.evaluationService.getStudentFinalStatuses({ academic_year_id: this.activeAcademicYearId, per_page: 500 }),
      finalResults: this.evaluationService.getFinalCompetencyResults({ academic_year_id: this.activeAcademicYearId, per_page: 500 }),
    }).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: ({ evaluations, statuses, finalResults }) => {
        this.evaluations = this.normalizeCollection<Evaluation>(evaluations);
        this.studentStatuses = this.normalizeCollection<ReviewStudentFinalStatus>(statuses);
        this.finalResults = this.normalizeCollection<ReviewFinalCompetencyResult>(finalResults);

        console.log('[evaluation-review] evaluations:', this.evaluations);
        console.log('[evaluation-review] student statuses:', this.studentStatuses);
        console.log('[evaluation-review] final results:', this.finalResults);

        this.buildDashboard();
      },
      error: (error) => {
        console.error('[evaluation-review] dashboard error:', error);
        this.errorMessage = 'No se pudo cargar el resumen de revision del periodo.';
        this.resetDashboard();
      }
    });
  }

  closePeriod() {
    if (!this.selectedPeriodId || !this.selectedPeriod) {
      return;
    }

    const confirmed = window.confirm('¿Está seguro de cerrar este periodo académico? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    this.closing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.academicService.updatePeriod(this.selectedPeriodId, { is_closed: true }).pipe(
      finalize(() => {
        this.closing = false;
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Periodo cerrado correctamente.';
        this.selectedPeriod = this.selectedPeriod ? { ...this.selectedPeriod, is_closed: true } : null;
        this.periods = this.periods.map((period) =>
          period.id === this.selectedPeriodId ? { ...period, is_closed: true } : period
        );
      },
      error: (error) => {
        console.error('[evaluation-review] close period error:', error);
        this.errorMessage = 'No se pudo cerrar el periodo seleccionado.';
      }
    });
  }

  getKpiToneClasses(tone: ReviewKpi['tone']): string {
    const map: Record<ReviewKpi['tone'], string> = {
      slate: 'text-slate-900 bg-white',
      blue: 'text-blue-700 bg-blue-50',
      green: 'text-green-700 bg-green-50',
      yellow: 'text-yellow-700 bg-yellow-50',
      red: 'text-red-700 bg-red-50',
    };

    return map[tone];
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      promociona: 'bg-green-50 text-green-700 border-green-200',
      recuperacion: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      permanece: 'bg-red-50 text-red-700 border-red-200',
      pendiente: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return map[status] || map['pendiente'];
  }

  private buildDashboard() {
    const total = this.evaluations.length;
    const published = this.evaluations.filter((evaluation) => evaluation.status === 'publicada').length;
    const closed = this.evaluations.filter((evaluation) => evaluation.status === 'cerrada').length;
    const drafts = this.evaluations.filter((evaluation) => evaluation.status === 'borrador').length;
    const ready = published + closed;
    const progress = total > 0 ? Math.round((ready / total) * 100) : 0;

    this.pendingEvaluations = drafts;
    this.supportRequiredCount = this.finalResults.filter((result) => result.requires_support).length;
    this.consecutiveCCount = this.finalResults.filter((result) => result.has_consecutive_c).length;

    this.statusBreakdown = {
      promociona: this.studentStatuses.filter((status) => status.final_status === 'promociona').length,
      recuperacion: this.studentStatuses.filter((status) => status.final_status === 'recuperacion').length,
      permanece: this.studentStatuses.filter((status) => status.final_status === 'permanece').length,
      pendiente: this.studentStatuses.filter((status) => !status.final_status || status.final_status === 'pendiente').length,
    };

    this.kpis = [
      { ...this.kpis[0], value: total.toString() },
      { ...this.kpis[1], value: ready.toString() },
      { ...this.kpis[2], value: drafts.toString() },
      { ...this.kpis[3], value: progress.toString() },
      { ...this.kpis[4], value: this.statusBreakdown.recuperacion.toString() },
      { ...this.kpis[5], value: this.supportRequiredCount.toString() },
    ];

    this.courseSummaries = this.buildCourseSummaries(this.evaluations);
    this.riskStudents = this.studentStatuses
      .filter((status) => ['recuperacion', 'permanece'].includes(status.final_status) || status.recovery_required)
      .map((status) => ({
        id: status.student_id,
        name: status.student?.full_name || 'Sin nombre',
        code: status.student?.student_code || 'N/A',
        gradeLevel: status.grade_level?.name || 'Sin grado',
        finalStatus: status.final_status,
        pendingCompetencies: status.pending_competencies_count,
        recoveryRequired: status.recovery_required,
        decisionReason: status.decision_reason || '',
      }))
      .sort((a, b) => b.pendingCompetencies - a.pendingCompetencies);
  }

  private buildCourseSummaries(evaluations: Evaluation[]): CourseReviewSummary[] {
    const courses = new Map<string, CourseReviewSummary>();

    evaluations.forEach((evaluation: any) => {
      const courseId = evaluation.course?.id || evaluation.course_id || 'unknown';
      const current = courses.get(courseId) || {
        courseId,
        courseName: evaluation.course?.name || 'Curso sin nombre',
        total: 0,
        published: 0,
        drafts: 0,
        closed: 0,
        progress: 0,
      };

      current.total += 1;

      if (evaluation.status === 'publicada') {
        current.published += 1;
      } else if (evaluation.status === 'cerrada') {
        current.closed += 1;
      } else {
        current.drafts += 1;
      }

      courses.set(courseId, current);
    });

    return Array.from(courses.values())
      .map((course) => ({
        ...course,
        progress: course.total > 0 ? Math.round(((course.published + course.closed) / course.total) * 100) : 0,
      }))
      .sort((a, b) => a.progress - b.progress || b.drafts - a.drafts);
  }

  private resetDashboard() {
    this.evaluations = [];
    this.studentStatuses = [];
    this.finalResults = [];
    this.courseSummaries = [];
    this.riskStudents = [];
    this.pendingEvaluations = 0;
    this.supportRequiredCount = 0;
    this.consecutiveCCount = 0;
    this.statusBreakdown = {
      promociona: 0,
      recuperacion: 0,
      permanece: 0,
      pendiente: 0,
    };
    this.kpis = this.kpis.map((kpi, index) => ({
      ...kpi,
      value: '0',
      suffix: index === 3 ? '%' : kpi.suffix,
    }));
  }

  private normalizeCollection<T = any>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    console.warn('[evaluation-review] could not normalize response:', response);
    return [];
  }
}
