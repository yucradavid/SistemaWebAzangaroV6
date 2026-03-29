import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import { AcademicService, Period } from '@core/services/academic.service';

type SnapshotGrade = 'AD' | 'A' | 'B' | 'C' | '-' | null;

interface SnapshotCourseItem {
  id: string;
  course_id?: string;
  course_name?: string;
  competency_name?: string;
  grade?: SnapshotGrade;
  status?: string;
  comments?: string;
}

interface SnapshotAttendanceItem {
  id: string;
  date?: string;
  course_name?: string;
  status?: 'presente' | 'tarde' | 'falta' | 'justificado' | string;
  justification?: string | null;
}

interface StudentPeriodSnapshot {
  student?: {
    id: string;
    student_code?: string;
    full_name?: string;
    section?: {
      section_letter?: string;
      grade_level?: {
        name?: string;
        level?: string;
        grade?: number;
      } | null;
    } | null;
  };
  period?: {
    id: string;
    name?: string;
    period_number?: number;
    academic_year_id?: string;
  };
  enrollments?: Array<{
    id: string;
    course?: {
      id: string;
      code?: string;
      name?: string;
    } | null;
  }>;
  evaluations?: {
    summary?: {
      records?: number;
      published_or_closed?: number;
      drafts?: number;
      levels?: Record<string, number>;
    };
    items?: SnapshotCourseItem[];
  };
  attendance?: {
    summary?: {
      records?: number;
      present?: number;
      late?: number;
      absent?: number;
      justified?: number;
    };
    items?: SnapshotAttendanceItem[];
  };
  assignments?: {
    summary?: {
      published?: number;
      task_submissions?: number;
      assignment_submissions?: number;
      graded_task_submissions?: number;
      reviewed_assignment_submissions?: number;
    };
  };
  messages?: {
    summary?: {
      total?: number;
      unread?: number;
      teacher_messages?: number;
      guardian_messages?: number;
    };
  };
  conduct?: {
    module_available?: boolean;
    message?: string;
  };
  meta?: {
    snapshot_generated_at?: string;
  };
}

interface StudentSnapshotRow {
  id: string;
  snapshot: StudentPeriodSnapshot;
}

