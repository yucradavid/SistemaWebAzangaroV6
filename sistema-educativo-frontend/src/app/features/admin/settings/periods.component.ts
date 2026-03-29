//src/app/features/admin/settings/periods.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import {
  AcademicPeriodHistory,
  AcademicPeriodStudentSnapshot,
  AcademicService,
  Period,
} from '@core/services/academic.service';
import { AcademicYear } from '@core/models/AcademicYear';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import Swal from 'sweetalert2';

interface GroupedPeriods {
  year: number | string;
  periods: Period[];
}

@Component({
  selector: 'app-periods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent, SettingMetricCardComponent],
  templateUrl: './periods.component.html',
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-slide-left { animation: slideLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideLeft { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
  `]
})
export class PeriodsComponent implements OnInit {
  periods: Period[] = [];
  academicYears: AcademicYear[] = [];
  groupedPeriods: GroupedPeriods[] = [];
  periodHistoryMap: Record<string, AcademicPeriodHistory | null> = {};

  loading = false;
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  currentEditId: string | null = null;

  showHistoryModal = false;
  historyLoading = false;
  historyError = '';
  selectedHistoryPeriod: Period | null = null;
  selectedHistory: AcademicPeriodHistory | null = null;
  selectedSnapshots: AcademicPeriodStudentSnapshot[] = [];
  selectedSnapshot: AcademicPeriodStudentSnapshot | null = null;
  historyGeneratingPeriodId: string | null = null;

  periodForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.periodForm = this.fb.group({
      academic_year_id: ['', Validators.required],
      name: ['', Validators.required],
      period_number: ['', [Validators.required, Validators.min(1)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_closed: [false],
    });
  }

  get totalPeriods(): number {
    return this.periods.length;
  }

  get openPeriods(): number {
    return this.periods.filter((period) => !period.is_closed).length;
  }

  get closedPeriods(): number {
    return this.periods.filter((period) => period.is_closed).length;
  }

  get periodsWithHistory(): number {
    return Object.values(this.periodHistoryMap).filter((history) => !!history).length;
  }

  get closedWithoutHistory(): number {
    return this.periods.filter((period) => period.is_closed && !this.periodHistoryMap[period.id]).length;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.academicService.getAcademicYears().subscribe({
      next: (yearsResponse) => {
        this.academicYears = this.extractCollection<AcademicYear>(yearsResponse);

        this.academicService.getPeriods({ per_page: 100, simple: true }).subscribe({
          next: (periodsResponse) => {
            this.periods = this.extractCollection<Period>(periodsResponse);
            this.groupPeriods();
            this.seedHistoryMap();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            Swal.fire('Error', 'No se pudieron cargar los periodos.', 'error');
          },
        });
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los anios academicos.', 'error');
      },
    });
  }

  groupPeriods(): void {
    const groups: Record<string, Period[]> = {};

    this.periods.forEach((period) => {
      const yearObj = this.academicYears.find((year) => year.id === period.academic_year_id);
      const yearName = yearObj ? yearObj.year : 'Desconocido';

      if (!groups[yearName]) {
        groups[yearName] = [];
      }

      groups[yearName].push(period);
    });

    this.groupedPeriods = Object.keys(groups)
      .map((year) => ({
        year,
        periods: groups[year].sort((left, right) => left.period_number - right.period_number),
      }))
      .sort((left, right) => Number(right.year) - Number(left.year));
  }

  openModal(period?: Period): void {
    this.isEditing = !!period;

    if (period) {
      this.currentEditId = period.id;
      this.periodForm.patchValue({
        ...period,
        start_date: this.safeDateInput(period.start_date),
        end_date: this.safeDateInput(period.end_date),
      });
    } else {
      this.currentEditId = null;
      const activeYear = this.academicYears.find((year) => year.is_active);
      const yearId = activeYear?.id || '';
      let nextNumber = 1;

      if (yearId) {
        const yearPeriods = this.periods.filter((item) => item.academic_year_id === yearId);
        if (yearPeriods.length) {
          nextNumber = Math.max(...yearPeriods.map((item) => item.period_number)) + 1;
        }
      }

      this.periodForm.reset({
        academic_year_id: yearId,
        is_closed: false,
        name: `Periodo ${nextNumber}`,
        period_number: nextNumber,
        start_date: '',
        end_date: '',
      });
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  savePeriod(): void {
    if (this.periodForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const payload = this.periodForm.value;

    const request$ = this.isEditing && this.currentEditId
      ? this.academicService.updatePeriod(this.currentEditId, payload)
      : this.academicService.createPeriod(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
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
        this.isSubmitting = false;
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

  historyLabel(period: Period): string {
    const history = this.periodHistoryMap[period.id];

    if (history) {
      const generatedAt = history.generated_at ? new Date(history.generated_at).toLocaleString() : 'fecha no disponible';
      return `Generado el ${generatedAt}`;
    }

    return period.is_closed
      ? 'Cerrado sin snapshot consultable todavia'
      : 'Aun no se ha generado snapshot';
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

  private seedHistoryMap(): void {
    const nextMap: Record<string, AcademicPeriodHistory | null> = {};

    this.periods.forEach((period) => {
      nextMap[period.id] = this.periodHistoryMap[period.id] ?? null;
    });

    this.periodHistoryMap = nextMap;
  }

  private safeDateInput(value?: string | null): string {
    return value ? String(value).substring(0, 10) : '';
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
