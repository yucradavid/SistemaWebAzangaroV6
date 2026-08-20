//src/app/features/admin/finance/reports/finance-reports.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService } from '@core/services/academic.service';
import { CashClosure, Charge, FinanceService, Payment } from '@core/services/finance.service';

type FinanceTab = 'morosidad' | 'recaudacion';

@Component({
  selector: 'app-finance-reports',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule],
  templateUrl: './finance-reports.component.html',
  styleUrls: ['./finance-reports.component.css']
})
export class FinanceReportsComponent implements OnInit {
  activeTab: FinanceTab = 'morosidad';
  loading = true;
  academicYears: any[] = [];
  gradeLevels: any[] = [];
  sections: any[] = [];
  selectedYearId = '';
  selectedMonth = '';
  selectedMethod = '';
  searchTerm = '';
  debtScope: 'todos' | 'vencidos' = 'todos';
  selectedGradeLevelId = '';
  selectedSectionId = '';

  allCharges: Charge[] = [];
  allPayments: Payment[] = [];
  allClosures: CashClosure[] = [];

  debtStats = {
    pending: 0,
    overdue: 0,
    delinquency: 0,
    averagePerStudent: 0
  };

  revenueStats = {
    total: 0,
    cash: 0,
    digital: 0,
    averageTicket: 0,
    expenses: 0
  };

  overdueStudents: Array<{ name: string; totalDebt: number; chargesCount: number }> = [];
  paymentBreakdown: Array<{ label: string; amount: number; count: number }> = [];
  recentPayments: Payment[] = [];
  topDebtConcepts: Array<{ label: string; amount: number; count: number }> = [];
  cashierClosureBreakdown: Array<{ label: string; amount: number; count: number; difference: number }> = [];

  constructor(
    private financeService: FinanceService,
    private academicService: AcademicService
  ) {}

  ngOnInit(): void {
    forkJoin({
      years: this.academicService.getAcademicYears(),
      gradeLevels: this.academicService.getGradeLevels({ per_page: 100 }),
      sections: this.academicService.getSections({ per_page: 300 })
    }).subscribe({
      next: ({ years, gradeLevels, sections }) => {
        const yearItems = Array.isArray((years as any).data) ? (years as any).data : years;
        this.academicYears = Array.isArray(yearItems) ? yearItems : [];
        const activeYear = this.academicYears.find((year: any) => year.is_active);
        this.selectedYearId = activeYear?.id || this.academicYears[0]?.id || '';
        this.gradeLevels = this.extractCollection(gradeLevels);
        this.sections = this.extractCollection(sections);
        this.loadData();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los datos base del reporte.', 'error');
      }
    });
  }

  get filteredSections(): any[] {
    return this.sections.filter((section: any) => {
      if (!this.selectedGradeLevelId) {
        return true;
      }

      return String(section.grade_level_id || section.gradeLevel?.id || '') === this.selectedGradeLevelId;
    });
  }

  loadData(): void {
    if (!this.selectedYearId) {
      this.loading = false;
      return;
    }

    this.loading = true;

    forkJoin({
      charges: this.financeService.getCharges({ academic_year_id: this.selectedYearId, per_page: 1000 }),
      payments: this.financeService.getPayments({ per_page: 1000 }),
      closures: this.financeService.getClosures({ per_page: 500 })
    }).subscribe({
      next: ({ charges, payments, closures }) => {
        this.allCharges = this.financeService.unwrapItems(charges);
        this.allPayments = this.financeService.unwrapItems(payments);
        this.allClosures = this.financeService.unwrapItems(closures);
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los reportes financieros.', 'error');
      }
    });
  }

