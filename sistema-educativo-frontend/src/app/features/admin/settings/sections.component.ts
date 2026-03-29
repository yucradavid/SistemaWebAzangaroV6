//src/app/features/admin/settings/sections.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { AcademicService, GradeLevel, Section } from '@core/services/academic.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';

interface SectionGroup {
  gradeId: string;
  gradeName: string;
  level: string;
  sections: Section[];
}

interface SectionRelationDetail {
  key: string;
  label: string;
  value: number;
  tone: string;
}

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BackButtonComponent,
    SettingMetricCardComponent,
    SettingFilterDropdownComponent,
  ],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700 relative">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
        <div class="flex items-center gap-4">
          <app-back-button></app-back-button>
          <div class="space-y-1">
            <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Secciones</h1>
            <p class="text-slate-500 text-sm font-medium">Gestiona las secciones por grado academico</p>
          </div>
        </div>
        <button
          (click)="openModal()"
          [disabled]="!activeAcademicYearId"
          class="px-6 py-3 bg-gradient-to-r from-[#0E3A8A] to-[#C026D3] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Seccion
        </button>
      </div>

      <div class="flex flex-wrap gap-3 mt-2 mb-6">
        <app-setting-metric-card label="Secciones" [value]="totalSections"></app-setting-metric-card>
        <app-setting-metric-card label="Aforo Total" [value]="totalCapacity"></app-setting-metric-card>
        <app-setting-metric-card label="Estudiantes" [value]="totalStudents"></app-setting-metric-card>
        <app-setting-metric-card label="Ano Activo" [value]="activeAcademicYearLabel"></app-setting-metric-card>
      </div>

      <div *ngIf="!activeAcademicYearId && !loading" class="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
        <p class="text-sm font-semibold">No hay un ano academico activo.</p>
        <p class="text-xs mt-1">Activa un ano academico antes de registrar secciones nuevas.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:max-w-md">
              <app-setting-filter-dropdown
                [options]="gradeLevels"
                [selectedId]="selectedGradeFilter"
                placeholder="Todos los grados"
                (selectionChange)="filterByGrade($event)">
              </app-setting-filter-dropdown>
            </div>

            <div class="relative">
              <input
                [(ngModel)]="searchTerm"
                (ngModelChange)="applyFilters()"
                type="text"
                placeholder="Buscar por seccion o grado"
                class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <button
                *ngIf="searchTerm"
                type="button"
                (click)="clearSearch()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">
                Limpiar
              </button>
            </div>
          </div>

          <div *ngIf="loading" class="flex justify-center p-12">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div *ngIf="!loading" class="space-y-8">
            <div *ngFor="let group of filteredGroupedSections" class="space-y-5">
              <div class="flex items-center gap-3 border-l-[3px] pl-4"
                [ngClass]="group.level === 'primaria' ? 'border-blue-600' : group.level === 'secundaria' ? 'border-violet-600' : 'border-amber-500'">
                <h2 class="text-base font-bold text-[#0F172A] uppercase tracking-wide">
                  {{ humanizeLevel(group.level) }} · {{ group.gradeName }}
                </h2>
                <span class="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full">{{ group.sections.length }}</span>
              </div>

              <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div
                  *ngFor="let section of group.sections"
                  class="bg-white border border-slate-100 rounded-[1.75rem] p-5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">

                  <div class="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-blue-50 transition-colors"></div>

                  <div class="relative z-10 space-y-5">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md"
                          [ngClass]="group.level === 'primaria' ? 'bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8]' : group.level === 'secundaria' ? 'bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED]' : 'bg-gradient-to-br from-amber-500 to-orange-500'">
                          <span class="text-xl font-bold leading-none">{{ sectionDisplayName(section) }}</span>
                        </div>
                        <div class="space-y-1">
                          <h3 class="text-lg font-semibold text-[#0F172A] leading-tight">
                            Seccion {{ sectionDisplayName(section) }}
                          </h3>
                          <p class="text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">
                            {{ group.gradeName }}
                          </p>
                          <div class="flex flex-wrap gap-2">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                              [ngClass]="occupancyRate(section) >= 100 ? 'bg-red-50 text-red-700 border-red-200' : occupancyRate(section) >= 80 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                              {{ occupancyRate(section) | number:'1.0-0' }}% ocupacion
                            </span>
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                              [ngClass]="relatedRecordsCount(section) > 0 ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                              {{ relatedRecordsCount(section) > 0 ? relatedRecordsCount(section) + ' vinculaciones' : 'Libre' }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="flex gap-2 border border-slate-100 rounded-xl p-1 bg-slate-50/70">
                        <button
                          (click)="openModal(section)"
                          class="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white shadow-sm"
                          title="Editar">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          (click)="deleteSection(section)"
                          [disabled]="!canDeleteSection(section)"
                          [attr.title]="getDeleteTooltip(section)"
                          class="p-2 transition-colors rounded-lg shadow-sm disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-300"
                          [ngClass]="canDeleteSection(section) ? 'text-slate-400 hover:text-red-600 hover:bg-white' : 'text-slate-300'">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3">
                      <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Capacidad</p>
                        <p class="mt-1 text-sm font-semibold text-slate-700">{{ section.capacity }}</p>
                      </div>
                      <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estudiantes</p>
                        <p class="mt-1 text-sm font-semibold text-slate-700">{{ occupiedSeats(section) }}</p>
                      </div>
                      <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Disponibles</p>
                        <p class="mt-1 text-sm font-semibold text-slate-700">{{ availableSeats(section) }}</p>
                      </div>
                    </div>

                    <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full transition-all"
                        [ngClass]="occupancyRate(section) >= 100 ? 'bg-red-500' : occupancyRate(section) >= 80 ? 'bg-amber-500' : 'bg-blue-500'"
                        [style.width.%]="progressWidth(section)"></div>
                    </div>

                    <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 overflow-hidden">
                      <button
                        type="button"
                        (click)="toggleDetails(section.id)"
                        class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/70 transition-colors">
                        <div>
                          <p class="text-sm font-semibold text-slate-700">Detalles de la seccion</p>
                          <p class="text-[11px] text-slate-400">
                            {{ relatedRecordsCount(section) > 0 ? 'Dependencias, ocupacion y bloqueo de eliminacion' : 'Seccion sin dependencias registradas' }}
                          </p>
                        </div>
                        <svg
                          class="w-4 h-4 text-slate-400 transition-transform"
                          [ngClass]="isDetailsExpanded(section.id) ? 'rotate-180' : ''"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </button>

                      <div *ngIf="isDetailsExpanded(section.id)" class="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100 bg-white/70">
                        <div *ngIf="relationDetails(section).length > 0; else noRelationsBlock" class="flex flex-wrap gap-2">
                          <span
                            *ngFor="let detail of relationDetails(section)"
                            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold"
                            [ngClass]="detail.tone">
                            <span>{{ detail.label }}</span>
                            <span class="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-white/80 px-1">{{ detail.value }}</span>
                          </span>
                        </div>

                        <ng-template #noRelationsBlock>
                          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700 font-medium">
                            Esta seccion no tiene alumnos, matriculas, horarios, tareas ni anuncios vinculados.
                          </div>
                        </ng-template>

                        <div class="grid grid-cols-2 gap-3 text-[12px]">
                          <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p class="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Ano</p>
                            <p class="mt-1 font-semibold text-slate-700">{{ academicYearLabel(section.academic_year_id) }}</p>
                          </div>
                          <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p class="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Eliminar</p>
                            <p class="mt-1 font-semibold text-slate-700">{{ canDeleteSection(section) ? 'Si' : 'No' }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="filteredGroupedSections.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg class="w-16 h-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p class="text-sm font-semibold">No hay secciones para los filtros actuales</p>
              <p class="text-xs mt-1">Ajusta el grado o el texto de busqueda</p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-[1.75rem] bg-white border border-slate-100 p-5 shadow-sm">
            <p class="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">Resumen</p>
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Nivel Inicial</span>
                <span class="font-semibold text-slate-700">{{ countSectionsByLevel('inicial') }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Primaria</span>
                <span class="font-semibold text-slate-700">{{ countSectionsByLevel('primaria') }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Secundaria</span>
                <span class="font-semibold text-slate-700">{{ countSectionsByLevel('secundaria') }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Con alumnos</span>
                <span class="font-semibold text-slate-700">{{ sectionsWithStudents }}</span>
              </div>
            </div>
          </div>

          <div class="rounded-[1.75rem] bg-white border border-slate-100 p-5 shadow-sm">
            <p class="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">Operacion</p>
            <div class="mt-4 space-y-3 text-sm text-slate-600">
              <p>Las nuevas secciones se registran sobre el ano academico activo.</p>
              <p>La ocupacion usa el conteo real de estudiantes asignados a la seccion.</p>
              <p>El borrado se bloquea si existen dependencias como alumnos, matriculas, horarios, tareas o anuncios.</p>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 animate-slide-up overflow-hidden border border-slate-100">
          <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 class="text-xl font-bold text-slate-800 tracking-tight">{{ isEditing ? 'Editar Seccion' : 'Nueva Seccion' }}</h2>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ isEditing ? 'Actualiza grado, letra y capacidad de la seccion.' : 'La seccion se creara en el ano academico activo.' }}
              </p>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="sectionForm" (ngSubmit)="saveSection()" class="p-8 space-y-5">
            <div class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span class="font-semibold text-slate-700">Ano:</span> {{ activeAcademicYearLabel }}
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grado Academico</label>
              <select
                formControlName="grade_level_id"
                class="w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                [ngClass]="isFieldInvalid('grade_level_id') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
                <option value="">Selecciona un grado...</option>
                <option *ngFor="let grade of gradeLevels" [value]="grade.id">
                  {{ grade.name }} ({{ humanizeLevel(grade.level) }})
                </option>
              </select>
              <p *ngIf="isFieldInvalid('grade_level_id')" class="text-[11px] text-red-500 font-semibold">Debe seleccionar un grado.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Letra o Codigo</label>
              <input
                type="text"
                formControlName="name"
                maxlength="5"
                placeholder="Ej: A"
                class="w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold uppercase transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white hover:border-slate-300"
                [ngClass]="isFieldInvalid('name') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
              <p *ngIf="isFieldInvalid('name')" class="text-[11px] text-red-500 font-semibold">La seccion es obligatoria y no puede superar 5 caracteres.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Capacidad Maxima</label>
              <input
                type="number"
                formControlName="capacity"
                placeholder="Ej: 30"
                class="w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white hover:border-slate-300"
                [ngClass]="isFieldInvalid('capacity') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
              <p *ngIf="isFieldInvalid('capacity')" class="text-[11px] text-red-500 font-semibold">La capacidad debe estar entre 1 y 80.</p>
            </div>

            <div class="pt-2 flex gap-3">
              <button
                type="button"
                (click)="closeModal()"
                class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95">
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="sectionForm.invalid || isSubmitting"
                class="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ isEditing ? 'Guardar Cambios' : 'Registrar Seccion' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SectionsComponent implements OnInit {
  sections: Section[] = [];
  gradeLevels: GradeLevel[] = [];
  groupedSections: SectionGroup[] = [];
  filteredGroupedSections: SectionGroup[] = [];

  loading = false;
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  currentEditId: string | null = null;
  selectedGradeFilter = '';
  searchTerm = '';
  activeAcademicYearId: string | null = null;
  activeAcademicYearLabel = 'Sin activo';
  expandedSectionIds: Record<string, boolean> = {};

  sectionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.sectionForm = this.fb.group({
      grade_level_id: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(5)]],
      capacity: [30, [Validators.required, Validators.min(1), Validators.max(80)]],
    });
  }

  get totalSections(): number {
    return this.sections.length;
  }

  get totalCapacity(): number {
    return this.sections.reduce((sum, section) => sum + Number(section.capacity || 0), 0);
  }

  get totalStudents(): number {
    return this.sections.reduce((sum, section) => sum + this.occupiedSeats(section), 0);
  }

  get sectionsWithStudents(): number {
    return this.sections.filter((section) => this.occupiedSeats(section) > 0).length;
  }

  ngOnInit(): void {
    this.loadData();
  }

  humanizeLevel(level: string): string {
    const labels: Record<string, string> = {
      inicial: 'Inicial',
      primaria: 'Primaria',
      secundaria: 'Secundaria',
    };

    return labels[level] || level;
  }

  sectionDisplayName(section: Section): string {
    return String(section.name || section.section_letter || '').toUpperCase();
  }

  occupiedSeats(section: Section): number {
    return Number(section.students_count ?? 0);
  }

  availableSeats(section: Section): number {
    return Math.max(Number(section.capacity || 0) - this.occupiedSeats(section), 0);
  }

  occupancyRate(section: Section): number {
    const capacity = Number(section.capacity || 0);
    if (!capacity) {
      return 0;
    }

    return (this.occupiedSeats(section) / capacity) * 100;
  }

  progressWidth(section: Section): number {
    return Math.min(this.occupancyRate(section), 100);
  }

  relatedRecordsCount(section: Section): number {
    return (section.students_count ?? 0)
      + (section.student_course_enrollments_count ?? 0)
      + (section.teacher_course_assignments_count ?? 0)
      + (section.course_schedules_count ?? 0)
      + (section.assignments_count ?? 0)
      + (section.announcements_count ?? 0)
      + (section.attendances_count ?? 0);
  }

  relationDetails(section: Section): SectionRelationDetail[] {
    return [
      { key: 'students', label: 'Alumnos', value: section.students_count ?? 0, tone: 'bg-blue-50 text-blue-700 border-blue-200' },
      { key: 'enrollments', label: 'Matriculas', value: section.student_course_enrollments_count ?? 0, tone: 'bg-sky-50 text-sky-700 border-sky-200' },
      { key: 'teachers', label: 'Asignaciones docentes', value: section.teacher_course_assignments_count ?? 0, tone: 'bg-violet-50 text-violet-700 border-violet-200' },
      { key: 'schedules', label: 'Horarios', value: section.course_schedules_count ?? 0, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
      { key: 'assignments', label: 'Tareas', value: section.assignments_count ?? 0, tone: 'bg-rose-50 text-rose-700 border-rose-200' },
      { key: 'announcements', label: 'Anuncios', value: section.announcements_count ?? 0, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { key: 'attendance', label: 'Asistencias', value: section.attendances_count ?? 0, tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    ].filter((detail) => detail.value > 0);
  }

  canDeleteSection(section: Section): boolean {
    return this.relatedRecordsCount(section) === 0;
  }

  getDeleteTooltip(section: Section): string {
    if (!this.canDeleteSection(section)) {
      return 'No puedes eliminar esta seccion porque tiene registros vinculados.';
    }

    return 'Eliminar';
  }

  academicYearLabel(academicYearId: string): string {
    const year = this.sections.find((section) => section.academic_year_id === academicYearId)?.academic_year?.year;
    return year ? String(year) : this.activeAcademicYearLabel;
  }

  countSectionsByLevel(level: string): number {
    return this.sections.filter((section) => section.grade_level?.level === level || this.gradeLevels.find((grade) => grade.id === section.grade_level_id)?.level === level).length;
  }

  toggleDetails(sectionId: string): void {
    this.expandedSectionIds[sectionId] = !this.expandedSectionIds[sectionId];
  }

  isDetailsExpanded(sectionId: string): boolean {
    return !!this.expandedSectionIds[sectionId];
  }

  isFieldInvalid(field: string): boolean {
    const control = this.sectionForm.get(field);
    return !!(control?.invalid && (control.dirty || control.touched));
  }

  filterByGrade(value: string): void {
    this.selectedGradeFilter = value;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      academicYears: this.academicService.getAcademicYears({ per_page: 100, simple: true }),
      gradeLevels: this.academicService.getGradeLevels({ per_page: 100, simple: true }),
    }).subscribe({
      next: ({ academicYears, gradeLevels }) => {
        const years = this.extractCollection<any>(academicYears);
        const activeYear = years.find((year: any) => year.is_active);

        this.activeAcademicYearId = activeYear?.id || null;
        this.activeAcademicYearLabel = activeYear?.year ? String(activeYear.year) : 'Sin activo';
        this.gradeLevels = this.extractCollection<GradeLevel>(gradeLevels);

        const params: Record<string, string | number | boolean> = { per_page: 300, simple: true };
        if (this.activeAcademicYearId) {
          params['academic_year_id'] = this.activeAcademicYearId;
        }

        this.academicService.getSections(params).subscribe({
          next: (sectionsResponse) => {
            this.sections = this.extractCollection<Section>(sectionsResponse);
            this.groupSections();
            this.applyFilters();
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            Swal.fire('Error', err?.error?.message || 'No se pudieron cargar las secciones.', 'error');
          },
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'No se pudieron cargar los catalogos base.', 'error');
      },
    });
  }

  groupSections(): void {
    const groups: Record<string, SectionGroup> = {};

    this.gradeLevels.forEach((grade) => {
      groups[grade.id] = {
        gradeId: grade.id,
        gradeName: grade.name,
        level: grade.level,
        sections: [],
      };
    });

    this.sections.forEach((section) => {
      const group = groups[section.grade_level_id];
      if (group) {
        if (!section.grade_level) {
          section.grade_level = this.gradeLevels.find((grade) => grade.id === section.grade_level_id);
        }
        group.sections.push(section);
      }
    });

    this.groupedSections = Object.values(groups)
      .filter((group) => group.sections.length > 0)
      .map((group) => ({
        ...group,
        sections: [...group.sections].sort((left, right) => this.sectionDisplayName(left).localeCompare(this.sectionDisplayName(right))),
      }))
      .sort((left, right) => {
        const orderMap: Record<string, number> = { inicial: 1, primaria: 2, secundaria: 3 };
        const levelOrder = (orderMap[left.level] ?? 99) - (orderMap[right.level] ?? 99);
        return levelOrder !== 0 ? levelOrder : left.gradeName.localeCompare(right.gradeName);
      });
  }

  applyFilters(): void {
    const search = this.normalizeText(this.searchTerm);

    this.filteredGroupedSections = this.groupedSections
      .map((group) => ({
        ...group,
        sections: group.sections.filter((section) => {
          const matchesGrade = !this.selectedGradeFilter || group.gradeId === this.selectedGradeFilter;
          const matchesSearch = !search || this.normalizeText(`${group.gradeName} ${this.sectionDisplayName(section)}`).includes(search);
          return matchesGrade && matchesSearch;
        }),
      }))
      .filter((group) => group.sections.length > 0);
  }

  openModal(section?: Section): void {
    this.isEditing = !!section;

    if (section) {
      this.currentEditId = section.id;
      this.sectionForm.patchValue({
        grade_level_id: section.grade_level_id,
        name: this.sectionDisplayName(section),
        capacity: section.capacity,
      });
    } else {
      this.currentEditId = null;
      this.sectionForm.reset({
        grade_level_id: this.selectedGradeFilter || '',
        name: '',
        capacity: 30,
      });
    }

    this.sectionForm.markAsPristine();
    this.sectionForm.markAsUntouched();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentEditId = null;
    this.isSubmitting = false;
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }

    if (!this.activeAcademicYearId && !this.isEditing) {
      Swal.fire('Error', 'No hay un ano academico activo configurado.', 'error');
      return;
    }

    this.isSubmitting = true;

    const payload: any = {
      grade_level_id: this.sectionForm.value.grade_level_id,
      section_letter: String(this.sectionForm.value.name || '').trim().toUpperCase(),
      name: String(this.sectionForm.value.name || '').trim().toUpperCase(),
      capacity: Number(this.sectionForm.value.capacity),
    };

    if (!this.isEditing) {
      payload.academic_year_id = this.activeAcademicYearId;
    }

    const request$ = this.isEditing && this.currentEditId
      ? this.academicService.updateSection(this.currentEditId, payload)
      : this.academicService.createSection(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? 'Seccion actualizada' : 'Seccion registrada',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
        this.loadData();
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire('Error', this.resolveErrorMessage(err), 'error');
      },
    });
  }

  deleteSection(section: Section): void {
    if (!this.canDeleteSection(section)) {
      Swal.fire('Accion no permitida', this.getDeleteTooltip(section), 'info');
      return;
    }

    Swal.fire({
      title: '¿Eliminar seccion?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.academicService.deleteSection(section.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
          });
          this.loadData();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo eliminar la seccion.', 'error');
        },
      });
    });
  }

  private normalizeText(value: string | undefined | null): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private resolveErrorMessage(err: any): string {
    const errors = err?.error?.errors;
    if (!errors) {
      return err?.error?.message || 'Hubo un error al guardar la seccion.';
    }

    return (Object.values(errors).flat()[0] as string) || 'Hubo un error al guardar la seccion.';
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
