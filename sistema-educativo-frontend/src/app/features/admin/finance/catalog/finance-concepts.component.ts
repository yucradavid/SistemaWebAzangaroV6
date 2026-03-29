//src/app/features/admin/finance/catalog/finance-concepts.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { FeeConcept, FinanceService } from '@core/services/finance.service';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

type ConceptType = FeeConcept['type'];
type ConceptPeriodicity = FeeConcept['periodicity'];

@Component({
  selector: 'app-finance-concepts',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule, ReactiveFormsModule, SettingMetricCardComponent, SettingFilterDropdownComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div class="space-y-2">
          <p class="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.25em]">Catalogo financiero</p>
          <div class="space-y-1">
            <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Conceptos de cobro</h1>
            <p class="text-slate-500 text-sm font-medium">Define conceptos, periodicidad y monto base para planes, cargos y caja.</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            (click)="resetFilters()"
            class="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all">
            Limpiar filtros
          </button>
          <button
            (click)="openModal()"
            class="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-red-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo concepto
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <app-setting-metric-card *ngFor="let kpi of kpis" [label]="kpi.label" [value]="kpi.value"></app-setting-metric-card>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] gap-4">
        <div class="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Buscar concepto</label>
          <input
            [(ngModel)]="filters.q"
            (ngModelChange)="onSearchChange()"
            type="text"
            placeholder="Nombre o descripcion"
            class="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
        </div>
        <div>
          <app-setting-filter-dropdown
            [options]="typeOptions"
            [selectedId]="filters.type"
            placeholder="Todos los tipos"
            (selectionChange)="applyFilters('type', $event)">
          </app-setting-filter-dropdown>
        </div>
        <div>
          <app-setting-filter-dropdown
            [options]="periodicityOptions"
            [selectedId]="filters.periodicity"
            placeholder="Toda periodicidad"
            (selectionChange)="applyFilters('periodicity', $event)">
          </app-setting-filter-dropdown>
        </div>
        <div>
          <app-setting-filter-dropdown
            [options]="statusOptions"
            [selectedId]="filters.is_active"
            placeholder="Todos los estados"
            (selectionChange)="applyFilters('is_active', $event)">
          </app-setting-filter-dropdown>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div class="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 px-8">
          <div>
            <h2 class="text-base font-semibold text-slate-800 tracking-tight">Conceptos ({{ concepts.length }})</h2>
            <p class="text-xs text-slate-400 mt-1">Base de matriculas, pensiones, servicios y cobros adicionales.</p>
          </div>
          <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            [class]="filters.is_active === 'true' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'">
            {{ filters.is_active === 'true' ? 'Solo activos' : 'Vista general' }}
          </span>
        </div>

        <div *ngIf="loading" class="py-20 text-center">
          <div class="w-10 h-10 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-400 text-sm font-medium">Cargando conceptos...</p>
        </div>

        <div *ngIf="!loading && concepts.length === 0" class="p-20 text-center text-slate-400">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          </div>
          No hay conceptos que coincidan con los filtros actuales.
        </div>

        <div *ngIf="!loading && concepts.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                <th class="py-5 px-8 text-left">Concepto</th>
                <th class="py-5 px-6 text-left">Tipo</th>
                <th class="py-5 px-6 text-left">Periodicidad</th>
                <th class="py-5 px-6 text-right">Monto base</th>
                <th class="py-5 px-6 text-center">Estado</th>
                <th class="py-5 px-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let concept of concepts" class="group hover:bg-slate-50/60 transition-colors">
                <td class="py-5 px-8">
                  <div class="space-y-1">
                    <div class="text-sm font-semibold text-slate-800">{{ concept.name }}</div>
                    <div class="text-[11px] text-slate-400">{{ concept.description || 'Sin descripcion adicional' }}</div>
                  </div>
                </td>
                <td class="py-5 px-6">
                  <span class="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                    {{ getTypeLabel(concept.type) }}
                  </span>
                </td>
                <td class="py-5 px-6">
                  <span class="text-sm font-medium text-slate-500">{{ getPeriodicityLabel(concept.periodicity) }}</span>
                </td>
                <td class="py-5 px-6 text-right">
                  <span class="text-sm font-bold text-slate-900 tracking-tight">S/ {{ concept.base_amount | number:'1.2-2' }}</span>
                </td>
                <td class="py-5 px-6 text-center">
                  <span
                    [class]="concept.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
                    class="px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                    {{ concept.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-5 px-8 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      (click)="editConcept(concept)"
                      class="p-2 text-slate-400 hover:text-blue-900 transition-colors"
                      [disabled]="saving">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      (click)="deleteConcept(concept)"
                      class="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      [disabled]="saving">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 class="text-xl font-bold text-blue-900">{{ isEditing ? 'Editar concepto' : 'Nuevo concepto' }}</h3>
              <p class="text-xs text-slate-400 mt-1">Este catalogo alimenta planes, emision de cargos y caja.</p>
            </div>
            <button (click)="closeModal()" class="p-2 hover:bg-slate-100 rounded-full transition-colors" [disabled]="saving">
              <svg class="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="conceptForm" (ngSubmit)="saveConcept()" class="p-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Nombre del concepto</label>
                <input formControlName="name" type="text" placeholder="Ej. Pension regular primaria" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Tipo</label>
                <select formControlName="type" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <option *ngFor="let option of allTypeOptions" [value]="option.id">{{ option.name }}</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Periodicidad</label>
                <select formControlName="periodicity" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <option *ngFor="let option of allPeriodicityOptions" [value]="option.id">{{ option.name }}</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Monto base</label>
                <input formControlName="base_amount" type="number" step="0.01" min="0" placeholder="0.00" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
                <select formControlName="is_active" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <option [ngValue]="true">Activo</option>
                  <option [ngValue]="false">Inactivo</option>
                </select>
              </div>

              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Descripcion</label>
                <textarea formControlName="description" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="Describe cuando se usa este concepto y como se ve en cobros o recibos."></textarea>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Tipo actual</p>
                <p class="text-sm font-semibold text-slate-700">{{ getTypeLabel(conceptForm.get('type')?.value) }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Periodicidad</p>
                <p class="text-sm font-semibold text-slate-700">{{ getPeriodicityLabel(conceptForm.get('periodicity')?.value) }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Monto base</p>
                <p class="text-sm font-semibold text-slate-700">S/ {{ (conceptForm.get('base_amount')?.value || 0) | number:'1.2-2' }}</p>
              </div>
            </div>

            <div class="flex gap-4 pt-2">
              <button (click)="closeModal()" type="button" [disabled]="saving" class="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                Cancelar
              </button>
              <button [disabled]="conceptForm.invalid || saving" type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg *ngIf="saving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ isEditing ? 'Actualizar concepto' : 'Crear concepto' }}
              </button>
            </div>
          </form>
        </div>
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
export class FinanceConceptsComponent implements OnInit, OnDestroy {
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

  ngOnDestroy(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
  }

  loadConcepts(): void {
    this.loading = true;

    this.financeService.getConcepts(this.filters).subscribe({
      next: (response) => {
        this.concepts = this.financeService.unwrapItems(response);
        this.updateKPIs();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los conceptos financieros.', 'error');
      }
    });
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
