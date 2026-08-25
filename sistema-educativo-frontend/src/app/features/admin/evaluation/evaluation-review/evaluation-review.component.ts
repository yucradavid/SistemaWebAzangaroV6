//src/app/features/admin/evaluation/evaluation-review/evaluation-review.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { getFailedCourseNamesFromResults } from '@shared/utils/grade-converter';
import { DonutChartComponent, DonutChartSegment } from '@shared/components/charts/donut-chart.component';
import { BarChartComponent, BarChartItem } from '@shared/components/charts/bar-chart.component';
import { AcademicService, Period } from '@core/services/academic.service';
import {
  Evaluation,
  EvaluationService,
  FinalCompetencyResult,
  PeriodCoverageCourse,
  StudentFinalStatus,
} from '@core/services/evaluation.service';

interface ReviewKpi {
  label: string;
  value: string;
  suffix?: string;
  icon: string;
  tone: 'slate' | 'blue' | 'green' | 'yellow' | 'red';
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
  nextGradeLevelId: string;
  isGraduating: boolean;
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
  next_grade_level_id?: string | null;
  is_graduating?: boolean;
};

const RISK_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'promocionan', label: 'Promocionan' },
  { key: 'vacacional', label: 'Vacacional' },
  { key: 'permanecen', label: 'Permanecen' },
] as const;

