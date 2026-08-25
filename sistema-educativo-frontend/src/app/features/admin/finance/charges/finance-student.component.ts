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
import { FinanceCashierService } from '@core/services/finance-cashier.service';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

@Component({
  selector: 'app-finance-student',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, ReactiveFormsModule, SettingFilterDropdownComponent],
  templateUrl: './finance-student.component.html'
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
    private academicService: AcademicService,
    private financeCashier: FinanceCashierService
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

    this.financeCashier.collectChargePayment(charge)
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
        error: () => {
          // El modal compartido ya muestra el error al usuario.
        }
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
