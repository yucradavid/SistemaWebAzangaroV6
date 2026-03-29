import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService, Period } from '@core/services/academic.service';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import {
  DescriptiveConclusion,
  EvaluationSummary,
  FinalCompetencyResult,
  EvaluationService,
} from '@core/services/evaluation.service';
import {
  ReportService,
  StudentReportCardCourse,
  StudentReportCardResponse,
} from '@core/services/report.service';

type GradeValue = 'AD' | 'A' | 'B' | 'C' | '-';

interface GuardianEvaluationItemView {
  id: string;
  name: string;
  grade: GradeValue;
  description: string;
  periodLabel: string;
  statusLabel: string;
  statusTone: string;
  supportRequired: boolean;
  conclusionText: string;
}

interface GuardianCourseView {
  id: string;
  courseName: string;
  courseCode: string;
  average: GradeValue;
  supportCount: number;
  items: GuardianEvaluationItemView[];
}

interface GuardianConclusionView {
  id: string;
  competencyName: string;
  periodName: string;
  achievementLevel: GradeValue;
  conclusionText: string;
  recommendations: string;
}

interface GuardianFocusItem {
  id: string;
  courseName: string;
  competencyName: string;
  grade: GradeValue;
  periodLabel: string;
  summary: string;
}

@Component({
  selector: 'app-apoderado-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apoderado-evaluation.component.html',
  styleUrls: ['./apoderado-evaluation.component.css']
})
export class ApoderadoEvaluationComponent implements OnInit {
  private authService = inject(AuthService);
  private academicService = inject(AcademicService);
  private evaluationService = inject(EvaluationService);
  private reportService = inject(ReportService);

  students: AcademicContextStudent[] = [];
  periods: Period[] = [];
  courses: GuardianCourseView[] = [];
  summary: EvaluationSummary | null = null;
  error = '';
  loading = false;

  selectedStudentId = '';
  selectedPeriod = 'all';
  selectedCourseId = 'all';
  activeAcademicYearId = '';

  readonly scale = [
    { grade: 'AD', label: 'Logro destacado', color: 'bg-emerald-500', description: 'Desempeno sobresaliente.' },
    { grade: 'A', label: 'Logro esperado', color: 'bg-blue-600', description: 'Cumple con lo esperado.' },
    { grade: 'B', label: 'En proceso', color: 'bg-amber-500', description: 'Requiere refuerzo puntual.' },
    { grade: 'C', label: 'En inicio', color: 'bg-rose-500', description: 'Necesita acompanamiento cercano.' },
  ];

  ngOnInit(): void {
    this.loadAcademicContext();
  }

  get selectedStudent(): AcademicContextStudent | null {
    return this.students.find((student) => student.id === this.selectedStudentId) || null;
  }

  get isAnnualView(): boolean {
    return this.selectedPeriod === 'all';
  }

  get selectedStudentLabel(): string {
    const gradeLevel = this.selectedStudent?.section?.grade_level;
    const sectionLetter = this.selectedStudent?.section?.section_letter;
    return gradeLevel ? `${gradeLevel.grade} ${gradeLevel.level}${sectionLetter ? ` - ${sectionLetter}` : ''}` : '';
  }

  get selectedPeriodDescription(): string {
    if (this.isAnnualView) {
      return 'Vista anual consolidada para acompanar el progreso y la decision final.';
    }

    const period = this.periods.find((item) => item.id === this.selectedPeriod);
    return period ? `Detalle del ${period.name} para el estudiante seleccionado.` : 'Selecciona un periodo.';
  }

