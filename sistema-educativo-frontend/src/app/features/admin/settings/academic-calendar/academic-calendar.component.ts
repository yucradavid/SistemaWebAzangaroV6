//src/app/features/admin/settings/academic-calendar/academic-calendar.component.ts
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
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { AcademicYear } from '@core/models/AcademicYear';
import {
  AcademicPeriodHistory,
  AcademicPeriodStudentSnapshot,
  AcademicService,
  Period,
} from '@core/services/academic.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

interface YearWithPeriods {
  year: AcademicYear;
  periods: Period[];
  expanded: boolean;
}

@Component({
  selector: 'app-academic-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './academic-calendar.component.html',
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-slide-left { animation: slideLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideLeft { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
  `]
})
export class AcademicCalendarComponent implements OnInit {
  yearsWithPeriods: YearWithPeriods[] = [];
  periodHistoryMap: Record<string, AcademicPeriodHistory | null> = {};
  loading = false;

  // Modal de año académico
  showYearModal = false;
  isEditingYear = false;
  yearSubmitting = false;
  currentYearEditId: string | null = null;
  yearForm: FormGroup;

  // Modal de período
  showPeriodModal = false;
  isEditingPeriod = false;
  periodSubmitting = false;
  currentPeriodEditId: string | null = null;
  periodForm: FormGroup;

  // Panel de historial / snapshots (misma lógica que el componente de períodos original)
  showHistoryModal = false;
  historyLoading = false;
  historyError = '';
  selectedHistoryPeriod: Period | null = null;
  selectedHistory: AcademicPeriodHistory | null = null;
  selectedSnapshots: AcademicPeriodStudentSnapshot[] = [];
  selectedSnapshot: AcademicPeriodStudentSnapshot | null = null;
  historyGeneratingPeriodId: string | null = null;

  private expandedYears: Record<string, boolean> = {};

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

    this.periodForm = this.fb.group({
      academic_year_id: ['', Validators.required],
      name: ['', Validators.required],
      period_number: ['', [Validators.required, Validators.min(1)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_closed: [false],
    });
  }

  get yearOptions(): AcademicYear[] {
    return this.yearsWithPeriods.map((group) => group.year);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      years: this.academicService.getAcademicYears({ per_page: 100, simple: true }),
      periods: this.academicService.getPeriods({ per_page: 100, simple: true }),
    }).subscribe({
      next: ({ years, periods }) => {
        const yearList = this.extractCollection<AcademicYear>(years)
          .sort((left, right) => Number(right.year) - Number(left.year));
        const periodList = this.extractCollection<Period>(periods);

        this.yearsWithPeriods = yearList.map((year) => ({
          year,
          periods: periodList
            .filter((period) => period.academic_year_id === year.id)
            .sort((left, right) => left.period_number - right.period_number),
          expanded: this.expandedYears[year.id] ?? !!year.is_active,
        }));

        this.seedHistoryMap(periodList);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el calendario academico.', 'error');
      },
    });
  }

  toggleYear(group: YearWithPeriods): void {
    group.expanded = !group.expanded;
    this.expandedYears[group.year.id] = group.expanded;
  }

  // ── Año académico ──────────────────────────────────────────

  yearDurationDays(year: AcademicYear): number {
    const start = new Date(year.start_date);
    const end = new Date(year.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    const diff = end.getTime() - start.getTime();
    return diff >= 0 ? Math.floor(diff / 86400000) + 1 : 0;
  }

  relatedRecordsCount(year: AcademicYear): number {
    return (year.periods_count ?? 0)
      + (year.sections_count ?? 0)
      + (year.period_histories_count ?? 0)
      + (year.student_discounts_count ?? 0)
      + (year.financial_plans_count ?? 0);
  }

  canDeleteYear(group: YearWithPeriods): boolean {
    return !group.year.is_active
      && this.relatedRecordsCount(group.year) === 0
      && group.periods.length === 0;
  }

  getDeleteTooltip(group: YearWithPeriods): string {
    if (group.year.is_active) {
      return 'No puedes eliminar el año academico activo.';
    }

    if (this.relatedRecordsCount(group.year) > 0 || group.periods.length > 0) {
      return 'No puedes eliminar este año porque tiene registros vinculados.';
    }

    return 'Eliminar';
  }

  openYearModal(year?: AcademicYear): void {
    this.isEditingYear = !!year;
    this.currentYearEditId = year?.id ?? null;

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
    this.showYearModal = true;
  }

  closeYearModal(): void {
    this.showYearModal = false;
    this.isEditingYear = false;
    this.currentYearEditId = null;
    this.yearSubmitting = false;
  }

  saveYear(): void {
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      return;
    }

    this.yearSubmitting = true;

    const payload: Partial<AcademicYear> = {
      year: Number(this.yearForm.value.year),
      start_date: this.yearForm.value.start_date,
      end_date: this.yearForm.value.end_date,
      is_active: this.yearForm.value.is_active,
    };

    const isUpdate = this.isEditingYear && !!this.currentYearEditId;
    const request$ = isUpdate
      ? this.academicService.updateAcademicYear(this.currentYearEditId!, payload)
      : this.academicService.createAcademicYear(payload);

    request$.subscribe({
      next: () => {
        this.yearSubmitting = false;
        this.closeYearModal();
        this.loadData();

        Swal.fire({
          icon: 'success',
          title: isUpdate ? 'Año actualizado' : 'Año creado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.yearSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          text: this.resolveYearErrorMessage(err),
        });
      },
    });
  }

  toggleYearActive(year: AcademicYear): void {
    const activating = !year.is_active;

    Swal.fire({
      title: activating ? `¿Activar el año ${year.year}?` : `¿Desactivar el año ${year.year}?`,
      text: activating
        ? 'Solo puede haber un año activo a la vez.'
        : 'Los modulos que dependen del año activo dejaran de mostrar este año.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: activating ? '#059669' : '#dc2626',
      cancelButtonColor: '#2563eb',
      confirmButtonText: activating ? 'Si, activar' : 'Si, desactivar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.academicService.updateAcademicYear(year.id, {
        year: Number(year.year),
        start_date: this.toInputDate(year.start_date),
        end_date: this.toInputDate(year.end_date),
        is_active: activating,
      }).subscribe({
        next: () => {
          this.loadData();
          Swal.fire({
            icon: 'success',
            title: activating ? 'Año activado' : 'Año desactivado',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          Swal.fire('Error', this.resolveYearErrorMessage(err), 'error');
        },
      });
    });
  }

  deleteYear(group: YearWithPeriods): void {
    if (!this.canDeleteYear(group)) {
      Swal.fire('Accion no permitida', this.getDeleteTooltip(group), 'info');
      return;
    }

    Swal.fire({
      title: '¿Eliminar año academico?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.academicService.deleteAcademicYear(group.year.id).subscribe({
        next: () => {
          this.yearsWithPeriods = this.yearsWithPeriods.filter((item) => item.year.id !== group.year.id);

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
          Swal.fire('Error', this.resolveYearDeleteErrorMessage(err), 'error');
        },
      });
    });
  }

  isYearFieldInvalid(field: string): boolean {
    const ctrl = this.yearForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  hasYearDateRangeError(): boolean {
    return !!(
      this.yearForm.hasError('dateRange') &&
      (this.yearForm.get('start_date')?.touched || this.yearForm.get('end_date')?.touched)
    );
  }

  // ── Períodos ───────────────────────────────────────────────

  openPeriodModal(group: YearWithPeriods, period?: Period): void {
    this.isEditingPeriod = !!period;

    if (period) {
      this.currentPeriodEditId = period.id;
      this.periodForm.patchValue({
        ...period,
        start_date: this.toInputDate(period.start_date),
        end_date: this.toInputDate(period.end_date),
      });
    } else {
      this.currentPeriodEditId = null;
      const nextNumber = group.periods.length
        ? Math.max(...group.periods.map((item) => item.period_number)) + 1
        : 1;

      this.periodForm.reset({
        academic_year_id: group.year.id,
        is_closed: false,
        name: `Periodo ${nextNumber}`,
        period_number: nextNumber,
        start_date: '',
        end_date: '',
      });
    }

    this.showPeriodModal = true;
  }

  closePeriodModal(): void {
    this.showPeriodModal = false;
    this.isEditingPeriod = false;
    this.currentPeriodEditId = null;
    this.periodSubmitting = false;
  }

  savePeriod(): void {
    if (this.periodForm.invalid) {
      this.periodForm.markAllAsTouched();
      return;
    }

    this.periodSubmitting = true;
    const payload = this.periodForm.value;

    const request$ = this.isEditingPeriod && this.currentPeriodEditId
      ? this.academicService.updatePeriod(this.currentPeriodEditId, payload)
      : this.academicService.createPeriod(payload);

    request$.subscribe({
      next: () => {
        this.periodSubmitting = false;
        this.closePeriodModal();
        Swal.fire({
          icon: 'success',
          title: 'Periodo guardado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
        this.loadData();
      },
      error: (error) => {
        this.periodSubmitting = false;
        Swal.fire('Error', error?.error?.message || 'Hubo un error al guardar el periodo.', 'error');
      },
    });
  }

  deletePeriod(id: string): void {
    Swal.fire({
      title: 'Eliminar periodo',
      text: 'No podras revertir esta accion.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#2563eb',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.academicService.deletePeriod(id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Periodo eliminado',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
          });
          delete this.periodHistoryMap[id];
          this.loadData();
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo eliminar el periodo.', 'error');
        },
      });
    });
  }

  periodCircleClass(periodNumber: number): string {
    switch (periodNumber) {
      case 1:
        return 'bg-cermat-blue-700';
      case 2:
        return 'bg-emerald-700';
      case 3:
        return 'bg-amber-700';
      default:
        return 'bg-violet-700';
    }
  }

  // % transcurrido del período; null si hoy está fuera del rango
  periodProgress(period: Period): number | null {
    const start = new Date(period.start_date).getTime();
    const end = new Date(period.end_date).getTime();
    const now = Date.now();

    if (isNaN(start) || isNaN(end) || end <= start) {
      return null;
    }

    if (now < start || now > end) {
      return null;
    }

    return Math.round(((now - start) / (end - start)) * 100);
  }

  // ── Historial / snapshots ──────────────────────────────────

  openHistory(period: Period): void {
    this.selectedHistoryPeriod = period;
    this.showHistoryModal = true;
    this.historyLoading = true;
    this.historyError = '';
    this.selectedHistory = null;
    this.selectedSnapshots = [];
    this.selectedSnapshot = null;

    this.academicService.getPeriodHistory(period.id, {
      include_students: true,
      per_page: 250,
    }).subscribe({
      next: (response) => {
        this.selectedHistory = response?.history || null;
        this.periodHistoryMap[period.id] = this.selectedHistory;
        this.selectedSnapshots = this.extractCollection<AcademicPeriodStudentSnapshot>(response?.student_snapshots);
        this.selectedSnapshot = this.selectedSnapshots[0] || null;
        this.historyLoading = false;
      },
      error: (error) => {
        this.historyLoading = false;
        this.selectedHistory = null;
        this.selectedSnapshots = [];
        this.selectedSnapshot = null;
        this.periodHistoryMap[period.id] = null;
        this.historyError = error?.status === 404
          ? 'Este periodo aun no tiene snapshot generado. Puedes crearlo manualmente desde este panel.'
          : (error?.error?.message || 'No se pudo cargar el historial del periodo.');
      },
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedHistoryPeriod = null;
    this.selectedHistory = null;
    this.selectedSnapshots = [];
    this.selectedSnapshot = null;
    this.historyError = '';
  }

  generateHistory(period: Period, refreshCurrentView = false): void {
    this.historyGeneratingPeriodId = period.id;

    this.academicService.regeneratePeriodHistory(period.id).subscribe({
      next: (response) => {
        const history = response?.data || null;
        this.periodHistoryMap[period.id] = history;
        this.historyGeneratingPeriodId = null;

        Swal.fire({
          icon: 'success',
          title: period.is_closed ? 'Historial regenerado' : 'Snapshot preliminar generado',
          text: response?.message || 'Operacion completada correctamente.',
          confirmButtonColor: '#0f766e',
        });

        if (refreshCurrentView && this.selectedHistoryPeriod?.id === period.id) {
          this.openHistory(period);
          return;
        }

        if (this.showHistoryModal && this.selectedHistoryPeriod?.id === period.id) {
          this.openHistory(period);
        }
      },
      error: (error) => {
        this.historyGeneratingPeriodId = null;
        Swal.fire('Error', error?.error?.message || 'No se pudo generar el historial del periodo.', 'error');
      },
    });
  }

  selectSnapshot(snapshot: AcademicPeriodStudentSnapshot): void {
    this.selectedSnapshot = snapshot;
  }

  hasHistory(periodId: string): boolean {
    return !!this.periodHistoryMap[periodId];
  }

  snapshotLabel(period: Period): string {
    const history = this.periodHistoryMap[period.id];

    if (history) {
      const generatedAt = history.generated_at ? new Date(history.generated_at).toLocaleString() : 'fecha no disponible';
      return `Generado el ${generatedAt}`;
    }

    return 'Pendiente';
  }

  attendanceTone(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'presente':
        return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
      case 'tarde':
        return 'bg-amber-50 border border-amber-200 text-amber-700';
      case 'justificado':
        return 'bg-blue-50 border border-blue-200 text-blue-700';
      case 'falta':
        return 'bg-red-50 border border-red-200 text-red-700';
      default:
        return 'bg-slate-50 border border-slate-200 text-slate-600';
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  private seedHistoryMap(periods: Period[]): void {
    const nextMap: Record<string, AcademicPeriodHistory | null> = {};

    periods.forEach((period) => {
      nextMap[period.id] = this.periodHistoryMap[period.id] ?? null;
    });

    this.periodHistoryMap = nextMap;
  }

  private toInputDate(value?: string | null): string {
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

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const startDate = group.get('start_date')?.value;
    const endDate = group.get('end_date')?.value;

    if (!startDate || !endDate) {
      return null;
    }

    return new Date(endDate) > new Date(startDate) ? null : { dateRange: true };
  }

  private resolveYearErrorMessage(err: any): string {
    const errors = err?.error?.errors;

    if (!errors) {
      return err?.error?.message || 'Hubo un error inesperado. Intente nuevamente.';
    }

    const errorMap: Record<string, string> = {
      year: 'Ese año academico ya existe.',
      start_date: 'Debe ingresar la fecha de inicio.',
      end_date: 'Debe ingresar la fecha de fin.',
    };

    for (const field of Object.keys(errorMap)) {
      if (errors[field]?.length) {
        const raw = String(errors[field][0]).toLowerCase();
        if (raw.includes('overlap') || raw.includes('superpone')) {
          return 'Las fechas se superponen con otro año academico.';
        }
        return errors[field][0];
      }
    }

    const firstError = Object.values(errors).flat()[0] as string;
    return firstError || 'Hubo un error inesperado. Intente nuevamente.';
  }

  private resolveYearDeleteErrorMessage(err: any): string {
    const rawMessage = String(err?.error?.message || '').toLowerCase();

    if (rawMessage.includes('activo')) {
      return 'No puedes eliminar el año academico activo.';
    }

    if (rawMessage.includes('relacionados') || rawMessage.includes('vinculados')) {
      return 'No puedes eliminar este año porque tiene registros vinculados.';
    }

    return err?.error?.message || 'No se pudo eliminar el año academico.';
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
