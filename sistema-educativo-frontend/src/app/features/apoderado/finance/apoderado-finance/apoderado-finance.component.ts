import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import {
  ReportService,
  StudentFinancialCharge,
  StudentFinancialPayment,
  StudentFinancialSummaryResponse,
} from '@core/services/report.service';

type FinanceTab = 'charges' | 'payments';
type FinanceScope = 'active' | 'all';
type ChargeFilter = 'all' | 'with-balance' | 'overdue' | 'partial' | 'paid' | 'voided';
type PaymentFilter = 'all' | 'valid' | 'voided';

interface SummaryCardView {
  label: string;
  value: string;
  helper: string;
  tone: string;
}

interface FamilyStudentFinanceView {
  studentId: string;
  studentName: string;
  sectionLabel: string;
  pendingTotal: number;
  paidTotal: number;
  overdueCount: number;
  dueSoonCount: number;
}

@Component({
  selector: 'app-apoderado-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apoderado-finance.component.html',
  styleUrls: ['./apoderado-finance.component.css']
})
export class ApoderadoFinanceComponent implements OnInit {
  private authService = inject(AuthService);
  private reportService = inject(ReportService);

  students: AcademicContextStudent[] = [];
  charges: StudentFinancialCharge[] = [];
  payments: StudentFinancialPayment[] = [];
  loading = false;
  error = '';
  selectedStudentId = '';
  selectedScope: FinanceScope = 'all';
  activeTab: FinanceTab = 'charges';
  chargeFilter: ChargeFilter = 'all';
  paymentFilter: PaymentFilter = 'all';
  movementSearch = '';
  activeAcademicYearId = '';
  activeAcademicYearLabel = 'Todo el historial';
  lastSummary: StudentFinancialSummaryResponse | null = null;
  private summaries: StudentFinancialSummaryResponse[] = [];

  ngOnInit(): void {
    this.loadAcademicContext();
  }

  get selectedStudent(): AcademicContextStudent | null {
    return this.students.find((student) => student.id === this.selectedStudentId) || null;
  }

