//src/app/features/admin/admissions/pending-cash-collection/pending-cash-collection.component.ts
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import {
  EnrollmentService,
  PendingCashCollectionRow,
} from '@core/services/enrollment.service';

/**
 * Seguimiento de las matriculas aprobadas con pago AL CONTADO cuyo cargo
 * todavia no fue cobrado: secretaria las aprobo, pero nadie confirmo el pago
 * real en Finanzas.
 *
 * La lista se arma entera en el backend (pending-cash-collection): un alumno
 * desaparece solo cuando ya no le quedan cargos pendientes, sin necesidad de
 * marcarlo a mano en ningun lado.
 */
@Component({
  selector: 'app-pending-cash-collection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div *ngIf="errorMessage" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
        {{ errorMessage }}
      </div>

      <!-- Resumen -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200">
          <span class="text-amber-700 font-medium">Por cobrar</span>
          <span class="text-amber-900 font-bold">{{ rows.length }}</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200">
          <span class="text-emerald-700 font-medium">Monto total</span>
          <span class="text-emerald-900 font-bold">S/ {{ totalDue | number:'1.2-2' }}</span>
        </span>
        <button
          (click)="load()"
          class="ml-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95">
          Actualizar
        </button>
      </div>

      <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200">
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estudiante</th>
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apoderado</th>
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Aprobada</th>
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <tr *ngFor="let row of rows" class="hover:bg-slate-50/60 transition-colors align-middle">
                <td class="px-5 py-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-bold text-slate-900 capitalize">{{ row.student_name }}</span>
                    <span class="text-[11px] text-slate-500">
                      {{ row.student_code || 'Sin código' }}
                      <span *ngIf="row.grade_level"> · {{ row.grade_level }} {{ row.section }}</span>
                    </span>
                  </div>
                </td>

                <td class="px-5 py-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-semibold text-slate-800 capitalize">{{ row.guardian_name || 'Sin registrar' }}</span>
                    <span class="text-[11px] text-slate-500">{{ row.guardian_phone || 'Sin teléfono' }}</span>
                  </div>
                </td>

                <td class="px-5 py-4 text-center text-slate-600">
                  {{ row.approved_at ? (row.approved_at | date:'dd/MM/yyyy') : '—' }}
                </td>

                <td class="px-5 py-4 text-right whitespace-nowrap">
                  <div class="font-bold text-slate-900">S/ {{ row.total_due | number:'1.2-2' }}</div>
                  <div class="text-[10px] text-slate-400">
                    {{ row.charges_count }} {{ row.charges_count === 1 ? 'cargo' : 'cargos' }}
                    <span *ngIf="row.total_paid > 0"> · pagado S/ {{ row.total_paid | number:'1.2-2' }}</span>
                  </div>
                </td>

                <td class="px-5 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      (click)="notifyViaWhatsapp(row)"
                      [disabled]="!row.guardian_phone"
                      title="Avisar al apoderado por WhatsApp"
                      class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                      Avisar por WhatsApp
                    </button>
                    <button
                      (click)="goToCollect(row)"
                      class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs active:scale-95">
                      Ir a cobrar
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="!loading && rows.length === 0">
                <td colspan="5" class="px-5 py-16 text-center">
                  <p class="text-sm font-semibold text-slate-700">No hay matrículas al contado pendientes de cobro.</p>
                  <p class="text-xs text-slate-400 mt-1">
                    Aquí aparecen las matrículas aprobadas al contado hasta que se confirme su pago en Finanzas.
                  </p>
                </td>
              </tr>

              <tr *ngIf="loading">
                <td colspan="5" class="px-5 py-16 text-center text-xs text-slate-400">Cargando...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class PendingCashCollectionComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly router = inject(Router);

  /** Para que la pestaña que lo contiene pueda mostrar el contador. */
  @Output() countChange = new EventEmitter<number>();

  rows: PendingCashCollectionRow[] = [];
  totalDue = 0;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    // Sin academic_year_id: el backend usa el año académico activo.
    this.enrollmentService.getPendingCashCollection().subscribe({
      next: (response) => {
        this.rows = response.data || [];
        this.totalDue = response.total_due || 0;
        this.loading = false;
        this.countChange.emit(this.rows.length);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMessage = err?.error?.message
          || 'No se pudo cargar la lista de matrículas al contado pendientes de cobro.';
      }
    });
  }

  /**
   * Mismo patron manual que el envio de credenciales: solo abre wa.me con el
   * mensaje pre-armado y el admin presiona enviar. No hay API de pago ni envio
   * automatico.
   */
  notifyViaWhatsapp(row: PendingCashCollectionRow): void {
    const rawPhone = String(row.guardian_phone || '').replace(/\D/g, '');

    if (!rawPhone) {
      void Swal.fire({
        icon: 'warning',
        title: 'Sin número de WhatsApp',
        text: 'El apoderado no tiene un teléfono registrado.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const fullPhone = rawPhone.startsWith('51') ? rawPhone : '51' + rawPhone;
    const monto = row.total_due.toFixed(2);

    const lines = [
      `Hola ${row.guardian_name || 'apoderado(a)'},`,
      '',
      `La matrícula de ${row.student_name} en CERMAT ya fue aprobada bajo la modalidad de PAGO AL CONTADO.`,
      '',
      `💰 Monto pendiente de pago: S/ ${monto}`,
      '',
      'Te esperamos en la oficina de secretaría del colegio para completar el pago y cerrar el proceso de matrícula.',
      '',
      'Gracias.',
    ];

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  /** Finanzas -> Cuenta Corriente con el alumno ya seleccionado. */
  goToCollect(row: PendingCashCollectionRow): void {
    void this.router.navigate(['/app/finance/account'], {
      queryParams: { tab: 'student', student_id: row.student_id },
    });
  }
}
