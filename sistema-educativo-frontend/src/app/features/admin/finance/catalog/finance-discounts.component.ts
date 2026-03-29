import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { Discount, FeeConcept, FinanceService, StudentDiscount } from '@core/services/finance.service';
import { AcademicService } from '@core/services/academic.service';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';

@Component({
  selector: 'app-finance-discounts',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule, ReactiveFormsModule, SettingMetricCardComponent, SettingFilterDropdownComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div class="space-y-1">
          <p class="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.25em]">Catalogo financiero</p>
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Descuentos</h1>
          <p class="text-slate-500 text-sm font-medium">Administra descuentos globales, por pension, matricula o concepto especifico.</p>
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
            Nuevo descuento
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <app-setting-metric-card *ngFor="let kpi of kpis" [label]="kpi.label" [value]="kpi.value"></app-setting-metric-card>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] gap-4">
        <div class="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Buscar descuento</label>
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
            [options]="scopeOptions"
            [selectedId]="filters.scope"
            placeholder="Todos los alcances"
            (selectionChange)="applyFilters('scope', $event)">
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
            <h2 class="text-base font-semibold text-slate-800 tracking-tight">Descuentos ({{ discounts.length }})</h2>
            <p class="text-xs text-slate-400 mt-1">Reglas para becas, convenios, promociones y rebajas manuales.</p>
          </div>
        </div>

        <div *ngIf="loading" class="py-20 text-center">
          <div class="w-10 h-10 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-400 text-sm font-medium">Cargando descuentos...</p>
        </div>

        <div *ngIf="!loading && discounts.length === 0" class="p-20 text-center text-slate-400">
          No hay descuentos registrados con los filtros actuales.
        </div>

        <div *ngIf="!loading && discounts.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                <th class="py-5 px-8 text-left">Descuento</th>
                <th class="py-5 px-6 text-center">Tipo</th>
                <th class="py-5 px-6 text-center">Valor</th>
                <th class="py-5 px-6 text-left">Alcance</th>
                <th class="py-5 px-6 text-center">Estado</th>
                <th class="py-5 px-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let discount of discounts" class="group hover:bg-slate-50/50 transition-colors">
                <td class="py-5 px-8">
                  <div class="space-y-1">
                    <div class="text-sm font-semibold text-slate-800">{{ discount.name }}</div>
                    <div class="text-[11px] text-slate-400">{{ discount.description || 'Sin descripcion adicional' }}</div>
                  </div>
                </td>
                <td class="py-5 px-6 text-center">
                  <span class="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                    {{ discount.type === 'porcentaje' ? 'Porcentaje' : 'Monto fijo' }}
                  </span>
                </td>
                <td class="py-5 px-6 text-center">
                  <span class="text-sm font-semibold text-slate-800">
                    {{ discount.type === 'porcentaje' ? discount.value + '%' : 'S/ ' + (discount.value | number:'1.2-2') }}
                  </span>
                </td>
                <td class="py-5 px-6">
                  <div class="text-sm font-medium text-slate-700">{{ getScopeLabel(discount) }}</div>
                  <div *ngIf="discount.scope === 'especifico'" class="text-[11px] text-slate-400">{{ discount.concept?.name || 'Concepto no cargado' }}</div>
                </td>
                <td class="py-5 px-6 text-center">
                  <span
                    [class]="discount.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
                    class="px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                    {{ discount.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-5 px-8 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      (click)="editDiscount(discount)"
                      class="p-2 text-slate-400 hover:text-blue-900 transition-colors"
                      [disabled]="saving">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      (click)="deleteDiscount(discount)"
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

      <div class="grid grid-cols-1 xl:grid-cols-[1.05fr_1.25fr] gap-6">
        <div class="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-50 bg-slate-50/30">
            <h2 class="text-base font-semibold text-slate-800 tracking-tight">Asignar descuento a alumno</h2>
            <p class="text-xs text-slate-400 mt-1">Aplica descuentos activos del catalogo a estudiantes concretos.</p>
          </div>

          <form [formGroup]="assignmentForm" (ngSubmit)="assignDiscountToStudent()" class="p-6 space-y-5">
            <div class="space-y-2 relative">
              <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Buscar estudiante</label>
              <input
                [(ngModel)]="studentSearchTerm"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onStudentSearchChange()"
                type="text"
                placeholder="Nombre, codigo o DNI"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">

              <div *ngIf="studentResults.length > 0" class="absolute z-40 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
                <button
                  *ngFor="let student of studentResults"
                  (click)="selectStudentForAssignment(student)"
                  type="button"
                  class="w-full px-4 py-3 text-left border-b border-slate-50 last:border-b-0 hover:bg-slate-50">
                  <div class="text-sm font-semibold text-slate-800">{{ student.first_name }} {{ student.last_name }}</div>
                  <div class="text-[11px] text-slate-400">DNI: {{ student.dni || '-' }} | Codigo: {{ student.student_code || '-' }}</div>
                </button>
              </div>
            </div>

            <div *ngIf="selectedAssignmentStudent" class="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p class="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mb-1">Alumno seleccionado</p>
              <p class="text-sm font-bold text-blue-900">{{ selectedAssignmentStudent.first_name }} {{ selectedAssignmentStudent.last_name }}</p>
              <p class="text-xs text-blue-700">DNI: {{ selectedAssignmentStudent.dni || '-' }} | Codigo: {{ selectedAssignmentStudent.student_code || '-' }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Anio academico</label>
              <select formControlName="academic_year_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                <option value="">Selecciona un anio</option>
                <option *ngFor="let year of academicYears" [value]="year.id">{{ year.year }}</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Descuento</label>
              <select formControlName="discount_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                <option value="">Selecciona un descuento</option>
                <option *ngFor="let discount of activeDiscounts" [value]="discount.id">{{ discount.name }}</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Observacion</label>
              <textarea formControlName="notes" rows="3" placeholder="Motivo o detalle de la asignacion" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"></textarea>
            </div>

            <button
              [disabled]="assignmentForm.invalid || assigningStudentDiscount || !selectedAssignmentStudent"
              type="submit"
              class="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {{ assigningStudentDiscount ? 'Asignando...' : 'Asignar descuento' }}
            </button>
          </form>
        </div>

        <div class="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold text-slate-800 tracking-tight">Descuentos asignados</h2>
              <p class="text-xs text-slate-400 mt-1">Relacion operativa por alumno y anio academico.</p>
            </div>
            <button (click)="loadStudentDiscounts()" class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-600">
              Actualizar
            </button>
          </div>

          <div *ngIf="loadingAssignments" class="py-16 text-center">
            <div class="w-8 h-8 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-400 text-sm font-medium">Cargando descuentos asignados...</p>
          </div>

          <div *ngIf="!loadingAssignments && studentDiscounts.length === 0" class="py-16 text-center text-slate-400 text-sm">
            No hay descuentos asignados todavia.
          </div>

          <div *ngIf="!loadingAssignments && studentDiscounts.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-50">
                  <th class="py-4 px-6 text-left">Alumno</th>
                  <th class="py-4 px-6 text-left">Descuento</th>
                  <th class="py-4 px-6 text-left">Anio</th>
                  <th class="py-4 px-6 text-left">Observacion</th>
                  <th class="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let item of studentDiscounts" class="hover:bg-slate-50/50">
                  <td class="py-4 px-6">
                    <div class="text-sm font-semibold text-slate-800">{{ getStudentLabel(item.student) }}</div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="text-sm font-semibold text-slate-800">{{ item.discount?.name || 'Descuento' }}</div>
                    <div class="text-[11px] text-slate-400">{{ item.discount?.type === 'porcentaje' ? (item.discount?.value + '%') : ('S/ ' + (item.discount?.value || 0 | number:'1.2-2')) }}</div>
                  </td>
                  <td class="py-4 px-6 text-sm text-slate-500">{{ item.academic_year?.year || '-' }}</td>
                  <td class="py-4 px-6 text-sm text-slate-500">{{ item.notes || 'Sin observacion' }}</td>
                  <td class="py-4 px-6 text-right">
                    <button
                      (click)="removeStudentDiscount(item)"
                      class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-white border border-red-200 text-red-600">
                      Quitar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 class="text-xl font-bold text-blue-900">{{ isEditing ? 'Editar descuento' : 'Nuevo descuento' }}</h3>
              <p class="text-xs text-slate-400 mt-1">Usa descuentos globales o amarrados a un concepto especifico.</p>
            </div>
            <button (click)="closeModal()" class="p-2 hover:bg-slate-100 rounded-full transition-colors" [disabled]="saving">
              <svg class="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="discountForm" (ngSubmit)="saveDiscount()" class="p-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Nombre del descuento</label>
                <input formControlName="name" type="text" placeholder="Ej. Beca por excelencia" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Tipo</label>
                <select formControlName="type" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <option value="porcentaje">Porcentaje</option>
                  <option value="monto_fijo">Monto fijo</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Valor</label>
                <input formControlName="value" type="number" min="0" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Alcance</label>
                <select formControlName="scope" (change)="onScopeChange()" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <option value="todos">Global</option>
                  <option value="pension">Todas las pensiones</option>
                  <option value="matricula">Todas las matriculas</option>
                  <option value="especifico">Concepto especifico</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
                <select formControlName="is_active" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <option [ngValue]="true">Activo</option>
                  <option [ngValue]="false">Inactivo</option>
                </select>
              </div>

              <div *ngIf="discountForm.get('scope')?.value === 'especifico'" class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Concepto</label>
                <select formControlName="specific_concept_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <option [ngValue]="null">Selecciona un concepto</option>
                  <option *ngFor="let concept of concepts" [value]="concept.id">{{ concept.name }}</option>
                </select>
              </div>

              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Descripcion</label>
                <textarea formControlName="description" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="Explica si aplica por beca, convenio, hermanos, puntualidad u otro criterio."></textarea>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                <p class="text-sm font-semibold text-slate-700">
                  {{ discountForm.get('type')?.value === 'porcentaje'
                      ? (discountForm.get('value')?.value || 0) + '%'
                      : 'S/ ' + ((discountForm.get('value')?.value || 0) | number:'1.2-2') }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Alcance</p>
                <p class="text-sm font-semibold text-slate-700">{{ getDraftScopeLabel() }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                <p class="text-sm font-semibold text-slate-700">{{ discountForm.get('is_active')?.value ? 'Activo' : 'Inactivo' }}</p>
              </div>
            </div>

            <div class="flex gap-4 pt-2">
              <button (click)="closeModal()" type="button" [disabled]="saving" class="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                Cancelar
              </button>
              <button [disabled]="discountForm.invalid || saving" type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg *ngIf="saving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ isEditing ? 'Actualizar descuento' : 'Crear descuento' }}
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
