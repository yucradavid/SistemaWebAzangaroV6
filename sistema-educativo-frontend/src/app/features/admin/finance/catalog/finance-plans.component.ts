import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService } from '@core/services/academic.service';
import { FeeConcept, FinanceService, FinancialPlan, PlanInstallment } from '@core/services/finance.service';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

@Component({
  selector: 'app-finance-plans',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule, ReactiveFormsModule, SettingMetricCardComponent, SettingFilterDropdownComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div class="space-y-1">
          <p class="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.25em]">Configuracion financiera</p>
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Planes de pago</h1>
          <p class="text-slate-500 text-sm font-medium">Estructura cobros por anio academico, concepto y cuotas.</p>
        </div>
        <button (click)="openModal()" class="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-semibold rounded-xl shadow-lg flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo plan
        </button>
      </div>

      <div class="flex flex-wrap gap-3">
        <app-setting-metric-card *ngFor="let kpi of kpis" [label]="kpi.label" [value]="kpi.value"></app-setting-metric-card>
      </div>

      <div class="md:max-w-2xl mx-auto flex gap-4">
        <div class="flex-1">
          <app-setting-filter-dropdown [options]="yearOptions" [selectedId]="filters.academic_year_id" placeholder="Todos los anios" (selectionChange)="applyFilters('academic_year_id', $event)"></app-setting-filter-dropdown>
        </div>
        <div class="flex-1">
          <app-setting-filter-dropdown [options]="statusOptions" [selectedId]="filters.is_active" placeholder="Todos los estados" (selectionChange)="applyFilters('is_active', $event)"></app-setting-filter-dropdown>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div class="p-6 border-b border-slate-50 bg-slate-50/30 px-8">
          <h2 class="text-base font-semibold text-slate-800 tracking-tight">Planes ({{ plans.length }})</h2>
          <p class="text-xs text-slate-400 mt-1">La sincronizacion de cuotas ahora respeta altas, ediciones y eliminaciones.</p>
        </div>

        <div *ngIf="loading" class="py-20 text-center">
          <div class="w-10 h-10 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-400 text-sm font-medium">Cargando planes...</p>
        </div>

        <div *ngIf="!loading && plans.length === 0" class="p-20 text-center text-slate-400">No hay planes configurados.</div>

        <div *ngIf="!loading && plans.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                <th class="py-5 px-8 text-left">Plan</th>
                <th class="py-5 px-6 text-left">Concepto</th>
                <th class="py-5 px-6 text-center">Cuotas</th>
                <th class="py-5 px-6 text-right">Total</th>
                <th class="py-5 px-6 text-center">Estado</th>
                <th class="py-5 px-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let plan of plans" class="hover:bg-slate-50/50">
                <td class="py-5 px-8">
                  <div class="text-sm font-semibold text-slate-800">{{ plan.name }}</div>
                  <div class="text-[11px] text-slate-400">{{ plan.academic_year?.year || 'Sin anio' }}</div>
                </td>
                <td class="py-5 px-6">
                  <div class="text-sm font-medium text-slate-700">{{ plan.concept?.name || 'Sin concepto' }}</div>
                  <div class="text-[11px] text-slate-400">{{ plan.description || 'Sin descripcion' }}</div>
                </td>
                <td class="py-5 px-6 text-center text-sm font-semibold text-slate-700">{{ getInstallmentsCount(plan) }}</td>
                <td class="py-5 px-6 text-right text-sm font-bold text-slate-900">S/ {{ getPlanTotal(plan) | number:'1.2-2' }}</td>
                <td class="py-5 px-6 text-center">
                  <span [class]="plan.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'" class="px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                    {{ plan.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-5 px-8 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="editPlan(plan)" class="p-2 text-slate-400 hover:text-blue-900 transition-colors" [disabled]="isSaving">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button (click)="deletePlan(plan)" class="p-2 text-slate-400 hover:text-red-500 transition-colors" [disabled]="isSaving">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <form [formGroup]="planForm" (ngSubmit)="savePlan()" class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-slide-up">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 class="text-xl font-bold text-blue-900">{{ isEditing ? 'Editar plan' : 'Nuevo plan' }}</h3>
              <p class="text-xs text-slate-400 mt-1">Las cuotas removidas tambien se eliminan del backend.</p>
            </div>
            <button type="button" (click)="closeModal()" [disabled]="isSaving || loadingInstallments" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg class="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            <div *ngIf="loadingInstallments" class="py-12 text-center">
              <div class="w-8 h-8 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-sm text-slate-500 font-medium">Cargando cuotas del plan...</p>
            </div>

            <ng-container *ngIf="!loadingInstallments">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Nombre del plan</label>
                  <input formControlName="name" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Anio academico</label>
                  <select formControlName="academic_year_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                    <option value="">Selecciona un anio</option>
                    <option *ngFor="let year of years" [value]="year.id">{{ year.year }}</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Concepto base</label>
                  <select formControlName="concept_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                    <option value="">Selecciona un concepto</option>
                    <option *ngFor="let concept of concepts" [value]="concept.id">{{ concept.name }} - S/ {{ concept.base_amount | number:'1.2-2' }}</option>
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Numero de cuotas</label>
                    <input formControlName="number_of_installments" type="number" min="1" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
                    <select formControlName="is_active" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                      <option [ngValue]="true">Activo</option>
                      <option [ngValue]="false">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div class="lg:col-span-2 space-y-2">
                  <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Descripcion</label>
                  <textarea formControlName="description" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"></textarea>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Concepto</p><p class="text-sm font-semibold text-slate-700">{{ selectedConcept?.name || 'Sin seleccionar' }}</p></div>
                <div><p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Monto base</p><p class="text-sm font-semibold text-slate-700">S/ {{ (selectedConcept?.base_amount || 0) | number:'1.2-2' }}</p></div>
                <div><p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Cuotas</p><p class="text-sm font-semibold text-slate-700">{{ installmentsFormArray.length || 0 }}</p></div>
                <div><p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total cuotas</p><p class="text-sm font-semibold text-slate-700">S/ {{ calculateTotalInstallments() | number:'1.2-2' }}</p></div>
              </div>

              <div class="space-y-4">
                <div class="flex flex-wrap gap-3">
                  <button type="button" (click)="generateInstallments()" class="px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-700 text-[13px] font-bold rounded-xl">Generar cuotas</button>
                  <button type="button" (click)="addInstallment()" class="px-5 py-2.5 bg-slate-100 text-slate-700 text-[13px] font-bold rounded-xl">Agregar cuota manual</button>
                </div>

                <div class="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-bold text-slate-800">Detalle de cuotas</h4>
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest">{{ installmentsFormArray.length }} registradas</span>
                  </div>
                  <div *ngIf="installmentsFormArray.length === 0" class="py-10 text-center text-slate-400 text-sm">Genera o agrega cuotas para completar el plan.</div>
                  <div formArrayName="installments" class="space-y-3" *ngIf="installmentsFormArray.length > 0">
                    <div *ngFor="let installmentControl of installmentsFormArray.controls; let i = index" [formGroupName]="i" class="grid grid-cols-1 md:grid-cols-[90px_1fr_1fr_44px] gap-3 items-center">
                      <div class="text-xs font-semibold text-slate-500">Cuota {{ i + 1 }}</div>
                      <input formControlName="due_date" type="date" class="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">S/</span>
                        <input formControlName="amount" type="number" step="0.01" min="0" class="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm">
                      </div>
                      <button type="button" (click)="removeInstallment(i)" class="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>

          <div class="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-4">
            <button (click)="closeModal()" type="button" [disabled]="isSaving || loadingInstallments" class="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl disabled:opacity-50">Cancelar</button>
            <button [disabled]="planForm.invalid || isSaving || loadingInstallments" type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              <svg *ngIf="isSaving" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ isEditing ? 'Actualizar plan' : 'Crear plan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class FinancePlansComponent implements OnInit {
  kpis = [
    { label: 'Total planes', value: 0 },
    { label: 'Activos', value: 0 },
    { label: 'Cuotas configuradas', value: 0 },
    { label: 'Monto total', value: 0 }
  ];

  plans: FinancialPlan[] = [];
  concepts: FeeConcept[] = [];
  years: any[] = [];
  loading = false;
  loadingInstallments = false;
  statusOptions = [
    { id: 'true', name: 'Activos' },
    { id: 'false', name: 'Inactivos' }
  ];
  yearOptions: Array<{ id: string; name: string }> = [];
  filters: { is_active: string; academic_year_id: string } = { is_active: '', academic_year_id: '' };
  showModal = false;
  isEditing = false;
  currentId: string | null = null;
  isSaving = false;
  planForm: FormGroup;
  originalInstallmentIds: string[] = [];
  activeYearId = '';

  constructor(
    private financeService: FinanceService,
    private academicService: AcademicService,
    private fb: FormBuilder
  ) {
    this.planForm = this.fb.group({
      name: ['', Validators.required],
      academic_year_id: ['', Validators.required],
      concept_id: ['', Validators.required],
      number_of_installments: [1, [Validators.required, Validators.min(1)]],
      description: [''],
      is_active: [true],
      installments: this.fb.array([])
    });
  }

  get installmentsFormArray(): FormArray {
    return this.planForm.get('installments') as FormArray;
  }

  get selectedConcept(): FeeConcept | undefined {
    const conceptId = this.planForm.get('concept_id')?.value;
    return this.concepts.find((concept) => concept.id === conceptId);
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadPlans();
  }

  loadInitialData(): void {
    this.academicService.getAcademicYears().subscribe({
      next: (response) => {
        const items = Array.isArray((response as any).data) ? (response as any).data : response;
        this.years = Array.isArray(items) ? items : [];
        this.yearOptions = this.years.map((year: any) => ({ id: year.id, name: String(year.year) }));
        const activeYear = this.years.find((year: any) => year.is_active);
        this.activeYearId = activeYear?.id || this.years[0]?.id || '';
        if (this.activeYearId && !this.planForm.get('academic_year_id')?.value) {
          this.planForm.patchValue({ academic_year_id: this.activeYearId });
        }
      }
    });

    this.financeService.getConcepts({ is_active: true, per_page: 200 }).subscribe({
      next: (response) => {
        this.concepts = this.financeService.unwrapItems(response);
      }
    });
  }

  loadPlans(): void {
    this.loading = true;
    this.financeService.getPlans({ ...this.filters, per_page: 200 }).subscribe({
      next: (response) => {
        this.plans = this.financeService.unwrapItems(response);
        this.updateKPIs();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los planes de pago.', 'error');
      }
    });
  }

  updateKPIs(): void {
    this.kpis[0].value = this.plans.length;
    this.kpis[1].value = this.plans.filter((plan) => plan.is_active).length;
    this.kpis[2].value = this.plans.reduce((sum, plan) => sum + this.getInstallmentsCount(plan), 0);
    this.kpis[3].value = this.plans.reduce((sum, plan) => sum + this.getPlanTotal(plan), 0);
  }

  applyFilters(key: 'is_active' | 'academic_year_id', value: string): void {
    this.filters[key] = value;
    this.loadPlans();
  }

  getInstallmentsCount(plan: FinancialPlan): number {
    return Number(plan.installments_count ?? plan.number_of_installments ?? plan.installments?.length ?? 0);
  }

  getPlanTotal(plan: FinancialPlan): number {
    if (typeof plan.total_amount === 'number') {
      return plan.total_amount;
    }
    if (Array.isArray(plan.installments) && plan.installments.length > 0) {
      return plan.installments.reduce((sum, installment) => sum + Number(installment.amount || 0), 0);
    }
    return Number(plan.concept?.base_amount || 0);
  }

  calculateTotalInstallments(): number {
    return this.installmentsFormArray.controls.reduce((sum, control) => sum + Number(control.get('amount')?.value || 0), 0);
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.currentId = null;
    this.loadingInstallments = false;
    this.originalInstallmentIds = [];
    this.installmentsFormArray.clear();
    this.planForm.reset({
      name: '',
      academic_year_id: this.activeYearId || '',
      concept_id: '',
      number_of_installments: 1,
      description: '',
      is_active: true
    });
  }

  editPlan(plan: FinancialPlan): void {
    this.showModal = true;
    this.isEditing = true;
    this.currentId = plan.id;
    this.loadingInstallments = true;
    this.originalInstallmentIds = [];
    this.installmentsFormArray.clear();
    this.planForm.patchValue({
      name: plan.name,
      academic_year_id: plan.academic_year_id,
      concept_id: plan.concept_id,
      number_of_installments: plan.number_of_installments ?? plan.installments_count ?? plan.installments?.length ?? 1,
      description: plan.description || '',
      is_active: plan.is_active
    });

    this.loadInstallments(plan);
  }

  closeModal(): void {
    if (this.isSaving || this.loadingInstallments) {
      return;
    }
    this.showModal = false;
    this.installmentsFormArray.clear();
    this.originalInstallmentIds = [];
  }

  addInstallment(): void {
    const date = new Date();
    date.setMonth(date.getMonth() + this.installmentsFormArray.length);
    this.installmentsFormArray.push(this.createInstallmentGroup({
      installment_number: this.installmentsFormArray.length + 1,
      due_date: date.toISOString().split('T')[0],
      amount: 0
    }));
    this.reindexInstallments();
  }

  removeInstallment(index: number): void {
    this.installmentsFormArray.removeAt(index);
    this.reindexInstallments();
  }

  generateInstallments(): void {
    const concept = this.selectedConcept;
    const count = Math.max(1, Number(this.planForm.get('number_of_installments')?.value || 1));

    if (!concept) {
      Swal.fire('Atencion', 'Selecciona un concepto base antes de generar cuotas.', 'warning');
      return;
    }

    const totalCents = Math.round(Number(concept.base_amount || 0) * 100);
    const baseCents = Math.floor(totalCents / count);
    const remainder = totalCents - (baseCents * count);

    this.installmentsFormArray.clear();
    for (let index = 0; index < count; index++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + index);
      const amountCents = baseCents + (index === count - 1 ? remainder : 0);
      this.installmentsFormArray.push(this.createInstallmentGroup({
        installment_number: index + 1,
        due_date: dueDate.toISOString().split('T')[0],
        amount: amountCents / 100
      }));
    }

    this.planForm.patchValue({ number_of_installments: count });
  }

  savePlan(): void {
    if (this.planForm.invalid || this.isSaving) {
      this.planForm.markAllAsTouched();
      return;
    }
    if (this.installmentsFormArray.length === 0) {
      Swal.fire('Atencion', 'Debes registrar al menos una cuota para guardar el plan.', 'warning');
      return;
    }

    const payload = {
      name: String(this.planForm.get('name')?.value || '').trim(),
      academic_year_id: this.planForm.get('academic_year_id')?.value,
      concept_id: this.planForm.get('concept_id')?.value,
      number_of_installments: Number(this.planForm.get('number_of_installments')?.value || this.installmentsFormArray.length || 1),
      description: String(this.planForm.get('description')?.value || '').trim() || null,
      is_active: this.planForm.get('is_active')?.value
    };

    if (!payload.name) {
      Swal.fire('Atencion', 'El nombre del plan es obligatorio.', 'warning');
      return;
    }

    this.isSaving = true;
    const request = this.isEditing && this.currentId
      ? this.financeService.updatePlan(this.currentId, payload)
      : this.financeService.createPlan(payload);

    request.subscribe({
      next: (response: any) => {
        const planId = String(this.currentId || response?.id || response?.data?.id || '');
        if (!planId) {
          this.isSaving = false;
          Swal.fire('Error', 'No se pudo identificar el plan guardado.', 'error');
          return;
        }
        this.syncInstallments(planId);
      },
      error: (error) => {
        this.isSaving = false;
        Swal.fire('Error', error?.error?.message || 'No se pudo guardar el plan.', 'error');
      }
    });
  }

  deletePlan(plan: FinancialPlan): void {
    Swal.fire({
      title: 'Eliminar plan',
      text: `Se eliminara "${plan.name}" y sus cuotas asociadas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.financeService.deletePlan(plan.id).subscribe({
        next: () => {
          this.loadPlans();
          Swal.fire('Eliminado', 'El plan fue eliminado correctamente.', 'success');
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo eliminar el plan.', 'error');
        }
      });
    });
  }

  private loadInstallments(plan: FinancialPlan): void {
    const embedded = Array.isArray(plan.installments) ? plan.installments : [];
    if (embedded.length > 0) {
      this.populateInstallments(embedded);
      this.loadingInstallments = false;
      return;
    }

    this.financeService.getInstallments({ plan_id: plan.id, per_page: 200 }).subscribe({
      next: (response) => {
        this.populateInstallments(this.financeService.unwrapItems(response));
        this.loadingInstallments = false;
      },
      error: () => {
        this.loadingInstallments = false;
        Swal.fire('Error', 'No se pudieron cargar las cuotas del plan.', 'error');
      }
    });
  }

  private populateInstallments(installments: PlanInstallment[]): void {
    const ordered = [...installments].sort((a, b) => Number(a.installment_number || 0) - Number(b.installment_number || 0));
    this.installmentsFormArray.clear();
    this.originalInstallmentIds = ordered.map((installment) => installment.id).filter(Boolean) as string[];
    ordered.forEach((installment, index) => {
      this.installmentsFormArray.push(this.createInstallmentGroup({
        id: installment.id,
        installment_number: installment.installment_number || index + 1,
        due_date: installment.due_date || '',
        amount: Number(installment.amount || 0)
      }));
    });
    this.reindexInstallments();
  }

  private createInstallmentGroup(installment?: Partial<PlanInstallment>): FormGroup {
    return this.fb.group({
      id: [installment?.id || null],
      installment_number: [installment?.installment_number || 1, Validators.required],
      due_date: [installment?.due_date || '', Validators.required],
      amount: [Number(installment?.amount || 0), [Validators.required, Validators.min(0)]]
    });
  }

  private reindexInstallments(): void {
    this.installmentsFormArray.controls.forEach((control, index) => {
      control.get('installment_number')?.setValue(index + 1, { emitEvent: false });
    });
    this.planForm.patchValue({ number_of_installments: this.installmentsFormArray.length || 1 }, { emitEvent: false });
  }

  private syncInstallments(planId: string): void {
    const currentInstallments = this.installmentsFormArray.controls.map((control, index) => ({
      id: control.get('id')?.value,
      installment_number: index + 1,
      due_date: control.get('due_date')?.value,
      amount: Number(control.get('amount')?.value || 0)
    }));

    const currentIds = currentInstallments.map((installment) => installment.id).filter(Boolean) as string[];
    const removedIds = this.originalInstallmentIds.filter((id) => !currentIds.includes(id));
    const requests: Observable<any>[] = [];

    removedIds.forEach((id) => {
      requests.push(this.financeService.deleteInstallment(id).pipe(catchError((error) => of({ __error: true, error }))));
    });

    currentInstallments.forEach((installment) => {
      const payload = {
        plan_id: planId,
        installment_number: installment.installment_number,
        due_date: installment.due_date,
        amount: installment.amount
      };

      if (installment.id) {
        requests.push(this.financeService.updateInstallment(installment.id, payload).pipe(catchError((error) => of({ __error: true, error }))));
      } else {
        requests.push(this.financeService.createInstallment(payload).pipe(catchError((error) => of({ __error: true, error }))));
      }
    });

    (requests.length > 0 ? forkJoin(requests) : of([])).subscribe({
      next: (results: any[]) => {
        this.isSaving = false;
        this.closeModal();
        this.loadPlans();
        const hasErrors = Array.isArray(results) && results.some((result) => result?.__error);
        Swal.fire(hasErrors ? 'Atencion' : 'Guardado', hasErrors ? 'El plan se guardo, pero algunas cuotas no se sincronizaron.' : 'El plan y sus cuotas fueron guardados correctamente.', hasErrors ? 'warning' : 'success');
      },
      error: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadPlans();
        Swal.fire('Atencion', 'El plan se guardo, pero hubo un problema al sincronizar cuotas.', 'warning');
      }
    });
  }
}
