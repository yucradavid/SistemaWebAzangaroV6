import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Course, GradeLevel } from '@core/services/academic.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700 relative">
      <app-back-button></app-back-button>

      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Cursos</h1>
          <p class="text-slate-500 text-sm font-medium">Gestiona los cursos y materias</p>
        </div>
        <div class="flex gap-3 mt-4 sm:mt-0">
          <button
            (click)="openModal()"
            class="px-6 py-3 bg-gradient-to-r from-[#0E3A8A] via-[#1D4ED8] to-[#991B1B] hover:opacity-90 text-white text-sm font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Curso
          </button>
        </div>
      </div>

      <!-- Filter Pill -->
      <div class="bg-white border border-slate-100/50 rounded-[2rem] p-4 shadow-sm flex items-center gap-4 px-6 md:max-w-md mx-auto">
        <div class="text-slate-400">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
        </div>
        <select
          [ngModel]="selectedGradeFilter"
          (ngModelChange)="filterByGrade($event)"
          class="flex-1 bg-transparent border-none text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.15em] focus:ring-0 cursor-pointer appearance-none">
          <option value="">Todos los grados</option>
          <option *ngFor="let g of gradeLevels" [value]="g.id">{{ g.name }} ({{ g.level }})</option>
        </select>
        <div class="text-slate-400">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <!-- Grade Section -->
      <div *ngIf="!loading" class="space-y-6">
        <div *ngFor="let gradeGroup of filteredGroupedCourses" class="space-y-6">
          <h2 class="text-xl font-bold text-[#0F172A] flex items-center gap-3 border-l-[3px] border-blue-600 pl-4 tracking-tight uppercase leading-none">
            {{ gradeGroup.gradeName }} <span class="text-sm text-slate-400 ml-2 font-medium">({{gradeGroup.level}})</span>
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let course of gradeGroup.courses" class="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col gap-6 relative overflow-hidden">

              <!-- Card Header: Icon + Info -->
              <div class="flex items-center gap-4 relative z-10 w-full">
                <div [style.backgroundColor]="course.color || '#2563EB'" class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                  <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <div class="space-y-1 overflow-hidden">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-bold bg-slate-50 text-slate-500 border border-slate-100 shadow-sm uppercase tracking-widest break-words">{{ course.code }}</span>
                  <h3 class="text-base font-bold text-[#0F172A] tracking-tighter uppercase leading-tight truncate" [title]="course.name">{{ course.name }}</h3>
                </div>
              </div>

              <!-- Card Body: Hours -->
              <div class="bg-slate-50/50 p-3 px-4 rounded-xl border border-slate-50 flex items-center gap-3 relative z-10">
                <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div class="flex items-baseline gap-1.5 text-xs font-bold">
                  <span class="text-[#0F172A] italic">{{ getCourseHours(course) }} horas</span>
                  <span class="text-slate-400 uppercase tracking-tighter">/ semana</span>
                </div>
              </div>

              <!-- Card Footer: Actions -->
              <div class="flex gap-2 relative z-10">
                <button (click)="openModal(course)" class="flex-1 py-3 bg-white text-[#0E3A8A] border-2 border-slate-100/50 hover:border-[#0E3A8A] text-[10px] font-bold uppercase tracking-tight rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 group/btn">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
                <button (click)="deleteCourse(course.id)" class="w-12 h-12 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-red-100 shrink-0">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
              <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-blue-50 transition-colors pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Creation/Edit -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-slide-up overflow-hidden border border-slate-100">
          <div class="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] flex items-center justify-center shadow-md">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-800 tracking-tight leading-tight">{{ isEditing ? 'Editar Curso' : 'Nuevo Curso' }}</h2>
                <p class="text-xs text-slate-400 font-medium">{{ isEditing ? 'Modifica los datos del curso' : 'Registra una nueva materia' }}</p>
              </div>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="courseForm" (ngSubmit)="saveCourse()" class="p-8 space-y-5">

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grado Académico</label>
              <select formControlName="grade_level_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona un Grado...</option>
                <option *ngFor="let g of gradeLevels" [value]="g.id">{{ g.name }} ({{ g.level }})</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors">Nombre del Curso</label>
              <input type="text" formControlName="name" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:border-blue-500" placeholder="Ej: Matemática, Comunicación">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5 focus-within:text-blue-600">
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors">Código</label>
                <input type="text" formControlName="code" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 uppercase" placeholder="Ej: MAT-101">
              </div>

              <div class="space-y-1.5 focus-within:text-blue-600">
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors">Horas Semanales</label>
                <input type="number" formControlName="hours_per_week" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:border-blue-500" placeholder="Ej: 4">
              </div>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors">Color Institucional (Opcional)</label>
              <div class="flex items-center gap-3">
                <input type="color" formControlName="color" class="w-12 h-12 rounded-xl border-none p-0 cursor-pointer bg-transparent">
                <span class="text-xs text-slate-500 font-medium">Click para elegir el color</span>
                <button type="button" (click)="courseForm.get('color')?.setValue('#2563EB')" class="ml-auto text-xs text-blue-600 hover:underline px-2 font-bold">Por Defecto</button>
              </div>
            </div>

            <div class="pt-6 flex gap-3">
              <button type="button" (click)="closeModal()" class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95">
                Cancelar
              </button>
              <button type="submit" [disabled]="courseForm.invalid || isSubmitting" class="flex-[1.5] px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ isEditing ? 'Guardar Cambios' : 'Registrar Curso' }}
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
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  gradeLevels: GradeLevel[] = [];
  groupedCourses: { gradeId: string, gradeName: string, level: string, courses: Course[] }[] = [];
  filteredGroupedCourses: any[] = [];

  loading = false;
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  currentEditId: string | null = null;
  courseForm: FormGroup;
  selectedGradeFilter: string = '';

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.courseForm = this.fb.group({
      grade_level_id: ['', Validators.required],
      name: ['', Validators.required],
      code: ['', Validators.required],
      hours_per_week: [4, [Validators.required, Validators.min(1)]],
      color: ['#2563EB']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  filterByGrade(val: string) {
    this.selectedGradeFilter = val;
    if (!val) {
      this.filteredGroupedCourses = [...this.groupedCourses];
    } else {
      this.filteredGroupedCourses = this.groupedCourses.filter(g => g.gradeId === val);
    }
  }

  loadData() {
    this.loading = true;
    this.academicService.getGradeLevels().subscribe((resG) => {
      this.gradeLevels = resG.data || resG;

      this.academicService.getCourses({ per_page: 100 }).subscribe({
        next: (resC) => {
          this.courses = resC.data || resC;
          this.groupCourses();
          this.filterByGrade(this.selectedGradeFilter);
          this.loading = false;
        },
        error: () => this.loading = false
      });
    });
  }

  groupCourses() {
    const groups: { [key: string]: { gradeId: string, gradeName: string, level: string, courses: Course[] } } = {};

    this.gradeLevels.forEach(gl => {
      groups[gl.id] = { gradeId: gl.id, gradeName: gl.name, level: gl.level, courses: [] };
    });

    this.courses.forEach(course => {
      if (groups[course.grade_level_id]) {
        groups[course.grade_level_id].courses.push(course);
      }
    });

    // Remove empty groups and sort based on grade
    this.groupedCourses = Object.values(groups)
      .filter(g => g.courses.length > 0)
      .map(g => {
        g.courses.sort((a, b) => a.name.localeCompare(b.name));
        return g;
      });
  }

  openModal(course?: Course) {
    this.isEditing = !!course;
    if (course) {
      this.currentEditId = course.id;
      this.courseForm.patchValue({
        ...course,
        hours_per_week: this.getCourseHours(course)
      });
    } else {
      this.currentEditId = null;
      this.courseForm.reset({
        grade_level_id: this.selectedGradeFilter || '',
        name: '',
        code: '',
        hours_per_week: 4,
        color: '#2563EB'
      });
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveCourse() {
    if (this.courseForm.invalid) return;
    this.isSubmitting = true;
    const data = this.courseForm.value;

    const req$ = this.isEditing && this.currentEditId
      ? this.academicService.updateCourse(this.currentEditId, data)
      : this.academicService.createCourse(data);

    req$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: 'Curso guardado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        this.loadData();
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire('Error', err.error?.message || 'Hubo un error al guardar', 'error');
      }
    });
  }

  deleteCourse(id: string) {
    Swal.fire({
      title: '¿Eliminar curso?',
      text: "Se eliminaría de manera irreversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.academicService.deleteCourse(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Eliminado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
            this.loadData();
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo eliminar, revisa dependencias', 'error')
        });
      }
    });
  }

  getCourseHours(course: Course): number {
    return course.hours_per_week ?? course.weekly_hours ?? 0;
  }
}
