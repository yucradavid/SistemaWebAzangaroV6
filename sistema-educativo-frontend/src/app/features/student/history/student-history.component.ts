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
  templateUrl: './student-history.component.html',
  styleUrls: ['./student-history.component.css']
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