  get availableCourses(): GuardianCourseView[] {
    return this.courses
      .slice()
      .sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  get filteredCourses(): GuardianCourseView[] {
    if (this.selectedCourseId === 'all') {
      return this.courses;
    }

    return this.courses.filter((course) => course.id === this.selectedCourseId);
  }

  get annualCards(): Array<{ label: string; value: string; helper: string }> {
    if (!this.summary) {
      return [];
    }

    return [
      {
        label: 'Competencias',
        value: String(this.summary.totals.competencies || 0),
        helper: 'Resultados finales consolidados.',
      },
      {
        label: 'Estado final',
        value: this.getFinalStatusLabel(this.summary.student_final_status?.final_status),
        helper: 'Situacion anual del estudiante.',
      },
      {
        label: 'Pendientes',
        value: String((this.summary.totals.b || 0) + (this.summary.totals.c || 0)),
        helper: 'Competencias en B o C.',
      },
      {
        label: 'Recuperacion',
        value: String(this.summary.recovery_process?.results?.length || 0),
        helper: this.summary.recovery_process ? this.summary.recovery_process.status : 'Sin proceso activo.',
      },
    ];
  }

  get conclusions(): GuardianConclusionView[] {
    if (!this.summary) {
      return [];
    }

    return this.summary.descriptive_conclusions.map((conclusion) => ({
      id: conclusion.id,
      competencyName: conclusion.competency?.name || conclusion.competency?.description || 'Competencia',
      periodName: conclusion.period?.name || 'Periodo',
      achievementLevel: (conclusion.achievement_level || '-') as GradeValue,
      conclusionText: conclusion.conclusion_text || '',
      recommendations: conclusion.recommendations || '',
    }));
  }

  get priorityItems(): GuardianFocusItem[] {
    const gradeOrder: Record<GradeValue, number> = { C: 0, B: 1, A: 2, AD: 3, '-': 4 };

    return this.filteredCourses
      .flatMap((course) =>
        course.items
          .filter((item) => item.supportRequired)
          .map((item) => ({
            id: `${course.id}-${item.id}`,
            courseName: course.courseName,
            competencyName: item.name,
            grade: item.grade,
            periodLabel: item.periodLabel,
            summary: item.conclusionText || item.description || 'Conviene reforzar esta competencia con apoyo en casa y seguimiento docente.',
          }))
      )
      .sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade] || a.courseName.localeCompare(b.courseName))
      .slice(0, 4);
  }

  get actionPlan():
    | { title: string; message: string; tone: string }
    | null {
    if (this.isAnnualView && this.summary?.student_final_status) {
      const status = this.summary.student_final_status.final_status;

      if (status === 'promociona') {
        return {
          title: 'Acompanamiento estable',
          message: this.priorityItems.length > 0
            ? 'El estudiante cierra bien el ano, pero aun hay competencias que conviene reforzar desde casa.'
            : 'El progreso anual es favorable. Mantengan seguimiento de comentarios y rutinas de estudio.',
          tone: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        };
      }

      if (status === 'recuperacion') {
        return {
          title: 'Priorizar refuerzo',
          message: 'Conviene concentrarse en las competencias en B y C y revisar el plan de apoyo con el colegio.',
          tone: 'bg-amber-50 border-amber-200 text-amber-700',
        };
      }

      if (status === 'permanece') {
        return {
          title: 'Intervencion inmediata',
          message: 'El estudiante necesita apoyo academico sostenido y seguimiento cercano en los cursos criticos.',
          tone: 'bg-rose-50 border-rose-200 text-rose-700',
        };
      }
    }

    if (this.priorityItems.length > 0) {
      return {
        title: 'Seguimiento del periodo',
        message: 'Hay competencias que conviene revisar con el estudiante antes del siguiente corte evaluativo.',
        tone: 'bg-amber-50 border-amber-200 text-amber-700',
      };
    }

    if (this.filteredCourses.length > 0) {
      return {
        title: 'Panorama estable',
        message: 'No hay alertas visibles en el filtro actual. Revisa comentarios y conclusiones para sostener el avance.',
        tone: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      };
    }

    return null;
  }

  loadEvaluationData(): void {
    if (!this.selectedStudentId || !this.activeAcademicYearId) {
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.isAnnualView) {
      this.evaluationService.getEvaluationSummary(this.activeAcademicYearId, this.selectedStudentId).subscribe({
        next: (summary) => {
          this.summary = summary;
          this.courses = this.mapSummaryCourses(summary);
          this.syncSelectedCourseFilter();
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar el cierre anual del estudiante.';
          this.summary = null;
          this.courses = [];
          this.loading = false;
        }
      });
      return;
    }

    this.reportService.getReportCard(this.selectedStudentId, this.selectedPeriod).subscribe({
      next: (response) => {
        this.summary = null;
        this.courses = this.mapReportCourses(response);
        this.syncSelectedCourseFilter();
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el reporte del periodo seleccionado.';
        this.courses = [];
        this.loading = false;
      }
    });
  }

  onStudentChange(): void {
    this.selectedCourseId = 'all';
    this.loadEvaluationData();
  }

  getGradeColorClass(grade: GradeValue): string {
    const map: Record<GradeValue, string> = {
      AD: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      A: 'text-blue-700 bg-blue-50 border-blue-200',
      B: 'text-amber-700 bg-amber-50 border-amber-200',
      C: 'text-rose-700 bg-rose-50 border-rose-200',
      '-': 'text-slate-500 bg-slate-50 border-slate-200',
    };

    return map[grade] || map['-'];
  }

  getGradeChipClass(grade: GradeValue): string {
    return this.getGradeColorClass(grade);
  }

  getGradeLabel(grade: GradeValue): string {
    const map: Record<GradeValue, string> = {
      AD: 'Logro destacado',
      A: 'Logro esperado',
      B: 'En proceso',
      C: 'En inicio',
      '-': 'Sin nota',
    };

    return map[grade] || 'Sin nota';
  }

  getFinalStatusLabel(status?: string | null): string {
    const map: Record<string, string> = {
      promociona: 'Promociona',
      recuperacion: 'Recuperacion',
      permanece: 'Permanece',
      pendiente: 'Pendiente',
    };

    return map[status || 'pendiente'] || 'Pendiente';
  }

  getFinalStatusClass(status?: string | null): string {
    const map: Record<string, string> = {
      promociona: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      recuperacion: 'bg-amber-50 text-amber-700 border-amber-200',
      permanece: 'bg-rose-50 text-rose-700 border-rose-200',
      pendiente: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return map[status || 'pendiente'] || map['pendiente'];
  }

  getAreaCoverage(area: EvaluationSummary['areas'][number]): number {
    if (!area?.total) {
      return 0;
    }

    return Math.round(((area.aad_count || 0) / area.total) * 100);
  }

  private loadAcademicContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.students = context.students || [];
        this.selectedStudentId = this.students[0]?.id || '';
        this.activeAcademicYearId = context.active_academic_year?.id || '';

        if (!this.students.length) {
          this.error = 'Tu usuario no tiene estudiantes vinculados.';
          this.loading = false;
          return;
        }

        if (!this.activeAcademicYearId) {
          this.error = 'No existe un ano academico activo configurado.';
          this.loading = false;
          return;
        }

        this.academicService.getPeriods({ academic_year_id: this.activeAcademicYearId }).subscribe({
          next: (response) => {
            this.periods = response.data || response || [];
            this.loadEvaluationData();
          },
          error: () => {
            this.error = 'No se pudieron cargar los periodos academicos.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'No se pudo obtener el contexto academico del apoderado.';
        this.loading = false;
      }
    });
  }

  private mapSummaryCourses(summary: EvaluationSummary): GuardianCourseView[] {
    const grouped = summary.final_results.reduce<Record<string, FinalCompetencyResult[]>>((acc, item) => {
      if (!acc[item.course_id]) {
        acc[item.course_id] = [];
      }

      acc[item.course_id].push(item);
      return acc;
    }, {});

    const mapped = Object.entries(grouped).map(([courseId, results]) => ({
      id: courseId,
      courseName: results[0]?.course?.name || 'Curso',
      courseCode: results[0]?.course?.code || '',
      average: this.aggregateLevels(results.map((item) => (item.final_level || '-') as GradeValue)),
      supportCount: results.filter((item) => item.requires_support).length,
      items: results
        .slice()
        .sort((a, b) => (a.competency?.name || '').localeCompare(b.competency?.name || ''))
        .map((result) => ({
          id: result.competency?.id || result.competency_id,
          name: result.competency?.name || result.competency?.description || 'Competencia',
          grade: (result.final_level || '-') as GradeValue,
          description: result.evidence_note || result.competency?.description || '',
          periodLabel: result.source_period?.name || 'Cierre anual',
          statusLabel: this.getEvaluationStatusLabel(result.current_status),
          statusTone: this.getEvaluationStatusClass(result.current_status),
          supportRequired: !!result.requires_support,
          conclusionText: this.getLatestConclusionForCompetency(summary.descriptive_conclusions, result.competency_id)?.conclusion_text || '',
        })),
    }));

    return this.withMissingEnrolledCourses(mapped, summary.enrolled_courses);
  }

  private mapReportCourses(response: StudentReportCardResponse): GuardianCourseView[] {
    return (response.report || [])
      .map((course: StudentReportCardCourse) => ({
        id: course.course_id,
        courseName: course.course_name || 'Curso',
        courseCode: course.course_code || '',
        average: this.aggregateLevels((course.competencies || []).map((item) => (item.grade || '-') as GradeValue)),
        supportCount: (course.competencies || []).filter((item) => item.grade === 'B' || item.grade === 'C').length,
        items: (course.competencies || []).map((item) => ({
          id: item.competency_id || item.evaluation_id,
          name: item.competency_name || 'Competencia',
          grade: (item.grade || '-') as GradeValue,
          description: item.comments || '',
          periodLabel: course.period_name || 'Periodo',
          statusLabel: this.getEvaluationStatusLabel(item.status),
          statusTone: this.getEvaluationStatusClass(item.status),
          supportRequired: item.grade === 'B' || item.grade === 'C',
          conclusionText: '',
        })),
      }))
      .sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  private withMissingEnrolledCourses(
    courses: GuardianCourseView[],
    enrolledCourses?: Array<{ id: string; code?: string; name?: string }>,
  ): GuardianCourseView[] {
    const merged = new Map<string, GuardianCourseView>(courses.map((course) => [course.id, course]));

    (enrolledCourses || []).forEach((course) => {
      if (merged.has(course.id)) {
        return;
      }

      merged.set(course.id, {
        id: course.id,
        courseName: course.name || 'Curso',
        courseCode: course.code || '',
        average: '-',
        supportCount: 0,
        items: [],
      });
    });

    return Array.from(merged.values()).sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  private getLatestConclusionForCompetency(
    conclusions: DescriptiveConclusion[],
    competencyId: string,
  ): DescriptiveConclusion | null {
    const matches = conclusions.filter((item) => item.competency_id === competencyId);
    if (matches.length === 0) {
      return null;
    }

    return matches.sort((a, b) => this.getPeriodRank(b.period?.id) - this.getPeriodRank(a.period?.id))[0];
  }

  private getPeriodRank(periodId?: string): number {
    const period = this.periods.find((item) => item.id === periodId);
    return period?.period_number || 0;
  }

  private getEvaluationStatusLabel(status?: string | null): string {
    const map: Record<string, string> = {
      borrador: 'Borrador',
      publicada: 'Publicada',
      cerrada: 'Cerrada',
    };

    return map[status || ''] || 'Sin estado';
  }

  private getEvaluationStatusClass(status?: string | null): string {
    const map: Record<string, string> = {
      borrador: 'bg-amber-50 text-amber-700 border-amber-200',
      publicada: 'bg-blue-50 text-blue-700 border-blue-200',
      cerrada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };

    return map[status || ''] || 'bg-slate-50 text-slate-600 border-slate-200';
  }

  private syncSelectedCourseFilter(): void {
    if (this.selectedCourseId === 'all') {
      return;
    }

    const hasSelected = this.courses.some((course) => course.id === this.selectedCourseId);
    if (!hasSelected) {
      this.selectedCourseId = 'all';
    }
  }

  private aggregateLevels(levels: GradeValue[]): GradeValue {
    const order: Record<string, number> = { '-': 0, C: 1, B: 2, A: 3, AD: 4 };

    return levels.reduce<GradeValue>((lowest, level) => {
      if (!lowest || lowest === '-') {
        return level;
      }

      return (order[level] || 0) < (order[lowest] || 0) ? level : lowest;
    }, '-');
  }
}
