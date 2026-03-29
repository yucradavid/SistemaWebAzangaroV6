//src/app/features/admin/finance/charges/finance-emission.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AcademicService } from '@core/services/academic.service';
import { FinanceService, FinancialPlan } from '@core/services/finance.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

@Component({
  selector: 'app-finance-emission',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, ReactiveFormsModule, SettingFilterDropdownComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="space-y-1">
        <p class="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.25em]">Cargos financieros</p>
        <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Emision masiva</h1>
        <p class="text-slate-500 text-sm font-medium">Genera cargos desde un plan financiero real y filtros academicos.</p>
      </div>

      <div [formGroup]="emissionForm" class="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-700 tracking-tight">Filtros de emision</h2>
            <p class="text-xs text-slate-400 mt-1">La pantalla ahora trabaja con el backend de cargos masivos.</p>
          </div>
          <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            [class]="selectedPlan ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
            {{ selectedPlan ? 'Plan listo' : 'Seleccion pendiente' }}
          </span>
        </div>

        <div class="p-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div class="space-y-2">
              <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Anio academico <span class="text-red-500">*</span></label>
              <app-setting-filter-dropdown
                [options]="yearOptions"
                [selectedId]="emissionForm.get('academic_year_id')?.value || ''"
                placeholder="Selecciona un anio"
                (selectionChange)="emissionForm.get('academic_year_id')?.setValue($event)">
              </app-setting-filter-dropdown>
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Plan financiero <span class="text-red-500">*</span></label>
              <app-setting-filter-dropdown
                [options]="planOptions"
                [selectedId]="emissionForm.get('financial_plan_id')?.value || ''"
                placeholder="{{ loadingPlans ? 'Cargando planes...' : 'Selecciona un plan' }}"
                (selectionChange)="emissionForm.get('financial_plan_id')?.setValue($event)">
              </app-setting-filter-dropdown>
              <p *ngIf="!loadingPlans && emissionForm.get('academic_year_id')?.value && financialPlans.length === 0" class="text-xs text-amber-600">
                No hay planes activos para el anio seleccionado.
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Grado (opcional)</label>
              <app-setting-filter-dropdown
                [options]="gradeOptions"
                [selectedId]="emissionForm.get('grade_level_id')?.value || ''"
                placeholder="Todos los grados"
                (selectionChange)="emissionForm.get('grade_level_id')?.setValue($event)">
              </app-setting-filter-dropdown>
            </div>

            <div class="space-y-2" [class.opacity-60]="!emissionForm.get('grade_level_id')?.value">
              <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Seccion (opcional)</label>
              <app-setting-filter-dropdown
                [options]="sectionOptions"
                [selectedId]="emissionForm.get('section_id')?.value || ''"
                placeholder="{{ loadingSections ? 'Cargando secciones...' : 'Todas las secciones' }}"
                (selectionChange)="emissionForm.get('section_id')?.setValue($event)">
              </app-setting-filter-dropdown>
            </div>
          </div>

          <div *ngIf="selectedPlan" class="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Plan</p>
              <p class="text-sm font-semibold text-slate-700">{{ selectedPlan.name }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Concepto</p>
              <p class="text-sm font-semibold text-slate-700">{{ selectedPlan.concept?.name || 'Sin concepto' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Cuotas</p>
              <p class="text-sm font-semibold text-slate-700">{{ selectedPlan.installments_count || selectedPlan.number_of_installments || 0 }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Monto referencia</p>
              <p class="text-sm font-semibold text-slate-700">S/ {{ selectedPlan.total_amount || selectedPlan.concept?.base_amount || 0 | number:'1.2-2' }}</p>
            </div>
          </div>

          <div *ngIf="lastEmission" class="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-emerald-800">Ultima emision</p>
              <p class="text-xs text-emerald-700 mt-1">{{ lastEmission.message }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Cargos creados</p>
              <p class="text-2xl font-bold text-emerald-700">{{ lastEmission.created_count }}</p>
            </div>
          </div>

          <div class="pt-2 flex flex-wrap gap-3">
            <button
              (click)="onEmit()"
              [disabled]="loading || loadingPlans || emissionForm.invalid"
              class="px-8 py-3 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="!loading">Generar cargos masivos</span>
              <span *ngIf="loading">Procesando emision...</span>
            </button>
            <button
              type="button"
              (click)="resetOptionalFilters()"
              [disabled]="loading"
              class="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50">
              Limpiar grado y seccion
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class FinanceEmissionComponent implements OnInit, OnDestroy {
  emissionForm: FormGroup;
  academicYears: any[] = [];
  financialPlans: FinancialPlan[] = [];
  gradeLevels: any[] = [];
  sections: any[] = [];

  yearOptions: Array<{ id: string; name: string }> = [];
  planOptions: Array<{ id: string; name: string }> = [];
  gradeOptions: Array<{ id: string; name: string }> = [];
  sectionOptions: Array<{ id: string; name: string }> = [];

  loading = false;
  loadingPlans = false;
  loadingSections = false;
  lastEmission: { message: string; created_count: number } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private academicService: AcademicService
  ) {
    this.emissionForm = this.fb.group({
      academic_year_id: ['', Validators.required],
      financial_plan_id: ['', Validators.required],
      grade_level_id: [''],
      section_id: ['']
    });
  }

  get selectedPlan(): FinancialPlan | undefined {
    const planId = this.emissionForm.get('financial_plan_id')?.value;
    return this.financialPlans.find((plan) => plan.id === planId);
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.registerFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialData(): void {
    forkJoin({
      academicYears: this.academicService.getAcademicYears(),
      gradeLevels: this.academicService.getGradeLevels()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ academicYears, gradeLevels }) => {
          const yearItems = Array.isArray((academicYears as any).data) ? (academicYears as any).data : academicYears;
          const gradeItems = Array.isArray((gradeLevels as any).data) ? (gradeLevels as any).data : gradeLevels;

          this.academicYears = Array.isArray(yearItems) ? yearItems : [];
          this.gradeLevels = Array.isArray(gradeItems) ? gradeItems : [];

          this.yearOptions = this.academicYears.map((year: any) => ({ id: year.id, name: String(year.year) }));
          this.gradeOptions = this.gradeLevels.map((grade: any) => ({ id: grade.id, name: grade.name }));

          const activeYear = this.academicYears.find((year: any) => year.is_active);
          const yearId = activeYear?.id || this.academicYears[0]?.id || '';
          if (yearId) {
            this.emissionForm.patchValue({ academic_year_id: yearId });
            this.loadPlans(yearId);
          }
        },
        error: () => {
          Swal.fire('Error', 'No se pudieron cargar los datos base de emision.', 'error');
        }
      });
  }

  registerFormListeners(): void {
    this.emissionForm.get('academic_year_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((academicYearId) => {
        this.emissionForm.patchValue({ financial_plan_id: '', section_id: '' }, { emitEvent: false });
        this.lastEmission = null;
        this.loadPlans(academicYearId);

        const gradeId = this.emissionForm.get('grade_level_id')?.value;
        if (gradeId) {
          this.loadSections(gradeId);
        } else {
          this.clearSections();
        }
      });

    this.emissionForm.get('grade_level_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((gradeId) => {
        this.emissionForm.patchValue({ section_id: '' }, { emitEvent: false });
        this.loadSections(gradeId);
      });
  }

  loadPlans(academicYearId: string): void {
    if (!academicYearId) {
      this.financialPlans = [];
      this.planOptions = [];
      return;
    }

    this.loadingPlans = true;

    this.financeService.getPlans({
      academic_year_id: academicYearId,
      is_active: true,
      per_page: 200
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.financialPlans = this.financeService.unwrapItems(response);
          this.planOptions = this.financialPlans.map((plan) => ({
            id: plan.id,
            name: `${plan.name} · ${plan.concept?.name || 'Sin concepto'}`
          }));
          this.loadingPlans = false;
        },
        error: () => {
          this.loadingPlans = false;
          this.financialPlans = [];
          this.planOptions = [];
          Swal.fire('Error', 'No se pudieron cargar los planes financieros.', 'error');
        }
      });
  }

  loadSections(gradeId: string): void {
    const academicYearId = this.emissionForm.get('academic_year_id')?.value;

    if (!gradeId) {
      this.clearSections();
      return;
    }

    this.loadingSections = true;

    this.academicService.getSections({
      grade_level_id: gradeId,
      academic_year_id: academicYearId || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const items = Array.isArray((response as any).data) ? (response as any).data : response;
          this.sections = Array.isArray(items) ? items : [];
          this.sectionOptions = this.sections.map((section: any) => ({
            id: section.id,
            name: section.section_letter || section.name || 'Seccion'
          }));
          this.loadingSections = false;
        },
        error: () => {
          this.loadingSections = false;
          this.clearSections();
          Swal.fire('Error', 'No se pudieron cargar las secciones.', 'error');
        }
      });
  }

  resetOptionalFilters(): void {
    this.emissionForm.patchValue({
      grade_level_id: '',
      section_id: ''
    });
  }

  onEmit(): void {
    if (this.emissionForm.invalid) {
      Swal.fire('Error', 'Selecciona el anio academico y el plan financiero.', 'error');
      return;
    }

    const payload = this.buildPayload();
    const planName = this.selectedPlan?.name || 'Plan seleccionado';

    Swal.fire({
      title: 'Confirmar emision',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6">
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Anio:</strong> ${this.getSelectedYearLabel()}</p>
          <p><strong>Grado:</strong> ${this.getSelectedGradeLabel()}</p>
          <p><strong>Seccion:</strong> ${this.getSelectedSectionLabel()}</p>
          <p style="margin-top:12px;">Se generaran cargos para los estudiantes que cumplan esos filtros.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1d4ed8',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Emitir cargos',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.loading = true;

      this.financeService.emitBatchCharges(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.lastEmission = response;

            Swal.fire(
              response.created_count > 0 ? 'Emision completada' : 'Sin cambios',
              `${response.message}<br><br><strong>Cargos creados:</strong> ${response.created_count}`,
              response.created_count > 0 ? 'success' : 'info'
            );
          },
          error: (error) => {
            this.loading = false;
            Swal.fire('Error', error?.error?.message || 'Hubo un problema al generar los cargos.', 'error');
          }
        });
    });
  }

  private buildPayload(): {
    academic_year_id: string;
    financial_plan_id: string;
    grade_level_id?: string;
    section_id?: string;
  } {
    const value = this.emissionForm.getRawValue();

    return {
      academic_year_id: value.academic_year_id,
      financial_plan_id: value.financial_plan_id,
      ...(value.grade_level_id ? { grade_level_id: value.grade_level_id } : {}),
      ...(value.section_id ? { section_id: value.section_id } : {})
    };
  }

  private clearSections(): void {
    this.sections = [];
    this.sectionOptions = [];
    this.loadingSections = false;
  }

  private getSelectedYearLabel(): string {
    const yearId = this.emissionForm.get('academic_year_id')?.value;
    return this.yearOptions.find((year) => year.id === yearId)?.name || 'No definido';
  }

  private getSelectedGradeLabel(): string {
    const gradeId = this.emissionForm.get('grade_level_id')?.value;
    return this.gradeOptions.find((grade) => grade.id === gradeId)?.name || 'Todos';
  }

  private getSelectedSectionLabel(): string {
    const sectionId = this.emissionForm.get('section_id')?.value;
    return this.sectionOptions.find((section) => section.id === sectionId)?.name || 'Todas';
  }
}
