import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Discount, FeeConcept, FinanceService, StudentDiscount } from '@core/services/finance.service';
import { AcademicService } from '@core/services/academic.service';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

@Component({
  selector: 'app-finance-discounts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SettingMetricCardComponent, SettingFilterDropdownComponent],
  templateUrl: './finance-discounts.component.html',
  styleUrls: ['./finance-discounts.component.css']
})
export class FinanceDiscountsComponent implements OnInit, OnDestroy {
  kpis = [
    { label: 'Total', value: 0 },
    { label: 'Activos', value: 0 },
    { label: 'Porcentaje', value: 0 },
    { label: 'Monto fijo', value: 0 }
  ];

  typeOptions = [
    { id: 'porcentaje', name: 'Porcentaje' },
    { id: 'monto_fijo', name: 'Monto fijo' }
  ];

  scopeOptions = [
    { id: 'todos', name: 'Global' },
    { id: 'pension', name: 'Pensiones' },
    { id: 'matricula', name: 'Matriculas' },
    { id: 'especifico', name: 'Concepto especifico' }
  ];

  statusOptions = [
    { id: 'true', name: 'Activos' },
    { id: 'false', name: 'Inactivos' }
  ];

  discounts: Discount[] = [];
  studentDiscounts: StudentDiscount[] = [];
  concepts: FeeConcept[] = [];
  academicYears: any[] = [];
  filters: { q: string; type: string; scope: string; is_active: string } = { q: '', type: '', scope: '', is_active: '' };
  loading = false;
  loadingAssignments = false;
  saving = false;
  assigningStudentDiscount = false;
  showModal = false;
  isEditing = false;
  currentId: string | null = null;
  discountForm: FormGroup;
  assignmentForm: FormGroup;
  studentSearchTerm = '';
  studentResults: any[] = [];
  selectedAssignmentStudent: any = null;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private studentSearchDebounce?: ReturnType<typeof setTimeout>;

