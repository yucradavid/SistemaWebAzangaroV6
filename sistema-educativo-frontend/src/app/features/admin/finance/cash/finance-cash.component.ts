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
  templateUrl: './finance-cash.component.html'
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
