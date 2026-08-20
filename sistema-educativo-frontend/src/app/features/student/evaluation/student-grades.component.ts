import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { ebrToRange } from '@shared/utils/grade-converter';
import { ICONS } from '@core/constants/icons';
import { AcademicService, Period } from '@core/services/academic.service';
import { PeriodContextService } from '@core/services/period-context.service';
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

interface CompetencyRow {
  competencyId: string;
  competencyName: string;
  grade: 'AD' | 'A' | 'B' | 'C' | null;
  status: 'publicada' | 'borrador' | null;
  evaluationId: string | null;
}

interface TrimestreRow {
  periodId: string;
  periodName: string;
  periodEndDate: string;
  periodNumber: number;
  competencies: CompetencyRow[];
}

interface CourseTableView {
  courseId: string;
  courseName: string;
  teacherName: string;
  trimestres: TrimestreRow[];
}

interface StudentEvaluationItemView {
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

interface StudentCourseView {
  id: string;
  courseName: string;
  courseCode: string;
  average: GradeValue;
  supportCount: number;
  items: StudentEvaluationItemView[];
}

interface StudentConclusionView {
  id: string;
  competencyName: string;
  periodName: string;
  achievementLevel: GradeValue;
  conclusionText: string;
  recommendations: string;
}

interface StudentFocusItem {
  id: string;
  courseName: string;
  competencyName: string;
  grade: GradeValue;
  periodLabel: string;
  summary: string;
}

@Component({
  selector: 'app-grades-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  templateUrl: './student-grades.component.html',
  styleUrls: ['./student-grades.component.css']
})
export class GradesStudentComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private academicService = inject(AcademicService);
  private evaluationService = inject(EvaluationService);
  private reportService = inject(ReportService);
  private periodCtx = inject(PeriodContextService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  loading = false;
  error = '';
  selectedPeriod = 'all';
  selectedCourseId = 'all';
  periods: Period[] = [];
  courses: StudentCourseView[] = [];
  courseTableViews: CourseTableView[] = [];
  summary: EvaluationSummary | null = null;
  studentContext: AcademicContextStudent | null = null;
  activeAcademicYearId = '';

  readonly scale = [
    { grade: 'AD', label: 'Logro destacado', color: 'bg-green-500', description: 'Desempeno sobresaliente.' },
    { grade: 'A', label: 'Logro esperado', color: 'bg-blue-600', description: 'Cumple con lo esperado.' },
    { grade: 'B', label: 'En proceso', color: 'bg-amber-500', description: 'Requiere refuerzo puntual.' },
    { grade: 'C', label: 'En inicio', color: 'bg-rose-500', description: 'Necesita acompanamiento cercano.' },
  ];

  ngOnInit(): void {
    // Sincronizar con el selector global de trimestre del navbar.
    // Antes de cargar el contexto: solo fija selectedPeriod (sin recargar todavia).
    // Despues de cargado: un cambio global recarga las notas del periodo.
    this.periodCtx.selectedPeriod$.subscribe((period) => {
      if (!period) {
        return;
      }
      this.selectedPeriod = period.id;
      if (this.studentContext?.id && this.activeAcademicYearId) {
        this.loadGrades();
      }
    });

    this.loadAcademicContext();
    this.route.queryParams.subscribe((params) => {
      if (params['course_id']) {
        this.selectedCourseId = params['course_id'];
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  get isAnnualView(): boolean {
    return this.selectedPeriod === 'all';
  }

  get studentLabel(): string {
    const gradeLevel = this.studentContext?.section?.grade_level;
    const sectionLetter = this.studentContext?.section?.section_letter;
    return gradeLevel ? `${gradeLevel.grade} ${gradeLevel.level}${sectionLetter ? ` - ${sectionLetter}` : ''}` : '';
  }

  get selectedPeriodDescription(): string {
    if (this.isAnnualView) {
      return 'Muestra resultado final, recuperacion, areas y conclusiones.';
    }

    const period = this.periods.find((item) => item.id === this.selectedPeriod);
    return period ? `Detalle del ${period.name}.` : 'Selecciona un periodo.';
  }

  get availableCourses(): StudentCourseView[] {
    return this.courses
      .slice()
      .sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  get filteredCourses(): StudentCourseView[] {
    if (this.selectedCourseId === 'all') {
      return this.courses;
    }

    return this.courses.filter((course) => course.id === this.selectedCourseId);
  }

  get filteredCourseTableViews(): CourseTableView[] {
    if (this.selectedCourseId === 'all') {
      return this.courseTableViews;
    }

    return this.courseTableViews.filter((course) => course.courseId === this.selectedCourseId);
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
        helper: 'Decision anual vigente.',
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

  get conclusions(): StudentConclusionView[] {
    if (!this.summary) {
      return [];
    }

    return this.summary.descriptive_conclusions.map((conclusion) => ({
      id: conclusion.id,
      competencyName: conclusion.competency?.name || 'Competencia',
      periodName: conclusion.period?.name || 'Periodo',
      achievementLevel: (conclusion.achievement_level || '-') as GradeValue,
      conclusionText: conclusion.conclusion_text || '',
      recommendations: conclusion.recommendations || '',
    }));
  }

  get priorityItems(): StudentFocusItem[] {
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
            summary: item.conclusionText || item.description || 'Requiere refuerzo y seguimiento docente.',
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
          title: 'Mantener el ritmo',
          message: this.priorityItems.length > 0
            ? 'Hay competencias en observacion. Refuerza los cursos filtrados para sostener el resultado final.'
            : 'El cierre anual es favorable. Mantén constancia y revisa las recomendaciones del docente.',
          tone: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        };
      }

      if (status === 'recuperacion') {
        return {
          title: 'Prioriza recuperacion',
          message: 'Concéntrate en las competencias con B y C, siguiendo las conclusiones y el plan de apoyo.',
          tone: 'bg-amber-50 border-amber-200 text-amber-700',
        };
      }

      if (status === 'permanece') {
        return {
          title: 'Atencion inmediata',
          message: 'Necesitas intervenir primero en las competencias criticas del curso filtrado y coordinar apoyo academico.',
          tone: 'bg-rose-50 border-rose-200 text-rose-700',
        };
      }
    }

    if (this.priorityItems.length > 0) {
      return {
        title: 'Refuerzo del periodo',
        message: 'Enfocate en las competencias marcadas como soporte antes del siguiente corte evaluativo.',
        tone: 'bg-amber-50 border-amber-200 text-amber-700',
      };
    }

    if (this.filteredCourses.length > 0) {
      return {
        title: 'Panorama estable',
        message: 'No hay alertas visibles en el filtro actual. Revisa comentarios y conclusiones para sostener tu avance.',
        tone: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      };
    }

    return null;
  }

  loadGrades(): void {
    if (!this.studentContext?.id || !this.activeAcademicYearId) {
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.isAnnualView) {
      this.evaluationService.getEvaluationSummary(this.activeAcademicYearId, this.studentContext.id).subscribe({
        next: (summary) => {
          this.summary = summary;
          this.courses = this.mapSummaryCourses(summary);
          this.syncSelectedCourseFilter();
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar el resumen anual de evaluaciones.';
          this.summary = null;
          this.courses = [];
          this.loading = false;
        }
      });
      return;
    }

    this.reportService.getReportCard(this.studentContext.id, this.selectedPeriod).subscribe({
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

  getSafeIcon(name: string): SafeHtml {
    const svg = (ICONS as Record<string, string>)[name] || ICONS.calendar;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getAreaCoverage(area: EvaluationSummary['areas'][number]): number {
    if (!area?.total) {
      return 0;
    }

    return Math.round(((area.aad_count || 0) / area.total) * 100);
  }

  getGradeColorClass(grade: GradeValue): string {
    const map: Record<GradeValue, string> = {
      AD: 'text-green-700 bg-green-50 border-green-200',
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

  getGradeRange(grade: GradeValue): string {
    if (grade === '-') return '';
    return ebrToRange(grade);
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

  private loadAcademicContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.studentContext = context.students?.[0] || null;
        this.activeAcademicYearId = context.active_academic_year?.id || '';

        if (!this.studentContext) {
          this.error = 'Tu usuario no tiene un estudiante vinculado.';
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
            this.loadGrades();
            this.loadCourseTableViews();
          },
          error: () => {
            this.error = 'No se pudo cargar la lista de periodos academicos.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'No se pudo obtener el contexto academico del usuario.';
        this.loading = false;
      }
    });
  }

  private mapSummaryCourses(summary: EvaluationSummary): StudentCourseView[] {
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
          name: result.competency?.name || 'Competencia',
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

  private mapReportCourses(response: StudentReportCardResponse): StudentCourseView[] {
    return (response.report || []).map((course: StudentReportCardCourse) => ({
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
    }));
  }

  private withMissingEnrolledCourses(
    courses: StudentCourseView[],
    enrolledCourses?: Array<{ id: string; code?: string; name?: string }>,
  ): StudentCourseView[] {
    const merged = new Map<string, StudentCourseView>(courses.map((course) => [course.id, course]));

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

  private loadCourseTableViews(): void {
    if (!this.studentContext?.id) {
      return;
    }

    const trimestrePeriods = this.periods
      .filter((period) => period.name.toLowerCase().includes('trimestre'))
      .sort((a, b) => (a.period_number || 0) - (b.period_number || 0));

    if (trimestrePeriods.length === 0) {
      this.courseTableViews = [];
      return;
    }

    forkJoin(
      trimestrePeriods.map((period) => this.reportService.getReportCard(this.studentContext!.id, period.id))
    ).subscribe({
      next: (responses) => {
        this.courseTableViews = this.buildCourseTableViews(trimestrePeriods, responses);
      },
      error: () => {
        this.courseTableViews = [];
      }
    });
  }

  private buildCourseTableViews(periods: Period[], responses: StudentReportCardResponse[]): CourseTableView[] {
    const courseMap = new Map<string, CourseTableView>();

    responses.forEach((response, index) => {
      (response.report || []).forEach((course: StudentReportCardCourse) => {
        if (!courseMap.has(course.course_id)) {
          courseMap.set(course.course_id, {
            courseId: course.course_id,
            courseName: course.course_name || 'Curso',
            teacherName: '',
            trimestres: periods.map((period) => ({
              periodId: period.id,
              periodName: period.name,
              periodEndDate: period.end_date,
              periodNumber: period.period_number,
              competencies: [],
            })),
          });
        }

        const trimestre = courseMap.get(course.course_id)!.trimestres[index];
        (course.competencies || []).forEach((comp) => {
          trimestre.competencies.push({
            competencyId: comp.competency_id,
            competencyName: comp.competency_name || 'Competencia',
            grade: comp.grade,
            status: this.normalizeCompetencyStatus(comp.status),
            evaluationId: comp.evaluation_id || null,
          });
        });
      });
    });

    courseMap.forEach((courseView) => {
      courseView.trimestres.forEach((trimestre) => {
        if (trimestre.competencies.length === 0) {
          trimestre.competencies.push({
            competencyId: '',
            competencyName: 'Sin competencias registradas',
            grade: null,
            status: null,
            evaluationId: null,
          });
        }
      });
    });

    return Array.from(courseMap.values()).sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  private normalizeCompetencyStatus(status?: string | null): 'publicada' | 'borrador' | null {
    if (status === 'publicada' || status === 'cerrada') {
      return 'publicada';
    }

    if (status === 'borrador') {
      return 'borrador';
    }

    return null;
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
