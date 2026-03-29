//src/app/features/admin/finance/charges/finance-student.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AcademicService } from '@core/services/academic.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { Charge, FinanceService, Payment } from '@core/services/finance.service';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

@Component({
  selector: 'app-finance-student',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, ReactiveFormsModule, SettingFilterDropdownComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 text-slate-700">
      <app-back-button></app-back-button>

      <div class="space-y-1">
        <p class="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.25em]">Cuenta corriente</p>
        <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Estado financiero por estudiante</h1>
        <p class="text-slate-500 text-sm font-medium">Consulta cargos, pagos, recibos y saldos reales del backend financiero.</p>
      </div>

      <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
        <div class="grid grid-cols-1 lg:grid-cols-[1.5fr_320px] gap-4 items-end">
          <div [formGroup]="searchForm" class="relative">
            <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Buscar estudiante</label>
            <input
              formControlName="q"
              type="text"
              placeholder="Buscar alumno con cargos por DNI, codigo o apellidos"
              class="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500">

            <div *ngIf="students.length > 0" class="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
              <button
                *ngFor="let student of students"
                (click)="selectStudent(student)"
                class="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
                <div class="text-sm font-semibold text-slate-900">{{ student.last_name }}, {{ student.first_name }}</div>
                <div class="text-[11px] text-slate-400">
                  DNI: {{ student.dni }} | Codigo: {{ student.student_code }} |
                  {{ getStudentSectionLabel(student) }} |
                  Cargos: {{ student.active_charges_count || 0 }}
                </div>
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Anio academico</label>
            <app-setting-filter-dropdown
              [options]="yearOptions"
              [selectedId]="selectedAcademicYearId"
              placeholder="Todos los anios"
              (selectionChange)="onAcademicYearChange($event)">
            </app-setting-filter-dropdown>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-100 bg-slate-50/40 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-semibold text-slate-800">Alumnos con cargos</h3>
              <p class="text-xs text-slate-400">Listado rapido del anio seleccionado para que no dependas de la busqueda manual.</p>
            </div>
            <span class="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
              {{ chargedStudents.length }} alumnos
            </span>
          </div>

          <div *ngIf="loadingStudentDirectory" class="px-6 py-10 text-center text-slate-400 text-sm font-medium">
            Cargando alumnos con cargos...
          </div>

          <div *ngIf="!loadingStudentDirectory && chargedStudents.length === 0" class="px-6 py-10 text-center text-slate-400 text-sm font-medium">
            No hay alumnos con cargos para el anio seleccionado.
          </div>

          <div *ngIf="!loadingStudentDirectory && chargedStudents.length > 0" class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <button
              *ngFor="let student of chargedStudents"
              type="button"
              (click)="selectStudent(student)"
              class="text-left rounded-2xl border px-4 py-4 transition-all hover:border-blue-200 hover:bg-white"
              [class.border-blue-200]="selectedStudent?.id === student.id"
              [class.bg-blue-50]="selectedStudent?.id === student.id"
              [class.border-slate-100]="selectedStudent?.id !== student.id"
              [class.bg-white]="selectedStudent?.id !== student.id">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-slate-900">{{ student.last_name }}, {{ student.first_name }}</div>
                  <div class="text-[11px] text-slate-400 mt-1">
                    DNI: {{ student.dni || '-' }} | Codigo: {{ student.student_code || '-' }}
                  </div>
                  <div class="text-[11px] text-slate-500 mt-1">{{ getStudentSectionLabel(student) }}</div>
                </div>
                <span class="shrink-0 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                  {{ student.active_charges_count || 0 }} cargos
                </span>
              </div>
            </button>
          </div>
        </div>

        <div *ngIf="loading" class="py-16 text-center">
          <div class="w-10 h-10 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-400 text-sm font-medium">Cargando estado de cuenta...</p>
        </div>

        <ng-container *ngIf="selectedStudent && !loading">
          <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-1">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Alumno seleccionado</p>
              <h2 class="text-2xl font-semibold text-slate-900">{{ selectedStudent.first_name }} {{ selectedStudent.last_name }}</h2>
              <p class="text-sm text-slate-500">
                DNI: {{ selectedStudent.dni || '-' }} | Codigo: {{ selectedStudent.student_code || '-' }}
              </p>
              <p class="text-sm text-slate-500">
                {{ selectedStudent.section?.grade_level?.name || 'Sin grado' }} {{ selectedStudent.section?.section_letter || '' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <button (click)="loadAccount()" class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold">Actualizar</button>
              <button (click)="clearSelection()" class="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold text-slate-700">Limpiar</button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Emitido neto</p>
              <h3 class="text-2xl font-bold text-slate-950">S/ {{ accountSummary.netTotal | number:'1.2-2' }}</h3>
            </div>
            <div class="p-5 bg-emerald-50 rounded-2xl border border-emerald-100/50">
              <p class="text-[10px] text-emerald-600/70 uppercase font-bold tracking-widest mb-1">Pagado</p>
              <h3 class="text-2xl font-bold text-emerald-700">S/ {{ accountSummary.paid | number:'1.2-2' }}</h3>
            </div>
            <div class="p-5 bg-amber-50 rounded-2xl border border-amber-100/50">
              <p class="text-[10px] text-amber-600/70 uppercase font-bold tracking-widest mb-1">Pendiente</p>
              <h3 class="text-2xl font-bold text-amber-700">S/ {{ accountSummary.outstanding | number:'1.2-2' }}</h3>
            </div>
            <div class="p-5 bg-red-50 rounded-2xl border border-red-100/50">
              <p class="text-[10px] text-red-600/70 uppercase font-bold tracking-widest mb-1">Vencidos</p>
              <h3 class="text-2xl font-bold text-red-700">{{ accountSummary.overdueCount }}</h3>
            </div>
            <div class="p-5 bg-blue-50 rounded-2xl border border-blue-100/50">
              <p class="text-[10px] text-blue-600/70 uppercase font-bold tracking-widest mb-1">Estado general</p>
              <h3 class="text-xl font-bold text-blue-900">{{ getAccountStatus() }}</h3>
            </div>
          </div>

          <div class="flex items-center gap-10 border-b border-slate-100 overflow-x-auto pb-px">
            <button (click)="activeTab = 'charges'" [class]="activeTab === 'charges' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-600'" class="pb-4 text-xs font-semibold border-b-2 whitespace-nowrap px-1">
              Cargos
            </button>
            <button (click)="activeTab = 'payments'" [class]="activeTab === 'payments' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-600'" class="pb-4 text-xs font-semibold border-b-2 whitespace-nowrap px-1">
              Pagos y recibos
            </button>
          </div>

          <div *ngIf="activeTab === 'charges'" class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-slate-50 bg-slate-50/10 flex items-center justify-between">
              <h3 class="text-base font-semibold text-slate-800 tracking-tight">Cargos del alumno ({{ charges.length }})</h3>
              <span class="text-xs text-slate-400">Filtrados por anio: {{ getSelectedYearLabel() }}</span>
            </div>

            <div *ngIf="charges.length === 0" class="px-6 py-12 text-center text-slate-400 text-sm font-medium">
              No se encontraron cargos para este alumno.
            </div>

            <div *ngIf="charges.length > 0" class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-100">
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Concepto / referencia</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vencimiento</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Monto neto</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Pagado</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr *ngFor="let charge of charges" class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-semibold text-slate-900 text-sm">{{ charge.concept?.name || 'Cargo directo' }}</div>
                      <div class="text-[11px] text-slate-400">{{ charge.notes || 'Sin referencia adicional' }}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500 font-medium">{{ charge.due_date ? (charge.due_date | date:'dd/MM/yyyy') : '-' }}</td>
                    <td class="px-6 py-4 text-right text-sm font-bold text-slate-950">S/ {{ getNetAmount(charge) | number:'1.2-2' }}</td>
                    <td class="px-6 py-4 text-right text-sm font-bold text-emerald-700">S/ {{ (charge.paid_amount || 0) | number:'1.2-2' }}</td>
                    <td class="px-6 py-4 text-right text-sm font-bold text-slate-800">S/ {{ getOutstandingAmount(charge) | number:'1.2-2' }}</td>
                    <td class="px-6 py-4 text-center">
                      <span [class]="'px-3 py-1 rounded-full text-[10px] font-bold border ' + getStatusBadge(charge.status)">
                        {{ charge.status | uppercase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <button
                          (click)="registerChargePayment(charge)"
                          [disabled]="getOutstandingAmount(charge) <= 0 || charge.status === 'anulado'"
                          class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                          [class.bg-blue-900]="getOutstandingAmount(charge) > 0 && charge.status !== 'anulado'"
                          [class.text-white]="getOutstandingAmount(charge) > 0 && charge.status !== 'anulado'"
                          [class.bg-slate-100]="getOutstandingAmount(charge) <= 0 || charge.status === 'anulado'"
                          [class.text-slate-500]="getOutstandingAmount(charge) <= 0 || charge.status === 'anulado'">
                          Cobrar
                        </button>
                        <button
                          (click)="voidCharge(charge)"
                          [disabled]="charge.status === 'anulado' || (charge.paid_amount || 0) > 0"
                          class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-white border border-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div *ngIf="activeTab === 'payments'" class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-slate-50 bg-slate-50/10 flex items-center justify-between">
              <h3 class="text-base font-semibold text-slate-800 tracking-tight">Pagos registrados ({{ payments.length }})</h3>
              <span class="text-xs text-slate-400">Recibos incluidos cuando existen</span>
            </div>

            <div *ngIf="payments.length === 0" class="px-6 py-12 text-center text-slate-400 text-sm font-medium">
              No se encontraron pagos para este alumno.
            </div>

            <div *ngIf="payments.length > 0" class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-100">
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Concepto</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metodo</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Monto</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recibo</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referencia</th>
                    <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr *ngFor="let payment of payments" class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4 text-sm text-slate-500 font-medium">{{ payment.paid_at | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-6 py-4">
                      <div class="font-semibold text-slate-900 text-sm">{{ payment.charge?.concept?.name || 'Pago libre' }}</div>
                      <div class="text-[11px] text-slate-400">{{ payment.notes || payment.charge?.notes || 'Sin observacion' }}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600 font-semibold">{{ getMethodLabel(payment.method) }}</td>
                    <td class="px-6 py-4">
                      <span [class]="'px-3 py-1 rounded-full text-[10px] font-bold border ' + getPaymentStatusBadge(payment)">
                        {{ payment.voided_at ? 'ANULADO' : 'VIGENTE' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right text-sm font-bold" [class.text-emerald-700]="!payment.voided_at" [class.text-slate-400]="!!payment.voided_at">
                      S/ {{ payment.amount | number:'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600">{{ payment.receipt?.number || 'Sin recibo' }}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">{{ payment.reference || '-' }}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <button
                          (click)="printReceipt(payment)"
                          [disabled]="!payment.receipt"
                          class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                          [class.bg-white]="!!payment.receipt"
                          [class.border]="!!payment.receipt"
                          [class.border-slate-200]="!!payment.receipt"
                          [class.text-slate-700]="!!payment.receipt"
                          [class.bg-slate-100]="!payment.receipt"
                          [class.text-slate-500]="!payment.receipt">
                          Reimprimir
                        </button>
                        <button
                          (click)="voidPayment(payment)"
                          [disabled]="!!payment.voided_at"
                          class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-white border border-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>

        <div *ngIf="!selectedStudent && !loading" class="py-20 border-2 border-dashed border-slate-50 rounded-3xl text-center">
          <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h4 class="text-slate-900 font-semibold text-xl mb-2">Selecciona un estudiante</h4>
          <p class="text-slate-400 text-sm max-w-xs mx-auto font-medium">Busca un alumno para ver su cuenta corriente con cargos y pagos reales.</p>
        </div>
      </div>
    </div>
  `
})
export class FinanceStudentComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  students: any[] = [];
  chargedStudents: any[] = [];
  academicYears: any[] = [];
  yearOptions: Array<{ id: string; name: string }> = [];

  selectedStudent: any = null;
  selectedAcademicYearId = '';
  activeTab: 'charges' | 'payments' = 'charges';

  charges: Charge[] = [];
  payments: Payment[] = [];
  loading = false;
  loadingStudentDirectory = false;
  accountSummary = {
    netTotal: 0,
    outstanding: 0,
    paid: 0,
    overdueCount: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private academicService: AcademicService
  ) {
    this.searchForm = this.fb.group({
      q: ['']
    });
  }

  ngOnInit(): void {
    this.loadAcademicYears();

    this.searchForm.get('q')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        if (value && value.length >= 2) {
          this.onSearch();
        } else {
          this.students = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAcademicYears(): void {
    this.academicService.getAcademicYears()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const items = Array.isArray((response as any).data) ? (response as any).data : response;
          this.academicYears = Array.isArray(items) ? items : [];
          this.yearOptions = [
            { id: '', name: 'Todos los anios' },
            ...this.academicYears.map((year: any) => ({ id: year.id, name: String(year.year) }))
          ];

          const activeYear = this.academicYears.find((year: any) => year.is_active);
          this.selectedAcademicYearId = activeYear?.id || '';
          this.loadStudentsWithCharges();
        }
      });
  }

  onSearch(): void {
    const query = this.searchForm.get('q')?.value;
    if (!query) {
      return;
    }

    this.financeService.searchStudents(query, {
      only_with_charges: true,
      academic_year_id: this.selectedAcademicYearId || undefined,
      include_voided: false,
      per_page: 20
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.students = this.financeService.unwrapItems(response);
        },
        error: () => {
          this.students = [];
          Swal.fire('Error', 'No se pudo buscar estudiantes.', 'error');
        }
      });
  }

  selectStudent(student: any): void {
    this.selectedStudent = student;
    this.students = [];
    this.activeTab = 'charges';
    this.searchForm.patchValue({ q: `${student.last_name}, ${student.first_name}` }, { emitEvent: false });
    this.loadAccount();
  }

  onAcademicYearChange(academicYearId: string): void {
    this.selectedAcademicYearId = academicYearId;
    this.students = [];
    this.loadStudentsWithCharges();

    if (this.selectedStudent) {
      this.loadAccount();
    }
  }

  clearSelection(): void {
    this.selectedStudent = null;
    this.charges = [];
    this.payments = [];
    this.accountSummary = {
      netTotal: 0,
      outstanding: 0,
      paid: 0,
      overdueCount: 0
    };
    this.searchForm.patchValue({ q: '' }, { emitEvent: false });
  }

  loadStudentsWithCharges(): void {
    this.loadingStudentDirectory = true;

    this.financeService.searchStudents('', {
      only_with_charges: true,
      academic_year_id: this.selectedAcademicYearId || undefined,
      include_voided: false,
      per_page: 100
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chargedStudents = this.financeService.unwrapItems(response);
          this.loadingStudentDirectory = false;
        },
        error: () => {
          this.chargedStudents = [];
          this.loadingStudentDirectory = false;
          Swal.fire('Error', 'No se pudo cargar la lista de alumnos con cargos.', 'error');
        }
      });
  }

  loadAccount(): void {
    if (!this.selectedStudent) {
      return;
    }

    this.loading = true;

    const chargeFilters = {
      student_id: this.selectedStudent.id,
      ...(this.selectedAcademicYearId ? { academic_year_id: this.selectedAcademicYearId } : {}),
      include_voided: true,
      per_page: 500
    };

    const paymentFilters = {
      student_id: this.selectedStudent.id,
      include_voided: true,
      per_page: 500
    };

    forkJoin({
      charges: this.financeService.getCharges(chargeFilters),
      payments: this.financeService.getPayments(paymentFilters)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ charges, payments }) => {
          this.charges = this.financeService.unwrapItems(charges);
          this.payments = this.filterPaymentsByAcademicYear(this.financeService.unwrapItems(payments));
          this.calculateSummary();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          Swal.fire('Error', 'No se pudo cargar la cuenta corriente del alumno.', 'error');
        }
      });
  }

  calculateSummary(): void {
    this.accountSummary = this.charges.reduce((summary, charge) => {
      if (charge.status === 'anulado') {
        return summary;
      }

      const net = this.getNetAmount(charge);
      const paid = Number(charge.paid_amount || 0);
      const outstanding = this.getOutstandingAmount(charge);
      const isOverdue = charge.status === 'vencido'
        || (!!charge.due_date && new Date(charge.due_date) < new Date() && outstanding > 0);

      summary.netTotal += net;
      summary.paid += paid;
      summary.outstanding += outstanding;
      if (isOverdue) {
        summary.overdueCount += 1;
      }

      return summary;
    }, {
      netTotal: 0,
      outstanding: 0,
      paid: 0,
      overdueCount: 0
    });
  }

  getNetAmount(charge: Charge): number {
    return Math.max(0, Number(charge.amount || 0) - Number(charge.discount_amount || 0));
  }

  getOutstandingAmount(charge: Charge): number {
    if (charge.status === 'anulado') {
      return 0;
    }

    return Math.max(0, this.getNetAmount(charge) - Number(charge.paid_amount || 0));
  }

  getAccountStatus(): string {
    if (!this.selectedStudent) {
      return '-';
    }
    if (this.accountSummary.overdueCount > 0) {
      return 'Con vencimientos';
    }
    if (this.accountSummary.outstanding > 0) {
      return 'Pendiente';
    }
    if (this.charges.length > 0) {
      return 'Al dia';
    }
    return 'Sin cargos';
  }

  getMethodLabel(method: string): string {
    const normalized = String(method || '').toLowerCase();
    if (normalized.includes('efectivo')) return 'Efectivo';
    if (normalized.includes('tarjeta')) return 'Tarjeta';
    if (normalized.includes('transfer')) return 'Transferencia';
    if (normalized.includes('yape')) return 'Yape';
    if (normalized.includes('plin')) return 'Plin';
    return method || 'Otro';
  }

  getSelectedYearLabel(): string {
    if (!this.selectedAcademicYearId) {
      return 'Todos los anios';
    }
    return this.yearOptions.find((year) => year.id === this.selectedAcademicYearId)?.name || 'Anio no encontrado';
  }

  getStudentSectionLabel(student: any): string {
    const grade = student?.section?.grade_level?.name || 'Sin grado';
    const section = student?.section?.section_letter || '';

    return `${grade} ${section}`.trim();
  }

  registerChargePayment(charge: Charge): void {
    if (!this.selectedStudent) {
      return;
    }

    const remaining = this.getOutstandingAmount(charge);
    if (remaining <= 0) {
      Swal.fire('Sin saldo', 'Este cargo ya se encuentra cancelado.', 'info');
      return;
    }

    Swal.fire({
      title: 'Registrar pago',
      html: `
        <div class="space-y-4 pt-4 text-left">
          <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1">
            <div class="text-sm font-semibold text-slate-800">${charge.concept?.name || charge.notes || 'Cargo'}</div>
            <div class="text-xs text-slate-500">Saldo pendiente: S/ ${remaining.toFixed(2)}</div>
          </div>
          <input id="swal-payment-amount" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Monto a cobrar">
          <select id="swal-payment-method" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
          </select>
          <input id="swal-payment-reference" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Referencia / operacion (opcional)">
          <input id="swal-payment-notes" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Observacion (opcional)">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar pago',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const amount = Number((document.getElementById('swal-payment-amount') as HTMLInputElement)?.value);
        const method = (document.getElementById('swal-payment-method') as HTMLSelectElement)?.value;
        const reference = (document.getElementById('swal-payment-reference') as HTMLInputElement)?.value || '';
        const notes = (document.getElementById('swal-payment-notes') as HTMLInputElement)?.value || '';

        if (!amount || amount <= 0) {
          Swal.showValidationMessage('Ingresa un monto valido.');
          return false;
        }

        if (amount > remaining) {
          Swal.showValidationMessage(`El monto no puede superar el saldo pendiente de S/ ${remaining.toFixed(2)}.`);
          return false;
        }

        return { amount, method, reference, notes };
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.financeService.createPayment({
        charge_id: charge.id,
        amount: result.value.amount,
        method: result.value.method,
        reference: result.value.reference || null,
        notes: result.value.notes || null,
        paid_at: new Date().toISOString()
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (payment) => {
            this.activeTab = 'payments';
            this.loadAccount();

            if (payment.receipt) {
              Swal.fire({
                title: 'Pago registrado',
                html: `Pago registrado correctamente.<br><br><strong>Recibo:</strong> ${payment.receipt.number || 'Generado'}`,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Imprimir recibo',
                cancelButtonText: 'Cerrar'
              }).then((printResult) => {
                if (printResult.isConfirmed) {
                  this.printReceipt(payment);
                }
              });
              return;
            }

            Swal.fire('Pago registrado', 'El pago fue registrado correctamente.', 'success');
          },
          error: (error) => {
            Swal.fire('Error', error?.error?.message || 'No se pudo registrar el pago.', 'error');
          }
        });
    });
  }

  voidCharge(charge: Charge): void {
    if (charge.status === 'anulado') {
      return;
    }

    Swal.fire({
      title: 'Anular cargo',
      input: 'text',
      inputLabel: 'Motivo de anulacion',
      inputPlaceholder: 'Describe por que se anula el cargo',
      inputAttributes: { maxlength: '2000' },
      showCancelButton: true,
      confirmButtonText: 'Anular cargo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      inputValidator: (value) => {
        if (!String(value || '').trim()) {
          return 'Debes indicar un motivo.';
        }
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.financeService.voidCharge(charge.id, String(result.value).trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadAccount();
            Swal.fire('Cargo anulado', 'El cargo fue anulado con trazabilidad.', 'success');
          },
          error: (error) => {
            Swal.fire('Error', error?.error?.message || 'No se pudo anular el cargo.', 'error');
          }
        });
    });
  }

  voidPayment(payment: Payment): void {
    if (payment.voided_at) {
      return;
    }

    Swal.fire({
      title: 'Anular pago',
      input: 'text',
      inputLabel: 'Motivo de anulacion',
      inputPlaceholder: 'Describe por que se anula el pago',
      inputAttributes: { maxlength: '2000' },
      showCancelButton: true,
      confirmButtonText: 'Anular pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      inputValidator: (value) => {
        if (!String(value || '').trim()) {
          return 'Debes indicar un motivo.';
        }
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.financeService.voidPayment(payment.id, String(result.value).trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadAccount();
            Swal.fire('Pago anulado', 'El pago fue anulado con trazabilidad.', 'success');
          },
          error: (error) => {
            Swal.fire('Error', error?.error?.message || 'No se pudo anular el pago.', 'error');
          }
        });
    });
  }

  printReceipt(payment: Payment): void {
    if (!payment.receipt) {
      Swal.fire('Sin recibo', 'Este pago todavia no tiene un recibo asociado.', 'info');
      return;
    }

    const studentName = this.selectedStudent
      ? `${this.selectedStudent.first_name || ''} ${this.selectedStudent.last_name || ''}`.trim()
      : this.getPaymentStudentName(payment);
    const conceptName = payment.charge?.concept?.name || payment.charge?.notes || payment.notes || 'Pago';
    const receiptNumber = payment.receipt.number || 'Sin numero';
    const paidAt = payment.paid_at ? new Date(payment.paid_at).toLocaleString() : '-';
    const issuedAt = payment.receipt.issued_at ? new Date(payment.receipt.issued_at).toLocaleString() : paidAt;
    const popup = window.open('', '_blank', 'width=900,height=700');

    if (!popup) {
      Swal.fire('Bloqueado', 'El navegador bloqueo la ventana de impresion.', 'warning');
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Recibo ${receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            .receipt { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
            .muted { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
            .title { font-size: 28px; font-weight: 700; margin: 8px 0; color: #1e3a8a; }
            .number { font-size: 18px; font-weight: 700; color: #b91c1c; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 24px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #f8fafc; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .14em; margin-bottom: 8px; }
            .value { font-size: 15px; font-weight: 600; }
            .amount { font-size: 32px; font-weight: 800; color: #047857; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div>
                <div class="muted">Sistema educativo</div>
                <div class="title">Recibo de pago</div>
                <div class="muted">Comprobante generado desde cuenta corriente</div>
              </div>
              <div style="text-align:right">
                <div class="muted">Numero de recibo</div>
                <div class="number">${receiptNumber}</div>
              </div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="label">Alumno</div>
                <div class="value">${studentName || 'No identificado'}</div>
              </div>
              <div class="card">
                <div class="label">Metodo de pago</div>
                <div class="value">${this.getMethodLabel(payment.method)}</div>
              </div>
              <div class="card">
                <div class="label">Concepto</div>
                <div class="value">${conceptName}</div>
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

            <div class="card" style="text-align:center; background:#ecfdf5; border-color:#a7f3d0;">
              <div class="label">Monto pagado</div>
              <div class="amount">S/ ${Number(payment.amount || 0).toFixed(2)}</div>
            </div>

            <div class="footer">
              Observacion: ${payment.notes || payment.charge?.notes || 'Sin observacion adicional.'}
            </div>
          </div>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  getStatusBadge(status: string): string {
    const maps: Record<string, string> = {
      pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
      pagado_parcial: 'bg-blue-100 text-blue-700 border-blue-200',
      pagado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      vencido: 'bg-red-100 text-red-700 border-red-200',
      anulado: 'bg-slate-100 text-slate-600 border-slate-200'
    };

    return maps[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  }

  getPaymentStatusBadge(payment: Payment): string {
    return payment.voided_at
      ? 'bg-slate-100 text-slate-600 border-slate-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }

  private filterPaymentsByAcademicYear(payments: Payment[]): Payment[] {
    const filtered = this.selectedAcademicYearId
      ? payments.filter((payment) => !payment.charge?.academic_year_id || payment.charge.academic_year_id === this.selectedAcademicYearId)
      : payments;

    return filtered.sort((left, right) => new Date(right.paid_at).getTime() - new Date(left.paid_at).getTime());
  }

  private getPaymentStudentName(payment: Payment): string {
    const student = payment.student || payment.charge?.student;
    if (!student) {
      return '';
    }

    return `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.name || '';
  }
}
