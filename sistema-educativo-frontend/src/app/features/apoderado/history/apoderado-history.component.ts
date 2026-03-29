import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import { AcademicService, Period } from '@core/services/academic.service';
import {
  ReportService,
  StudentFinancialCharge,
  StudentFinancialPayment,
  StudentFinancialSummaryResponse,
} from '@core/services/report.service';

type SnapshotGrade = 'AD' | 'A' | 'B' | 'C' | '-' | null;

interface SnapshotCourseItem {
  id: string;
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
  status?: string;
  justification?: string | null;
}

interface GuardianSnapshotPayload {
  student?: {
    full_name?: string;
    student_code?: string;
    section?: {
      section_letter?: string;
      grade_level?: {
        name?: string;
        level?: string;
        grade?: number;
      } | null;
    } | null;
  };
  enrollments?: Array<{
    id: string;
    course?: {
      id: string;
      name?: string;
    } | null;
  }>;
  evaluations?: {
    summary?: {
      records?: number;
      published_or_closed?: number;
      drafts?: number;
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
    };
  };
  messages?: {
    summary?: {
      total?: number;
      unread?: number;
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

interface SnapshotRow {
  id: string;
  snapshot: GuardianSnapshotPayload;
}

interface PeriodHistoryResponse {
  history?: {
    generated_at?: string;
  };
  student_snapshots?: {
    data?: SnapshotRow[];
  } | SnapshotRow[];
}

@Component({
  selector: 'app-apoderado-history',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './apoderado-history.component.html',
  styles: [':host { display: block; }']
})
export class ApoderadoHistoryComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly academicService = inject(AcademicService);
  private readonly reportService = inject(ReportService);

  students: AcademicContextStudent[] = [];
  periods: Period[] = [];
  selectedStudentId = '';
  selectedAcademicYearId = '';
  selectedPeriodId = '';
  selectedSnapshot: GuardianSnapshotPayload | null = null;
  financeSummary: StudentFinancialSummaryResponse | null = null;
  loading = false;
  error = '';
  snapshotGeneratedAt = '';

  ngOnInit(): void {
    this.loadContextAndPeriods();
  }

  get selectedStudent(): AcademicContextStudent | null {
    return this.students.find((student) => student.id === this.selectedStudentId) || null;
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

  get selectedStudentLabel(): string {
    const gradeLevel = this.selectedStudent?.section?.grade_level;
    const sectionLetter = this.selectedStudent?.section?.section_letter;
    return gradeLevel ? `${gradeLevel.grade} ${gradeLevel.level}${sectionLetter ? ` - ${sectionLetter}` : ''}` : '';
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

  get summaryCards(): Array<{ label: string; value: string; helper: string }> {
    return [
      {
        label: 'Cursos',
        value: String(this.selectedSnapshot?.enrollments?.length || 0),
        helper: 'Matriculados en ese periodo.',
      },
      {
        label: 'Notas',
        value: String(this.selectedSnapshot?.evaluations?.summary?.records || 0),
        helper: 'Evaluaciones archivadas.',
      },
      {
        label: 'Asistencia',
        value: String(this.selectedSnapshot?.attendance?.summary?.records || 0),
        helper: 'Registros tomados en clase.',
      },
      {
        label: 'Pendiente',
        value: `S/ ${this.formatMoney(this.financeSummary?.totals?.pending_total || 0)}`,
        helper: 'Saldo del ano academico.',
      },
      {
        label: 'Pagado',
        value: `S/ ${this.formatMoney(this.financeSummary?.totals?.paid_total || 0)}`,
        helper: 'Pagos registrados en el ano.',
      },
    ];
  }

  get evaluationGroups(): Array<{ courseName: string; items: SnapshotCourseItem[]; lowestGrade: SnapshotGrade }> {
    const items = this.selectedSnapshot?.evaluations?.items || [];
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
    return (this.selectedSnapshot?.attendance?.items || [])
      .slice()
      .sort((left, right) => new Date(right.date || '').getTime() - new Date(left.date || '').getTime())
      .slice(0, 12);
  }

  get validCharges(): StudentFinancialCharge[] {
    return (this.financeSummary?.charges || []).filter((charge) => charge.status !== 'anulado');
  }

  get highlightedCharges(): StudentFinancialCharge[] {
    return this.validCharges
      .filter((charge) => this.getOutstandingAmount(charge) > 0)
      .sort((left, right) => this.getChargePriority(left) - this.getChargePriority(right))
      .slice(0, 6);
  }

  get recentPayments(): StudentFinancialPayment[] {
    return (this.financeSummary?.payments || [])
      .filter((payment) => !payment.voided_at)
      .slice()
      .sort((left, right) => new Date(right.paid_at || right.created_at || '').getTime() - new Date(left.paid_at || left.created_at || '').getTime())
      .slice(0, 6);
  }

  onStudentChange(): void {
    const firstPeriod = this.filteredPeriods[0];
    if (!this.selectedStudentId) {
      this.selectedSnapshot = null;
      this.financeSummary = null;
      return;
    }

    if (!firstPeriod && this.periods.length > 0) {
      this.selectedAcademicYearId = this.getPeriodYearId(this.periods[0]);
    }

    this.selectedPeriodId = this.filteredPeriods[0]?.id || '';
    this.loadHistory();
  }

  onAcademicYearChange(): void {
    this.selectedPeriodId = this.filteredPeriods[0]?.id || '';
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.selectedStudentId || !this.selectedAcademicYearId || !this.selectedPeriodId) {
      this.selectedSnapshot = null;
      this.financeSummary = null;
      return;
    }

    this.loading = true;
    this.error = '';

    const history$ = this.academicService.getPeriodHistory(this.selectedPeriodId, {
      include_students: true,
      student_id: this.selectedStudentId,
    });
    const finance$ = this.reportService.getFinancialSummary(this.selectedStudentId, this.selectedAcademicYearId);

    history$.subscribe({
      next: (historyResponse: PeriodHistoryResponse) => {
        const rows = this.normalizeSnapshotRows(historyResponse?.student_snapshots);
        this.selectedSnapshot = rows[0]?.snapshot || null;
        this.snapshotGeneratedAt = historyResponse?.history?.generated_at || this.selectedSnapshot?.meta?.snapshot_generated_at || '';

        if (!this.selectedSnapshot) {
          this.financeSummary = null;
          this.error = 'El periodo seleccionado no tiene un snapshot historico disponible para este estudiante.';
          this.loading = false;
          return;
        }

        finance$.subscribe({
          next: (financeResponse) => {
            this.financeSummary = financeResponse;
            this.loading = false;
          },
          error: () => {
            this.financeSummary = null;
            this.error = 'Se cargo el historial academico, pero no se pudo obtener el historial financiero del ano.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.selectedSnapshot = null;
        this.financeSummary = null;
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

  formatMoney(value: number | string): string {
    return Number(value || 0).toFixed(2);
  }

  getOutstandingAmount(charge: StudentFinancialCharge): number {
    if (charge.status === 'anulado') {
      return 0;
    }

    const net = Math.max(0, Number(charge.amount || 0) - Number(charge.discount_amount || 0));
    return Math.max(0, net - Number(charge.paid_amount || 0));
  }

  getChargeLabel(charge: StudentFinancialCharge): string {
    if (this.isOverdue(charge)) {
      return 'Vencido';
    }

    return this.getOutstandingAmount(charge) > 0 ? 'Pendiente' : 'Pagado';
  }

  getChargeClass(charge: StudentFinancialCharge): string {
    if (this.isOverdue(charge)) {
      return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    if (this.getOutstandingAmount(charge) > 0) {
      return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  getMethodLabel(method: string): string {
    const normalized = String(method || '').toLowerCase();
    if (normalized.includes('efectivo')) return 'Efectivo';
    if (normalized.includes('tarjeta')) return 'Tarjeta';
    if (normalized.includes('transfer')) return 'Transferencia';
    if (normalized.includes('yape')) return 'Yape';
    if (normalized.includes('plin')) return 'Plin';
    return method || 'Metodo no definido';
  }

  private loadContextAndPeriods(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.students = (context.students || [])
          .slice()
          .sort((left, right) => (left.full_name || '').localeCompare(right.full_name || ''));

        if (this.students.length === 0) {
          this.error = 'Tu usuario no tiene estudiantes vinculados.';
          this.loading = false;
          return;
        }

        this.selectedStudentId = this.students[0].id;

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
            this.loadHistory();
          },
          error: () => {
            this.error = 'No se pudieron cargar los periodos historicos.';
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

  private normalizePeriods(response: any): Period[] {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private normalizeSnapshotRows(value: PeriodHistoryResponse['student_snapshots']): SnapshotRow[] {
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

  private isOverdue(charge: StudentFinancialCharge): boolean {
    if (this.getOutstandingAmount(charge) <= 0) {
      return false;
    }

    if (charge.status === 'vencido') {
      return true;
    }

    if (!charge.due_date) {
      return false;
    }

    const dueTime = new Date(charge.due_date).getTime();
    return Number.isFinite(dueTime) && dueTime < Date.now();
  }

  private getChargePriority(charge: StudentFinancialCharge): number {
    if (this.isOverdue(charge)) {
      return -1000000000 + (new Date(charge.due_date || '').getTime() || 0);
    }

    const dueTime = new Date(charge.due_date || '').getTime();
    return Number.isFinite(dueTime) ? dueTime : Number.MAX_SAFE_INTEGER;
  }
}
