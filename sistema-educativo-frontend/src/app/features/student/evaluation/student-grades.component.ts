import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { ICONS } from '@core/constants/icons';
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
  template: `
    <div class="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-6">
        <app-back-button link="/app/dashboard/student"></app-back-button>

        <section class="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-5">
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
            <div class="space-y-2">
              <p class="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-700">Modulo de notas</p>
              <h1 class="text-3xl font-black text-slate-900">Mis Calificaciones</h1>
              <p class="text-sm text-slate-500 font-medium">
                Resumen anual y detalle por periodo conectado a la nueva logica academica.
              </p>
            </div>

            <div class="w-full xl:w-[320px] space-y-3">
              <select
                [(ngModel)]="selectedPeriod"
                (change)="loadGrades()"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500"
              >
                <option value="all">Cierre anual</option>
                <option *ngFor="let period of periods" [value]="period.id">{{ period.name }}</option>
              </select>
              <select
                [(ngModel)]="selectedCourseId"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500"
              >
                <option value="all">Todos los cursos</option>
                <option *ngFor="let course of availableCourses" [value]="course.id">{{ course.courseName }}</option>
              </select>
              <p class="text-xs font-medium text-slate-500">{{ selectedPeriodDescription }}</p>
            </div>
          </div>

          <div *ngIf="studentContext" class="flex flex-wrap gap-3 text-xs font-black uppercase tracking-widest">
            <span class="px-3 py-2 rounded-2xl bg-slate-900 text-white">{{ studentContext.full_name }}</span>
            <span *ngIf="studentContext.student_code" class="px-3 py-2 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200">
              {{ studentContext.student_code }}
            </span>
            <span *ngIf="studentLabel" class="px-3 py-2 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              {{ studentLabel }}
            </span>
            <span *ngIf="isAnnualView && summary?.student_final_status" class="px-3 py-2 rounded-2xl border" [class]="getFinalStatusClass(summary?.student_final_status?.final_status)">
              {{ getFinalStatusLabel(summary?.student_final_status?.final_status) }}
            </span>
          </div>
        </section>

        <div *ngIf="error" class="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {{ error }}
        </div>

        <div *ngIf="loading" class="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          <p class="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Cargando informacion academica</p>
        </div>

        <ng-container *ngIf="!loading">
          <section *ngIf="isAnnualView && summary" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <article class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm" *ngFor="let card of annualCards">
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{{ card.label }}</p>
              <p class="mt-3 text-3xl font-black text-slate-900">{{ card.value }}</p>
              <p class="mt-2 text-sm font-medium text-slate-500">{{ card.helper }}</p>
            </article>
          </section>

          <section *ngIf="isAnnualView && summary?.student_final_status?.decision_reason" class="rounded-3xl border px-5 py-4" [class]="getFinalStatusClass(summary?.student_final_status?.final_status)">
            <p class="text-sm font-bold">{{ summary?.student_final_status?.decision_reason }}</p>
          </section>

          <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_420px] gap-4" *ngIf="actionPlan || priorityItems.length > 0">
            <article class="bg-white border border-slate-200 rounded-3xl shadow-sm p-5" *ngIf="actionPlan">
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Que sigue</p>
              <div class="mt-4 rounded-3xl border px-4 py-4" [class]="actionPlan.tone">
                <p class="text-lg font-black">{{ actionPlan.title }}</p>
                <p class="mt-2 text-sm font-medium">{{ actionPlan.message }}</p>
              </div>
            </article>

            <article class="bg-white border border-slate-200 rounded-3xl shadow-sm p-5" *ngIf="priorityItems.length > 0">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Focos prioritarios</p>
                  <h2 class="mt-2 text-lg font-black text-slate-900">Competencias a reforzar</h2>
                </div>
                <span class="px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black uppercase tracking-widest">
                  {{ priorityItems.length }}
                </span>
              </div>

              <div class="mt-4 space-y-3">
                <div *ngFor="let item of priorityItems" class="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-900">{{ item.competencyName }}</p>
                      <p class="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {{ item.courseName }} | {{ item.periodLabel }}
                      </p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-black border" [class]="getGradeChipClass(item.grade)">
                      {{ item.grade }}
                    </span>
                  </div>
                  <p class="mt-3 text-sm font-medium text-slate-600">{{ item.summary }}</p>
                </div>
              </div>
            </article>
          </section>

          <section *ngIf="isAnnualView && summary?.areas?.length" class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div class="p-5 border-b border-slate-100">
              <h2 class="text-lg font-black text-slate-900">Areas consolidadas</h2>
            </div>
            <div class="divide-y divide-slate-100">
              <div *ngFor="let area of summary?.areas" class="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <p class="text-lg font-black text-slate-900">{{ area.course_name || 'Curso' }}</p>
                  <p class="mt-2 text-sm font-medium text-slate-500">
                    AD: {{ area.ad_count }} | A: {{ area.a_count }} | B: {{ area.b_count }} | C: {{ area.c_count }}
                  </p>
                </div>
                <div class="lg:w-72">
                  <div class="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    <span>Logro AD/A</span>
                    <span>{{ getAreaCoverage(area) }}%</span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div class="h-full rounded-full bg-cyan-500" [style.width.%]="getAreaCoverage(area)"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section *ngIf="isAnnualView && conclusions.length > 0" class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div class="p-5 border-b border-slate-100">
              <h2 class="text-lg font-black text-slate-900">Conclusiones descriptivas</h2>
            </div>
            <div class="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <article *ngFor="let conclusion of conclusions" class="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="font-black text-slate-900">{{ conclusion.competencyName }}</p>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">{{ conclusion.periodName }}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-black border" [class]="getGradeChipClass(conclusion.achievementLevel)">
                    {{ conclusion.achievementLevel }}
                  </span>
                </div>
                <p *ngIf="conclusion.conclusionText" class="text-sm font-medium text-slate-600">{{ conclusion.conclusionText }}</p>
                <p *ngIf="conclusion.recommendations" class="text-sm font-medium text-cyan-700">Recomendacion: {{ conclusion.recommendations }}</p>
              </article>
            </div>
          </section>

          <section *ngIf="filteredCourses.length === 0" class="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center">
            <div class="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto">
              <div [innerHTML]="getSafeIcon('bookOpen')" class="w-8 h-8 text-slate-300"></div>
            </div>
            <h2 class="mt-5 text-2xl font-black text-slate-900">No hay calificaciones disponibles</h2>
            <p class="mt-2 text-sm font-medium text-slate-500">
              {{ selectedCourseId === 'all'
                ? (isAnnualView ? 'Aun no hay resultados finales consolidados.' : 'No existen evaluaciones para el periodo seleccionado.')
                : 'No hay registros visibles para el curso filtrado.' }}
            </p>
          </section>

          <section *ngIf="filteredCourses.length > 0" class="space-y-5">
            <article *ngFor="let course of filteredCourses" class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div class="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h2 class="text-xl font-black text-slate-900">{{ course.courseName }}</h2>
                  <p class="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">
                    {{ course.courseCode || 'Sin codigo' }} · {{ course.items.length }} competencia(s)
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest" [class]="getGradeChipClass(course.average)">
                    Resultado {{ course.average }}
                  </span>
                  <span *ngIf="course.supportCount > 0" class="px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black uppercase tracking-widest">
                    {{ course.supportCount }} en soporte
                  </span>
                </div>
              </div>

              <div class="p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div *ngFor="let item of course.items" class="rounded-3xl border border-slate-200 p-4 bg-slate-50/50">
                  <div class="flex items-start justify-between gap-4">
                    <div class="space-y-2">
                      <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{{ item.periodLabel }}</span>
                        <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border" [class]="item.statusTone">{{ item.statusLabel }}</span>
                        <span *ngIf="item.supportRequired" class="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest">
                          Soporte
                        </span>
                      </div>
                      <h3 class="text-base font-black text-slate-900">{{ item.name }}</h3>
                      <p *ngIf="item.description" class="text-sm font-medium text-slate-500">{{ item.description }}</p>
                      <p *ngIf="item.conclusionText" class="text-sm font-medium text-cyan-700">{{ item.conclusionText }}</p>
                    </div>
                    <div class="shrink-0 flex flex-col items-center gap-2">
                      <div class="w-14 h-14 rounded-2xl border flex items-center justify-center text-xl font-black shadow-sm" [class]="getGradeColorClass(item.grade)">
                        {{ item.grade }}
                      </div>
                      <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ getGradeLabel(item.grade) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section class="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
            <h2 class="text-lg font-black text-slate-900">Escala de calificacion</h2>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div *ngFor="let scaleItem of scale" class="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black" [class]="scaleItem.color">{{ scaleItem.grade }}</div>
                <div>
                  <p class="font-black text-slate-900">{{ scaleItem.label }}</p>
                  <p class="text-xs font-medium text-slate-500 mt-1">{{ scaleItem.description }}</p>
                </div>
              </div>
            </div>
          </section>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    select::-ms-expand { display: none; }
  `]
})
export class GradesStudentComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private academicService = inject(AcademicService);
  private evaluationService = inject(EvaluationService);
  private reportService = inject(ReportService);

  loading = false;
  error = '';
  selectedPeriod = 'all';
  selectedCourseId = 'all';
  periods: Period[] = [];
  courses: StudentCourseView[] = [];
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
    this.loadAcademicContext();
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
      competencyName: conclusion.competency?.name || conclusion.competency?.description || 'Competencia',
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
