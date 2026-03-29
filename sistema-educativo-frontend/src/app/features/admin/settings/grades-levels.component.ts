//src/app/features/admin/settings/grades-levels.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { AcademicService, GradeLevel } from '@core/services/academic.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';

interface GroupedGrades {
  level: string;
  label: string;
  accent: string;
  grades: GradeLevel[];
}

interface GradeRelationDetail {
  key: string;
  label: string;
  value: number;
  tone: string;
}

@Component({
  selector: 'app-grades-levels',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent, SettingMetricCardComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700 relative">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
        <div class="flex items-center gap-4">
          <app-back-button></app-back-button>
          <div class="space-y-1">
            <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Grados y Niveles</h1>
            <p class="text-slate-500 text-sm font-medium">Gestiona los grados por nivel educativo</p>
          </div>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-3 bg-gradient-to-r from-[#0E3A8A] to-[#C026D3] hover:opacity-90 text-white text-sm font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar Grado
        </button>
      </div>

      <div class="flex flex-wrap gap-3 mt-2">
        <app-setting-metric-card label="Total Grados" [value]="grades.length"></app-setting-metric-card>
        <app-setting-metric-card label="Primaria" [value]="countLevel('primaria')"></app-setting-metric-card>
        <app-setting-metric-card label="Secundaria" [value]="countLevel('secundaria')"></app-setting-metric-card>
        <app-setting-metric-card label="Con Secciones" [value]="gradesWithSections"></app-setting-metric-card>
      </div>

      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div *ngIf="!loading" class="space-y-8">
        <div *ngFor="let levelGroup of groupedGrades" class="space-y-6">
          <div class="flex items-center gap-3 border-l-[3px] pl-4" [ngClass]="levelGroup.accent">
            <h2 class="text-xl font-semibold text-[#0F172A] uppercase tracking-wide">
              {{ levelGroup.label }}
            </h2>
            <span class="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full">
              {{ levelGroup.grades.length }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div
              *ngFor="let grade of levelGroup.grades"
              class="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">

              <div class="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-blue-50 transition-colors pointer-events-none"></div>

              <div class="relative z-10 space-y-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md"
                      [ngClass]="badgeClass(grade.level)">
                      <span class="text-2xl font-bold leading-none">{{ grade.grade }}</span>
                    </div>
                    <div class="space-y-1">
                      <h3 class="text-lg font-semibold text-[#0F172A] leading-tight">{{ grade.name }}</h3>
                      <p class="text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">
                        {{ humanizeLevel(grade.level) }}
                      </p>
                      <div class="flex flex-wrap gap-2">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                          [ngClass]="relatedRecordsCount(grade) > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                          {{ relatedRecordsCount(grade) > 0 ? relatedRecordsCount(grade) + ' vinculaciones' : 'Sin uso' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2 border border-slate-100 rounded-xl p-1 bg-slate-50/70">
                    <button
                      (click)="openModal(grade)"
                      class="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white shadow-sm"
                      title="Editar">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      (click)="deleteGrade(grade)"
                      [disabled]="!canDeleteGrade(grade)"
                      [attr.title]="getDeleteTooltip(grade)"
                      class="p-2 transition-colors rounded-lg shadow-sm disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-300"
                      [ngClass]="canDeleteGrade(grade) ? 'text-slate-400 hover:text-red-600 hover:bg-white' : 'text-slate-300'">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Orden</p>
                    <p class="mt-1 text-sm font-semibold text-slate-700">{{ grade.grade }}</p>
                  </div>
                  <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Secciones</p>
                    <p class="mt-1 text-sm font-semibold text-slate-700">{{ grade.sections_count ?? 0 }}</p>
                  </div>
                  <div class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cursos</p>
                    <p class="mt-1 text-sm font-semibold text-slate-700">{{ grade.courses_count ?? 0 }}</p>
                  </div>
                </div>

                <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 overflow-hidden">
                  <button
                    type="button"
                    (click)="toggleDetails(grade.id)"
                    class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/70 transition-colors">
                    <div>
                      <p class="text-sm font-semibold text-slate-700">Detalles del grado</p>
                      <p class="text-[11px] text-slate-400">
                        {{ relatedRecordsCount(grade) > 0 ? 'Desglose de relaciones y estado de uso' : 'Grado libre para reorganizar o eliminar' }}
                      </p>
                    </div>
                    <svg
                      class="w-4 h-4 text-slate-400 transition-transform"
                      [ngClass]="isDetailsExpanded(grade.id) ? 'rotate-180' : ''"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>

                  <div *ngIf="isDetailsExpanded(grade.id)" class="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100 bg-white/70">
                    <div *ngIf="gradeRelationDetails(grade).length > 0; else noRelationsBlock" class="flex flex-wrap gap-2">
                      <span
                        *ngFor="let detail of gradeRelationDetails(grade)"
                        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold"
                        [ngClass]="detail.tone">
                        <span>{{ detail.label }}</span>
                        <span class="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-white/80 px-1">{{ detail.value }}</span>
                      </span>
                    </div>

                    <ng-template #noRelationsBlock>
                      <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700 font-medium">
                        Este grado no tiene secciones ni cursos vinculados.
                      </div>
                    </ng-template>

                    <div class="grid grid-cols-2 gap-3 text-[12px]">
                      <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <p class="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Puede eliminarse</p>
                        <p class="mt-1 font-semibold text-slate-700">{{ canDeleteGrade(grade) ? 'Si' : 'No' }}</p>
                      </div>
                      <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <p class="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Motivo</p>
                        <p class="mt-1 font-semibold text-slate-700">{{ getDeleteTooltip(grade) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="grades.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg class="w-16 h-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
          </svg>
          <p class="text-sm font-semibold">No hay grados registrados</p>
          <p class="text-xs mt-1">Haz clic en "Registrar Grado" para comenzar</p>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 animate-slide-up overflow-hidden border border-slate-100">
          <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 class="text-xl font-bold text-slate-800 tracking-tight">{{ isEditing ? 'Editar Grado' : 'Nuevo Grado' }}</h2>
              <p class="text-xs text-slate-400 mt-0.5">{{ isEditing ? 'Modifica los datos del grado seleccionado' : 'Completa los datos para registrar un nuevo grado' }}</p>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="gradeForm" (ngSubmit)="saveGrade()" class="p-8 space-y-5">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nivel Educativo</label>
              <select
                formControlName="level"
                class="w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                [ngClass]="isFieldInvalid('level') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
                <option value="inicial">Inicial</option>
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre del Grado</label>
              <input
                type="text"
                formControlName="name"
                placeholder="Ej: 1ro Secundaria"
                class="w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white hover:border-slate-300"
                [ngClass]="isFieldInvalid('name') ? 'border-red-400 bg-red-50' : 'border-slate-200'">
              <p *ngIf="isFieldInvalid('name')" class="text-[11px] text-red-500 font-semibold">
                El nombre del grado es obligatorio.
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Orden Numerico</label>
              <input
                type="number"
                formControlName="grade"
                placeholder="Ej: 1"
                class="w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white hover:border-slate-300"
                [ngClass]="isFieldInvalid('grade') || !!gradeServerError ? 'border-red-400 bg-red-50' : 'border-slate-200'">
              <p *ngIf="isFieldInvalid('grade')" class="text-[11px] text-red-500 font-semibold">
                El orden numerico debe ser mayor a 0.
              </p>
              <p *ngIf="gradeServerError" class="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ gradeServerError }}
              </p>
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
                [disabled]="gradeForm.invalid || isSubmitting"
                class="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ isEditing ? 'Guardar Cambios' : 'Registrar Grado' }}
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
export class GradesLevelsComponent implements OnInit {
  grades: GradeLevel[] = [];
  groupedGrades: GroupedGrades[] = [];

  loading = false;
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  currentEditId: string | null = null;
  gradeServerError: string | null = null;
  expandedGradeIds: Record<string, boolean> = {};

  gradeForm: FormGroup;

  private readonly orderMap: Record<string, number> = { inicial: 1, primaria: 2, secundaria: 3 };

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.gradeForm = this.fb.group({
      level: ['primaria', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(120)]],
      grade: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
    });
  }

  get gradesWithSections(): number {
    return this.grades.filter((grade) => (grade.sections_count ?? 0) > 0).length;
  }

  ngOnInit(): void {
    this.loadData();
  }

  countLevel(level: string): number {
    return this.grades.filter((grade) => grade.level === level).length;
  }

  humanizeLevel(level: string): string {
    const labels: Record<string, string> = {
      inicial: 'Inicial',
      primaria: 'Primaria',
      secundaria: 'Secundaria',
    };

    return labels[level] || level;
  }

  badgeClass(level: string): string {
    const styles: Record<string, string> = {
      inicial: 'bg-gradient-to-br from-amber-500 to-orange-500',
      primaria: 'bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8]',
      secundaria: 'bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED]',
    };

    return styles[level] || 'bg-gradient-to-br from-slate-500 to-slate-700';
  }

  relatedRecordsCount(grade: GradeLevel): number {
    return (grade.sections_count ?? 0) + (grade.courses_count ?? 0);
  }

  gradeRelationDetails(grade: GradeLevel): GradeRelationDetail[] {
    return [
      {
        key: 'sections',
        label: 'Secciones',
        value: grade.sections_count ?? 0,
        tone: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      {
        key: 'courses',
        label: 'Cursos',
        value: grade.courses_count ?? 0,
        tone: 'bg-violet-50 text-violet-700 border-violet-200',
      },
    ].filter((detail) => detail.value > 0);
  }

  canDeleteGrade(grade: GradeLevel): boolean {
    return this.relatedRecordsCount(grade) === 0;
  }

  getDeleteTooltip(grade: GradeLevel): string {
    if ((grade.sections_count ?? 0) > 0 || (grade.courses_count ?? 0) > 0) {
      return 'No puedes eliminar este grado porque tiene secciones o cursos vinculados.';
    }

    return 'Eliminar';
  }

  toggleDetails(gradeId: string): void {
    this.expandedGradeIds[gradeId] = !this.expandedGradeIds[gradeId];
  }

  isDetailsExpanded(gradeId: string): boolean {
    return !!this.expandedGradeIds[gradeId];
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.gradeForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  private handleServerErrors(err: any): boolean {
    const errors = err?.error?.errors;

    if (!errors) {
      return false;
    }

    if (errors['grade']?.length) {
      this.gradeServerError = errors['grade'][0];
      this.gradeForm.get('grade')?.setErrors({ serverError: true });
      return true;
    }

    if (errors['name']?.length) {
      this.gradeForm.get('name')?.setErrors({ serverError: true });
    }

    return false;
  }

  private resolveErrorMessage(err: any): string {
    const errors = err?.error?.errors;

    if (!errors) {
      return err?.error?.message || 'Hubo un error inesperado. Intente nuevamente.';
    }

    const firstError = Object.values(errors).flat()[0] as string;
    return firstError || 'Hubo un error inesperado.';
  }

  private resolveDeleteErrorMessage(err: any): string {
    const rawMessage = String(err?.error?.message || '').toLowerCase();

    if (rawMessage.includes('secciones') || rawMessage.includes('cursos') || rawMessage.includes('vinculados')) {
      return 'No puedes eliminar este grado porque tiene secciones o cursos vinculados.';
    }

    return err?.error?.message || 'No se pudo eliminar el grado.';
  }

  loadData(): void {
    this.loading = true;
    this.academicService.getGradeLevels({ per_page: 100, simple: true }).subscribe({
      next: (response) => {
        this.grades = this.extractCollection<GradeLevel>(response);
        this.groupGrades();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'No se pudieron cargar los grados.', 'error');
      },
    });
  }

  groupGrades(): void {
    const groups: Record<string, GradeLevel[]> = {};

    this.grades.forEach((grade) => {
      if (!groups[grade.level]) {
        groups[grade.level] = [];
      }

      groups[grade.level].push(grade);
    });

    const accents: Record<string, string> = {
      inicial: 'border-amber-500',
      primaria: 'border-blue-600',
      secundaria: 'border-violet-600',
    };

    this.groupedGrades = Object.keys(groups)
      .map((level) => ({
        level,
        label: this.humanizeLevel(level),
        accent: accents[level] || 'border-slate-400',
        grades: groups[level].sort((left, right) => left.grade - right.grade),
      }))
      .sort((left, right) => (this.orderMap[left.level] ?? 99) - (this.orderMap[right.level] ?? 99));
  }

  openModal(grade?: GradeLevel): void {
    this.isEditing = !!grade;
    this.currentEditId = grade?.id ?? null;
    this.gradeServerError = null;

    if (grade) {
      this.gradeForm.patchValue({
        level: grade.level,
        name: grade.name,
        grade: grade.grade,
      });
    } else {
      this.gradeForm.reset({ level: 'primaria', name: '', grade: 1 });
    }

    this.gradeForm.markAsPristine();
    this.gradeForm.markAsUntouched();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentEditId = null;
    this.isSubmitting = false;
    this.gradeServerError = null;
  }

  saveGrade(): void {
    if (this.gradeForm.invalid) {
      this.gradeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.gradeServerError = null;

    const payload = {
      level: String(this.gradeForm.value.level || '').trim().toLowerCase(),
      name: String(this.gradeForm.value.name || '').trim(),
      grade: Number(this.gradeForm.value.grade),
    };

    const isUpdate = this.isEditing && !!this.currentEditId;
    const request$ = isUpdate
      ? this.academicService.updateGradeLevel(this.currentEditId!, payload)
      : this.academicService.createGradeLevel(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.loadData();

        Swal.fire({
          icon: 'success',
          title: isUpdate ? 'Grado actualizado' : 'Grado registrado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.isSubmitting = false;

        const handledInline = this.handleServerErrors(err);

        if (!handledInline) {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo guardar',
            text: this.resolveErrorMessage(err),
          });
        }
      },
    });
  }

  deleteGrade(grade: GradeLevel): void {
    if (!this.canDeleteGrade(grade)) {
      Swal.fire('Accion no permitida', this.getDeleteTooltip(grade), 'info');
      return;
    }

    Swal.fire({
      title: '¿Eliminar grado?',
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

      this.academicService.deleteGradeLevel(grade.id).subscribe({
        next: () => {
          this.grades = this.grades.filter((item) => item.id !== grade.id);
          delete this.expandedGradeIds[grade.id];
          this.groupGrades();

          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          Swal.fire('Error', this.resolveDeleteErrorMessage(err), 'error');
        },
      });
    });
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