  constructor(
    private financeService: FinanceService,
    private academicService: AcademicService,
    private fb: FormBuilder
  ) {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      type: ['porcentaje', Validators.required],
      value: [0, [Validators.required, Validators.min(0)]],
      scope: ['todos', Validators.required],
      specific_concept_id: [null],
      description: [''],
      is_active: [true]
    });

    this.assignmentForm = this.fb.group({
      academic_year_id: ['', Validators.required],
      discount_id: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDiscounts();
    this.loadInitialData();
    this.loadStudentDiscounts();
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    if (this.studentSearchDebounce) {
      clearTimeout(this.studentSearchDebounce);
    }
  }

  loadInitialData(): void {
    this.financeService.getConcepts({ is_active: true, per_page: 200 }).subscribe({
      next: (response) => {
        this.concepts = this.financeService.unwrapItems(response);
      }
    });

    this.academicService.getAcademicYears({ per_page: 100 }).subscribe({
      next: (response: any) => {
        const items = Array.isArray(response?.data) ? response.data : response;
        this.academicYears = Array.isArray(items) ? items : [];
        const activeYear = this.academicYears.find((year: any) => year.is_active);
        this.assignmentForm.patchValue({
          academic_year_id: activeYear?.id || ''
        });
      }
    });
  }

  loadDiscounts(): void {
    this.loading = true;

    this.financeService.getDiscounts(this.filters).subscribe({
      next: (response) => {
        this.discounts = this.financeService.unwrapItems(response);
        this.updateKPIs();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los descuentos.', 'error');
      }
    });
  }

  updateKPIs(): void {
    this.kpis[0].value = this.discounts.length;
    this.kpis[1].value = this.discounts.filter((discount) => discount.is_active).length;
    this.kpis[2].value = this.discounts.filter((discount) => discount.type === 'porcentaje').length;
    this.kpis[3].value = this.discounts.filter((discount) => discount.type === 'monto_fijo').length;
  }

  applyFilters(key: 'type' | 'scope' | 'is_active', value: string): void {
    this.filters[key] = value;
    this.loadDiscounts();
  }

  onSearchChange(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }

    this.searchDebounce = setTimeout(() => this.loadDiscounts(), 250);
  }

  resetFilters(): void {
    this.filters = { q: '', type: '', scope: '', is_active: '' };
    this.loadDiscounts();
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.currentId = null;
    this.discountForm.reset({
      name: '',
      type: 'porcentaje',
      value: 0,
      scope: 'todos',
      specific_concept_id: null,
      description: '',
      is_active: true
    });
  }

  editDiscount(discount: Discount): void {
    this.showModal = true;
    this.isEditing = true;
    this.currentId = discount.id;
    this.discountForm.patchValue({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      scope: discount.scope,
      specific_concept_id: discount.specific_concept_id ?? null,
      description: discount.description || '',
      is_active: discount.is_active
    });
  }

  closeModal(): void {
    if (this.saving) {
      return;
    }

    this.showModal = false;
  }

  onScopeChange(): void {
    if (this.discountForm.get('scope')?.value !== 'especifico') {
      this.discountForm.patchValue({ specific_concept_id: null });
    }
  }

  saveDiscount(): void {
    if (this.discountForm.invalid || this.saving) {
      this.discountForm.markAllAsTouched();
      return;
    }

    const name = String(this.discountForm.get('name')?.value || '').trim();
    if (!name) {
      Swal.fire('Atencion', 'El nombre del descuento es obligatorio.', 'warning');
      return;
    }

    if (this.discountForm.get('scope')?.value === 'especifico' && !this.discountForm.get('specific_concept_id')?.value) {
      Swal.fire('Atencion', 'Debes seleccionar un concepto especifico para este descuento.', 'warning');
      return;
    }

    const data = {
      ...this.discountForm.getRawValue(),
      name,
      value: Number(this.discountForm.get('value')?.value || 0),
      description: String(this.discountForm.get('description')?.value || '').trim() || null,
      specific_concept_id: this.discountForm.get('scope')?.value === 'especifico'
        ? this.discountForm.get('specific_concept_id')?.value
        : null
    };

    this.saving = true;

    const request = this.isEditing && this.currentId
      ? this.financeService.updateDiscount(this.currentId, data)
      : this.financeService.createDiscount(data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadDiscounts();
        Swal.fire('Guardado', 'El descuento fue actualizado correctamente.', 'success');
      },
      error: (error) => {
        this.saving = false;
        Swal.fire('Error', error?.error?.message || 'No se pudo guardar el descuento.', 'error');
      }
    });
  }

  deleteDiscount(discount: Discount): void {
    Swal.fire({
      title: 'Eliminar descuento',
      text: `Se eliminara "${discount.name}" del catalogo de descuentos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.financeService.deleteDiscount(discount.id).subscribe({
        next: () => {
          this.loadDiscounts();
          Swal.fire('Eliminado', 'El descuento fue eliminado correctamente.', 'success');
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo eliminar el descuento.', 'error');
        }
      });
    });
  }

  get activeDiscounts(): Discount[] {
    return this.discounts.filter((discount) => discount.is_active);
  }

  onStudentSearchChange(): void {
    if (this.studentSearchDebounce) {
      clearTimeout(this.studentSearchDebounce);
    }

    const query = this.studentSearchTerm.trim();
    if (query.length < 3) {
      this.studentResults = [];
      return;
    }

    this.studentSearchDebounce = setTimeout(() => {
      this.financeService.searchStudents(query).subscribe({
        next: (response) => {
          this.studentResults = this.financeService.unwrapItems(response);
        },
        error: () => {
          this.studentResults = [];
        }
      });
    }, 250);
  }

  selectStudentForAssignment(student: any): void {
    this.selectedAssignmentStudent = student;
    this.studentSearchTerm = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    this.studentResults = [];
  }

  loadStudentDiscounts(): void {
    this.loadingAssignments = true;

    this.financeService.getStudentDiscounts({ per_page: 300 }).subscribe({
      next: (response) => {
        this.studentDiscounts = this.financeService.unwrapItems(response);
        this.loadingAssignments = false;
      },
      error: () => {
        this.loadingAssignments = false;
        Swal.fire('Error', 'No se pudieron cargar los descuentos asignados.', 'error');
      }
    });
  }

  assignDiscountToStudent(): void {
    if (this.assignmentForm.invalid || !this.selectedAssignmentStudent || this.assigningStudentDiscount) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.assigningStudentDiscount = true;

    this.financeService.createStudentDiscount({
      student_id: this.selectedAssignmentStudent.id,
      discount_id: this.assignmentForm.get('discount_id')?.value,
      academic_year_id: this.assignmentForm.get('academic_year_id')?.value,
      notes: String(this.assignmentForm.get('notes')?.value || '').trim() || null
    }).subscribe({
      next: () => {
        this.assigningStudentDiscount = false;
        this.assignmentForm.patchValue({ discount_id: '', notes: '' });
        this.loadStudentDiscounts();
        Swal.fire('Asignado', 'El descuento fue asignado al alumno correctamente.', 'success');
      },
      error: (error) => {
        this.assigningStudentDiscount = false;
        Swal.fire('Error', error?.error?.message || 'No se pudo asignar el descuento.', 'error');
      }
    });
  }

  removeStudentDiscount(item: StudentDiscount): void {
    Swal.fire({
      title: 'Quitar descuento',
      text: `Se quitara "${item.discount?.name || 'el descuento'}" al alumno seleccionado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.financeService.deleteStudentDiscount(item.id).subscribe({
        next: () => {
          this.loadStudentDiscounts();
          Swal.fire('Quitado', 'El descuento fue retirado del alumno.', 'success');
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo quitar el descuento.', 'error');
        }
      });
    });
  }

  getStudentLabel(student: any): string {
    if (!student) {
      return 'Alumno no identificado';
    }

    return `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.name || 'Alumno';
  }

  getScopeLabel(discount: Discount): string {
    switch (discount.scope) {
      case 'todos':
        return 'Global para todos los cobros';
      case 'pension':
        return 'Aplica a todas las pensiones';
      case 'matricula':
        return 'Aplica a todas las matriculas';
      case 'especifico':
        return 'Ligado a un concepto especifico';
      default:
        return 'Sin alcance';
    }
  }

  getDraftScopeLabel(): string {
    const scope = this.discountForm.get('scope')?.value;

    if (scope === 'especifico') {
      const conceptId = this.discountForm.get('specific_concept_id')?.value;
      const concept = this.concepts.find((item) => item.id === conceptId);
      return concept?.name || 'Concepto especifico';
    }

    switch (scope) {
      case 'todos':
        return 'Global';
      case 'pension':
        return 'Todas las pensiones';
      case 'matricula':
        return 'Todas las matriculas';
      default:
        return 'Sin alcance';
    }
  }
}
