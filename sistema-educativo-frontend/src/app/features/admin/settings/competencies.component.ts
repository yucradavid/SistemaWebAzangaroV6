import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent, FilterOption } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';
import { AcademicService, Competency, Course } from '@core/services/academic.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-competencies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent, SettingMetricCardComponent, SettingFilterDropdownComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700 relative">
      <app-back-button></app-back-button>

      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Competencias</h1>
          <p class="text-slate-500 text-sm font-medium">Gestiona las competencias curriculares por curso</p>
        </div>
        <button 
          (click)="openModal()"
          class="px-6 py-3 bg-gradient-to-r from-[#0E3A8A] to-[#C026D3] hover:opacity-90 text-white text-sm font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Competencia
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="flex flex-wrap gap-3 mt-2 mb-6">
        <app-setting-metric-card label="Total Cursos" [value]="totalCourses"></app-setting-metric-card>
        <app-setting-metric-card label="Competencias" [value]="totalCompetencies"></app-setting-metric-card>
        <app-setting-metric-card label="Cursos Config." [value]="configuredCourses"></app-setting-metric-card>
        <app-setting-metric-card label="Prom. por Curso" [value]="avgCompetencies | number:'1.0-1'"></app-setting-metric-card>
      </div>

      <!-- Filter Pill -->
      <!-- Filter Pill -->
      <div class="md:max-w-xl mx-auto">
        <app-setting-filter-dropdown
          [options]="courseFilterOptions"
          [selectedId]="selectedCourseFilter"
          placeholder="Todos los cursos"
          (selectionChange)="filterByCourse($event)">
        </app-setting-filter-dropdown>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <!-- Competencies by Course -->
      <div *ngIf="!loading" class="space-y-6">
        <div *ngFor="let courseGroup of filteredGroupedCompetencies" class="space-y-6">
          <h2 class="text-xl font-bold text-[#0F172A] flex items-center gap-3 border-l-[3px] border-[#0E3A8A] pl-4 tracking-tight uppercase leading-none">
            {{ courseGroup.courseName }}
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">({{ courseGroup.courseCode }})</span>
          </h2>
          
          <div class="space-y-4">
            <div *ngFor="let competency of courseGroup.competencies; let i = index" class="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center gap-6 md:gap-8 group relative overflow-hidden">
              
              <div class="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-50 rounded-full blur-2xl group-hover:bg-blue-50 transition-colors pointer-events-none"></div>

              <!-- Content Area -->
              <div class="flex items-start gap-4 flex-1 relative z-10">
                <!-- Number Square -->
                <div class="w-16 h-16 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-[1.25rem] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all flex-shrink-0">
                  <span class="text-2xl font-bold text-white">C{{ i + 1 }}</span>
                </div>

                <!-- Content -->
                <div class="flex-1 space-y-2">
                  <h4 class="text-sm font-bold text-[#0F172A] leading-tight tracking-tight uppercase">
                    {{ competency.name || ('Competencia ' + (i + 1)) }}
                  </h4>
                  <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {{ competency.description }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 relative z-10 w-full md:w-auto">
                <button (click)="openModal(competency)" class="flex-1 md:flex-none p-3.5 bg-white text-[#0E3A8A] border-2 border-slate-100 hover:border-[#0E3A8A] rounded-2xl transition-all active:scale-95 shadow-sm group/edit flex justify-center items-center">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button (click)="deleteCompetency(competency.id)" class="flex-1 md:flex-none p-3.5 bg-red-50 text-red-600 border-2 border-transparent hover:bg-red-600 hover:text-white rounded-2xl transition-all active:scale-95 flex justify-center items-center">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>

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
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E3A8A] to-[#C026D3] flex items-center justify-center shadow-md">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-800 tracking-tight leading-tight">{{ isEditing ? 'Editar Competencia' : 'Nueva Competencia' }}</h2>
                <p class="text-xs text-slate-400 font-medium">{{ isEditing ? 'Modifica los datos de la competencia' : 'Registra un nuevo criterio de evaluación' }}</p>
              </div>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="competencyForm" (ngSubmit)="saveCompetency()" class="p-8 space-y-5">
            
            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Curso Asociado</label>
              <select formControlName="course_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona un Curso...</option>
                <option *ngFor="let c of courses" [value]="c.id">{{ c.code }} - {{ c.name }}</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Título / Nombre de la Competencia</label>
              <input type="text" formControlName="name" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500" placeholder="Ej: Resuelve problemas de cantidad">
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors">Descripción Detallada</label>
              <textarea formControlName="description" rows="3" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:border-blue-500 resize-none leading-relaxed" placeholder="Ej: Traduce cantidades a expresiones numéricas y comunica su comprensión..."></textarea>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors">Orden (Opcional)</label>
              <input type="number" formControlName="order" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus:border-blue-500" placeholder="Ej: 1, 2, 3...">
            </div>

            <div class="pt-6 flex gap-3">
              <button type="button" (click)="closeModal()" class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95">
                Cancelar
              </button>
              <button type="submit" [disabled]="competencyForm.invalid || isSubmitting" class="flex-[1.5] px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ isEditing ? 'Guardar Cambios' : 'Registrar' }}
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
export class CompetenciesComponent implements OnInit {
  competencies: Competency[] = [];
  courses: Course[] = [];
  groupedCompetencies: { courseId: string, courseName: string, courseCode: string, competencies: Competency[] }[] = [];
  filteredGroupedCompetencies: any[] = [];
  
  loading = false;
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  currentEditId: string | null = null;
  competencyForm: FormGroup;
  selectedCourseFilter: string = '';
  courseFilterOptions: FilterOption[] = [];

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.competencyForm = this.fb.group({
      course_id: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      order: [1, [Validators.min(1)]]
    });
  }

  get totalCourses() { return this.courses.length; }
  get totalCompetencies() { return this.competencies.length; }
  get configuredCourses() { return this.groupedCompetencies.length; }
  get avgCompetencies() { return this.configuredCourses === 0 ? 0 : this.totalCompetencies / this.configuredCourses; }

  ngOnInit() {
    this.loadData();
  }

  filterByCourse(val: string) {
    this.selectedCourseFilter = val;
    if (!val) {
      this.filteredGroupedCompetencies = [...this.groupedCompetencies];
    } else {
      this.filteredGroupedCompetencies = this.groupedCompetencies.filter(g => g.courseId === val);
    }
  }

  loadData() {
    this.loading = true;
    this.academicService.getCourses({ per_page: 100 }).subscribe((resC) => {
      this.courses = resC.data || resC;
      this.courseFilterOptions = this.courses.map(c => ({ id: c.id, name: c.name, level: c.code }));
      
      this.academicService.getCompetencies({ per_page: 200 }).subscribe({
        next: (resComp) => {
          this.competencies = resComp.data || resComp;
          this.groupCompetencies();
          this.filterByCourse(this.selectedCourseFilter);
          this.loading = false;
        },
        error: () => this.loading = false
      });
    });
  }

  groupCompetencies() {
    const groups: { [key: string]: { courseId: string, courseName: string, courseCode: string, competencies: Competency[] } } = {};
    
    this.courses.forEach(c => {
      groups[c.id] = { courseId: c.id, courseName: c.name, courseCode: c.code, competencies: [] };
    });

    this.competencies.forEach(comp => {
      if (groups[comp.course_id]) {
        groups[comp.course_id].competencies.push(comp);
      }
    });

    // Remove empty groups and sort based on course code
    this.groupedCompetencies = Object.values(groups)
      .filter(g => g.competencies.length > 0)
      .map(g => {
        g.competencies.sort((a, b) => ((a.order ?? a.order_index ?? 0) - (b.order ?? b.order_index ?? 0)));
        return g;
      })
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  }

  openModal(competency?: Competency) {
    this.isEditing = !!competency;
    if (competency) {
      this.currentEditId = competency.id;
      this.competencyForm.patchValue(competency);
    } else {
      this.currentEditId = null;
      let nextOrder = 1;
      if (this.selectedCourseFilter) {
         const group = this.groupedCompetencies.find(g => g.courseId === this.selectedCourseFilter);
         if (group && group.competencies.length > 0) {
            nextOrder = Math.max(...group.competencies.map(c => c.order || 0)) + 1;
         }
      }
      this.competencyForm.reset({ 
        course_id: this.selectedCourseFilter || '', 
        name: '',
        description: '', 
        order: nextOrder
      });
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveCompetency() {
    if (this.competencyForm.invalid) return;
    this.isSubmitting = true;
    const data = this.competencyForm.value;

    const req$ = this.isEditing && this.currentEditId
      ? this.academicService.updateCompetency(this.currentEditId, data)
      : this.academicService.createCompetency(data);

    req$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: 'Competencia guardada',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        this.loadData();
      },
      error: (err) => {
        this.isSubmitting = false;
        const validationErrors = err.error?.errors
          ? Object.values(err.error.errors).flat().join('<br>')
          : '';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          html: validationErrors || err.error?.message || 'Hubo un error al guardar'
        });
      }
    });
  }

  deleteCompetency(id: string) {
    Swal.fire({
      title: '¿Eliminar competencia?',
      text: "Se eliminaría de manera irreversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.academicService.deleteCompetency(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Eliminada', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
            this.loadData();
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo eliminar, revisa dependencias', 'error')
        });
      }
    });
  }
}
