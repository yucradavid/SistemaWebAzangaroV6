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
  templateUrl: './finance-emission.component.html',
  styleUrls: ['./finance-emission.component.css']
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
