import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { Assignment, TaskService } from '@core/services/task.service';
import { AcademicService, Course, Section } from '@core/services/academic.service';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <app-back-button></app-back-button>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Gestion de Tareas</h1>
          <p class="text-slate-500 text-sm mt-1 font-medium">Crea y administra tareas conectadas al backend real.</p>
        </div>
        <button
          (click)="openCreateModal()"
          class="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-red-600 hover:opacity-90 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Tarea
        </button>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curso</label>
          <select
            [(ngModel)]="selectedCourseId"
            (ngModelChange)="onCourseChange()"
            class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">Todos los cursos</option>
            <option *ngFor="let course of courses" [value]="course.id">{{ course.name }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seccion</label>
          <select
            [(ngModel)]="selectedSectionId"
            (ngModelChange)="loadAssignments()"
            class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">Todas las secciones</option>
            <option *ngFor="let section of sections" [value]="section.id">{{ getSectionOptionLabel(section) }}</option>
          </select>
        </div>
      </div>

      <div *ngIf="loading()" class="flex justify-center py-16">
        <div class="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div *ngIf="error()" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
        {{ error() }}
      </div>

      <div *ngIf="!loading() && assignments().length === 0" class="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <h3 class="text-slate-800 font-bold text-lg">No hay tareas registradas</h3>
        <p class="text-slate-400 text-sm mt-1.5 font-medium">Crea tu primera tarea desde este modulo.</p>
      </div>

      <div *ngIf="!loading() && assignments().length > 0" class="space-y-4">
        <div
          *ngFor="let task of assignments()"
          class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm border-l-4 border-l-blue-900 hover:shadow-md transition-all"
        >
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-bold text-slate-900">{{ task.title }}</h3>
                <span
                  class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight"
                  [class]="isOverdue(task.due_date) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'"
                >
                  {{ isOverdue(task.due_date) ? 'Vencida' : 'Activa' }}
                </span>
              </div>
              <p *ngIf="task.description" class="text-sm text-slate-500 font-medium">{{ task.description }}</p>
              <p *ngIf="task.instructions" class="text-sm text-slate-400 font-medium">{{ task.instructions }}</p>
              <div class="flex flex-wrap items-center gap-5 pt-1">
                <div class="flex items-center gap-1.5 text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  <span class="text-xs font-semibold">{{ task.course?.name || getCourseName(task.course_id) }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/></svg>
                  <span class="text-xs font-semibold">{{ getSectionLabel(task) }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span class="text-xs font-semibold">Limite: {{ task.due_date ? (task.due_date | date:'dd/MM/yyyy HH:mm') : 'Sin fecha' }}</span>
                </div>
                <div *ngIf="task.max_score !== undefined && task.max_score !== null" class="flex items-center gap-1.5 text-slate-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span class="text-xs font-semibold">Puntaje max: {{ task.max_score }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 pt-2">
                <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                  Esperados {{ task.metrics?.expected_count ?? 0 }}
                </span>
                <span class="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-bold">
                  Entregados {{ task.metrics?.submitted_count ?? 0 }}
                </span>
                <span class="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                  Sin calificar {{ task.metrics?.pending_count ?? 0 }}
                </span>
                <span class="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                  Sin entregar {{ task.metrics?.missing_count ?? 0 }}
                </span>
                <span *ngIf="task.metrics?.average_grade !== null && task.metrics?.average_grade !== undefined" class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  Promedio {{ task.metrics?.average_grade }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <button
                (click)="openEditModal(task)"
                class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                Editar
              </button>
              <button
                (click)="deleteTask(task)"
                class="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div class="p-8 pb-0 flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-slate-900">{{ editingTask ? 'Editar Tarea' : 'Nueva Tarea' }}</h2>
              <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Completa los campos requeridos</p>
            </div>
            <button (click)="closeModal()" class="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <svg class="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <form (submit)="saveTask($event)" class="p-8 space-y-5">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Titulo *</label>
              <input
                [(ngModel)]="form.title"
                name="title"
                required
                placeholder="Ej: Resolucion de ejercicios"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              >
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripcion</label>
              <textarea
                [(ngModel)]="form.description"
                name="description"
                rows="3"
                placeholder="Descripcion breve de la tarea..."
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
              ></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indicaciones</label>
              <textarea
                [(ngModel)]="form.instructions"
                name="instructions"
                rows="3"
                placeholder="Indicaciones para resolver o entregar la tarea..."
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curso *</label>
                <select
                  [(ngModel)]="form.course_id"
                  name="course_id"
                  required
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let course of courses" [value]="course.id">{{ course.name }}</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seccion *</label>
                <select
                  [(ngModel)]="form.section_id"
                  name="section_id"
                  required
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let section of sections" [value]="section.id">{{ getSectionOptionLabel(section) }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha limite</label>
                <input
                  [(ngModel)]="form.due_date"
                  name="due_date"
                  type="datetime-local"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntaje max</label>
                <input
                  [(ngModel)]="form.max_score"
                  name="max_score"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="20"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
              </div>
            </div>

            <div class="flex gap-4 pt-2">
              <button
                type="button"
                (click)="closeModal()"
                class="flex-1 px-6 py-3 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest hover:border-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="submitting()"
                class="flex-[2] px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-xs font-bold rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60"
              >
                {{ submitting() ? 'Guardando...' : (editingTask ? 'Actualizar' : 'Crear Tarea') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class TaskManagementComponent implements OnInit {
  private taskService = inject(TaskService);
  private academicService = inject(AcademicService);

  assignments = signal<Assignment[]>([]);
  loading = signal(false);
  error = signal('');
  showModal = signal(false);
  submitting = signal(false);

  courses: Course[] = [];
  sections: Section[] = [];
  selectedCourseId = '';
  selectedSectionId = '';
  editingTask: Assignment | null = null;

  form = {
    title: '',
    description: '',
    instructions: '',
    course_id: '',
    section_id: '',
    due_date: '',
    max_score: null as number | null,
  };

  ngOnInit(): void {
    this.academicService.getCourses().subscribe({
      next: (response) => this.courses = response.data || response || [],
      error: () => undefined,
    });

    this.academicService.getSections().subscribe({
      next: (response) => this.sections = response.data || response || [],
      error: () => undefined,
    });

    this.loadAssignments();
  }

  onCourseChange(): void {
    this.selectedSectionId = '';
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading.set(true);
    this.error.set('');

    const params: { course_id?: string; section_id?: string } = {};
    if (this.selectedCourseId) {
      params.course_id = this.selectedCourseId;
    }
    if (this.selectedSectionId) {
      params.section_id = this.selectedSectionId;
    }

    this.taskService.getAssignments(params).subscribe({
      next: (response) => {
        this.assignments.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar las tareas.');
        this.loading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.editingTask = null;
    this.form = {
      title: '',
      description: '',
      instructions: '',
      course_id: this.selectedCourseId,
      section_id: this.selectedSectionId,
      due_date: '',
      max_score: null,
    };
    this.showModal.set(true);
  }

  openEditModal(task: Assignment): void {
    this.editingTask = task;
    const dueDate = task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '';

    this.form = {
      title: task.title,
      description: task.description || '',
      instructions: task.instructions || '',
      course_id: task.course_id,
      section_id: task.section_id,
      due_date: dueDate,
      max_score: task.max_score ?? null,
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask = null;
  }

  saveTask(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);

    const payload = {
      title: this.form.title,
      description: this.form.description || null,
      instructions: this.form.instructions || null,
      course_id: this.form.course_id,
      section_id: this.form.section_id,
      due_date: this.form.due_date || null,
      max_score: this.form.max_score,
    };

    const request = this.editingTask
      ? this.taskService.updateAssignment(this.editingTask.id, payload)
      : this.taskService.createAssignment(payload);

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeModal();
        this.loadAssignments();
      },
      error: (error) => {
        this.submitting.set(false);
        alert('Error: ' + (error.error?.message || 'No se pudo guardar la tarea'));
      },
    });
  }

  deleteTask(task: Assignment): void {
    if (!confirm(`Eliminar la tarea "${task.title}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    this.taskService.deleteAssignment(task.id).subscribe({
      next: () => this.loadAssignments(),
      error: (error) => alert(error.error?.message || 'Error al eliminar la tarea.'),
    });
  }

  isOverdue(dueDate?: string | null): boolean {
    if (!dueDate) {
      return false;
    }

    return new Date(dueDate) < new Date();
  }

  getCourseName(courseId: string): string {
    return this.courses.find((course) => course.id === courseId)?.name || 'Curso';
  }

  getSectionOptionLabel(section: Section): string {
    return section.section_letter ? `Seccion ${section.section_letter}` : 'Seccion';
  }

  getSectionLabel(task: Assignment): string {
    const sectionLetter = task.section?.section_letter
      || this.sections.find((section) => section.id === task.section_id)?.section_letter;
    const gradeLevel = task.section?.grade_level;
    const gradeLabel = gradeLevel ? `${gradeLevel.grade} ${gradeLevel.level}` : '';
    const sectionLabel = sectionLetter ? `Seccion ${sectionLetter}` : 'Seccion';

    return gradeLabel ? `${gradeLabel} - ${sectionLabel}` : sectionLabel;
  }
}
