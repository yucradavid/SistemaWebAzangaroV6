//src/app/features/admin/finance/cash/finance-closures.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AuthService } from '@core/services/auth.service';
import { CashClosure, FinanceService, Payment } from '@core/services/finance.service';

interface LiveCashClosure {
  opening_time: string;
  opening_balance: number;
  cash_received: number;
  total_cash: number;
  total_cards: number;
  total_transfers: number;
  total_yape: number;
  total_plin: number;
  total_amount: number;
  expected_balance: number;
  payments_count: number;
  cashier?: any;
}

@Component({
  selector: 'app-finance-closures',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './finance-closures.component.html',
  styleUrls: ['./finance-closures.component.css']
})
export class FinanceClosuresComponent implements OnInit {
  closures: CashClosure[] = [];
  activeClosure: LiveCashClosure | null = null;
  todayClosure: CashClosure | null = null;
  lastClosure: CashClosure | null = null;
  loading = true;
  currentUser: any = null;
  dateFromFilter = '';
  dateToFilter = '';
  statusFilter = '';
  cashierFilter = '';

  constructor(
    private financeService: FinanceService,
    private authService: AuthService
  ) {}

  get filteredClosures(): CashClosure[] {
    return this.closures.filter((closure) => {
      const closureDate = String(closure.closure_date || '').slice(0, 10);
      const cashierName = this.getCashierName(closure);
      const hasDifference = Number(closure.difference || 0) !== 0;

      const matchesFrom = !this.dateFromFilter || closureDate >= this.dateFromFilter;
      const matchesTo = !this.dateToFilter || closureDate <= this.dateToFilter;
      const matchesCashier = !this.cashierFilter || cashierName === this.cashierFilter;
      const matchesStatus = this.matchesStatusFilter(closure, hasDifference);

      return matchesFrom && matchesTo && matchesCashier && matchesStatus;
    });
  }

  get cashierOptions(): string[] {
    return [...new Set(
      this.closures
        .map((closure) => this.getCashierName(closure))
        .filter((name) => !!name && name !== 'Sin usuario')
    )];
  }

  get shortageClosures(): number {
    return this.filteredClosures.filter((closure) => Number(closure.difference || 0) < 0).length;
  }

  get surplusClosures(): number {
    return this.filteredClosures.filter((closure) => Number(closure.difference || 0) > 0).length;
  }

