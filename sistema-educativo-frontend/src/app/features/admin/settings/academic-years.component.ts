//src/app/features/admin/settings/academic-years.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';

import { AcademicYear } from '@core/models/AcademicYear';
import { AcademicService } from '@core/services/academic.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';

type LinkedDetail = {
  key: string;
  label: string;
  value: number;
  tone: string;
};

@Component({
  selector: 'app-academic-years',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent, SettingMetricCardComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700 relative">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
        <div class="flex items-center gap-4">
          <app-back-button></app-back-button>
          <div class="space-y-1">
            <h1 class="text-2xl sm:text-3xl font-medium text-[#0F172A] tracking-tight">A&ntilde;os Acad&eacute;micos</h1>
            <p class="text-slate-500 text-sm font-normal">Gestiona los a&ntilde;os lectivos de la instituci&oacute;n</p>
          </div>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-3 bg-gradient-to-r from-[#0E3A8A] to-[#C026D3] hover:opacity-90 text-white text-sm font-medium rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar A&ntilde;o
        </button>
      </div>

      <div class="flex flex-wrap gap-3 mt-2 mb-6">
        <app-setting-metric-card label="Total A&ntilde;os" [value]="academicYears.length"></app-setting-metric-card>
        <app-setting-metric-card label="A&ntilde;o Activo" [value]="activeYear ? activeYear.year : 'Ninguno'"></app-setting-metric-card>
      </div>

      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          *ngFor="let year of academicYears"
          class="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">

          <div class="absolute -right-10 -top-10 w-32 h-32 bg-slate-50 rounded-full blur-3xl group-hover:bg-blue-50 transition-colors"></div>

          <div class="flex items-start justify-between relative z-10 w-full">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-blue-200">
                <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div class="space-y-1">
                <h3 class="text-2xl font-medium text-[#0F172A] tracking-tight">{{ year.year }}</h3>
                <div class="text-xs text-slate-500 font-normal">
                  {{ year.start_date | date:'dd/MM/yyyy' }} - {{ year.end_date | date:'dd/MM/yyyy' }}
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    *ngIf="year.is_active"
                    class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-100 uppercase tracking-widest">
                    Activo
                  </span>
                  <span
                    *ngIf="!year.is_active"
                    class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
                    Inactivo
                  </span>
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium border uppercase tracking-widest"
                    [ngClass]="relatedRecordsCount(year) > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                    {{ relatedRecordsCount(year) > 0 ? relatedRecordsCount(year) + ' vinculados' : 'Sin vinculaciones' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex-shrink-0 flex gap-2 pt-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
              <button
                (click)="openModal(year)"
                class="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white shadow-sm"
                title="Editar">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                (click)="deleteYear(year)"
                [disabled]="!canDeleteYear(year)"
                [attr.title]="getDeleteTooltip(year)"
                class="p-2 transition-colors rounded-lg shadow-sm disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-300"
                [ngClass]="canDeleteYear(year) ? 'text-slate-400 hover:text-red-600 hover:bg-white' : 'text-slate-300'">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="relative z-10 mt-6 space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Duracion</p>
                <p class="mt-1 text-sm font-semibold text-slate-700">{{ yearDurationDays(year) }} dias</p>
              </div>
              <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Bloqueo</p>
                <p class="mt-1 text-sm font-semibold text-slate-700">{{ deletionStatus(year) }}</p>
              </div>
              <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total</p>
                <p class="mt-1 text-sm font-semibold text-slate-700">{{ relatedRecordsCount(year) }}</p>
              </div>
            </div>

            <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 overflow-hidden">
              <button
                type="button"
                (click)="toggleDetails(year.id)"
                class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/70 transition-colors">
                <div>
                  <p class="text-sm font-semibold text-slate-700">Detalles del ano</p>
                  <p class="text-[11px] text-slate-400">
                    {{ relatedRecordsCount(year) > 0 ? 'Desglose de relaciones y estado operativo' : 'Sin registros vinculados por ahora' }}
                  </p>
                </div>
                <svg
                  class="w-4 h-4 text-slate-400 transition-transform"
                  [ngClass]="isDetailsExpanded(year.id) ? 'rotate-180' : ''"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <div *ngIf="isDetailsExpanded(year.id)" class="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100 bg-white/70">
                <div *ngIf="linkedDetails(year).length > 0; else noLinksBlock" class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let detail of linkedDetails(year)"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold"
                    [ngClass]="detail.tone">
                    <span>{{ detail.label }}</span>
                    <span class="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-white/80 px-1">{{ detail.value }}</span>
                  </span>
                </div>

                <ng-template #noLinksBlock>
                  <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700 font-medium">
                    Este ano academico no tiene periodos, secciones, historiales ni registros financieros vinculados.
                  </div>
                </ng-template>

                <div class="grid grid-cols-2 gap-3 text-[12px]">
                  <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p class="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Puede eliminarse</p>
                    <p class="mt-1 font-semibold text-slate-700">{{ canDeleteYear(year) ? 'Si' : 'No' }}</p>
                  </div>
                  <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p class="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Motivo</p>
                    <p class="mt-1 font-semibold text-slate-700">{{ getDeleteTooltip(year) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          *ngIf="academicYears.length === 0"
          class="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
          <svg class="w-16 h-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p class="text-sm font-semibold">No hay a&ntilde;os acad&eacute;micos registrados</p>
          <p class="text-xs mt-1">Haz clic en "Registrar A&ntilde;o" para comenzar</p>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 animate-slide-up overflow-hidden border border-slate-100">
          <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 class="text-xl font-bold text-slate-800 tracking-tight">
                {{ isEditing ? 'Editar A\u00f1o Acad\u00e9mico' : 'Nuevo A\u00f1o Acad\u00e9mico' }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ isEditing ? 'Modifica los datos del a\u00f1o seleccionado' : 'Completa los datos para registrar un nuevo a\u00f1o' }}
              </p>
            </div>
            <button
              (click)="closeModal()"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="yearForm" (ngSubmit)="saveYear()" class="p-8 space-y-5">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                A&ntilde;o
              </label>
              <input
                type="number"
                formControlName="year"
                placeholder="Ej: 2025"
                class="w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white hover:border-slate-300"
                [ngClass]="isFieldInvalid('year') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
              <p *ngIf="isFieldInvalid('year')" class="text-[11px] text-red-500 font-semibold">
                Ingrese un a&ntilde;o valido entre 1900 y 2100.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  formControlName="start_date"
                  class="w-full bg-slate-50 border text-slate-800 rounded-xl px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white hover:border-slate-300"
                  [ngClass]="isFieldInvalid('start_date') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
                <p *ngIf="isFieldInvalid('start_date')" class="text-[11px] text-red-500 font-semibold">
                  Requerida.
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Fecha fin
                </label>
                <input
                  type="date"
                  formControlName="end_date"
                  class="w-full bg-slate-50 border text-slate-800 rounded-xl px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white hover:border-slate-300"
                  [ngClass]="isFieldInvalid('end_date') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
                <p *ngIf="isFieldInvalid('end_date')" class="text-[11px] text-red-500 font-semibold">
                  Requerida.
                </p>
              </div>
            </div>

            <p *ngIf="hasDateRangeError()" class="text-[11px] text-red-500 font-semibold -mt-2">
              La fecha de fin debe ser posterior a la fecha de inicio.
            </p>

            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p class="text-sm font-bold text-slate-700">Estado Activo</p>
                <p class="text-xs text-slate-400 mt-0.5">Solo puede haber un a\u00f1o activo a la vez</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" formControlName="is_active" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 rounded-full peer
                            peer-checked:after:translate-x-full peer-checked:after:border-white
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:border-slate-300 after:border after:rounded-full
                            after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <div class="pt-2 flex gap-3">
              <button
                type="button"
                (click)="closeModal()"
                class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95">
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="yearForm.invalid || isSubmitting"
                class="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">
                <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ isEditing ? 'Guardar Cambios' : 'Crear A\u00f1o' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in  { animation: fadeIn  0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AcademicYearsComponent implements OnInit {
  academicYears: AcademicYear[] = [];
  loading = false;
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  currentEditId: string | null = null;
  expandedYearIds: Record<string, boolean> = {};
  yearForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.yearForm = this.fb.group({
      year: ['', [Validators.required, Validators.min(1900), Validators.max(2100)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_active: [false],
    }, { validators: this.dateRangeValidator });
  }

  get activeYear(): AcademicYear | undefined {
    return this.academicYears.find((year) => year.is_active);
  }

  ngOnInit(): void {
    this.loadYears();
  }

  private toInputDate(value: string | null | undefined): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (value.includes('T')) return value.split('T')[0];
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      return `${year}-${month}-${day}`;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.yearForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  hasDateRangeError(): boolean {
    return !!(
      this.yearForm.hasError('dateRange') &&
      (this.yearForm.get('start_date')?.touched || this.yearForm.get('end_date')?.touched)
    );
  }

  relatedRecordsCount(year: AcademicYear): number {
    return (year.periods_count ?? 0)
      + (year.sections_count ?? 0)
      + (year.period_histories_count ?? 0)
      + (year.student_discounts_count ?? 0)
      + (year.financial_plans_count ?? 0);
  }

  linkedDetails(year: AcademicYear): LinkedDetail[] {
    const details: LinkedDetail[] = [
      {
        key: 'periods',
        label: 'Periodos',
        value: year.periods_count ?? 0,
        tone: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      {
        key: 'sections',
        label: 'Secciones',
        value: year.sections_count ?? 0,
        tone: 'bg-sky-50 text-sky-700 border-sky-200',
      },
      {
        key: 'histories',
        label: 'Historiales',
        value: year.period_histories_count ?? 0,
        tone: 'bg-violet-50 text-violet-700 border-violet-200',
      },
      {
        key: 'discounts',
        label: 'Descuentos',
        value: year.student_discounts_count ?? 0,
        tone: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      {
        key: 'plans',
        label: 'Planes',
        value: year.financial_plans_count ?? 0,
        tone: 'bg-rose-50 text-rose-700 border-rose-200',
      },
    ];

    return details.filter((detail) => detail.value > 0);
  }

  yearDurationDays(year: AcademicYear): number {
    const start = new Date(year.start_date);
    const end = new Date(year.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    const diff = end.getTime() - start.getTime();
    return diff >= 0 ? Math.floor(diff / 86400000) + 1 : 0;
  }

  deletionStatus(year: AcademicYear): string {
    if (year.is_active) {
      return 'Activo';
    }

    if (this.relatedRecordsCount(year) > 0) {
      return 'Vinculado';
    }

    return 'Libre';
  }

  canDeleteYear(year: AcademicYear): boolean {
    return !year.is_active && this.relatedRecordsCount(year) === 0;
  }

  getDeleteTooltip(year: AcademicYear): string {
    if (year.is_active) {
      return 'No puedes eliminar el a\u00f1o academico activo.';
    }

    if (this.relatedRecordsCount(year) > 0) {
      return 'No puedes eliminar este a\u00f1o porque tiene registros vinculados.';
    }

    return 'Eliminar';
  }

  toggleDetails(yearId: string): void {
    this.expandedYearIds[yearId] = !this.expandedYearIds[yearId];
  }

  isDetailsExpanded(yearId: string): boolean {
    return !!this.expandedYearIds[yearId];
  }

  private resolveErrorMessage(err: any): string {
    const errors = err?.error?.errors;

    if (!errors) {
      return err?.error?.message || 'Hubo un error inesperado. Intente nuevamente.';
    }

    const errorMap: Record<string, string> = {
      year: 'Ese a\u00f1o academico ya existe.',
      start_date: 'Debe ingresar la fecha de inicio.',
      end_date: 'Debe ingresar la fecha de fin.',
    };

    for (const field of Object.keys(errorMap)) {
      if (errors[field]?.length) {
        const raw = String(errors[field][0]).toLowerCase();
        if (raw.includes('overlap') || raw.includes('superpone')) {
          return 'Las fechas se superponen con otro a\u00f1o academico.';
        }
        return errors[field][0];
      }
    }

    const firstError = Object.values(errors).flat()[0] as string;
    return firstError || 'Hubo un error inesperado. Intente nuevamente.';
  }

  private resolveDeleteErrorMessage(err: any): string {
    const rawMessage = String(err?.error?.message || '').toLowerCase();

    if (rawMessage.includes('activo')) {
      return 'No puedes eliminar el a\u00f1o academico activo.';
    }

    if (rawMessage.includes('relacionados') || rawMessage.includes('vinculados')) {
      return 'No puedes eliminar este a\u00f1o porque tiene registros vinculados.';
    }

    return err?.error?.message || 'No se pudo eliminar el a\u00f1o academico.';
  }

  loadYears(): void {
    this.loading = true;
    this.academicService.getAcademicYears({ per_page: 100, simple: true }).subscribe({
      next: (response) => {
        this.academicYears = this.extractCollection<AcademicYear>(response);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'No se pudieron cargar los a\u00f1os academicos.', 'error');
      },
    });
  }

  openModal(year?: AcademicYear): void {
    this.isEditing = !!year;
    this.currentEditId = year?.id ?? null;

    if (year) {
      this.yearForm.patchValue({
        year: year.year,
        start_date: this.toInputDate(year.start_date),
        end_date: this.toInputDate(year.end_date),
        is_active: year.is_active ?? false,
      });
    } else {
      this.yearForm.reset({
        year: new Date().getFullYear(),
        start_date: '',
        end_date: '',
        is_active: false,
      });
    }

    this.yearForm.markAsPristine();
    this.yearForm.markAsUntouched();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentEditId = null;
    this.isSubmitting = false;
  }

  saveYear(): void {
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const payload: Partial<AcademicYear> = {
      year: Number(this.yearForm.value.year),
      start_date: this.yearForm.value.start_date,
      end_date: this.yearForm.value.end_date,
      is_active: this.yearForm.value.is_active,
    };

    const isUpdate = this.isEditing && !!this.currentEditId;
    const request$ = isUpdate
      ? this.academicService.updateAcademicYear(this.currentEditId!, payload)
      : this.academicService.createAcademicYear(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.loadYears();

        Swal.fire({
          icon: 'success',
          title: isUpdate ? 'A\u00f1o actualizado' : 'A\u00f1o creado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          text: this.resolveErrorMessage(err),
        });
      },
    });
  }

  deleteYear(year: AcademicYear): void {
    if (!this.canDeleteYear(year)) {
      Swal.fire('Accion no permitida', this.getDeleteTooltip(year), 'info');
      return;
    }

    Swal.fire({
      title: '\u00bfEliminar a\u00f1o academico?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.academicService.deleteAcademicYear(year.id).subscribe({
        next: () => {
          this.academicYears = this.academicYears.filter((item) => item.id !== year.id);

          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          Swal.fire('Error', this.resolveDeleteErrorMessage(err), 'error');
        },
      });
    });
  }

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const startDate = group.get('start_date')?.value;
    const endDate = group.get('end_date')?.value;

    if (!startDate || !endDate) {
      return null;
    }

    return new Date(endDate) > new Date(startDate) ? null : { dateRange: true };
  }

  private extractCollection<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }
}