interface PeriodHistoryResponse {
  history?: {
    generated_at?: string;
    summary?: {
      academic_year?: {
        id?: string;
        year?: number | string;
      };
    };
  };
  student_snapshots?: {
    data?: StudentSnapshotRow[];
  } | StudentSnapshotRow[];
}

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-6">
        <app-back-button link="/app/dashboard/student"></app-back-button>

        <section class="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-6 text-white shadow-2xl">
          <div class="grid gap-6 lg:grid-cols-[1.35fr,0.95fr]">
            <div class="space-y-4">
              <div class="space-y-2">
                <p class="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-200">Historial academico</p>
                <h1 class="text-3xl font-black tracking-tight sm:text-4xl">Tus anos y periodos cerrados</h1>
                <p class="max-w-2xl text-sm font-medium text-white/75">
                  Revisa cursos, notas, asistencia, tareas y actividad guardada cuando un periodo ya fue cerrado por administracion.
                </p>
              </div>

              <div class="flex flex-wrap gap-3 text-xs font-black uppercase tracking-widest">
                <span *ngIf="studentContext?.full_name" class="rounded-2xl bg-white/10 px-3 py-2">{{ studentContext?.full_name }}</span>
                <span *ngIf="studentContext?.student_code" class="rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
                  {{ studentContext?.student_code }}
                </span>
                <span *ngIf="currentSectionLabel" class="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-cyan-100">
                  {{ currentSectionLabel }}
                </span>
              </div>
            </div>

            <div class="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <label class="block space-y-2">
                <span class="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">Ano academico</span>
                <select
                  [(ngModel)]="selectedAcademicYearId"
                  (change)="onAcademicYearChange()"
                  class="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-bold text-white outline-none"
                >
                  <option *ngFor="let year of availableYears" [value]="year.id">{{ year.label }}</option>
                </select>
              </label>

              <label class="block space-y-2">
                <span class="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">Periodo cerrado</span>
                <select
                  [(ngModel)]="selectedPeriodId"
                  (change)="loadSnapshot()"
                  class="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-bold text-white outline-none"
                >
                  <option *ngFor="let period of filteredPeriods" [value]="period.id">
                    {{ period.name }}{{ period.period_number ? ' · P' + period.period_number : '' }}
                  </option>
                </select>
              </label>

              <p class="text-xs font-medium text-white/70">
                Solo aparecen periodos cerrados con historial generado para no perder informacion de anos anteriores.
              </p>
            </div>
          </div>
        </section>

        <div *ngIf="error" class="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {{ error }}
        </div>

        <div *ngIf="loading" class="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
          <div class="flex flex-col items-center gap-4">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
            <p class="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Cargando historial</p>
          </div>
        </div>

        <section *ngIf="!loading && snapshot" class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" *ngFor="let card of summaryCards">
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{{ card.label }}</p>
            <p class="mt-3 text-3xl font-black text-slate-900">{{ card.value }}</p>
            <p class="mt-2 text-sm font-medium text-slate-500">{{ card.helper }}</p>
          </article>
        </section>

        <section *ngIf="!loading && snapshot" class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_380px]">
          <div class="space-y-4">
            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Periodo archivado</p>
                  <h2 class="mt-2 text-2xl font-black text-slate-900">{{ selectedPeriodLabel }}</h2>
                  <p class="mt-2 text-sm font-medium text-slate-500">
                    Snapshot generado {{ snapshotGeneratedAt | date:'dd MMM yyyy, HH:mm' }}
                  </p>
                </div>
                <div class="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800">
                  {{ selectedAcademicYearLabel }}
                </div>
              </div>

              <div class="mt-5">
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cursos guardados</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span *ngFor="let enrollment of snapshot.enrollments || []" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                    {{ enrollment.course?.name || 'Curso' }}
                  </span>
                </div>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div class="border-b border-slate-100 p-5">
                <h2 class="text-lg font-black text-slate-900">Notas del periodo</h2>
                <p class="mt-1 text-sm font-medium text-slate-500">Competencias y niveles guardados al cerrar el periodo.</p>
              </div>

              <div *ngIf="evaluationGroups.length === 0" class="p-6 text-sm font-medium text-slate-500">
                No se guardaron evaluaciones visibles en este periodo.
              </div>

              <div *ngIf="evaluationGroups.length > 0" class="divide-y divide-slate-100">
                <div *ngFor="let group of evaluationGroups" class="p-5">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <h3 class="text-lg font-black text-slate-900">{{ group.courseName }}</h3>
                      <p class="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {{ group.items.length }} competencia(s)
                      </p>
                    </div>
                    <span class="rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em]" [class]="getGradeClass(group.lowestGrade)">
                      {{ group.lowestGrade || '-' }}
                    </span>
                  </div>

                  <div class="mt-4 grid gap-3 lg:grid-cols-2">
                    <div *ngFor="let item of group.items" class="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-sm font-black text-slate-900">{{ item.competency_name || 'Competencia' }}</p>
                          <p class="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {{ getStatusLabel(item.status) }}
                          </p>
                        </div>
                        <span class="rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em]" [class]="getGradeClass(item.grade)">
                          {{ item.grade || '-' }}
                        </span>
                      </div>
                      <p *ngIf="item.comments" class="mt-3 text-sm font-medium text-slate-600">{{ item.comments }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div class="border-b border-slate-100 p-5">
                <h2 class="text-lg font-black text-slate-900">Asistencia archivada</h2>
                <p class="mt-1 text-sm font-medium text-slate-500">Registro resumido del periodo seleccionado.</p>
              </div>

              <div class="grid gap-4 p-5 md:grid-cols-4">
                <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">Presentes</p>
                  <p class="mt-3 text-2xl font-black text-emerald-900">{{ snapshot.attendance?.summary?.present || 0 }}</p>
                </div>
                <div class="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Tardanzas</p>
                  <p class="mt-3 text-2xl font-black text-amber-900">{{ snapshot.attendance?.summary?.late || 0 }}</p>
                </div>
                <div class="rounded-3xl border border-rose-100 bg-rose-50 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-rose-700">Faltas</p>
                  <p class="mt-3 text-2xl font-black text-rose-900">{{ snapshot.attendance?.summary?.absent || 0 }}</p>
                </div>
                <div class="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Justificadas</p>
                  <p class="mt-3 text-2xl font-black text-blue-900">{{ snapshot.attendance?.summary?.justified || 0 }}</p>
                </div>
              </div>

              <div *ngIf="attendanceItems.length === 0" class="px-5 pb-5 text-sm font-medium text-slate-500">
                No se guardaron registros de asistencia dentro de este periodo.
              </div>

              <div *ngIf="attendanceItems.length > 0" class="px-5 pb-5 space-y-3">
                <div *ngFor="let item of attendanceItems" class="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-sm font-black text-slate-900">{{ item.course_name || 'Curso' }}</p>
                    <p class="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{{ item.date | date:'dd MMM yyyy' }}</p>
                    <p *ngIf="item.justification" class="mt-2 text-sm font-medium text-slate-600">{{ item.justification }}</p>
                  </div>
                  <span class="w-fit rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em]" [class]="getAttendanceClass(item.status)">
                    {{ getAttendanceLabel(item.status) }}
                  </span>
                </div>
              </div>
            </article>
          </div>

          <aside class="space-y-4">
            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Actividad complementaria</p>
              <div class="mt-4 space-y-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-sm font-black text-slate-900">Tareas publicadas</p>
                  <p class="mt-2 text-2xl font-black text-slate-900">{{ snapshot.assignments?.summary?.published || 0 }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-sm font-black text-slate-900">Entregas registradas</p>
                  <p class="mt-2 text-2xl font-black text-slate-900">
                    {{ (snapshot.assignments?.summary?.task_submissions || 0) + (snapshot.assignments?.summary?.assignment_submissions || 0) }}
                  </p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-sm font-black text-slate-900">Mensajes del periodo</p>
                  <p class="mt-2 text-2xl font-black text-slate-900">{{ snapshot.messages?.summary?.total || 0 }}</p>
                </div>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Lectura rapida</p>
              <div class="mt-4 space-y-3 text-sm font-medium text-slate-600">
                <p>Notas publicadas/cerradas: <strong class="text-slate-900">{{ snapshot.evaluations?.summary?.published_or_closed || 0 }}</strong></p>
                <p>Borradores detectados: <strong class="text-slate-900">{{ snapshot.evaluations?.summary?.drafts || 0 }}</strong></p>
                <p>Mensajes sin leer al cierre: <strong class="text-slate-900">{{ snapshot.messages?.summary?.unread || 0 }}</strong></p>
                <p>Modulo de conducta: <strong class="text-slate-900">{{ snapshot.conduct?.module_available ? 'Disponible' : 'Pendiente' }}</strong></p>
              </div>
              <p *ngIf="snapshot.conduct?.message" class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                {{ snapshot.conduct?.message }}
              </p>
            </article>
          </aside>
        </section>

        <section *ngIf="!loading && !snapshot && !error" class="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 class="text-2xl font-black text-slate-900">No hay historial disponible todavia</h2>
          <p class="mt-2 text-sm font-medium text-slate-500">
            Cuando administracion cierre un periodo y genere su snapshot, aqui podras ver notas, asistencia y actividad archivada.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class StudentHistoryComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly academicService = inject(AcademicService);

  loading = false;
  error = '';
  periods: Period[] = [];
  studentContext: AcademicContextStudent | null = null;
  selectedAcademicYearId = '';
  selectedPeriodId = '';
  snapshot: StudentPeriodSnapshot | null = null;
  snapshotGeneratedAt = '';

  ngOnInit(): void {
    this.loadContextAndPeriods();
  }

  get availableYears(): Array<{ id: string; label: string }> {
    const yearMap = new Map<string, string>();

    this.periods.forEach((period) => {
      const yearId = this.getPeriodYearId(period);
      if (!yearId || yearMap.has(yearId)) {
        return;
      }

      yearMap.set(yearId, this.getAcademicYearLabel(period));
    });

    return Array.from(yearMap.entries()).map(([id, label]) => ({ id, label }));
  }

  get filteredPeriods(): Period[] {
    return this.periods.filter((period) => this.getPeriodYearId(period) === this.selectedAcademicYearId);
  }

  get selectedAcademicYearLabel(): string {
    const period = this.filteredPeriods.find((item) => item.id === this.selectedPeriodId) || this.filteredPeriods[0];
    return period ? this.getAcademicYearLabel(period) : 'Ano academico';
  }

  get selectedPeriodLabel(): string {
    const period = this.filteredPeriods.find((item) => item.id === this.selectedPeriodId);
    if (!period) {
      return 'Periodo historico';
    }

    return `${period.name}${period.period_number ? ` · Periodo ${period.period_number}` : ''}`;
  }

  get currentSectionLabel(): string {
    const gradeLevel = this.studentContext?.section?.grade_level;
    const sectionLetter = this.studentContext?.section?.section_letter;
    return gradeLevel ? `${gradeLevel.grade} ${gradeLevel.level}${sectionLetter ? ` - ${sectionLetter}` : ''}` : '';
  }

  get summaryCards(): Array<{ label: string; value: string; helper: string }> {
    return [
      {
        label: 'Cursos',
        value: String(this.snapshot?.enrollments?.length || 0),
        helper: 'Matriculados en ese periodo.',
      },
      {
        label: 'Notas',
        value: String(this.snapshot?.evaluations?.summary?.records || 0),
        helper: 'Evaluaciones archivadas.',
      },
      {
        label: 'Asistencia',
        value: String(this.snapshot?.attendance?.summary?.records || 0),
        helper: 'Registros tomados en clase.',
      },
      {
        label: 'Entregas',
        value: String((this.snapshot?.assignments?.summary?.task_submissions || 0) + (this.snapshot?.assignments?.summary?.assignment_submissions || 0)),
        helper: 'Tareas y assignment submissions.',
      },
      {
        label: 'Mensajes',
        value: String(this.snapshot?.messages?.summary?.total || 0),
        helper: 'Actividad de comunicacion guardada.',
      },
    ];
  }

  get evaluationGroups(): Array<{ courseName: string; items: SnapshotCourseItem[]; lowestGrade: SnapshotGrade }> {
    const items = this.snapshot?.evaluations?.items || [];
    const grouped = items.reduce<Record<string, SnapshotCourseItem[]>>((acc, item) => {
      const courseName = item.course_name || 'Curso';
      if (!acc[courseName]) {
        acc[courseName] = [];
      }

      acc[courseName].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([courseName, courseItems]) => ({
        courseName,
        items: courseItems.sort((left, right) => (left.competency_name || '').localeCompare(right.competency_name || '')),
        lowestGrade: this.resolveLowestGrade(courseItems.map((item) => item.grade || '-')),
      }))
      .sort((left, right) => left.courseName.localeCompare(right.courseName));
  }

  get attendanceItems(): SnapshotAttendanceItem[] {
    return (this.snapshot?.attendance?.items || [])
      .slice()
      .sort((left, right) => new Date(right.date || '').getTime() - new Date(left.date || '').getTime())
      .slice(0, 12);
  }

  onAcademicYearChange(): void {
    const firstPeriod = this.filteredPeriods[0];
    this.selectedPeriodId = firstPeriod?.id || '';
    this.loadSnapshot();
  }

  loadSnapshot(): void {
    if (!this.selectedPeriodId) {
      this.snapshot = null;
      return;
    }

    this.loading = true;
    this.error = '';

    this.academicService.getPeriodHistory(this.selectedPeriodId, { include_students: true }).subscribe({
      next: (response: PeriodHistoryResponse) => {
        const rows = this.normalizeSnapshotRows(response?.student_snapshots);
        this.snapshot = rows[0]?.snapshot || null;
        this.snapshotGeneratedAt = response?.history?.generated_at || this.snapshot?.meta?.snapshot_generated_at || '';

        if (!this.snapshot) {
          this.error = 'El periodo seleccionado no tiene un snapshot historico disponible para este estudiante.';
        }

        this.loading = false;
      },
      error: () => {
        this.snapshot = null;
        this.snapshotGeneratedAt = '';
        this.error = 'No se pudo cargar el historial del periodo seleccionado.';
        this.loading = false;
      }
    });
  }

  getGradeClass(grade?: SnapshotGrade): string {
    const map: Record<string, string> = {
      AD: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      A: 'border-blue-200 bg-blue-50 text-blue-700',
      B: 'border-amber-200 bg-amber-50 text-amber-700',
      C: 'border-rose-200 bg-rose-50 text-rose-700',
      '-': 'border-slate-200 bg-slate-50 text-slate-600',
    };

    return map[grade || '-'] || map['-'];
  }

  getAttendanceClass(status?: string): string {
    const map: Record<string, string> = {
      presente: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      tarde: 'border-amber-200 bg-amber-50 text-amber-700',
      falta: 'border-rose-200 bg-rose-50 text-rose-700',
      justificado: 'border-blue-200 bg-blue-50 text-blue-700',
    };

    return map[status || ''] || 'border-slate-200 bg-slate-50 text-slate-600';
  }

  getAttendanceLabel(status?: string): string {
    const map: Record<string, string> = {
      presente: 'Presente',
      tarde: 'Tarde',
      falta: 'Falta',
      justificado: 'Justificado',
    };

    return map[status || ''] || 'Sin estado';
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      borrador: 'Borrador',
      publicada: 'Publicada',
      cerrada: 'Cerrada',
    };

    return map[status || ''] || 'Sin estado';
  }

  private loadContextAndPeriods(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.studentContext = context.students?.[0] || null;

        if (!this.studentContext) {
          this.error = 'Tu usuario no tiene un estudiante vinculado.';
          this.loading = false;
          return;
        }

        this.academicService.getPeriods({ per_page: 200, is_closed: true }).subscribe({
          next: (response) => {
            this.periods = this.normalizePeriods(response)
              .sort((left, right) =>
                this.getPeriodSortValue(right) - this.getPeriodSortValue(left)
                || (right.period_number || 0) - (left.period_number || 0)
              );

            if (this.periods.length === 0) {
              this.error = 'Todavia no existen periodos cerrados con historial disponible.';
              this.loading = false;
              return;
            }

            this.selectedAcademicYearId = this.getPeriodYearId(this.periods[0]);
            this.selectedPeriodId = this.filteredPeriods[0]?.id || this.periods[0].id;
            this.loadSnapshot();
          },
          error: () => {
            this.error = 'No se pudieron cargar los periodos historicos.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'No se pudo obtener el contexto academico del estudiante.';
        this.loading = false;
      }
    });
  }

  private normalizePeriods(response: any): Period[] {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private normalizeSnapshotRows(value: PeriodHistoryResponse['student_snapshots']): StudentSnapshotRow[] {
    if (Array.isArray((value as any)?.data)) {
      return (value as any).data;
    }

    if (Array.isArray(value)) {
      return value;
    }

    return [];
  }

  private getAcademicYearLabel(period: Period): string {
    const year = (period.academicYear as any)?.year ?? (period.academic_year as any)?.year;
    return year ? `Ano ${year}` : 'Ano academico';
  }

  private getPeriodYearId(period: Period): string {
    return (period.academicYear as any)?.id || (period.academic_year as any)?.id || period.academic_year_id;
  }

  private getPeriodSortValue(period: Period): number {
    const year = Number((period.academicYear as any)?.year ?? (period.academic_year as any)?.year ?? 0);
    return Number.isFinite(year) ? year : 0;
  }

  private resolveLowestGrade(grades: SnapshotGrade[]): SnapshotGrade {
    const order: Record<string, number> = { '-': 0, C: 1, B: 2, A: 3, AD: 4 };

    return grades.reduce<SnapshotGrade>((lowest, grade) => {
      const current = grade || '-';
      const previous = lowest || '-';
      return (order[current] || 0) < (order[previous] || 0) ? current : previous;
    }, '-');
  }
}