type RiskTab = typeof RISK_TABS[number]['key'];

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
  imports: [CommonModule, BackButtonComponent, FormsModule, DonutChartComponent, BarChartComponent],
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

  gradeLevels: any[] = [];
  sections: any[] = [];
  teachers: any[] = [];
  selectedGradeLevelId = '';
  selectedSectionId = '';
  selectedTeacherId = '';

  loading = false;
  closing = false;
  errorMessage = '';
  successMessage = '';

  evaluations: Evaluation[] = [];
  studentStatuses: ReviewStudentFinalStatus[] = [];
  finalResults: ReviewFinalCompetencyResult[] = [];
  periodCoverageCourses: PeriodCoverageCourse[] = [];
  riskStudents: RiskStudentItem[] = [];

  pendingEvaluations = 0;
  supportRequiredCount = 0;
  consecutiveCCount = 0;
  coursesWithoutProgress = 0;

  showCompletedCourses = false;
  coursePage = 1;
  readonly coursePageSize = 10;
  courseSearchTerm = '';

  riskTabs = RISK_TABS;
  riskTab: RiskTab = 'todos';
  riskPage = 1;
  readonly riskPageSize = 10;
  gradeLevelsById = new Map<string, string>();

  ebrDistributionChart: DonutChartSegment[] = [];
  coverageBarChart: BarChartItem[] = [];

  private readonly EBR_COLORS: Record<string, string> = {
    AD: '#10b981',
    A: '#3b82f6',
    B: '#f59e0b',
    C: '#f43f5e',
  };

  statusBreakdown = {
    promociona: 0,
    vacacional: 0,
    recuperacion: 0,
    permanece: 0,
    pendiente: 0,
  };

  sendingWhatsappId = '';

  kpis: ReviewKpi[] = [
    { label: 'Evaluaciones del periodo', value: '0', icon: '<path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M11 16V9"/><path d="M15 16V5"/><path d="M19 16v-7"/>', tone: 'slate' },
    { label: 'Publicadas o cerradas', value: '0', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', tone: 'green' },
    { label: 'Borradores pendientes', value: '0', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', tone: 'yellow' },
    { label: 'Avance de cierre', value: '0', suffix: '%', icon: '<path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M11 16V9"/><path d="M15 16V5"/><path d="M19 16v-7"/>', tone: 'blue' },
    { label: 'Estudiantes en recuperacion', value: '0', icon: '<path d="M12 2v6"/><path d="M12 16v6"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M2 12h6"/><path d="M16 12h6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M14.83 9.17l4.24-4.24"/>', tone: 'yellow' },
    { label: 'Competencias con soporte', value: '0', icon: '<path d="M9 12l2 2 4-4"/><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 1 0 0 1.996A.953.953 0 0 0 21 12Z"/>', tone: 'red' },
    { label: 'Cursos sin avance', value: '0', icon: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>', tone: 'red' },
  ];

  ngOnInit() {
    this.loadInitialData();
    this.loadFilterOptions();
  }

  get filteredSections(): any[] {
    return this.sections.filter((section: any) => {
      if (!this.selectedGradeLevelId) {
        return true;
      }

      return String(section.grade_level_id || section.gradeLevel?.id || '') === this.selectedGradeLevelId;
    });
  }

  loadFilterOptions(): void {
    forkJoin({
      gradeLevels: this.academicService.getGradeLevels({ per_page: 100 }),
      sections: this.academicService.getSections({ per_page: 300 }),
      teachers: this.academicService.getTeachers({ per_page: 200 }),
    }).subscribe({
      next: ({ gradeLevels, sections, teachers }) => {
        this.gradeLevels = this.normalizeCollection(gradeLevels);
        this.sections = this.normalizeCollection(sections);
        this.teachers = this.normalizeCollection(teachers);
        this.refreshGradeLevelsById();
      },
      error: (error) => {
        console.error('[evaluation-review] filter options error:', error);
      }
    });
  }

  onGradeLevelChange(): void {
    const stillMatches = this.filteredSections.some((section: any) => section.id === this.selectedSectionId);
    if (!stillMatches) {
      this.selectedSectionId = '';
    }
    this.onExtraFilterChange();
  }

  onExtraFilterChange(): void {
    if (!this.selectedPeriodId) {
      return;
    }
    this.loadStats();
  }

  clearExtraFilters(): void {
    this.selectedGradeLevelId = '';
    this.selectedSectionId = '';
    this.selectedTeacherId = '';
    this.courseSearchTerm = '';
    this.onExtraFilterChange();
  }

  getTeacherName(teacher: any): string {
    const first = teacher?.name || teacher?.first_name || '';
    const last = teacher?.last_name || '';
    return `${first} ${last}`.trim() || 'Docente';
  }

  // El buscador es solo de texto libre por nombre de curso, filtrado en el
  // cliente. Grado/Seccion/Docente ya se resuelven en el servidor (ver
  // onExtraFilterChange -> loadStats), asi que combinarlo "naturalmente"
  // con esos filtros significa aplicarlo sobre periodCoverageCourses, que
  // ya llega acotado por esos 3 filtros - no hace falta reimplementarlos
  // en el cliente.
  onCourseSearchChange(): void {
    this.coursePage = 1;
  }

  private matchesCourseSearch(courseName: string): boolean {
    if (!this.courseSearchTerm.trim()) {
      return true;
    }

    const normalize = (value: string) => value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    return normalize(courseName).includes(normalize(this.courseSearchTerm));
  }

  // Cursos con avance parcial o nulo (0-99%): lo que necesita atencion,
  // se muestra primero y paginado. Los completados al 100% se agrupan
  // aparte, colapsados por defecto, para que la tabla no se sature con
  // el crecimiento futuro de asignaciones (PASO 3/4).
  get problemCourses(): PeriodCoverageCourse[] {
    return this.periodCoverageCourses.filter((course) =>
      course.coverage_percent < 100 && this.matchesCourseSearch(course.course_name)
    );
  }

  get completedCourses(): PeriodCoverageCourse[] {
    return this.periodCoverageCourses.filter((course) =>
      course.coverage_percent === 100 && this.matchesCourseSearch(course.course_name)
    );
  }

  // Badge de conteo en el header de la card: refleja el resultado ya
  // acotado por el buscador (problemCourses + completedCourses ya lo
  // aplican), no el total de asignaciones sin filtrar.
  get filteredCoursesCount(): number {
    return this.problemCourses.length + this.completedCourses.length;
  }

  get problemCoursesTotalPages(): number {
    return Math.max(1, Math.ceil(this.problemCourses.length / this.coursePageSize));
  }

  get pagedProblemCourses(): PeriodCoverageCourse[] {
    const start = (this.coursePage - 1) * this.coursePageSize;
    return this.problemCourses.slice(start, start + this.coursePageSize);
  }

  goToCoursePage(page: number): void {
    this.coursePage = Math.min(Math.max(1, page), this.problemCoursesTotalPages);
  }

  toggleCompletedCourses(): void {
    this.showCompletedCourses = !this.showCompletedCourses;
  }

  setRiskTab(tab: RiskTab): void {
    this.riskTab = tab;
    this.riskPage = 1;
  }

  get filteredRiskStudents(): RiskStudentItem[] {
    switch (this.riskTab) {
      case 'promocionan':
        return this.riskStudents.filter((student) => student.finalStatus === 'promociona');
      case 'vacacional':
        return this.riskStudents.filter((student) => student.finalStatus === 'vacacional');
      case 'permanecen':
        return this.riskStudents.filter((student) => student.finalStatus === 'permanece');
      default:
        return this.riskStudents;
    }
  }

  get riskTabCounts(): Record<RiskTab, number> {
    const count = (finalStatus: string): number =>
      this.riskStudents.filter((student) => student.finalStatus === finalStatus).length;

    return {
      todos: this.riskStudents.length,
      promocionan: count('promociona'),
      vacacional: count('vacacional'),
      permanecen: count('permanece'),
    };
  }

  get riskTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRiskStudents.length / this.riskPageSize));
  }

  get pagedRiskStudents(): RiskStudentItem[] {
    const start = (this.riskPage - 1) * this.riskPageSize;
    return this.filteredRiskStudents.slice(start, start + this.riskPageSize);
  }

  goToRiskPage(page: number): void {
    this.riskPage = Math.min(Math.max(1, page), this.riskTotalPages);
  }

  // Grado que cursara el estudiante el proximo año segun la decision
  // persistida (student_final_statuses.next_grade_level_id): promociona y
  // vacacional -> grado siguiente; permanece -> el MISMO grado (repite);
  // is_graduating -> egreso, sin grado siguiente. Se resuelve contra el
  // catalogo de grados ya cargado porque /student-final-statuses devuelve
  // solo el UUID, sin la relacion nextGradeLevel.
  resolveProjectedGrade(student: RiskStudentItem): string {
    if (!student.nextGradeLevelId) {
      return student.isGraduating ? 'Egresa' : '-';
    }
    return this.gradeLevelsById.get(student.nextGradeLevelId) || '-';
  }

  private refreshGradeLevelsById(): void {
    this.gradeLevelsById = new Map(
      this.gradeLevels
        .map((grade) => [String(grade.id), String(grade.name || '')] as const)
        .filter(([id, name]) => id && name)
    );
  }

  get readyToClose(): boolean {
    return !!this.selectedPeriod && !this.selectedPeriod.is_closed && this.pendingEvaluations === 0;
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

    const evaluationFilters: any = { period_id: this.selectedPeriodId, per_page: 500 };
    const statusFilters: any = { academic_year_id: this.activeAcademicYearId, per_page: 500 };
    const coverageFilters: any = { period_id: this.selectedPeriodId };

    // final-competency-results no tiene columna de seccion/docente en el
    // modelo (solo course_id/competency_id), asi que queda fuera del
    // alcance de los filtros de Grado/Seccion/Docente por decision de
    // scope - solo alimenta 2 KPIs secundarios (soporte y C consecutiva).
    if (this.selectedGradeLevelId) {
      evaluationFilters.grade_level_id = this.selectedGradeLevelId;
      statusFilters.grade_level_id = this.selectedGradeLevelId;
      coverageFilters.grade_level_id = this.selectedGradeLevelId;
    }
    if (this.selectedSectionId) {
      evaluationFilters.section_id = this.selectedSectionId;
      coverageFilters.section_id = this.selectedSectionId;
    }
    if (this.selectedTeacherId) {
      evaluationFilters.teacher_id = this.selectedTeacherId;
      coverageFilters.teacher_id = this.selectedTeacherId;
    }

    forkJoin({
      evaluations: this.evaluationService.getEvaluations(evaluationFilters),
      statuses: this.evaluationService.getStudentFinalStatuses(statusFilters),
      finalResults: this.evaluationService.getFinalCompetencyResults({ academic_year_id: this.activeAcademicYearId, per_page: 500 }),
      coverage: this.evaluationService.getPeriodCoverage(coverageFilters),
    }).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: ({ evaluations, statuses, finalResults, coverage }) => {
        this.evaluations = this.normalizeCollection<Evaluation>(evaluations);
        this.studentStatuses = this.normalizeCollection<ReviewStudentFinalStatus>(statuses);
        this.finalResults = this.normalizeCollection<ReviewFinalCompetencyResult>(finalResults);
        this.periodCoverageCourses = coverage?.courses || [];
        this.coursesWithoutProgress = coverage?.summary?.courses_without_progress || 0;
        this.coursePage = 1;
        this.showCompletedCourses = false;

        console.log('[evaluation-review] evaluations:', this.evaluations);
        console.log('[evaluation-review] student statuses:', this.studentStatuses);
        console.log('[evaluation-review] final results:', this.finalResults);
        console.log('[evaluation-review] period coverage:', coverage);

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

  getKpiChipClasses(tone: ReviewKpi['tone']): { wrap: string; label: string; value: string } {
    const map: Record<ReviewKpi['tone'], { wrap: string; label: string; value: string }> = {
      slate: { wrap: 'bg-slate-50 border-slate-200', label: 'text-slate-400', value: 'text-slate-900' },
      blue: { wrap: 'bg-blue-50 border-blue-200', label: 'text-blue-700', value: 'text-blue-900' },
      green: { wrap: 'bg-green-50 border-green-200', label: 'text-green-700', value: 'text-green-900' },
      yellow: { wrap: 'bg-yellow-50 border-yellow-200', label: 'text-yellow-700', value: 'text-yellow-900' },
      red: { wrap: 'bg-red-50 border-red-200', label: 'text-red-700', value: 'text-red-900' },
    };

    return map[tone];
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      promociona: 'bg-green-50 text-green-700 border-green-200',
      vacacional: 'bg-orange-50 text-orange-700 border-orange-200',
      recuperacion: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      permanece: 'bg-red-50 text-red-700 border-red-200',
      pendiente: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return map[status] || map['pendiente'];
  }

  // Cursos con nota final en C del año activo para el aviso de Escuela
  // Vacacional. La formula (promedio EBR por curso) vive compartida en
  // grade-converter.ts::getFailedCourseNamesFromResults — misma que usa el
  // detalle de estudiantes — porque replica la del backend y no debe
  // divergir entre pantallas.
  getVacacionalCourseNames(studentId: string): string[] {
    return getFailedCourseNamesFromResults(
      this.finalResults.filter((result) => result.student_id === studentId)
    );
  }

  // Envio 100% manual al apoderado: mismo patron de Admision
  // (enrollment-approvals.component.ts::shareCredentialsViaWhatsapp) y de
  // Tutoria Academica — abre wa.me con el mensaje pre-armado y quien envia
  // revisa y presiona enviar. El telefono se resuelve on-demand desde
  // student-course-enrollments porque /student-final-statuses no trae
  // guardians.
  sendVacationalWhatsapp(student: RiskStudentItem): void {
    const courseNames = this.getVacacionalCourseNames(student.id);

    if (courseNames.length === 0) {
      void Swal.fire({
        icon: 'warning',
        title: 'Sin cursos desaprobados',
        text: `No se encontraron cursos con nota final en C para ${student.name} en el año activo.`,
        confirmButtonText: 'Entendido',
      });
      return;
    }

    if (!this.activeAcademicYearId || this.sendingWhatsappId) {
      return;
    }

    this.sendingWhatsappId = student.id;
    this.academicService.getStudentCourseEnrollments({
      student_id: student.id,
      academic_year_id: this.activeAcademicYearId,
      per_page: 100,
    }).pipe(
      finalize(() => {
        this.sendingWhatsappId = '';
      })
    ).subscribe({
      next: (response) => {
        const rows = this.normalizeCollection<any>(response);
        const guardians = rows[0]?.student?.guardians || [];
        const guardian =
          guardians.find((item: any) => item.is_primary && String(item.phone || '').trim())
          || guardians.find((item: any) => String(item.phone || '').trim());

        const rawPhone = String(guardian?.phone || '').replace(/\D/g, '');
        if (!rawPhone) {
          void Swal.fire({
            icon: 'warning',
            title: 'Sin numero de WhatsApp',
            text: `${student.name} no tiene un telefono de apoderado registrado.`,
            confirmButtonText: 'Entendido',
          });
          return;
        }

        const fullPhone = rawPhone.startsWith('51') ? rawPhone : '51' + rawPhone;
        const guardianName = [guardian?.first_name, guardian?.last_name].filter(Boolean).join(' ').trim();

        const lines: string[] = [
          `Hola ${guardianName || 'apoderado(a)'},`,
          '',
          `Le informamos que ${student.name} pasara al siguiente grado, pero desaprobó (C) los siguientes cursos y deberá recuperarlos en Escuela Vacacional:`,
          '',
          ...courseNames.map((name) => `• ${name}`),
          '',
          'Le pedimos estar atentos a las fechas y modalidad de la Escuela Vacacional que el colegio comunicará oportunamente.',
        ];

        const message = encodeURIComponent(lines.join('\n'));
        window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
      },
      error: (error) => {
        console.error('[evaluation-review] guardian phone error:', error);
        void Swal.fire({
          icon: 'error',
          title: 'No se pudo consultar el apoderado',
          text: 'Ocurrió un error al buscar el telefono del apoderado. Intenta nuevamente.',
          confirmButtonText: 'Entendido',
        });
      }
    });
  }

  getCoverageBadgeClass(percent: number): string {
    if (percent === 0) return 'bg-red-50 text-red-700 border-red-200';
    if (percent < 100) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  getCoverageBarClass(percent: number): string {
    if (percent === 0) return 'bg-red-400';
    if (percent < 100) return 'bg-amber-400';
    return 'bg-emerald-500';
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
      vacacional: this.studentStatuses.filter((status) => status.final_status === 'vacacional').length,
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
      { ...this.kpis[6], value: this.coursesWithoutProgress.toString(), tone: this.coursesWithoutProgress > 0 ? 'red' : 'slate' },
    ];

    this.riskStudents = this.studentStatuses
      .filter((status) => ['promociona', 'vacacional', 'recuperacion', 'permanece'].includes(status.final_status) || status.recovery_required)
      .map((status) => ({
        id: status.student_id,
        name: status.student?.full_name || 'Sin nombre',
        code: status.student?.student_code || 'N/A',
        gradeLevel: status.grade_level?.name || 'Sin grado',
        finalStatus: status.final_status,
        pendingCompetencies: status.pending_competencies_count,
        recoveryRequired: status.recovery_required,
        decisionReason: status.decision_reason || '',
        nextGradeLevelId: String(status.next_grade_level_id || ''),
        isGraduating: !!status.is_graduating,
      }))
      .sort((a, b) => b.pendingCompetencies - a.pendingCompetencies);

    this.refreshGradeLevelsById();
    this.riskPage = 1;

    this.buildEbrDistributionChart();
    this.buildCoverageBarChart();
  }

  private buildEbrDistributionChart(): void {
    const studentsByGrade: Record<string, Set<string>> = { AD: new Set(), A: new Set(), B: new Set(), C: new Set() };

    this.evaluations.forEach((evaluation: any) => {
      const grade = evaluation.grade;
      const studentId = evaluation.student?.id || evaluation.student_id;
      if (grade && studentsByGrade[grade] && studentId) {
        studentsByGrade[grade].add(studentId);
      }
    });

    const labels: Record<string, string> = { AD: 'AD - Logro destacado', A: 'A - Logro esperado', B: 'B - En proceso', C: 'C - En inicio' };

    this.ebrDistributionChart = (['AD', 'A', 'B', 'C'] as const)
      .filter((grade) => studentsByGrade[grade].size > 0)
      .map((grade) => ({
        label: labels[grade],
        value: studentsByGrade[grade].size,
        color: this.EBR_COLORS[grade],
      }));
  }

  private buildCoverageBarChart(): void {
    this.coverageBarChart = this.periodCoverageCourses.map((course) => ({
      label: course.course_name,
      value: course.coverage_percent,
    }));
  }

  private resetDashboard() {
    this.evaluations = [];
    this.studentStatuses = [];
    this.finalResults = [];
    this.periodCoverageCourses = [];
    this.coursePage = 1;
    this.showCompletedCourses = false;
    this.riskStudents = [];
    this.riskTab = 'todos';
    this.riskPage = 1;
    this.pendingEvaluations = 0;
    this.supportRequiredCount = 0;
    this.consecutiveCCount = 0;
    this.coursesWithoutProgress = 0;
    this.ebrDistributionChart = [];
    this.coverageBarChart = [];
    this.statusBreakdown = {
      promociona: 0,
      vacacional: 0,
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
