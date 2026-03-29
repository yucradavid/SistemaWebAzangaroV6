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
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Reportes financieros</h1>
          <p class="text-slate-500 text-sm font-medium">Morosidad y recaudacion calculadas con cargos y pagos reales.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="exportCurrentReport('excel')" class="px-5 py-2.5 bg-white border-2 border-blue-900 text-blue-900 text-xs font-semibold rounded-xl uppercase tracking-tight">
            Exportar Excel
          </button>
          <button (click)="exportCurrentReport('pdf')" class="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 text-xs font-semibold rounded-xl uppercase tracking-tight">
            Exportar PDF
          </button>
        </div>
      </div>

      <div class="flex items-center gap-10 border-b border-slate-100 overflow-x-auto pb-px">
        <button (click)="activeTab = 'morosidad'" [class]="activeTab === 'morosidad' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-600'" class="pb-4 text-xs font-semibold border-b-2 whitespace-nowrap px-1">Analisis de morosidad</button>
        <button (click)="activeTab = 'recaudacion'" [class]="activeTab === 'recaudacion' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-600'" class="pb-4 text-xs font-semibold border-b-2 whitespace-nowrap px-1">Recaudacion</button>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div class="space-y-2">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Anio academico</label>
            <select [(ngModel)]="selectedYearId" (change)="loadData()" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium">
              <option *ngFor="let year of academicYears" [value]="year.id">{{ year.year }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Mes</label>
            <select [(ngModel)]="selectedMonth" (change)="calculateStats()" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium">
              <option value="">Todos</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Setiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Buscar</label>
            <input
              [(ngModel)]="searchTerm"
              (ngModelChange)="calculateStats()"
              type="text"
              placeholder="Alumno, concepto o referencia"
              class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium">
          </div>
          <div class="space-y-2">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Grado</label>
            <select [(ngModel)]="selectedGradeLevelId" (change)="onGradeLevelChange()" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium">
              <option value="">Todos</option>
              <option *ngFor="let grade of gradeLevels" [value]="grade.id">{{ grade.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Seccion</label>
            <select [(ngModel)]="selectedSectionId" (change)="calculateStats()" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium">
              <option value="">Todas</option>
              <option *ngFor="let section of filteredSections" [value]="section.id">
                {{ section.grade_level?.name || section.gradeLevel?.name || 'Seccion' }} {{ section.section_letter || section.name || '' }}
              </option>
            </select>
          </div>
          <div class="space-y-2" *ngIf="activeTab === 'morosidad'">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Alcance</label>
            <select [(ngModel)]="debtScope" (change)="calculateStats()" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium">
              <option value="todos">Pendientes y vencidos</option>
              <option value="vencidos">Solo vencidos</option>
            </select>
          </div>
          <div class="space-y-2" *ngIf="activeTab === 'recaudacion'">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Metodo</label>
            <select [(ngModel)]="selectedMethod" (change)="calculateStats()" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium">
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="yape">Yape</option>
              <option value="plin">Plin</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center py-20">
        <div class="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
      </div>

      <ng-container *ngIf="!loading && activeTab === 'morosidad'">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-amber-400">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ debtStats.pending | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Saldo pendiente</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-red-500">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ debtStats.overdue | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Saldo vencido</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-blue-500">
            <h3 class="text-3xl font-bold text-slate-900">{{ debtStats.delinquency | number:'1.1-1' }}%</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">% de morosidad</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-slate-500">
            <h3 class="text-3xl font-bold text-slate-900">{{ overdueStudents.length }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Alumnos con deuda</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-violet-500">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ debtStats.averagePerStudent | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Promedio por alumno</p>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[1.25fr_0.85fr] gap-6">
          <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-slate-50 bg-slate-50/10">
              <h2 class="text-base font-semibold text-slate-800 tracking-tight">Alumnos con deuda ({{ overdueStudents.length }})</h2>
            </div>
            <div *ngIf="overdueStudents.length === 0" class="py-20 text-center text-slate-400">No hay deudas con los filtros seleccionados.</div>
            <div *ngIf="overdueStudents.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                    <th class="py-4 px-6 text-left">Alumno</th>
                    <th class="py-4 px-6 text-center">Cargos pendientes</th>
                    <th class="py-4 px-6 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr *ngFor="let student of overdueStudents" class="hover:bg-slate-50/50">
                    <td class="py-4 px-6">
                      <div class="text-sm font-bold text-slate-700">{{ student.name }}</div>
                    </td>
                    <td class="py-4 px-6 text-center">
                      <span class="bg-red-50 text-red-600 px-3 py-1 text-xs font-bold rounded-xl">{{ student.chargesCount }} cargos</span>
                    </td>
                    <td class="py-4 px-6 text-right text-sm font-bold text-slate-800">S/ {{ student.totalDebt | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="p-6 border-b border-slate-50 bg-slate-50/10">
            <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <div class="p-6 border-b border-slate-50 bg-slate-50/10">
                <h2 class="text-base font-semibold text-slate-800 tracking-tight">Conceptos con mayor deuda</h2>
              </div>
              <div *ngIf="topDebtConcepts.length === 0" class="py-20 text-center text-slate-400">No hay conceptos con deuda para mostrar.</div>
              <div *ngIf="topDebtConcepts.length > 0" class="p-6 space-y-4">
                <div *ngFor="let concept of topDebtConcepts" class="rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-800">{{ concept.label }}</p>
                    <p class="text-[11px] text-slate-400">{{ concept.count }} cargos con saldo</p>
                  </div>
                  <p class="text-lg font-bold text-slate-900">S/ {{ concept.amount | number:'1.2-2' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && activeTab === 'recaudacion'">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-emerald-500">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ revenueStats.total | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Recaudado</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-blue-500">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ revenueStats.cash | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Efectivo</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-violet-500">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ revenueStats.digital | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Canales digitales</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-slate-500">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ revenueStats.averageTicket | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Ticket promedio</p>
          </div>
          <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm border-t-4 border-red-500">
            <h3 class="text-3xl font-bold text-slate-900">S/ {{ revenueStats.expenses | number:'1.2-2' }}</h3>
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">Egresos</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-slate-50 bg-slate-50/10">
              <h2 class="text-base font-semibold text-slate-800 tracking-tight">Recaudacion por metodo</h2>
            </div>
            <div class="p-6 space-y-4">
              <div *ngFor="let item of paymentBreakdown" class="rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-slate-800">{{ item.label }}</p>
                  <p class="text-[11px] text-slate-400">{{ item.count }} pagos</p>
                </div>
                <p class="text-lg font-bold text-slate-900">S/ {{ item.amount | number:'1.2-2' }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-slate-50 bg-slate-50/10">
              <h2 class="text-base font-semibold text-slate-800 tracking-tight">Pagos recientes ({{ recentPayments.length }})</h2>
            </div>
            <div *ngIf="recentPayments.length === 0" class="py-20 text-center text-slate-400">No hay pagos con los filtros seleccionados.</div>
            <div *ngIf="recentPayments.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                    <th class="py-4 px-6 text-left">Alumno</th>
                    <th class="py-4 px-6 text-left">Metodo</th>
                    <th class="py-4 px-6 text-right">Monto</th>
                    <th class="py-4 px-6 text-left">Referencia</th>
                    <th class="py-4 px-6 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr *ngFor="let payment of recentPayments" class="hover:bg-slate-50/50">
                    <td class="py-4 px-6">
                      <div class="text-sm font-semibold text-slate-700">{{ getPaymentStudentName(payment) }}</div>
                      <div class="text-[11px] text-slate-400">{{ payment.receipt?.number || 'Sin recibo' }}</div>
                    </td>
                    <td class="py-4 px-6 text-sm font-medium text-slate-600">{{ getMethodLabel(payment.method) }}</td>
                    <td class="py-4 px-6 text-right text-sm font-bold text-slate-800">S/ {{ payment.amount | number:'1.2-2' }}</td>
                    <td class="py-4 px-6 text-sm text-slate-500">{{ payment.reference || '-' }}</td>
                    <td class="py-4 px-6 text-sm text-slate-500">{{ payment.paid_at | date:'dd/MM/yyyy HH:mm' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-slate-50 bg-slate-50/10">
              <h2 class="text-base font-semibold text-slate-800 tracking-tight">Cierres por cajero</h2>
            </div>
            <div *ngIf="cashierClosureBreakdown.length === 0" class="py-20 text-center text-slate-400">No hay cierres para el mes seleccionado.</div>
            <div *ngIf="cashierClosureBreakdown.length > 0" class="p-6 space-y-4">
              <div *ngFor="let item of cashierClosureBreakdown" class="rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-slate-800">{{ item.label }}</p>
                  <p class="text-[11px] text-slate-400">{{ item.count }} cierres | Dif. acumulada: S/ {{ item.difference | number:'1.2-2' }}</p>
                </div>
                <p class="text-lg font-bold text-slate-900">S/ {{ item.amount | number:'1.2-2' }}</p>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
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
