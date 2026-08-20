import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AcademicService } from '@core/services/academic.service';
import { FeeConcept, FinanceService, FinancialPlan, PlanInstallment } from '@core/services/finance.service';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

@Component({
  selector: 'app-finance-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SettingMetricCardComponent, SettingFilterDropdownComponent],
  templateUrl: './finance-plans.component.html',
  styleUrls: ['./finance-plans.component.css']
})
export class FinancePlansComponent implements OnInit {
  // Emitido al hacer click en el concepto de un plan: FinanceCatalogComponent
  // cambia al tab Conceptos y resalta ese concepto.
  @Output() conceptChipClick = new EventEmitter<string>();

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
