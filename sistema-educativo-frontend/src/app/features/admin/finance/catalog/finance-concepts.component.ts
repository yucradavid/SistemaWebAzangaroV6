//src/app/features/admin/finance/catalog/finance-concepts.component.ts
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { FeeConcept, FinanceService } from '@core/services/finance.service';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

type ConceptType = FeeConcept['type'];
type ConceptPeriodicity = FeeConcept['periodicity'];

@Component({
  selector: 'app-finance-concepts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SettingMetricCardComponent, SettingFilterDropdownComponent],
  templateUrl: './finance-concepts.component.html',
  styleUrls: ['./finance-concepts.component.css']
})
export class FinanceConceptsComponent implements OnInit, OnChanges, OnDestroy {
  // Recibido desde FinanceCatalogComponent al hacer click en el chip de concepto
  // dentro del tab de Planes: resalta y hace scroll hacia la fila del concepto.
  @Input() highlightConceptId: string | null = null;

  activeHighlightId: string | null = null;
  private highlightTimer?: ReturnType<typeof setTimeout>;

  readonly allTypeOptions: Array<{ id: ConceptType; name: string }> = [
    { id: 'matricula', name: 'Matricula' },
    { id: 'pension', name: 'Pension' },
    { id: 'interes', name: 'Interes / mora' },
    { id: 'certificado', name: 'Certificado' },
    { id: 'taller', name: 'Taller' },
    { id: 'servicio', name: 'Servicio' },
    { id: 'otro', name: 'Otro' }
  ];

  readonly allPeriodicityOptions: Array<{ id: ConceptPeriodicity; name: string }> = [
    { id: 'unico', name: 'Pago unico' },
    { id: 'mensual', name: 'Mensual' },
    { id: 'anual', name: 'Anual' },
    { id: 'opcional', name: 'Opcional' }
  ];

  typeOptions = this.allTypeOptions;
  periodicityOptions = this.allPeriodicityOptions;
  statusOptions = [
    { id: 'true', name: 'Activos' },
    { id: 'false', name: 'Inactivos' }
  ];

  kpis = [
    { label: 'Total', value: 0 },
    { label: 'Activos', value: 0 },
    { label: 'Pensiones', value: 0 },
    { label: 'Servicios y otros', value: 0 }
  ];

  concepts: FeeConcept[] = [];
  loading = false;
  saving = false;
  filters: { q: string; type: string; periodicity: string; is_active: string } = {
    q: '',
    type: '',
    periodicity: '',
    is_active: ''
  };
  showModal = false;
  isEditing = false;
  currentId: string | null = null;
  conceptForm: FormGroup;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor(private financeService: FinanceService, private fb: FormBuilder) {
    this.conceptForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      base_amount: [0, [Validators.required, Validators.min(0)]],
      type: ['pension', Validators.required],
      periodicity: ['mensual', Validators.required],
      is_active: [true],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadConcepts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['highlightConceptId'] && this.highlightConceptId) {
      this.applyHighlight(this.highlightConceptId);
    }
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }
  }

  loadConcepts(): void {
    this.loading = true;

    this.financeService.getConcepts(this.filters).subscribe({
      next: (response) => {
        this.concepts = this.financeService.unwrapItems(response);
        this.updateKPIs();
        this.loading = false;
        if (this.highlightConceptId) {
          this.applyHighlight(this.highlightConceptId);
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los conceptos financieros.', 'error');
      }
    });
  }

  rowClass(concept: FeeConcept): string {
    const base = 'group hover:bg-slate-50/60 transition-colors';
    return concept.id === this.activeHighlightId
      ? base + ' ring-2 ring-inset ring-cermat-blue-500 bg-blue-50/60'
      : base;
  }

  private applyHighlight(conceptId: string): void {
    this.activeHighlightId = conceptId;

    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }

    setTimeout(() => {
      document.getElementById('concept-row-' + conceptId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    this.highlightTimer = setTimeout(() => {
      this.activeHighlightId = null;
    }, 2500);
  }

  updateKPIs(): void {
    this.kpis[0].value = this.concepts.length;
    this.kpis[1].value = this.concepts.filter((concept) => concept.is_active).length;
    this.kpis[2].value = this.concepts.filter((concept) => concept.type === 'pension').length;
    this.kpis[3].value = this.concepts.filter((concept) => ['servicio', 'taller', 'otro', 'certificado'].includes(concept.type)).length;
  }

  applyFilters(key: 'type' | 'periodicity' | 'is_active', value: string): void {
    this.filters[key] = value;
    this.loadConcepts();
  }

  onSearchChange(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }

    this.searchDebounce = setTimeout(() => this.loadConcepts(), 250);
  }

  resetFilters(): void {
    this.filters = { q: '', type: '', periodicity: '', is_active: '' };
    this.loadConcepts();
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.currentId = null;
    this.conceptForm.reset({
      name: '',
      base_amount: 0,
      type: 'pension',
      periodicity: 'mensual',
      is_active: true,
      description: ''
    });
  }

  editConcept(concept: FeeConcept): void {
    this.showModal = true;
    this.isEditing = true;
    this.currentId = concept.id;
    this.conceptForm.patchValue({
      name: concept.name,
      base_amount: concept.base_amount,
      type: concept.type,
      periodicity: concept.periodicity,
      is_active: concept.is_active,
      description: concept.description || ''
    });
  }

  closeModal(): void {
    if (this.saving) {
      return;
    }

    this.showModal = false;
  }

  saveConcept(): void {
    if (this.conceptForm.invalid || this.saving) {
      this.conceptForm.markAllAsTouched();
      return;
    }

    const name = String(this.conceptForm.get('name')?.value || '').trim();
    if (!name) {
      Swal.fire('Atencion', 'El nombre del concepto es obligatorio.', 'warning');
      return;
    }

    const data = {
      ...this.conceptForm.getRawValue(),
      name,
      base_amount: Number(this.conceptForm.get('base_amount')?.value || 0),
      description: String(this.conceptForm.get('description')?.value || '').trim() || null
    };

    this.saving = true;

    const request = this.isEditing && this.currentId
      ? this.financeService.updateConcept(this.currentId, data)
      : this.financeService.createConcept(data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadConcepts();
        Swal.fire('Guardado', 'El concepto financiero fue actualizado correctamente.', 'success');
      },
      error: (error) => {
        this.saving = false;
        Swal.fire('Error', error?.error?.message || 'No se pudo guardar el concepto.', 'error');
      }
    });
  }

  deleteConcept(concept: FeeConcept): void {
    Swal.fire({
      title: 'Eliminar concepto',
      text: `Se eliminara "${concept.name}" del catalogo financiero.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.financeService.deleteConcept(concept.id).subscribe({
        next: () => {
          this.loadConcepts();
          Swal.fire('Eliminado', 'El concepto fue eliminado correctamente.', 'success');
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo eliminar el concepto.', 'error');
        }
      });
    });
  }

  getTypeLabel(type?: ConceptType): string {
    const labels: Record<ConceptType, string> = {
      matricula: 'Matricula',
      pension: 'Pension',
      interes: 'Interes',
      certificado: 'Certificado',
      taller: 'Taller',
      servicio: 'Servicio',
      otro: 'Otro'
    };

    return type ? labels[type] : 'Sin tipo';
  }

  getPeriodicityLabel(periodicity?: ConceptPeriodicity): string {
    const labels: Record<ConceptPeriodicity, string> = {
      unico: 'Pago unico',
      mensual: 'Mensual',
      anual: 'Anual',
      opcional: 'Opcional'
    };

    return periodicity ? labels[periodicity] : 'Sin periodicidad';
  }
}