  get summaryCards(): SummaryCardView[] {
    const totals = this.lastSummary?.totals;

    return [
      {
        label: 'Emitido neto',
        value: `S/ ${Number(totals?.net_total || 0).toFixed(2)}`,
        helper: `Incluye descuentos por S/ ${Number(totals?.total_discount || 0).toFixed(2)}`,
        tone: 'bg-slate-900 text-white border-slate-900',
      },
      {
        label: 'Pagado',
        value: `S/ ${Number(totals?.paid_total || 0).toFixed(2)}`,
        helper: `${this.validPayments.length} pagos vigentes registrados`,
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      {
        label: 'Pendiente',
        value: `S/ ${Number(totals?.pending_total || 0).toFixed(2)}`,
        helper: `${this.pendingCharges.length} cargos con saldo`,
        tone: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      {
        label: 'Vencidos',
        value: String(this.overdueCharges.length),
        helper: this.overdueCharges.length > 0 ? 'Requieren atencion inmediata' : 'Sin vencimientos activos',
        tone: 'bg-rose-50 text-rose-700 border-rose-200',
      },
    ];
  }

  get familySummaryCards(): SummaryCardView[] {
    const studentCards = this.familyStudentCards;
    const pending = studentCards.reduce((total, item) => total + item.pendingTotal, 0);
    const paid = studentCards.reduce((total, item) => total + item.paidTotal, 0);
    const overdue = studentCards.reduce((total, item) => total + item.overdueCount, 0);
    const dueSoon = studentCards.reduce((total, item) => total + item.dueSoonCount, 0);
    const studentsWithDebt = studentCards.filter((item) => item.pendingTotal > 0).length;

    return [
      {
        label: 'Pendiente familiar',
        value: `S/ ${pending.toFixed(2)}`,
        helper: `${studentsWithDebt} hijo(s) con saldo pendiente`,
        tone: 'bg-slate-950 text-white border-slate-950',
      },
      {
        label: 'Pagado familiar',
        value: `S/ ${paid.toFixed(2)}`,
        helper: `${this.validPayments.length} pagos vigentes del alumno actual`,
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      {
        label: 'Vencimientos',
        value: String(overdue),
        helper: overdue > 0 ? 'Cargos vencidos entre tus hijos' : 'Sin vencidos familiares',
        tone: 'bg-rose-50 text-rose-700 border-rose-200',
      },
      {
        label: 'Por vencer',
        value: String(dueSoon),
        helper: dueSoon > 0 ? 'Cargos en los proximos 7 dias' : 'Nada proximo a vencer',
        tone: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      },
    ];
  }

  get familyStudentCards(): FamilyStudentFinanceView[] {
    return this.students.map((student) => {
      const summary = this.summaries.find((item) => item.student_id === student.id);
      const charges = summary?.charges || [];
      const pendingCharges = charges.filter((charge) => this.getOutstandingAmount(charge) > 0 && charge.status !== 'anulado');

      return {
        studentId: student.id,
        studentName: student.full_name,
        sectionLabel: this.getSectionLabel(student),
        pendingTotal: Number(summary?.totals.pending_total || 0),
        paidTotal: Number(summary?.totals.paid_total || 0),
        overdueCount: pendingCharges.filter((charge) => this.isOverdue(charge)).length,
        dueSoonCount: pendingCharges.filter((charge) => this.isDueSoon(charge)).length,
      };
    }).sort((left, right) => right.pendingTotal - left.pendingTotal || left.studentName.localeCompare(right.studentName));
  }

  get pendingCharges(): StudentFinancialCharge[] {
    return this.charges.filter((charge) => this.getOutstandingAmount(charge) > 0 && charge.status !== 'anulado');
  }

  get overdueCharges(): StudentFinancialCharge[] {
    return this.pendingCharges.filter((charge) => this.isOverdue(charge));
  }

  get dueSoonCharges(): StudentFinancialCharge[] {
    return this.pendingCharges
      .filter((charge) => this.isDueSoon(charge))
      .sort((left, right) => this.getChargeSortDate(left) - this.getChargeSortDate(right))
      .slice(0, 4);
  }

  get filteredCharges(): StudentFinancialCharge[] {
    return this.charges
      .filter((charge) => this.matchesChargeFilter(charge))
      .filter((charge) => this.matchesSearch([
        charge.concept_name,
        charge.notes,
        charge.type,
        this.getChargeStatusLabel(charge.status),
      ]))
      .sort((left, right) => this.compareCharges(left, right));
  }

  get filteredPayments(): StudentFinancialPayment[] {
    return this.payments
      .filter((payment) => this.matchesPaymentFilter(payment))
      .filter((payment) => this.matchesSearch([
        payment.concept_name,
        payment.notes,
        payment.reference,
        payment.receipt_number,
        this.getMethodLabel(payment.method),
      ]))
      .sort((left, right) => this.getPaymentSortDate(right) - this.getPaymentSortDate(left));
  }

  get validPayments(): StudentFinancialPayment[] {
    return this.payments.filter((payment) => !payment.voided_at);
  }

  get studentSectionLabel(): string {
    return this.selectedStudent ? this.getSectionLabel(this.selectedStudent) : 'Sin grado';
  }

  get statusBanner(): { title: string; message: string; tone: string } | null {
    if (!this.selectedStudent || !this.lastSummary) {
      return null;
    }

    if (this.overdueCharges.length > 0) {
      return {
        title: 'Hay cargos vencidos',
        message: `${this.selectedStudent.full_name} mantiene ${this.overdueCharges.length} cargo(s) vencido(s) en el filtro actual.`,
        tone: 'bg-rose-50 border-rose-200 text-rose-700',
      };
    }

    if (this.dueSoonCharges.length > 0) {
      return {
        title: 'Cuotas por vencer',
        message: `${this.selectedStudent.full_name} tiene ${this.dueSoonCharges.length} cargo(s) que vencen en los proximos 7 dias.`,
        tone: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      };
    }

    if (this.pendingCharges.length > 0) {
      return {
        title: 'Saldo pendiente',
        message: `${this.selectedStudent.full_name} aun tiene cargos pendientes por regularizar.`,
        tone: 'bg-amber-50 border-amber-200 text-amber-700',
      };
    }

    if (this.charges.length > 0) {
      return {
        title: 'Cuenta al dia',
        message: 'No hay cargos con saldo pendiente en el periodo consultado.',
        tone: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      };
    }

    return {
      title: 'Sin movimientos',
      message: 'Todavia no existen cargos ni pagos registrados para este estudiante en el filtro actual.',
      tone: 'bg-slate-50 border-slate-200 text-slate-600',
    };
  }

  onStudentChange(): void {
    if (this.summaries.length === 0) {
      this.loadFinance();
      return;
    }

    this.applySelectedSummary();
  }

  onScopeChange(): void {
    this.loadFinance();
  }

  onTabChange(tab: FinanceTab): void {
    this.activeTab = tab;
    this.movementSearch = '';
  }

  clearFilters(): void {
    this.movementSearch = '';
    this.chargeFilter = 'all';
    this.paymentFilter = 'all';
  }

  refresh(): void {
    this.loadFinance();
  }

  selectStudent(studentId: string): void {
    this.selectedStudentId = studentId;
    this.applySelectedSummary();
  }

  getNetAmount(charge: StudentFinancialCharge): number {
    return Math.max(0, Number(charge.amount || 0) - Number(charge.discount_amount || 0));
  }

  getOutstandingAmount(charge: StudentFinancialCharge): number {
    if (charge.status === 'anulado') {
      return 0;
    }

    return Math.max(0, this.getNetAmount(charge) - Number(charge.paid_amount || 0));
  }

  getChargeStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      pagado_parcial: 'Pago parcial',
      pagado: 'Pagado',
      vencido: 'Vencido',
      anulado: 'Anulado',
    };

    return labels[status] || 'Registrado';
  }

  getChargeStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
      pagado_parcial: 'bg-blue-50 text-blue-700 border-blue-200',
      pagado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      vencido: 'bg-rose-50 text-rose-700 border-rose-200',
      anulado: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return classes[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  }

  getPaymentStatusLabel(payment: StudentFinancialPayment): string {
    return payment.voided_at ? 'Anulado' : 'Vigente';
  }

  getPaymentStatusClass(payment: StudentFinancialPayment): string {
    return payment.voided_at
      ? 'bg-slate-100 text-slate-600 border-slate-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  getMethodLabel(method: string): string {
    const normalized = String(method || '').toLowerCase();

    if (normalized.includes('efectivo')) return 'Efectivo';
    if (normalized.includes('tarjeta')) return 'Tarjeta';
    if (normalized.includes('transfer')) return 'Transferencia';
    if (normalized.includes('yape')) return 'Yape';
    if (normalized.includes('plin')) return 'Plin';

    return method || 'No definido';
  }

  getDueBadgeLabel(charge: StudentFinancialCharge): string {
    if (!charge.due_date) {
      return 'Sin fecha';
    }

    if (this.isOverdue(charge)) {
      return 'Vencido';
    }

    const diff = this.getDaysUntil(charge.due_date);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Manana';
    if (diff > 1) return `En ${diff} dias`;

    return 'Registrado';
  }

  getDueBadgeClass(charge: StudentFinancialCharge): string {
    if (this.isOverdue(charge)) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (this.isDueSoon(charge)) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }

    return 'bg-slate-100 text-slate-600 border-slate-200';
  }