  get totalDifference(): number {
    return this.filteredClosures.reduce((sum, closure) => sum + Number(closure.difference || 0), 0);
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    const today = this.getTodayString();

    this.financeService.getClosures({ per_page: 200 }).subscribe({
      next: (response) => {
        const closures = this.financeService.unwrapItems(response);
        this.closures = [...closures].sort((left, right) =>
          new Date(right.closure_date).getTime() - new Date(left.closure_date).getTime()
        );

        this.todayClosure = this.closures.find((closure) =>
          String(closure.closure_date || '').startsWith(today)
        ) || null;

        this.lastClosure = this.closures.find((closure) =>
          String(closure.closure_date || '').slice(0, 10) < today
        ) || null;

        if (this.todayClosure) {
          this.activeClosure = null;
          this.loading = false;
          return;
        }

        this.buildLiveClosureForToday(today);
      },
      error: (err) => {
        console.error('Error loading closures', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el historial de cierres.', 'error');
      }
    });
  }

  buildLiveClosureForToday(todayDate: string) {
    this.financeService.getPayments({ per_page: 1000, date_from: todayDate, date_to: todayDate }).subscribe({
      next: (response) => {
        const payments = this.financeService.unwrapItems(response).filter((payment) => {
          return this.getPaymentDate(payment) === todayDate;
        });
        const totals = this.summarizePayments(payments);
        const openingBalance = Number(this.lastClosure?.actual_balance || 0);

        this.activeClosure = {
          opening_time: new Date().toISOString(),
          opening_balance: openingBalance,
          cash_received: totals.cash,
          total_cash: totals.cash,
          total_cards: totals.cards,
          total_transfers: totals.transfers,
          total_yape: totals.yape,
          total_plin: totals.plin,
          total_amount: totals.total,
          expected_balance: openingBalance + totals.cash,
          payments_count: payments.length,
          cashier: this.currentUser
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading payments', err);
        this.activeClosure = null;
        this.loading = false;
        Swal.fire('Error', 'No se pudo construir el resumen operativo del dia.', 'error');
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
        <div class="space-y-4 text-left pt-4">
          <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1">
            <div class="text-sm font-semibold text-slate-800">Saldo esperado: S/ ${this.activeClosure.expected_balance.toFixed(2)}</div>
            <div class="text-xs text-slate-500">Efectivo neto del dia: S/ ${this.activeClosure.cash_received.toFixed(2)}</div>
          </div>
          <input id="swal-actual-balance" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Efectivo contado">
          <input id="swal-notes" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Observaciones (opcional)">
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Registrar cierre',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      customClass: { confirmButton: 'rounded-xl shadow-lg', popup: 'rounded-2xl' },
      preConfirm: () => {
        const actualValue = (document.getElementById('swal-actual-balance') as HTMLInputElement)?.value;
        const notes = (document.getElementById('swal-notes') as HTMLInputElement)?.value || '';

        if (actualValue === undefined || actualValue === null || actualValue === '') {
          Swal.showValidationMessage('Debes ingresar el efectivo contado.');
          return false;
        }

        return {
          actual_balance: Number(actualValue),
          notes
        };
      }
    }).then((result) => {
      if (!result.isConfirmed || !result.value) {
        return;
      }

      this.financeService.createClosure({
        closure_date: this.getTodayString(),
        opening_balance: this.activeClosure?.opening_balance || 0,
        cash_received: Math.max(0, this.activeClosure?.cash_received || 0),
        actual_balance: result.value.actual_balance,
        total_cash: Math.max(0, this.activeClosure?.total_cash || 0),
        total_cards: this.activeClosure?.total_cards || 0,
        total_transfers: this.activeClosure?.total_transfers || 0,
        total_yape: this.activeClosure?.total_yape || 0,
        total_plin: this.activeClosure?.total_plin || 0,
        payments_count: this.activeClosure?.payments_count || 0,
        notes: result.value.notes || null
      }).subscribe({
        next: () => {
          Swal.fire('Caja cerrada', 'El cierre fue registrado correctamente.', 'success');
          this.loadData();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo registrar el cierre.', 'error');
        }
      });
    });
  }

  viewClosureDetails(closure: CashClosure) {
    const closureDate = String(closure.closure_date || '').slice(0, 10);

    Swal.fire({
      title: 'Cargando detalle...',
      text: 'Consultando movimientos del dia',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.financeService.getPayments({ per_page: 1000, date_from: closureDate, date_to: closureDate }).subscribe({
      next: (response) => {
        const payments = this.financeService.unwrapItems(response).filter((payment) => {
          return this.getPaymentDate(payment) === closureDate;
        });
        const movementsHtml = this.buildMovementsHtml(payments);

        Swal.fire({
          title: `Cierre del ${new Date(closure.closure_date).toLocaleDateString()}`,
          width: 920,
          html: `
            <div class="text-left space-y-4 p-4 bg-slate-50 rounded-xl mt-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex justify-between"><span>Saldo inicial:</span><b>S/ ${Number(closure.opening_balance || 0).toFixed(2)}</b></div>
                <div class="flex justify-between"><span>Efectivo neto:</span><b>S/ ${Number(closure.total_cash || 0).toFixed(2)}</b></div>
                <div class="flex justify-between"><span>Tarjetas:</span><b>S/ ${Number(closure.total_cards || 0).toFixed(2)}</b></div>
                <div class="flex justify-between"><span>Transferencias:</span><b>S/ ${Number(closure.total_transfers || 0).toFixed(2)}</b></div>
                <div class="flex justify-between"><span>Yape:</span><b>S/ ${Number(closure.total_yape || 0).toFixed(2)}</b></div>
                <div class="flex justify-between"><span>Plin:</span><b>S/ ${Number(closure.total_plin || 0).toFixed(2)}</b></div>
              </div>
              <hr class="my-2 border-slate-200">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="flex justify-between"><span>Esperado:</span><b>S/ ${Number(closure.expected_balance || 0).toFixed(2)}</b></div>
                <div class="flex justify-between"><span>Real:</span><b>S/ ${Number(closure.actual_balance || 0).toFixed(2)}</b></div>
                <div class="flex justify-between"><span>Diferencia:</span><b>S/ ${Number(closure.difference || 0).toFixed(2)}</b></div>
              </div>
              <div class="flex justify-between text-lg"><span>Total:</span><b class="text-blue-900">S/ ${Number(closure.total_amount || 0).toFixed(2)}</b></div>
              <div>
                <div class="mt-4 text-xs text-slate-400 font-medium uppercase tracking-widest mb-2">Observaciones</div>
                <p class="text-sm italic text-slate-500">${closure.notes || 'Ninguna'}</p>
              </div>
              <div>
                <div class="mt-4 text-xs text-slate-400 font-medium uppercase tracking-widest mb-2">Movimientos incluidos del dia</div>
                ${movementsHtml}
              </div>
            </div>
          `,
          confirmButtonText: 'Entendido'
        });
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar los movimientos del cierre.', 'error');
      }
    });
  }

  getDigitalTotal(closure: LiveCashClosure): number {
    return Number(closure.total_transfers || 0) + Number(closure.total_yape || 0) + Number(closure.total_plin || 0) + Number(closure.total_cards || 0);
  }

  resetFilters() {
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.statusFilter = '';
    this.cashierFilter = '';
  }

  private summarizePayments(payments: Payment[]) {
    return payments.reduce((totals, payment) => {
      const amount = Number(payment.amount || 0);

      if (this.isEgreso(payment)) {
        totals.cash -= amount;
        totals.total -= amount;
        return totals;
      }

      switch ((payment.method || '').toLowerCase()) {
        case 'tarjeta':
          totals.cards += amount;
          break;
        case 'transferencia':
        case 'pasarela':
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

      totals.total += amount;
      return totals;
    }, {
      cash: 0,
      cards: 0,
      transfers: 0,
      yape: 0,
      plin: 0,
      total: 0
    });
  }

  private isEgreso(payment: Payment): boolean {
    return String(payment.notes || '').includes('(EGRESO)');
  }

  private getPaymentDate(payment: Payment): string {
    const sourceDate = String(payment.paid_at || '');
    return sourceDate ? sourceDate.slice(0, 10) : '';
  }

  private getCashierName(closure: CashClosure): string {
    return closure.cashier?.full_name || closure.closed_by_user?.full_name || 'Sin usuario';
  }

  private matchesStatusFilter(closure: CashClosure, hasDifference: boolean): boolean {
    if (!this.statusFilter) {
      return true;
    }

    if (this.statusFilter === 'closed') {
      return !!closure.closing_time;
    }

    if (this.statusFilter === 'open') {
      return !closure.closing_time;
    }

    if (this.statusFilter === 'difference') {
      return hasDifference;
    }

    return true;
  }

  private buildMovementsHtml(payments: Payment[]): string {
    if (payments.length === 0) {
      return '<div class="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">No se encontraron movimientos para esa fecha.</div>';
    }

    const rows = payments.slice(0, 40).map((payment) => {
      const concept = payment.notes || payment.charge?.notes || payment.charge?.concept?.name || 'Movimiento libre';
      const student = payment.student?.first_name
        ? `${payment.student.first_name} ${payment.student.last_name}`
        : 'Caja general';
      const amount = Number(payment.amount || 0).toFixed(2);
      const sign = this.isEgreso(payment) ? '-' : '+';

      return `
        <tr>
          <td style="padding:8px 10px;font-size:12px;color:#475569;">${payment.paid_at ? new Date(payment.paid_at).toLocaleTimeString() : '-'}</td>
          <td style="padding:8px 10px;font-size:12px;color:#0f172a;font-weight:600;">${concept}</td>
          <td style="padding:8px 10px;font-size:12px;color:#64748b;">${student}</td>
          <td style="padding:8px 10px;font-size:12px;color:#64748b;text-transform:uppercase;">${payment.method || '-'}</td>
          <td style="padding:8px 10px;font-size:12px;font-weight:700;text-align:right;color:${this.isEgreso(payment) ? '#dc2626' : '#15803d'};">${sign} S/ ${amount}</td>
        </tr>
      `;
    }).join('');

    const hiddenCount = payments.length > 40 ? `<div style="margin-top:8px;font-size:11px;color:#94a3b8;">Se muestran 40 de ${payments.length} movimientos del dia.</div>` : '';

    return `
      <div style="border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#fff;">
        <table style="width:100%;border-collapse:collapse;">
          <thead style="background:#f8fafc;">
            <tr>
              <th style="padding:10px;text-align:left;font-size:10px;color:#94a3b8;text-transform:uppercase;">Hora</th>
              <th style="padding:10px;text-align:left;font-size:10px;color:#94a3b8;text-transform:uppercase;">Concepto</th>
              <th style="padding:10px;text-align:left;font-size:10px;color:#94a3b8;text-transform:uppercase;">Alumno</th>
              <th style="padding:10px;text-align:left;font-size:10px;color:#94a3b8;text-transform:uppercase;">Metodo</th>
              <th style="padding:10px;text-align:right;font-size:10px;color:#94a3b8;text-transform:uppercase;">Monto</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${hiddenCount}
    `;
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
