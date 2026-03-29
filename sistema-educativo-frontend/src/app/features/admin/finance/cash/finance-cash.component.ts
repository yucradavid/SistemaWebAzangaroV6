//src/app/features/admin/finance/cash/finance-cash.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { Charge, FinanceService, Payment } from '@core/services/finance.service';

@Component({
  selector: 'app-finance-cash',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Caja Diaria</h1>
          <p class="text-slate-500 text-sm mt-1 font-medium">Movimientos reales del dia y cierre de caja</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            (click)="handleOpeningBalance()"
            [disabled]="!activeClosure || loading"
            class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50">
            Ajustar saldo inicial
          </button>
          <button
            (click)="handleMovement()"
            [disabled]="!activeClosure || loading"
            class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50">
            Movimiento libre
          </button>
          <button
            (click)="handleCloseCash()"
            [disabled]="!activeClosure || loading"
            class="px-5 py-2.5 bg-gradient-to-r from-blue-900 to-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            Cerrar caja
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="py-20 text-center">
        <div class="w-10 h-10 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-500 font-medium">Cargando movimientos de caja...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div *ngIf="todayClosure" class="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-blue-900">La caja del dia ya fue cerrada</h3>
            <p class="text-xs text-blue-700">
              Cierre registrado con saldo esperado de S/ {{ todayClosure.expected_balance | number:'1.2-2' }}
              y saldo real de S/ {{ todayClosure.actual_balance | number:'1.2-2' }}.
            </p>
            <p class="text-xs text-blue-700">
              Diferencia: S/ {{ todayClosure.difference | number:'1.2-2' }} | Pagos procesados: {{ todayClosure.payments_count || 0 }}
            </p>
          </div>
          <button (click)="goToClosures()" class="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold uppercase">
            Ver cierres
          </button>
        </div>

        <div *ngIf="activeClosure" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-emerald-900">Caja operativa</h3>
            <p class="text-xs text-emerald-700">
              Saldo inicial actual: S/ {{ activeClosure.opening_balance || 0 | number:'1.2-2' }}
            </p>
            <p *ngIf="lastClosure" class="text-xs text-emerald-700">
              Base heredada del ultimo cierre: {{ lastClosure.closure_date | date:'dd/MM/yyyy' }} con saldo real de S/ {{ lastClosure.actual_balance | number:'1.2-2' }}
            </p>
          </div>
          <button (click)="handleOpeningBalance()" class="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase">
            Editar saldo
          </button>
        </div>

        <div *ngIf="!activeClosure && !todayClosure" class="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-amber-900">No hay caja operativa</h3>
            <p class="text-xs text-amber-700">No se detecto cierre previo ni estado operativo para hoy.</p>
          </div>
          <button (click)="goToClosures()" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold uppercase">
            Ir a cierres
          </button>
        </div>

        <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div class="flex flex-col md:flex-row gap-4 items-end">
            <div class="flex-1">
              <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Buscar alumno</label>
              <input
                [(ngModel)]="searchTerm"
                (keyup.enter)="searchStudent()"
                type="text"
                placeholder="Nombre, codigo o DNI"
                class="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
            </div>
            <button (click)="searchStudent()" class="px-6 py-3 bg-blue-900 text-white rounded-xl text-sm font-semibold">
              Buscar
            </button>
          </div>

          <div *ngIf="students.length > 0" class="border border-slate-100 rounded-xl overflow-hidden">
            <button
              *ngFor="let student of students"
              (click)="selectStudent(student)"
              class="w-full px-4 py-3 text-left border-b border-slate-50 last:border-b-0 hover:bg-slate-50">
              <div class="text-sm font-semibold text-slate-800">{{ student.first_name }} {{ student.last_name }}</div>
              <div class="text-[11px] text-slate-400">
                DNI: {{ student.dni }} | Codigo: {{ student.student_code }} |
                {{ student.section?.grade_level?.name || 'Sin grado' }} {{ student.section?.section_letter || '' }}
              </div>
            </button>
          </div>
        </div>

        <div *ngIf="selectedStudent" class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div class="space-y-1">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Alumno seleccionado</p>
              <h2 class="text-2xl font-semibold text-slate-900">
                {{ selectedStudent.first_name }} {{ selectedStudent.last_name }}
              </h2>
              <p class="text-sm text-slate-500">
                DNI: {{ selectedStudent.dni || '-' }} | Codigo: {{ selectedStudent.student_code || '-' }}
              </p>
              <p class="text-sm text-slate-500">
                {{ selectedStudent.section?.grade_level?.name || 'Sin grado' }}
                {{ selectedStudent.section?.section_letter || '' }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                (click)="loadStudentCharges()"
                [disabled]="loadingStudentCharges"
                class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50">
                Actualizar estado
              </button>
              <button
                (click)="clearSelectedStudent()"
                class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                Limpiar alumno
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Total neto emitido</p>
              <h3 class="text-2xl font-bold text-slate-900">S/ {{ studentSummary.netTotal | number:'1.2-2' }}</h3>
            </div>
            <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p class="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-2">Total pagado</p>
              <h3 class="text-2xl font-bold text-emerald-700">S/ {{ studentSummary.paid | number:'1.2-2' }}</h3>
            </div>
            <div class="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p class="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mb-2">Saldo pendiente</p>
              <h3 class="text-2xl font-bold text-amber-700">S/ {{ studentSummary.pending | number:'1.2-2' }}</h3>
            </div>
            <div class="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p class="text-[10px] font-semibold text-red-600 uppercase tracking-widest mb-2">Cargos vencidos</p>
              <h3 class="text-2xl font-bold text-red-700">{{ studentSummary.overdueCount }}</h3>
            </div>
          </div>

          <div *ngIf="loadingStudentCharges" class="py-12 text-center">
            <div class="w-8 h-8 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-sm text-slate-500 font-medium">Cargando cuenta corriente...</p>
          </div>

          <div *ngIf="!loadingStudentCharges && studentCharges.length === 0" class="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-medium">
            El alumno no tiene cargos registrados.
          </div>

          <div *ngIf="!loadingStudentCharges && studentCharges.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                  <th class="py-4 px-4 text-left">Concepto</th>
                  <th class="py-4 px-4 text-left">Vencimiento</th>
                  <th class="py-4 px-4 text-right">Monto neto</th>
                  <th class="py-4 px-4 text-right">Pagado</th>
                  <th class="py-4 px-4 text-right">Saldo</th>
                  <th class="py-4 px-4 text-center">Estado</th>
                  <th class="py-4 px-4 text-right">Accion</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let charge of studentCharges" class="hover:bg-slate-50/50">
                  <td class="py-4 px-4">
                    <div class="text-sm font-semibold text-slate-800">
                      {{ charge.concept?.name || charge.notes || 'Cargo directo' }}
                    </div>
                    <div class="text-[11px] text-slate-400">{{ charge.notes || 'Sin referencia adicional' }}</div>
                  </td>
                  <td class="py-4 px-4 text-sm text-slate-500">
                    {{ charge.due_date ? (charge.due_date | date:'dd/MM/yyyy') : '-' }}
                  </td>
                  <td class="py-4 px-4 text-right text-sm font-bold text-slate-900">
                    S/ {{ getNetAmount(charge) | number:'1.2-2' }}
                  </td>
                  <td class="py-4 px-4 text-right text-sm font-semibold text-emerald-700">
                    S/ {{ (charge.paid_amount || 0) | number:'1.2-2' }}
                  </td>
                  <td class="py-4 px-4 text-right text-sm font-bold"
                    [class.text-red-600]="getOutstandingAmount(charge) > 0"
                    [class.text-slate-900]="getOutstandingAmount(charge) === 0">
                    S/ {{ getOutstandingAmount(charge) | number:'1.2-2' }}
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span [class]="'px-3 py-1 rounded-full text-[10px] font-bold border ' + getStatusBadge(charge.status)">
                      {{ charge.status | uppercase }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-right">
                    <button
                      (click)="registerChargePayment(charge)"
                      [disabled]="!activeClosure || getOutstandingAmount(charge) <= 0"
                      class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                      [class.bg-blue-900]="getOutstandingAmount(charge) > 0 && activeClosure"
                      [class.text-white]="getOutstandingAmount(charge) > 0 && activeClosure"
                      [class.bg-slate-100]="getOutstandingAmount(charge) <= 0 || !activeClosure"
                      [class.text-slate-500]="getOutstandingAmount(charge) <= 0 || !activeClosure">
                      Cobrar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div *ngFor="let stat of cashStats" class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{{ stat.label }}</p>
            <h3 class="text-2xl font-bold text-slate-900">S/ {{ stat.value | number:'1.2-2' }}</h3>
          </div>
        </div>

        <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div class="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-800">Movimientos del dia</h2>
            <span class="text-xs font-bold uppercase tracking-widest"
              [class.text-green-600]="activeClosure"
              [class.text-red-600]="!activeClosure">
              {{ activeClosure ? 'Caja abierta' : 'Caja cerrada' }}
            </span>
          </div>

          <div *ngIf="movements.length === 0" class="py-16 text-center text-slate-400 text-sm">
            No hay movimientos registrados hoy.
          </div>

          <div *ngIf="movements.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                  <th class="py-4 px-6 text-left">Hora</th>
                  <th class="py-4 px-6 text-left">Concepto</th>
                  <th class="py-4 px-6 text-center">Metodo</th>
                  <th class="py-4 px-6 text-center">Tipo</th>
                  <th class="py-4 px-6 text-right">Monto</th>
                  <th class="py-4 px-6 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let movement of movements" class="hover:bg-slate-50/50">
                  <td class="py-4 px-6 text-sm text-slate-500">{{ movement.paid_at | date:'shortTime' }}</td>
                  <td class="py-4 px-6">
                    <div class="text-sm font-semibold text-slate-800">
                      {{ movement.notes || movement.charge?.notes || movement.charge?.concept?.name || 'Movimiento libre' }}
                    </div>
                    <div class="text-[11px] text-slate-400">
                      {{ movement.student?.first_name ? (movement.student?.first_name + ' ' + movement.student?.last_name) : 'Caja general' }}
                    </div>
                  </td>
                  <td class="py-4 px-6 text-center text-xs font-semibold uppercase text-slate-500">{{ movement.method }}</td>
                  <td class="py-4 px-6 text-center">
                    <span
                      class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                      [class.bg-red-50]="isEgreso(movement)"
                      [class.text-red-600]="isEgreso(movement)"
                      [class.bg-green-50]="!isEgreso(movement)"
                      [class.text-green-600]="!isEgreso(movement)">
                      {{ isEgreso(movement) ? 'Egreso' : 'Ingreso' }}
                    </span>
                  </td>
                  <td class="py-4 px-6 text-right text-sm font-bold"
                    [class.text-red-600]="isEgreso(movement)"
                    [class.text-green-600]="!isEgreso(movement)">
                    {{ isEgreso(movement) ? '-' : '+' }} S/ {{ movement.amount | number:'1.2-2' }}
                  </td>
                  <td class="py-4 px-6 text-right">
                    <button (click)="viewMovement(movement)" class="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold">
                      Ver
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class FinanceCashComponent implements OnInit {
  cashStats = [
    { label: 'Saldo Inicial', value: 0 },
    { label: 'Ingresos Totales', value: 0 },
    { label: 'Egresos Totales', value: 0 },
    { label: 'Efectivo en Caja', value: 0 },
  ];

  movements: Payment[] = [];
  loading = true;
  activeClosure: { id: string; opening_balance?: number } | null = null;
  todayClosure: any | null = null;
  lastClosure: any | null = null;
  searchTerm = '';
  searching = false;
  students: any[] = [];
  selectedStudent: any | null = null;
  studentCharges: Charge[] = [];
  loadingStudentCharges = false;
  studentSummary = {
    netTotal: 0,
    paid: 0,
    pending: 0,
    overdueCount: 0,
  };

  constructor(
    private financeService: FinanceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const today = this.getTodayString();

    this.financeService.getClosures({ per_page: 200 }).subscribe({
      next: (response) => {
        const closures = this.financeService.unwrapItems(response as any) as any[];
        const orderedClosures = [...closures].sort((left: any, right: any) =>
          new Date(right.closure_date).getTime() - new Date(left.closure_date).getTime()
        );

        this.todayClosure = orderedClosures.find((closure: any) =>
          String(closure.closure_date || '').startsWith(today)
        ) || null;
        this.lastClosure = orderedClosures.find((closure: any) =>
          String(closure.closure_date || '').slice(0, 10) < today
        ) || null;

        this.activeClosure = this.todayClosure
          ? null
          : {
              id: 'open-box',
              opening_balance: Number(this.lastClosure?.actual_balance || 0)
            };

        this.loadMovements();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el estado de caja.', 'error');
      }
    });
  }

  loadMovements() {
    const today = this.getTodayString();

    this.financeService.getPayments({ per_page: 1000, date_from: today, date_to: today }).subscribe({
      next: (response) => {
        const payments = this.financeService.unwrapItems(response);
        this.movements = payments.filter((payment: Payment) =>
          String(payment.paid_at || '').startsWith(today)
        );
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los movimientos del dia.', 'error');
      }
    });
  }

  calculateStats() {
    const incomes = this.movements
      .filter((movement) => !this.isEgreso(movement))
      .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const expenses = this.movements
      .filter((movement) => this.isEgreso(movement))
      .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const initial = Number(this.todayClosure?.opening_balance ?? this.activeClosure?.opening_balance ?? 0);
    const finalCash = this.todayClosure
      ? Number(this.todayClosure.actual_balance || 0)
      : initial + incomes - expenses;

    this.cashStats[0].value = initial;
    this.cashStats[1].value = incomes;
    this.cashStats[2].value = expenses;
    this.cashStats[3].value = finalCash;
  }

  isEgreso(movement: Payment): boolean {
    return (movement.notes || '').includes('(EGRESO)');
  }

  searchStudent() {
    if (!this.searchTerm.trim()) {
      this.students = [];
      return;
    }

    this.searching = true;
    this.financeService.searchStudents(this.searchTerm).subscribe({
      next: (response) => {
        this.students = this.financeService.unwrapItems(response);
        this.searching = false;
      },
      error: () => {
        this.searching = false;
      }
    });
  }

  selectStudent(student: any) {
    this.selectedStudent = student;
    this.searchTerm = `${student.first_name} ${student.last_name}`.trim();
    this.students = [];
    this.loadStudentCharges();
  }

  clearSelectedStudent() {
    this.selectedStudent = null;
    this.studentCharges = [];
    this.studentSummary = {
      netTotal: 0,
      paid: 0,
      pending: 0,
      overdueCount: 0,
    };
  }

  loadStudentCharges() {
    if (!this.selectedStudent) {
      return;
    }

    this.loadingStudentCharges = true;
    this.financeService.getCharges({
      student_id: this.selectedStudent.id,
      per_page: 500
    }).subscribe({
      next: (response) => {
        this.studentCharges = this.financeService.unwrapItems(response);
        this.calculateStudentSummary();
        this.loadingStudentCharges = false;
      },
      error: () => {
        this.loadingStudentCharges = false;
        Swal.fire('Error', 'No se pudo cargar la cuenta corriente del alumno.', 'error');
      }
    });
  }

  registerChargePayment(charge: Charge) {
    if (!this.activeClosure) {
      Swal.fire('Caja cerrada', 'Debes tener la caja operativa para registrar pagos.', 'warning');
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
      }).subscribe({
        next: (payment) => {
          this.movements = [payment, ...this.movements];
          this.calculateStats();
          this.loadStudentCharges();

          const receiptLabel = payment.receipt?.number
            ? `Recibo generado: ${payment.receipt.number}`
            : 'El pago fue registrado correctamente.';

          Swal.fire('Pago registrado', receiptLabel, 'success');
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo registrar el pago.', 'error');
        }
      });
    });
  }

  handleMovement() {
    if (!this.activeClosure) {
      Swal.fire('Caja cerrada', 'Debes abrir operaciones desde cierres.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Nuevo movimiento libre',
      html: `
        <div class="space-y-4 pt-4 text-left">
          <select id="swal-type" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
            <option value="ingreso">Ingreso de efectivo</option>
            <option value="egreso">Retiro / egreso</option>
          </select>
          <input id="swal-amount" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Monto">
          <input id="swal-desc" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Descripcion">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      preConfirm: () => {
        const type = (document.getElementById('swal-type') as HTMLSelectElement)?.value;
        const amount = Number((document.getElementById('swal-amount') as HTMLInputElement)?.value);
        const description = (document.getElementById('swal-desc') as HTMLInputElement)?.value || '';

        if (!amount || amount <= 0) {
          Swal.showValidationMessage('El monto debe ser mayor a cero.');
          return false;
        }

        if (!description.trim()) {
          Swal.showValidationMessage('La descripcion es obligatoria.');
          return false;
        }

        return { type, amount, description };
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.saveFreeMovement({
        amount: result.value.amount,
        method: 'efectivo',
        paid_at: new Date().toISOString(),
        notes: `${result.value.description}${result.value.type === 'egreso' ? ' (EGRESO)' : ''}`
      }, result.value.type);
    });
  }

  saveFreeMovement(payload: Partial<Payment>, type: string) {
    this.financeService.createPayment(payload).subscribe({
      next: (payment) => {
        this.movements = [payment, ...this.movements];
        this.calculateStats();
        Swal.fire('Registrado', `El ${type} fue registrado correctamente.`, 'success');
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo registrar el movimiento.', 'error');
      }
    });
  }

  handleCloseCash() {
    if (!this.activeClosure) {
      return;
    }

    Swal.fire({
      title: 'Cerrar caja',
      html: `
        <div class="space-y-4 pt-4 text-left">
          <input id="swal-actual-balance" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Efectivo contado">
          <input id="swal-close-notes" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Observaciones (opcional)">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Cerrar',
      preConfirm: () => {
        const actualBalance = Number((document.getElementById('swal-actual-balance') as HTMLInputElement)?.value);
        const notes = (document.getElementById('swal-close-notes') as HTMLInputElement)?.value || '';

        if (!actualBalance && actualBalance !== 0) {
          Swal.showValidationMessage('Debes ingresar el efectivo contado.');
          return false;
        }

        return { actualBalance, notes };
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const totals = this.getMovementTotals();
      const openingBalance = Number(this.activeClosure?.opening_balance || 0);
      this.financeService.createClosure({
        closure_date: this.getTodayString(),
        opening_balance: openingBalance,
        cash_received: totals.cash,
        actual_balance: result.value.actualBalance,
        total_cash: totals.cash,
        total_cards: totals.cards,
        total_transfers: totals.transfers,
        total_yape: totals.yape,
        total_plin: totals.plin,
        payments_count: this.movements.length,
        notes: result.value.notes || null
      }).subscribe({
        next: () => {
          Swal.fire('Caja cerrada', 'El cierre fue registrado correctamente.', 'success');
          this.loadData();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo cerrar la caja.', 'error');
        }
      });
    });
  }

  handleOpeningBalance() {
    if (!this.activeClosure) {
      return;
    }

    const currentClosure = this.activeClosure;

    Swal.fire({
      title: 'Saldo inicial del dia',
      input: 'number',
      inputValue: Number(currentClosure.opening_balance || 0).toFixed(2),
      inputAttributes: {
        step: '0.01',
        min: '0'
      },
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      inputValidator: (value) => {
        if (value === null || value === undefined || value === '') {
          return 'Debes ingresar el saldo inicial.';
        }

        if (Number(value) < 0) {
          return 'El saldo inicial no puede ser negativo.';
        }

        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.activeClosure = {
        id: currentClosure.id,
        opening_balance: Number(result.value || 0)
      };
      this.calculateStats();
      Swal.fire('Actualizado', 'El saldo inicial fue actualizado para el cierre de hoy.', 'success');
    });
  }

  viewMovement(movement: Payment) {
    Swal.fire({
      title: 'Detalle del movimiento',
      html: `
        <div class="text-left space-y-3">
          <div><strong>Concepto:</strong> ${movement.notes || movement.charge?.notes || movement.charge?.concept?.name || 'Movimiento libre'}</div>
          <div><strong>Metodo:</strong> ${movement.method || '-'}</div>
          <div><strong>Monto:</strong> S/ ${Number(movement.amount || 0).toFixed(2)}</div>
          <div><strong>Fecha:</strong> ${movement.paid_at ? new Date(movement.paid_at).toLocaleString() : '-'}</div>
          <div><strong>Alumno:</strong> ${movement.student?.first_name ? `${movement.student.first_name} ${movement.student.last_name}` : 'Caja general'}</div>
          <div><strong>Recibo:</strong> ${movement.receipt?.number || 'No generado'}</div>
        </div>
      `,
      confirmButtonText: 'Cerrar'
    });
  }

  goToClosures() {
    this.router.navigateByUrl('/app/finance/cash/closures');
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  getNetAmount(charge: Charge): number {
    return Math.max(0, Number(charge.amount || 0) - Number(charge.discount_amount || 0));
  }

  getOutstandingAmount(charge: Charge): number {
    return Math.max(0, this.getNetAmount(charge) - Number(charge.paid_amount || 0));
  }

  getStatusBadge(status: string): string {
    const maps: Record<string, string> = {
      pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
      pagado_parcial: 'bg-blue-100 text-blue-700 border-blue-200',
      pagado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      vencido: 'bg-red-100 text-red-700 border-red-200'
    };

    return maps[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  }

  private getMovementTotals() {
    return this.movements.reduce((totals, movement) => {
      const amount = Number(movement.amount || 0);

      if (this.isEgreso(movement)) {
        totals.cash -= amount;
        return totals;
      }

      switch ((movement.method || '').toLowerCase()) {
        case 'tarjeta':
          totals.cards += amount;
          break;
        case 'transferencia':
          totals.transfers += amount;
          break;
        case 'yape':
          totals.yape += amount;
          break;
        case 'plin':
          totals.plin += amount;
          break;
        default:
          totals.cash += amount;
          break;
      }

      return totals;
    }, {
      cash: 0,
      cards: 0,
      transfers: 0,
      yape: 0,
      plin: 0,
    });
  }

  private calculateStudentSummary() {
    this.studentSummary = this.studentCharges.reduce((summary, charge) => {
      const net = this.getNetAmount(charge);
      const outstanding = this.getOutstandingAmount(charge);
      const isOverdue = outstanding > 0 && (
        charge.status === 'vencido'
        || (!!charge.due_date && new Date(charge.due_date) < new Date())
      );

      summary.netTotal += net;
      summary.paid += Number(charge.paid_amount || 0);
      summary.pending += outstanding;
      if (isOverdue) {
        summary.overdueCount += 1;
      }

      return summary;
    }, {
      netTotal: 0,
      paid: 0,
      pending: 0,
      overdueCount: 0,
    });
  }
}