  formatDate(value?: string | null, includeTime = false): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('es-PE', includeTime
      ? {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      : {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  printReceipt(payment: StudentFinancialPayment): void {
    if (!payment.receipt_number) {
      return;
    }

    const popup = window.open('', '_blank', 'width=900,height=720');
    if (!popup) {
      return;
    }

    const studentName = this.selectedStudent?.full_name || 'Estudiante';
    const concept = payment.concept_name || 'Pago';
    const amount = Number(payment.receipt_total ?? payment.amount ?? 0).toFixed(2);
    const issuedAt = this.formatDate(payment.receipt_issued_at || payment.paid_at || payment.created_at, true);
    const paidAt = this.formatDate(payment.paid_at || payment.created_at, true);

    popup.document.write(`
      <html>
        <head>
          <title>Recibo ${payment.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; background: #f8fafc; }
            .receipt { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; }
            .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
            .eyebrow { color: #0891b2; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .18em; }
            .title { font-size: 30px; font-weight: 800; margin: 10px 0 0; }
            .number { font-size: 20px; font-weight: 800; color: #0f172a; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 24px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; background: #f8fafc; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .16em; margin-bottom: 8px; }
            .value { font-size: 15px; font-weight: 600; }
            .amount { text-align: center; padding: 22px; border-radius: 20px; background: #ecfdf5; border: 1px solid #a7f3d0; margin-top: 12px; }
            .amount h2 { margin: 8px 0 0; font-size: 34px; color: #047857; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div>
                <div class="eyebrow">Comprobante financiero</div>
                <div class="title">Recibo de pago</div>
              </div>
              <div style="text-align:right">
                <div class="label">Numero</div>
                <div class="number">${payment.receipt_number}</div>
              </div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="label">Estudiante</div>
                <div class="value">${studentName}</div>
              </div>
              <div class="card">
                <div class="label">Metodo</div>
                <div class="value">${this.getMethodLabel(payment.method)}</div>
              </div>
              <div class="card">
                <div class="label">Concepto</div>
                <div class="value">${concept}</div>
              </div>
              <div class="card">
                <div class="label">Referencia</div>
                <div class="value">${payment.reference || '-'}</div>
              </div>
              <div class="card">
                <div class="label">Fecha de pago</div>
                <div class="value">${paidAt}</div>
              </div>
              <div class="card">
                <div class="label">Fecha de emision</div>
                <div class="value">${issuedAt}</div>
              </div>
            </div>

            <div class="amount">
              <div class="label">Monto acreditado</div>
              <h2>S/ ${amount}</h2>
            </div>

            <div class="footer">
              Observacion: ${payment.notes || 'Sin observaciones adicionales.'}
            </div>
          </div>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  private loadAcademicContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.students = context.students || [];
        this.selectedStudentId = this.students[0]?.id || '';
        this.activeAcademicYearId = context.active_academic_year?.id || '';
        this.activeAcademicYearLabel = context.active_academic_year
          ? `Ano ${context.active_academic_year.year}`
          : 'Todo el historial';
        this.selectedScope = this.activeAcademicYearId ? 'active' : 'all';

        if (!this.students.length) {
          this.loading = false;
          this.error = 'Tu usuario no tiene estudiantes vinculados.';
          return;
        }

        this.loadFinance();
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo obtener el contexto academico del apoderado.';
      }
    });
  }

  private loadFinance(): void {
    if (!this.students.length || !this.selectedStudentId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    const academicYearId = this.selectedScope === 'active'
      ? this.activeAcademicYearId || undefined
      : undefined;

    forkJoin(
      this.students.map((student) => this.reportService.getFinancialSummary(student.id, academicYearId))
    ).subscribe({
      next: (responses) => {
        this.summaries = responses;
        this.applySelectedSummary();
        this.loading = false;
      },
      error: () => {
        this.summaries = [];
        this.lastSummary = null;
        this.charges = [];
        this.payments = [];
        this.loading = false;
        this.error = 'No se pudo cargar el estado financiero familiar.';
      }
    });
  }

  private applySelectedSummary(): void {
    const summary = this.summaries.find((item) => item.student_id === this.selectedStudentId);

    this.lastSummary = summary || null;
    this.charges = (summary?.charges || []).slice();
    this.payments = (summary?.payments || []).slice();
  }

  private matchesChargeFilter(charge: StudentFinancialCharge): boolean {
    switch (this.chargeFilter) {
      case 'with-balance':
        return this.getOutstandingAmount(charge) > 0 && charge.status !== 'anulado';
      case 'overdue':
        return this.isOverdue(charge);
      case 'partial':
        return charge.status === 'pagado_parcial';
      case 'paid':
        return charge.status === 'pagado' || (this.getOutstandingAmount(charge) === 0 && charge.status !== 'anulado');
      case 'voided':
        return charge.status === 'anulado';
      default:
        return true;
    }
  }

  private matchesPaymentFilter(payment: StudentFinancialPayment): boolean {
    switch (this.paymentFilter) {
      case 'valid':
        return !payment.voided_at;
      case 'voided':
        return !!payment.voided_at;
      default:
        return true;
    }
  }

  private matchesSearch(values: Array<string | null | undefined>): boolean {
    const query = this.movementSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return values.some((value) => String(value || '').toLowerCase().includes(query));
  }

  private compareCharges(left: StudentFinancialCharge, right: StudentFinancialCharge): number {
    const priorityDiff = this.getChargePriority(left) - this.getChargePriority(right);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return this.getChargeSortDate(left) - this.getChargeSortDate(right);
  }

  private getChargePriority(charge: StudentFinancialCharge): number {
    if (this.isOverdue(charge)) return 0;
    if (this.isDueSoon(charge)) return 1;
    if (this.getOutstandingAmount(charge) > 0) return 2;
    if (charge.status === 'pagado_parcial') return 3;
    if (charge.status === 'pagado') return 4;
    if (charge.status === 'anulado') return 5;
    return 6;
  }

  private getChargeSortDate(charge: StudentFinancialCharge): number {
    const date = this.parseDate(charge.due_date) || this.parseDate(charge.created_at);
    return date?.getTime() || Number.MAX_SAFE_INTEGER;
  }

  private getPaymentSortDate(payment: StudentFinancialPayment): number {
    return this.parseDate(payment.paid_at || payment.created_at)?.getTime() || 0;
  }

  private isOverdue(charge: StudentFinancialCharge): boolean {
    if (charge.status === 'anulado' || this.getOutstandingAmount(charge) <= 0) {
      return false;
    }

    if (charge.status === 'vencido') {
      return true;
    }

    const dueDate = this.parseDate(charge.due_date);
    if (!dueDate) {
      return false;
    }

    return dueDate.getTime() < this.startOfDay(new Date()).getTime();
  }

  private isDueSoon(charge: StudentFinancialCharge): boolean {
    if (charge.status === 'anulado' || this.getOutstandingAmount(charge) <= 0 || this.isOverdue(charge)) {
      return false;
    }

    const dueDate = this.parseDate(charge.due_date);
    if (!dueDate) {
      return false;
    }

    const today = this.startOfDay(new Date());
    const diff = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

    return diff >= 0 && diff <= 7;
  }

  private getDaysUntil(value?: string | null): number {
    const dueDate = this.parseDate(value);
    if (!dueDate) {
      return Number.MAX_SAFE_INTEGER;
    }

    const today = this.startOfDay(new Date());
    return Math.round((dueDate.getTime() - today.getTime()) / 86400000);
  }

  private getSectionLabel(student: AcademicContextStudent): string {
    const grade = student.section?.grade_level?.name || 'Sin grado';
    const section = student.section?.section_letter || '';

    return `${grade} ${section}`.trim();
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return this.startOfDay(date);
  }

  private startOfDay(date: Date): Date {
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
  }
}
