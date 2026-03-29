
//src/app/features/admin/settings/teacher-assignments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { TeacherCourseAssignment, Course, Section } from '@core/services/academic.service';
import { UserService, User } from '@core/services/user.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { AcademicService } from '@core/services/academic.service';
import { AcademicYear } from '@core/models/AcademicYear';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent, SettingMetricCardComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700 relative">
      <app-back-button></app-back-button>

      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Asignación Docente</h1>
          <p class="text-slate-500 text-sm font-medium">Gestiona la carga institucional de los docentes</p>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-3 bg-gradient-to-r from-[#0E3A8A] to-[#C026D3] hover:opacity-90 text-white text-sm font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Asignación
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="flex flex-wrap gap-3 mt-2 mb-6">
        <app-setting-metric-card label="Docentes" [value]="totalTeachers"></app-setting-metric-card>
        <app-setting-metric-card label="Carga Total" [value]="totalAssignments"></app-setting-metric-card>
        <app-setting-metric-card label="Promedio" [value]="avgAssignments | number:'1.0-1'"></app-setting-metric-card>
        <app-setting-metric-card label="Ocupados" [value]="activeTeachersCount"></app-setting-metric-card>
      </div>

      <!-- Filter Pill -->
      <div class="bg-white border border-slate-100/50 rounded-[2rem] p-4 shadow-sm flex items-center gap-4 px-6 md:max-w-md mx-auto">
        <div class="text-slate-400">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="filterTeachers()" placeholder="Buscar por docente..." class="flex-1 bg-transparent border-none text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.1em] focus:ring-0 placeholder-slate-300">
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <!-- Teacher Cards -->
      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div *ngFor="let teacherGroup of filteredTeacherGroups" class="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">

          <div class="absolute -right-10 -top-10 w-32 h-32 bg-slate-50 rounded-full blur-3xl group-hover:bg-blue-50 transition-colors pointer-events-none"></div>

          <!-- Card Header: Teacher Profile -->
          <div class="flex items-start justify-between relative z-10">
            <div class="flex items-center gap-5">
              <div class="w-20 h-20 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                <span class="text-3xl font-bold text-white">{{ teacherGroup.teacher.name.charAt(0) }}</span>
              </div>
              <div class="overflow-hidden">
                <h3 class="text-2xl font-bold text-[#0F172A] tracking-tighter uppercase leading-none truncate" [title]="teacherGroup.teacher.name + ' ' + teacherGroup.teacher.last_name">
                  {{ teacherGroup.teacher.name }}
                </h3>
                <p class="text-sm font-bold text-slate-500 uppercase truncate" [title]="teacherGroup.teacher.last_name">{{ teacherGroup.teacher.last_name }}</p>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                   <span class="px-3 py-1 bg-blue-50 text-[#0E3A8A] rounded-full text-[9px] font-bold uppercase tracking-widest border border-blue-100 shadow-sm">{{ teacherGroup.assignments.length }} cursos asignados</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Body: Assignments -->
          <div class="mt-8 space-y-4 relative z-10 w-full">
            <div *ngFor="let item of teacherGroup.assignments" class="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 group/item hover:bg-white hover:shadow-md transition-all flex items-center justify-between w-full">
               <div class="flex items-center gap-4 overflow-hidden w-full">
                  <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-[#0E3A8A] font-bold text-[10px] shadow-sm group-hover/item:border-[#0E3A8A] shrink-0">
                    {{ item.course?.code || 'CRS' }}
                  </div>
                  <div class="overflow-hidden flex-1">
                    <h4 class="text-sm font-bold text-[#0F172A] tracking-tighter uppercase leading-tight truncate" [title]="item.course?.name">{{ item.course?.name }}</h4>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                      {{ getSectionDisplayName(item.section) }} <span *ngIf="item.academicYear">({{ item.academicYear?.year }})</span>
                    </p>
                  </div>
               </div>
               <button (click)="deleteAssignment(item.id)" class="p-2 ml-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>

            <div class="pt-6 border-t border-slate-50">
               <button (click)="openModal(teacherGroup.teacher.id)" class="w-full py-4 bg-white text-[#0E3A8A] border-2 border-slate-100 hover:border-[#0E3A8A] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Agregar curso a este docente
               </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Creation -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-slide-up overflow-hidden border border-slate-100">
          <div class="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E3A8A] to-[#C026D3] flex items-center justify-center shadow-md">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-800 tracking-tight leading-tight">Asignar Curso</h2>
                <p class="text-xs text-slate-400 font-medium">Asigna una carga académica al docente</p>
              </div>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="assignForm" (ngSubmit)="saveAssignment()" class="p-8 space-y-5">

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Docente</label>
              <select formControlName="teacher_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona Docente...</option>
                <option *ngFor="let t of teachers" [value]="t.id">{{ t.name }} {{ t.last_name }}</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Año Académico</label>
              <select formControlName="academic_year_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona Año...</option>
                <option *ngFor="let ay of academicYears" [value]="ay.id">{{ ay.year }}</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Curso</label>
              <select formControlName="course_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona Curso...</option>
                <option *ngFor="let c of courses" [value]="c.id">{{ c.code }} - {{ c.name }}</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sección</label>
              <select formControlName="section_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona Sección...</option>
                <option *ngFor="let sec of sections" [value]="sec.id">{{ getSectionDisplayName(sec) }}</option>
              </select>
            </div>

            <div class="pt-6 flex gap-3">
              <button type="button" (click)="closeModal()" class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95">
                Cancelar
              </button>
              <button type="submit" [disabled]="assignForm.invalid || isSubmitting" class="flex-[1.5] px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Asignar Curso
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
export class TeacherAssignmentsComponent implements OnInit {
  teachers: User[] = [];
  courses: Course[] = [];
  sections: Section[] = [];
  academicYears: AcademicYear[] = [];
  assignments: TeacherCourseAssignment[] = [];
  gradeLevelsMap: { [id: string]: string } = {};

  teacherGroups: { teacher: User, assignments: any[] }[] = [];
  filteredTeacherGroups: any[] = [];

  loading = false;
  showModal = false;
  isSubmitting = false;
  assignForm: FormGroup;
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private userService: UserService
  ) {
    // Note: backend expects `teacher_id` for teacher assignments (not `user_id`)
    this.assignForm = this.fb.group({
      teacher_id: ['', Validators.required],
      academic_year_id: ['', Validators.required],
      course_id: ['', Validators.required],
      section_id: ['', Validators.required]
    });
  }

  get totalTeachers() { return this.teachers.length; }
  get totalAssignments() { return this.assignments.length; }
  get activeTeachersCount() { return this.teacherGroups.filter(g => g.assignments.length > 0).length; }
  get avgAssignments() { return this.totalTeachers === 0 ? 0 : this.totalAssignments / this.totalTeachers; }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loading = true;
    console.log('Iniciando carga de datos...');
    const startTime = performance.now();

    forkJoin({
      teachers: this.academicService.getTeachers({ per_page: 200, simple: true }),
      courses: this.academicService.getCourses({ per_page: 200, simple: true }),
      sections: this.academicService.getSections({ per_page: 200, simple: true }),
      academicYears: this.academicService.getAcademicYears({ per_page: 50, simple: true }),
      assignments: this.academicService.getTeacherCourseAssignments({ per_page: 200, simple: true }),
      grades: this.academicService.getGradeLevels({ per_page: 200, simple: true })
    }).subscribe({
      next: (res: any) => {
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`Carga de datos completada en ${elapsed}ms`);
        console.log('Datos cargados:', res);

        const teacherData: any[] = res.teachers?.data || res.teachers || [];
        // Normalize teacher shape so template (name/last_name) works
        this.teachers = Array.isArray(teacherData)
          ? teacherData.map(t => ({ ...t, name: t.first_name || t.name, last_name: t.last_name || '' }))
          : [];

        this.courses = res.courses.data || res.courses;
        this.sections = res.sections.data || res.sections;
        this.academicYears = res.academicYears.data || res.academicYears;
        this.assignments = res.assignments.data || res.assignments;

        console.log('Docentes:', this.teachers.length, this.teachers);
        console.log('Cursos:', this.courses.length, this.courses);
        console.log('Secciones:', this.sections.length, this.sections);
        console.log('Años académicos:', this.academicYears.length, this.academicYears);
        console.log('Asignaciones:', this.assignments.length, this.assignments);

        const grades = res.grades.data || res.grades;
        grades.forEach((g: any) => this.gradeLevelsMap[g.id] = g.name);

        console.log('Niveles de grado:', grades.length, grades);

        this.processGroups();
        this.loading = false;
      },
      error: (err) => {
        console.log('Error al cargar datos:', err);
        this.loading = false;
      }
    });
  }
  getSectionDisplayName(sec: any): string {
    if (!sec) return 'Sección desconocida';
    const gradeName = this.gradeLevelsMap[sec.grade_level_id] || 'Grado';
    return `${gradeName} - Sección ${sec.section_letter || sec.letter || ''}`;
  }

  processGroups() {
    // Ensure we use the right teacher key (backend uses teacher_id)
    const sample = this.assignments?.[0];
    if (sample) {
      console.log('Sample assignment record:', sample);
    }

    this.teacherGroups = this.teachers.map(teacher => {
      // Find all assignments for this teacher
      const teacherAssignments = this.assignments
        .filter(a => (a as any).teacher_id === teacher.id || (a as any).user_id === teacher.id)
        .map((a: any) => {
          const course = this.courses.find(c => c.id === a.course_id);
          const section = this.sections.find(s => s.id === a.section_id);
          const academicYear = this.academicYears.find(ay => ay.id === a.academic_year_id);

          return {
            id: a.id,
            course,
            section,
            academicYear
          };
        });

      return { teacher, assignments: teacherAssignments };
    });

    console.log('Teacher groups processed:', this.teacherGroups);

    this.filterTeachers();
  }

  filterTeachers() {
    if (!this.searchTerm) {
      this.filteredTeacherGroups = [...this.teacherGroups];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredTeacherGroups = this.teacherGroups.filter(g =>
        g.teacher.name.toLowerCase().includes(term) || g.teacher.last_name?.toLowerCase().includes(term)
      );
    }
  }

  openModal(preselectedTeacherId?: string) {
    this.assignForm.reset({
      teacher_id: preselectedTeacherId || '',
      academic_year_id: this.academicYears.length > 0 ? this.academicYears[0].id : '',
      course_id: '',
      section_id: ''
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveAssignment() {
    if (this.assignForm.invalid) return;
    this.isSubmitting = true;

    const payload = {
      ...this.assignForm.value,
      // Backend expects teacher_id, not user_id
      teacher_id: (this.assignForm.value as any).teacher_id || (this.assignForm.value as any).user_id
    };

    console.log('Enviando asignación al backend:', payload);

    this.academicService.createTeacherCourseAssignment(payload).subscribe({
      next: (res) => {
        console.log('Respuesta creación asignación:', res);
        this.isSubmitting = false;
        this.closeModal();
        Swal.fire({
          icon: 'success', title: 'Asignación creada', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });

        // Reload all data to ensure references are fresh
        this.loadInitialData();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al crear asignación:', err);
        Swal.fire('Error', err.error?.message || 'Error al asignar curso', 'error');
      }
    });
  }

  deleteAssignment(id: string) {
    Swal.fire({
      title: '¿Quitar asignación?',
      text: "El docente dejará de dictar este curso en la sección.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.academicService.deleteTeacherCourseAssignment(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Removida', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
            this.loadInitialData();
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo remover', 'error')
        });
      }
    });
  }
}
