// src/app/core/services/finance-cashier.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { CashClosure, Charge, FinanceService, Payment } from './finance.service';

export interface DayPaymentTotals {
  cash: number;
  cards: number;
  transfers: number;
  yape: number;
  plin: number;
  total: number;
  count: number;
}

/**
 * Flujos de caja compartidos entre las 3 pestañas de Cuenta y Caja
 * (Cuenta Corriente, Caja Diaria, Cierres). Antes de este servicio, "Cobrar"
 * estaba reimplementado identico en finance-student y finance-cash, y
 * "Cerrar caja" reimplementado identico en finance-cash y finance-closures
 * (mismos endpoints, mismo modal, mismo payload, 2 copias de cada uno).
 */
@Injectable({
  providedIn: 'root'
})
export class FinanceCashierService {
  constructor(private financeService: FinanceService) {}

  getNetAmount(charge: Charge): number {
    return Math.max(0, Number(charge.amount || 0) - Number(charge.discount_amount || 0));
  }

  getOutstandingAmount(charge: Charge): number {
    if (charge.status === 'anulado') {
      return 0;
    }
    return Math.max(0, this.getNetAmount(charge) - Number(charge.paid_amount || 0));
  }

  isEgreso(payment: Payment): boolean {
    return String(payment.notes || '').includes('(EGRESO)');
  }

  summarizeDayPayments(payments: Payment[]): DayPaymentTotals {
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
    }, { cash: 0, cards: 0, transfers: 0, yape: 0, plin: 0, total: 0, count: payments.length });
  }

  /**
   * Abre el modal de "Registrar pago" y persiste vía createPayment.
   * Emite el pago creado y completa; completa sin emitir si el usuario cancela.
   */
  collectChargePayment(charge: Charge): Observable<Payment> {
    return new Observable<Payment>((subscriber) => {
      const remaining = this.getOutstandingAmount(charge);
      if (remaining <= 0) {
        Swal.fire('Sin saldo', 'Este cargo ya se encuentra cancelado.', 'info');
        subscriber.complete();
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
          subscriber.complete();
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
            subscriber.next(payment);
            subscriber.complete();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo registrar el pago.', 'error');
            subscriber.error(err);
          }
        });
      });
    });
  }

  /**
   * Abre el modal de "Cerrar caja" y persiste vía createClosure.
   * `context` trae los totales del dia ya calculados por el caller
   * (mismos campos que espera StoreCashClosureRequest en el backend).
   */
  closeCashRegister(context: {
    openingBalance: number;
    totals: DayPaymentTotals;
    paymentsCount: number;
  }): Observable<CashClosure> {
    return new Observable<CashClosure>((subscriber) => {
      Swal.fire({
        title: 'Cerrar caja',
        html: `
          <div class="space-y-4 pt-4 text-left">
            <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1">
              <div class="text-sm font-semibold text-slate-800">Saldo esperado: S/ ${(context.openingBalance + context.totals.cash).toFixed(2)}</div>
              <div class="text-xs text-slate-500">Efectivo neto del dia: S/ ${context.totals.cash.toFixed(2)}</div>
            </div>
            <input id="swal-actual-balance" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Efectivo contado">
            <input id="swal-close-notes" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Observaciones (opcional)">
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
          const notes = (document.getElementById('swal-close-notes') as HTMLInputElement)?.value || '';

          if (actualValue === undefined || actualValue === null || actualValue === '') {
            Swal.showValidationMessage('Debes ingresar el efectivo contado.');
            return false;
          }

          return { actualBalance: Number(actualValue), notes };
        }
      }).then((result) => {
        if (!result.isConfirmed) {
          subscriber.complete();
          return;
        }

        this.financeService.createClosure({
          closure_date: new Date().toISOString().split('T')[0],
          opening_balance: context.openingBalance,
          cash_received: Math.max(0, context.totals.cash),
          actual_balance: result.value.actualBalance,
          total_cash: Math.max(0, context.totals.cash),
          total_cards: context.totals.cards,
          total_transfers: context.totals.transfers,
          total_yape: context.totals.yape,
          total_plin: context.totals.plin,
          payments_count: context.paymentsCount,
          notes: result.value.notes || null
        }).subscribe({
          next: (closure) => {
            Swal.fire('Caja cerrada', 'El cierre fue registrado correctamente.', 'success');
            subscriber.next(closure);
            subscriber.complete();
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'No se pudo cerrar la caja.', 'error');
            subscriber.error(err);
          }
        });
      });
    });
  }
}