  calculateStats(): void {
    const filteredCharges = this.getFilteredCharges();
    const filteredPayments = this.getFilteredPayments();
    const incomePayments = filteredPayments.filter((payment) => !this.isExpense(payment));
    const expensePayments = filteredPayments.filter((payment) => this.isExpense(payment));

    let totalIssued = 0;
    let pending = 0;
    let overdue = 0;
    const studentDebts = new Map<string, { name: string; totalDebt: number; chargesCount: number }>();
    const conceptDebts = new Map<string, { label: string; amount: number; count: number }>();

    filteredCharges.forEach((charge) => {
      const netAmount = this.getNetChargeAmount(charge);
      const debt = this.getChargeDebt(charge);
      totalIssued += netAmount;

      if (debt <= 0) {
        return;
      }

      pending += debt;

      const dueDate = charge.due_date ? new Date(charge.due_date) : null;
      const isOverdue = charge.status === 'vencido' || (!!dueDate && dueDate < new Date() && charge.status !== 'pagado');
      if (isOverdue) {
        overdue += debt;
      }

       const conceptKey = String(charge.concept?.id || charge.concept_id || charge.type || charge.notes || 'sin-concepto');
       const conceptLabel = charge.concept?.name || charge.notes || 'Cargo directo';
       const conceptCurrent = conceptDebts.get(conceptKey) || { label: conceptLabel, amount: 0, count: 0 };
       conceptCurrent.amount += debt;
       conceptCurrent.count += 1;
       conceptDebts.set(conceptKey, conceptCurrent);

      const studentId = String(charge.student?.id || charge.student_id || '');
      const studentName = this.getStudentName(charge.student);
      if (!studentId || !studentName) {
        return;
      }

      const current = studentDebts.get(studentId) || { name: studentName, totalDebt: 0, chargesCount: 0 };
      current.totalDebt += debt;
      current.chargesCount += 1;
      studentDebts.set(studentId, current);
    });

    const totalCollected = incomePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const totalExpenses = expensePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const cash = incomePayments
      .filter((payment) => this.normalizeMethod(payment.method) === 'efectivo')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const digital = totalCollected - cash;

    this.debtStats.pending = pending;
    this.debtStats.overdue = overdue;
    this.debtStats.delinquency = totalIssued > 0 ? (overdue / totalIssued) * 100 : 0;
    this.debtStats.averagePerStudent = studentDebts.size > 0 ? pending / studentDebts.size : 0;

    this.revenueStats.total = totalCollected;
    this.revenueStats.cash = cash;
    this.revenueStats.digital = digital;
    this.revenueStats.averageTicket = incomePayments.length > 0 ? totalCollected / incomePayments.length : 0;
    this.revenueStats.expenses = totalExpenses;

    this.overdueStudents = Array.from(studentDebts.values()).sort((left, right) => right.totalDebt - left.totalDebt);
    this.topDebtConcepts = Array.from(conceptDebts.values())
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 8);
    this.paymentBreakdown = this.buildPaymentBreakdown(incomePayments);
    this.recentPayments = [...incomePayments]
      .sort((left, right) => new Date(right.paid_at).getTime() - new Date(left.paid_at).getTime())
      .slice(0, 12);
    this.cashierClosureBreakdown = this.buildCashierClosureBreakdown();
  }

  onGradeLevelChange(): void {
    const sectionStillMatches = this.filteredSections.some((section: any) => section.id === this.selectedSectionId);
    if (!sectionStillMatches) {
      this.selectedSectionId = '';
    }
    this.calculateStats();
  }

  getPaymentStudentName(payment: Payment): string {
    return this.getStudentName(payment.student || payment.charge?.student) || 'Alumno no identificado';
  }

  getMethodLabel(method?: string): string {
    switch (this.normalizeMethod(method)) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta':
        return 'Tarjeta';
      case 'transferencia':
        return 'Transferencia';
      case 'yape':
        return 'Yape';
      case 'plin':
        return 'Plin';
      default:
        return 'Otro';
    }
  }

  exportCurrentReport(format: 'excel' | 'pdf'): void {
    if (this.activeTab === 'morosidad') {
      this.exportDebtReport(format);
      return;
    }

    this.exportRevenueReport(format);
  }

  private getFilteredCharges(): Charge[] {
    return this.allCharges.filter((charge) => {
      if (charge.status === 'anulado') {
        return false;
      }
      const debt = this.getChargeDebt(charge);
      if (debt <= 0) {
        return false;
      }
      if (!this.matchesMonth(charge.due_date)) {
        return false;
      }
      if (this.debtScope === 'vencidos' && !this.isChargeOverdue(charge)) {
        return false;
      }
      if (!this.matchesSearch([
        this.getStudentName(charge.student),
        charge.concept?.name,
        charge.notes,
        charge.type
      ])) {
        return false;
      }
      if (!this.matchesStudentFilters(charge.student, charge.student?.section)) {
        return false;
      }
      return true;
    });
  }

  private getFilteredPayments(): Payment[] {
    return this.allPayments.filter((payment) => {
      const paymentYearId = payment.charge?.academic_year_id;
      if (paymentYearId && paymentYearId !== this.selectedYearId) {
        return false;
      }
      if (paymentYearId == null && payment.charge_id) {
        return false;
      }
      if (!this.matchesMonth(payment.paid_at)) {
        return false;
      }
      if (this.selectedMethod && this.normalizeMethod(payment.method) !== this.selectedMethod) {
        return false;
      }
      if (!this.matchesSearch([
        this.getPaymentStudentName(payment),
        payment.charge?.concept?.name,
        payment.charge?.notes,
        payment.reference,
        payment.notes
      ])) {
        return false;
      }
      const student = payment.student || payment.charge?.student;
      const section = student?.section || payment.charge?.student?.section;
      if (!this.matchesStudentFilters(student, section)) {
        return false;
      }
      return true;
    });
  }

  private matchesMonth(value?: string | null): boolean {
    if (!this.selectedMonth) {
      return true;
    }
    if (!value) {
      return false;
    }
    const month = new Date(value).getMonth() + 1;
    return String(month) === this.selectedMonth;
  }

  private getNetChargeAmount(charge: Charge): number {
    return Number(charge.amount || 0) - Number(charge.discount_amount || 0);
  }

  private getChargeDebt(charge: Charge): number {
    return Math.max(0, this.getNetChargeAmount(charge) - Number(charge.paid_amount || 0));
  }

  private isChargeOverdue(charge: Charge): boolean {
    const debt = this.getChargeDebt(charge);
    if (debt <= 0) {
      return false;
    }

    const dueDate = charge.due_date ? new Date(charge.due_date) : null;
    return charge.status === 'vencido' || (!!dueDate && dueDate < new Date() && charge.status !== 'pagado');
  }

  private isExpense(payment: Payment): boolean {
    return String(payment.notes || '').includes('(EGRESO)');
  }

  private normalizeMethod(method?: string | null): string {
    const value = String(method || '').toLowerCase().trim();
    if (value.includes('efectivo')) return 'efectivo';
    if (value.includes('tarjeta')) return 'tarjeta';
    if (value.includes('transfer')) return 'transferencia';
    if (value.includes('yape')) return 'yape';
    if (value.includes('plin')) return 'plin';
    return value || 'otro';
  }

  private buildPaymentBreakdown(payments: Payment[]): Array<{ label: string; amount: number; count: number }> {
    const methods = [
      { id: 'efectivo', label: 'Efectivo' },
      { id: 'tarjeta', label: 'Tarjeta' },
      { id: 'transferencia', label: 'Transferencia' },
      { id: 'yape', label: 'Yape' },
      { id: 'plin', label: 'Plin' },
      { id: 'otro', label: 'Otros' }
    ];

    return methods.map((method) => {
      const matches = payments.filter((payment) => this.normalizeMethod(payment.method) === method.id);
      return {
        label: method.label,
        amount: matches.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
        count: matches.length
      };
    }).filter((item) => item.count > 0 || item.amount > 0);
  }

  private getStudentName(student: any): string {
    if (!student) {
      return '';
    }
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    return fullName || student.name || '';
  }

  private matchesSearch(values: Array<string | null | undefined>): boolean {
    const search = this.searchTerm.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return values.some((value) => String(value || '').toLowerCase().includes(search));
  }

  private matchesStudentFilters(student: any, section: any): boolean {
    if (!this.selectedGradeLevelId && !this.selectedSectionId) {
      return true;
    }

    const sectionId = String(section?.id || student?.section_id || '');
    const gradeLevelId = String(section?.grade_level_id || section?.gradeLevel?.id || '');

    if (this.selectedGradeLevelId && gradeLevelId !== this.selectedGradeLevelId) {
      return false;
    }

    if (this.selectedSectionId && sectionId !== this.selectedSectionId) {
      return false;
    }

    return true;
  }

  private buildCashierClosureBreakdown(): Array<{ label: string; amount: number; count: number; difference: number }> {
    const filteredClosures = this.allClosures.filter((closure) => {
      if (!this.matchesMonth(String(closure.closure_date || ''))) {
        return false;
      }

      return true;
    });

    const grouped = new Map<string, { label: string; amount: number; count: number; difference: number }>();

    filteredClosures.forEach((closure) => {
      const label = closure.cashier?.full_name || closure.closed_by_user?.full_name || 'Sin usuario';
      const current = grouped.get(label) || { label, amount: 0, count: 0, difference: 0 };
      current.amount += Number(closure.total_amount || 0);
      current.count += 1;
      current.difference += Number(closure.difference || 0);
      grouped.set(label, current);
    });

    return Array.from(grouped.values()).sort((left, right) => right.amount - left.amount);
  }

  private extractCollection(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }

  private exportDebtReport(format: 'excel' | 'pdf') {
    const rows = this.overdueStudents.map((student) => ({
      Alumno: student.name,
      Cargos: student.chargesCount,
      Saldo: student.totalDebt.toFixed(2)
    }));

    if (format === 'excel') {
      this.downloadCsv(`reporte-morosidad-${this.selectedYearId}.csv`, rows);
      return;
    }

    const tableHtml = rows.length > 0
      ? rows.map((row) => `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${this.escapeHtml(String(row.Alumno))}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${row.Cargos}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">S/ ${row.Saldo}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">No hay datos para exportar.</td></tr>`;

    this.openPrintWindow('Reporte de Morosidad', `
      <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:12px;margin-bottom:20px;">
        ${this.printCard('Saldo pendiente', this.debtStats.pending)}
        ${this.printCard('Saldo vencido', this.debtStats.overdue)}
        ${this.printCard('% morosidad', this.debtStats.delinquency, true)}
        ${this.printCard('Promedio por alumno', this.debtStats.averagePerStudent)}
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px;text-align:left;">Alumno</th>
            <th style="padding:10px;text-align:center;">Cargos</th>
            <th style="padding:10px;text-align:right;">Saldo</th>
          </tr>
        </thead>
        <tbody>${tableHtml}</tbody>
      </table>
    `);
  }

  private exportRevenueReport(format: 'excel' | 'pdf') {
    const rows = this.recentPayments.map((payment) => ({
      Alumno: this.getPaymentStudentName(payment),
      Metodo: this.getMethodLabel(payment.method),
      Monto: Number(payment.amount || 0).toFixed(2),
      Referencia: payment.reference || '',
      Fecha: payment.paid_at ? new Date(payment.paid_at).toLocaleString() : ''
    }));

    if (format === 'excel') {
      this.downloadCsv(`reporte-recaudacion-${this.selectedYearId}.csv`, rows);
      return;
    }

    const tableHtml = rows.length > 0
      ? rows.map((row) => `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${this.escapeHtml(String(row.Alumno))}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${this.escapeHtml(String(row.Metodo))}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">S/ ${row.Monto}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${this.escapeHtml(String(row.Referencia))}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${this.escapeHtml(String(row.Fecha))}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;">No hay datos para exportar.</td></tr>`;

    this.openPrintWindow('Reporte de Recaudacion', `
      <div style="display:grid;grid-template-columns:repeat(5, minmax(0, 1fr));gap:12px;margin-bottom:20px;">
        ${this.printCard('Recaudado', this.revenueStats.total)}
        ${this.printCard('Efectivo', this.revenueStats.cash)}
        ${this.printCard('Digital', this.revenueStats.digital)}
        ${this.printCard('Ticket promedio', this.revenueStats.averageTicket)}
        ${this.printCard('Egresos', this.revenueStats.expenses)}
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px;text-align:left;">Alumno</th>
            <th style="padding:10px;text-align:left;">Metodo</th>
            <th style="padding:10px;text-align:right;">Monto</th>
            <th style="padding:10px;text-align:left;">Referencia</th>
            <th style="padding:10px;text-align:left;">Fecha</th>
          </tr>
        </thead>
        <tbody>${tableHtml}</tbody>
      </table>
    `);
  }

  private downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
    if (rows.length === 0) {
      Swal.fire('Sin datos', 'No hay datos para exportar con los filtros actuales.', 'info');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => this.toCsvValue(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private openPrintWindow(title: string, body: string) {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!printWindow) {
      Swal.fire('Bloqueado', 'El navegador bloqueo la ventana de impresion.', 'warning');
      return;
    }

    const selectedYear = this.academicYears.find((year: any) => year.id === this.selectedYearId);
    const monthLabel = this.getMonthLabel(this.selectedMonth);

    printWindow.document.write(`
      <html>
        <head>
          <title>${this.escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            p { margin: 0 0 18px; color: #475569; }
            table { width: 100%; }
            th { font-size: 12px; color: #64748b; text-transform: uppercase; }
            td { font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>${this.escapeHtml(title)}</h1>
          <p>Anio academico: ${this.escapeHtml(String(selectedYear?.year || '-'))} | Mes: ${this.escapeHtml(monthLabel)} | Generado: ${this.escapeHtml(new Date().toLocaleString())}</p>
          ${body}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private printCard(label: string, value: number, isPercent = false): string {
    const formatted = isPercent ? `${value.toFixed(1)}%` : `S/ ${value.toFixed(2)}`;
    return `
      <div style="border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;background:#fff;">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:6px;">${this.escapeHtml(label)}</div>
        <div style="font-size:20px;font-weight:700;color:#0f172a;">${formatted}</div>
      </div>
    `;
  }

  private toCsvValue(value: string | number): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private getMonthLabel(month: string): string {
    const labels: Record<string, string> = {
      '1': 'Enero',
      '2': 'Febrero',
      '3': 'Marzo',
      '4': 'Abril',
      '5': 'Mayo',
      '6': 'Junio',
      '7': 'Julio',
      '8': 'Agosto',
      '9': 'Setiembre',
      '10': 'Octubre',
      '11': 'Noviembre',
      '12': 'Diciembre'
    };

    return labels[month] || 'Todos';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
