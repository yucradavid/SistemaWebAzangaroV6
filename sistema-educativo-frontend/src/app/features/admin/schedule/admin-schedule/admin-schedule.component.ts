import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Course, GradeLevel, Section } from '@core/services/academic.service';
import { ScheduleService } from '@core/services/schedule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-700">
      <app-back-button></app-back-button>

      <div class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,58,138,0.16),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#eff6ff_48%,#f8fafc_100%)] p-6 sm:p-8 shadow-sm">
        <div class="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl"></div>
        <div class="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-cyan-200/20 blur-2xl"></div>

        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Planificador Academico</p>
            <h1 class="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">Horario Semanal</h1>
            <p class="mt-3 text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Organiza bloques por seccion, curso, docente y aula con control visual de carga semanal.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              (click)="printSchedule()"
              [disabled]="schedules.length === 0"
              class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 backdrop-blur text-sm font-bold text-slate-600 hover:border-blue-600 hover:text-blue-700 disabled:opacity-50">
              Imprimir
            </button>
            <button
              type="button"
              (click)="openModal()"
              [disabled]="!selectedSectionId || !activeAcademicYearId || loading"
              class="px-4 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-600 disabled:opacity-50 shadow-lg shadow-blue-700/20">
              Agregar Bloque
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div class="space-y-1">
          <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Grado</label>
          <select
            [(ngModel)]="selectedGradeId"
            (change)="onGradeChange()"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
            <option value="">Seleccionar grado</option>
            <option *ngFor="let grade of grades" [value]="grade.id">{{ grade.name || (grade.level + ' ' + grade.grade + '°') }}</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Seccion</label>
          <select
            [(ngModel)]="selectedSectionId"
            (change)="onSectionChange()"
            [disabled]="!selectedGradeId || !activeAcademicYearId"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-50">
            <option value="">Seleccionar seccion</option>
            <option *ngFor="let section of sections" [value]="section.id">Seccion {{ section.section_letter }}</option>
          </select>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Estado</p>
          <p class="mt-1 text-sm font-semibold text-slate-700">
            {{ activeAcademicYearId ? 'Ano academico activo detectado' : 'Sin ano academico activo' }}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {{ selectedSectionId ? 'Seccion lista para editar horario.' : 'Selecciona grado y seccion para continuar.' }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Bloques</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ schedules.length }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">Total de sesiones registradas</p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Horas</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ getTotalScheduledHoursLabel() }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">Carga total programada en la semana</p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Cursos</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ getScheduledCourseCount() }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">Cursos con al menos un bloque</p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Docentes</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ getAssignedTeacherCount() }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">Docentes asignados al horario actual</p>
        </div>
      </div>

      <div *ngIf="!activeAcademicYearId" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        No hay un ano academico activo. Activa uno antes de registrar horarios.
      </div>

      <div *ngIf="loadErrorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ loadErrorMessage }}
      </div>

      <div *ngIf="selectedSectionId" class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-bold text-slate-900">{{ getSelectedGradeName() }} - Seccion {{ getSelectedSectionLetter() }}</h2>
            <p class="text-sm text-slate-500">Bloques cargados: {{ schedules.length }}</p>
          </div>
          <div *ngIf="loading" class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-px bg-slate-100">
          <div *ngFor="let day of days" class="bg-white p-5 min-h-[220px]">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-800">{{ day.name }}</h3>
              <span class="text-[11px] font-bold text-slate-400">{{ getSchedulesByDay(day.id).length }} bloques</span>
            </div>

            <div class="space-y-3" *ngIf="getSchedulesByDay(day.id).length > 0; else emptyDay">
              <div *ngFor="let block of getSchedulesByDay(day.id)" [class]="'rounded-2xl p-4 text-white shadow-sm ' + getCourseColor(block.course_id)">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-black uppercase leading-tight">{{ block.course?.name || getCourseName(block.course_id) }}</p>
                    <p class="text-xs font-bold text-white/90 mt-1">{{ formatTime(block.start_time) }} - {{ formatTime(block.end_time) }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button type="button" (click)="editBlock(block)" class="text-[11px] font-black uppercase text-white/90 hover:text-white">Editar</button>
                    <button type="button" (click)="deleteBlock(block.id, $event)" class="text-[11px] font-black uppercase text-white/90 hover:text-white">Eliminar</button>
                  </div>
                </div>

                <div class="mt-3 space-y-1 text-xs font-semibold text-white/90">
                  <p *ngIf="block.teacher">Docente: {{ block.teacher.first_name }} {{ block.teacher.last_name }}</p>
                  <p *ngIf="block.room_number">Aula: {{ block.room_number }}</p>
                </div>
              </div>
            </div>

            <ng-template #emptyDay>
              <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-400 text-center">
                Sin bloques registrados
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <div *ngIf="selectedSectionId && getCourseLoadRows().length > 0" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Carga por Curso</h3>
            <p class="text-sm font-medium text-slate-500">Comparacion entre horas configuradas y horas ya programadas.</p>
          </div>
          <p class="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Control Semanal</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div *ngFor="let row of getCourseLoadRows()" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-black uppercase text-slate-900 leading-tight">{{ row.name }}</p>
                <p class="mt-1 text-xs font-semibold text-slate-500">
                  {{ row.scheduledHoursLabel }} programadas de {{ row.limitHoursLabel }} configuradas
                </p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
                    [ngClass]="row.statusClass">
                {{ row.statusLabel }}
              </span>
            </div>

            <div class="mt-4">
              <div class="h-3 rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                     [style.width.%]="row.progress"
                     [ngClass]="row.barClass"></div>
              </div>
              <div class="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <span>{{ row.blocks }} bloques</span>
                <span>{{ row.progress | number:'1.0-0' }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!selectedSectionId && selectedGradeId" class="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-400 font-medium">
        Selecciona una seccion para ver o editar el horario.
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="relative z-10 w-full max-w-3xl rounded-[2rem] border border-slate-100 bg-white shadow-2xl overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
            <div class="p-6 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50">
              <div class="mb-4">
                <h2 class="text-xl font-bold text-slate-900">{{ editingBlockId ? 'Editar Bloque' : 'Agregar Bloque' }}</h2>
                <p class="text-sm text-slate-500 mt-1">{{ getSelectedGradeName() }} - Seccion {{ getSelectedSectionLetter() }}</p>
              </div>

              <div *ngIf="overlapError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {{ saveErrorMessage || 'Revisa la informacion antes de guardar.' }}
              </div>

              <form [formGroup]="scheduleForm" (ngSubmit)="saveBlock()" class="space-y-4">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Curso</label>
                  <select formControlName="course_id" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                    <option value="">Seleccionar curso</option>
                    <option *ngFor="let course of courses" [value]="course.id">{{ course.name }}</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Docente</label>
                  <select formControlName="teacher_id" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                    <option value="">Sin docente asignado</option>
                    <option *ngFor="let teacher of teachers" [value]="teacher.id">{{ teacher.first_name }} {{ teacher.last_name }}</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Dia</label>
                  <select formControlName="day_of_week" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                    <option *ngFor="let day of days" [value]="day.id">{{ day.name }}</option>
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Inicio</label>
                    <input type="time" formControlName="start_time" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Fin</label>
                    <input type="time" formControlName="end_time" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Aula</label>
                  <input type="text" formControlName="room_number" placeholder="Ej: A-101" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                </div>

                <div class="grid grid-cols-2 gap-3 pt-2">
                  <button type="button" (click)="closeModal()" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                    Cancelar
                  </button>
                  <button type="submit" [disabled]="scheduleForm.invalid || saving" class="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                    {{ saving ? 'Guardando...' : (editingBlockId ? 'Actualizar' : 'Guardar') }}
                  </button>
                </div>

                <div class="text-center" *ngIf="editingBlockId">
                  <button type="button" (click)="resetFormToNew()" class="text-xs font-bold uppercase text-blue-600 hover:underline">
                    Volver a Agregar
                  </button>
                </div>
              </form>
            </div>

            <div class="p-6 bg-white">
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Vista Rapida</h3>
              <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Curso</p>
                  <p class="text-lg font-bold text-slate-900">{{ getCourseName(scheduleForm.get('course_id')?.value) || 'Selecciona un curso' }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Horario</p>
                  <p class="text-base font-semibold text-slate-700">{{ formatTime(scheduleForm.get('start_time')?.value) || '--:--' }} - {{ formatTime(scheduleForm.get('end_time')?.value) || '--:--' }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Dia</p>
                  <p class="text-base font-semibold text-slate-700">{{ getLiveDayName() }}</p>
                </div>
                <div *ngIf="scheduleForm.get('room_number')?.value">
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Aula</p>
                  <p class="text-base font-semibold text-slate-700">{{ scheduleForm.get('room_number')?.value }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media print {
      @page { size: landscape; margin: 0.5cm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
    }
  `]
})
export class AdminScheduleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private academicService = inject(AcademicService);
  private scheduleService = inject(ScheduleService);

  days = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miercoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sabado' }
  ];

  colorPalette = [
    'bg-[#8B5CF6]',
    'bg-[#10B981]',
    'bg-[#00A1DE]',
    'bg-[#84CC16]',
    'bg-[#EC4899]',
    'bg-[#F59E0B]',
    'bg-[#EF4444]',
    'bg-[#06B6D4]',
    'bg-[#6366F1]'
  ];
  courseColorMap: Record<string, string> = {};

  grades: GradeLevel[] = [];
  sections: Section[] = [];
  courses: Course[] = [];
  teachers: any[] = [];
  schedules: any[] = [];

  selectedGradeId = '';
  selectedSectionId = '';
  activeAcademicYearId = '';

  loading = false;
  showModal = false;
  saving = false;
  overlapError = false;
  loadErrorMessage = '';
  saveErrorMessage = '';
  editingBlockId: string | null = null;
  scheduleForm: FormGroup;

  constructor() {
    this.scheduleForm = this.fb.group({
      course_id: ['', Validators.required],
      teacher_id: [''],
      day_of_week: [1, Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      room_number: ['']
    });
  }

  ngOnInit() {
    this.loadAcademicYears();
    this.loadGrades();
    this.loadTeachers();
  }

  private loadAcademicYears() {
    this.academicService.getAcademicYears({ per_page: 200 }).subscribe({
      next: (response) => {
        const items = this.extractItems<any>(response);
        const activeYear = items.find((year) => year.is_active);
        this.activeAcademicYearId = activeYear?.id || '';
        this.loadErrorMessage = this.activeAcademicYearId ? '' : 'No existe un ano academico activo para gestionar horarios.';
      },
      error: (error) => {
        this.activeAcademicYearId = '';
        this.loadErrorMessage = this.getErrorMessage(error, 'No se pudo cargar el ano academico activo.');
      }
    });
  }

  private loadGrades() {
    this.academicService.getGradeLevels({ per_page: 200 }).subscribe({
      next: (response) => {
        this.grades = this.extractItems<GradeLevel>(response);
      },
      error: () => {
        this.grades = [];
      }
    });
  }

  private loadTeachers() {
    this.academicService.getTeachers({ per_page: 200 }).subscribe({
      next: (response) => {
        this.teachers = this.extractItems<any>(response);
      },
      error: () => {
        this.teachers = [];
      }
    });
  }

  onGradeChange() {
    this.sections = [];
    this.courses = [];
    this.schedules = [];
    this.courseColorMap = {};
    this.selectedSectionId = '';
    this.loadErrorMessage = '';

    if (!this.selectedGradeId) {
      return;
    }

    if (!this.activeAcademicYearId) {
      this.loadErrorMessage = 'Primero debes tener un ano academico activo para gestionar horarios.';
      return;
    }

    this.academicService.getSections({
      academic_year_id: this.activeAcademicYearId,
      grade_level_id: this.selectedGradeId,
      per_page: 200
    }).subscribe({
      next: (response) => {
        this.sections = this.extractItems<Section>(response);
      },
      error: (error) => {
        this.sections = [];
        this.loadErrorMessage = this.getErrorMessage(error, 'No se pudieron cargar las secciones del grado.');
      }
    });
  }

  onSectionChange() {
    this.courses = [];
    this.schedules = [];
    this.courseColorMap = {};
    this.loadErrorMessage = '';

    if (!this.selectedSectionId) {
      return;
    }

    if (!this.activeAcademicYearId) {
      this.loadErrorMessage = 'No existe un ano academico activo para cargar el horario.';
      return;
    }

    this.loadCoursesForSection();
    this.loadSchedules();
  }

  private loadCoursesForSection() {
    if (!this.selectedSectionId || !this.activeAcademicYearId) {
      this.courses = [];
      return;
    }

    this.academicService.getCourses({
      section_id: this.selectedSectionId,
      academic_year_id: this.activeAcademicYearId,
      per_page: 200
    }).subscribe({
      next: (response) => {
        this.courses = this.extractItems<Course>(response);
      },
      error: (error) => {
        this.courses = [];
        this.loadErrorMessage = this.getErrorMessage(error, 'No se pudieron cargar los cursos de la seccion.');
      }
    });
  }

  loadSchedules() {
    if (!this.selectedSectionId || !this.activeAcademicYearId) {
      return;
    }

    this.loading = true;
    this.loadErrorMessage = '';

    this.scheduleService.getSchedules({
      academic_year_id: this.activeAcademicYearId,
      section_id: this.selectedSectionId,
      per_page: 200,
      sort: 'day_of_week',
      dir: 'asc'
    }).subscribe({
      next: (response) => {
        this.schedules = this.extractItems<any>(response);
        this.assignColors();
        this.loading = false;
      },
      error: (error) => {
        this.schedules = [];
        this.courseColorMap = {};
        this.loadErrorMessage = this.getErrorMessage(error, 'No se pudo cargar el horario de la seccion.');
        this.loading = false;
      }
    });
  }

  private extractItems<T>(response: any): T[] {
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

  private sortCoursesInOrder() {
    const uniqueIds = [...new Set(this.schedules.map((schedule) => schedule.course_id))];
    return uniqueIds.sort((left, right) => {
      const leftTime = Math.min(...this.schedules
        .filter((schedule) => schedule.course_id === left)
        .map((schedule) => this.timeToMinutes(schedule.start_time)));
      const rightTime = Math.min(...this.schedules
        .filter((schedule) => schedule.course_id === right)
        .map((schedule) => this.timeToMinutes(schedule.start_time)));
      return leftTime - rightTime;
    });
  }

  assignColors() {
    this.courseColorMap = {};
    let colorIndex = 0;
    this.sortCoursesInOrder().forEach((courseId) => {
      this.courseColorMap[String(courseId)] = this.colorPalette[colorIndex % this.colorPalette.length];
      colorIndex++;
    });
  }

  getSchedulesByDay(dayId: number) {
    return this.schedules
      .filter((schedule) => Number(schedule.day_of_week) === dayId)
      .sort((left, right) => this.timeToMinutes(left.start_time) - this.timeToMinutes(right.start_time));
  }

  openModal() {
    if (!this.activeAcademicYearId) {
      Swal.fire('Ano academico', 'Debes activar un ano academico antes de registrar horarios.', 'warning');
      return;
    }

    if (!this.selectedSectionId) {
      return;
    }

    if (this.courses.length === 0) {
      Swal.fire('Sin cursos', 'La seccion seleccionada no tiene cursos disponibles para programar.', 'warning');
      return;
    }

    this.resetFormToNew();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.overlapError = false;
    this.saveErrorMessage = '';
    this.editingBlockId = null;
  }

  editBlock(block: any) {
    this.overlapError = false;
    this.saveErrorMessage = '';
    this.editingBlockId = block.id;
    this.scheduleForm.patchValue({
      course_id: block.course_id,
      teacher_id: block.teacher_id || '',
      day_of_week: Number(block.day_of_week),
      start_time: this.formatTime(block.start_time),
      end_time: this.formatTime(block.end_time),
      room_number: block.room_number || ''
    });
    this.showModal = true;
  }

  resetFormToNew() {
    this.overlapError = false;
    this.saveErrorMessage = '';
    this.editingBlockId = null;
    this.scheduleForm.reset({
      course_id: '',
      teacher_id: '',
      day_of_week: 1,
      start_time: '07:00',
      end_time: '08:00',
      room_number: ''
    });
  }

  saveBlock() {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    if (!this.activeAcademicYearId || !this.selectedSectionId) {
      this.overlapError = true;
      this.saveErrorMessage = 'Selecciona un ano academico activo y una seccion antes de guardar.';
      return;
    }

    this.saving = true;
    this.overlapError = false;
    this.saveErrorMessage = '';

    const isEditing = !!this.editingBlockId;
    const payload = {
      ...this.scheduleForm.getRawValue(),
      teacher_id: this.toNullableString(this.scheduleForm.get('teacher_id')?.value),
      room_number: this.toNullableString(this.scheduleForm.get('room_number')?.value),
      academic_year_id: this.activeAcademicYearId,
      section_id: this.selectedSectionId
    };

    const request$ = isEditing
      ? this.scheduleService.updateSchedule(this.editingBlockId as string, payload)
      : this.scheduleService.createSchedule(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: isEditing ? 'Bloque actualizado' : 'Bloque guardado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        this.loadSchedules();
      },
      error: (error: any) => {
        this.saving = false;
        this.overlapError = true;
        this.saveErrorMessage = this.getErrorMessage(
          error,
          isEditing ? 'No se pudo actualizar el bloque horario.' : 'No se pudo guardar el bloque horario.'
        );
      }
    });
  }

  deleteBlock(id: string, event: Event) {
    event.stopPropagation();

    Swal.fire({
      title: 'Eliminar bloque',
      text: 'No podras revertir esta accion.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.scheduleService.deleteSchedule(id).subscribe({
        next: () => {
          if (this.editingBlockId === id) {
            this.resetFormToNew();
          }

          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadSchedules();
        },
        error: (error: any) => {
          Swal.fire('Error', this.getErrorMessage(error, 'No se pudo eliminar el bloque.'), 'error');
        }
      });
    });
  }

  printSchedule() {
    window.print();
  }

  private toNullableString(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmedValue = String(value).trim();
    return trimmedValue === '' ? null : trimmedValue;
  }

  private getErrorMessage(error: any, fallback: string): string {
    const validationErrors = error?.error?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstError = Object.values(validationErrors).flat()[0];
      if (typeof firstError === 'string' && firstError.trim() !== '') {
        return firstError;
      }
    }

    const backendMessage = error?.error?.message;
    return typeof backendMessage === 'string' && backendMessage.trim() !== '' ? backendMessage : fallback;
  }

  private timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  }

  formatTime(timeStr: string): string {
    return timeStr ? timeStr.substring(0, 5) : '';
  }

  getCourseColor(courseId: string): string {
    return this.courseColorMap[courseId] || 'bg-slate-500';
  }

  getCourseName(courseId: string): string {
    return this.courses.find((course) => course.id === courseId)?.name
      || this.schedules.find((schedule) => schedule.course_id === courseId)?.course?.name
      || '';
  }

  getSelectedGradeName() {
    const grade = this.grades.find((item) => item.id === this.selectedGradeId);
    return grade ? (grade.name || `${grade.level} ${grade.grade}°`) : '';
  }

  getSelectedSectionLetter() {
    return this.sections.find((section) => section.id === this.selectedSectionId)?.section_letter || '';
  }

  getTotalScheduledMinutes(): number {
    return this.schedules.reduce((total, schedule) => {
      return total + this.timeToMinutes(schedule.end_time) - this.timeToMinutes(schedule.start_time);
    }, 0);
  }

  getTotalScheduledHoursLabel(): string {
    return (this.getTotalScheduledMinutes() / 60).toFixed(2) + 'h';
  }

  getScheduledCourseCount(): number {
    return new Set(this.schedules.map((schedule) => schedule.course_id)).size;
  }

  getAssignedTeacherCount(): number {
    return new Set(
      this.schedules
        .map((schedule) => schedule.teacher_id)
        .filter((teacherId) => !!teacherId)
    ).size;
  }

  getCourseLoadRows() {
    return this.courses
      .map((course) => {
        const courseSchedules = this.schedules.filter((schedule) => schedule.course_id === course.id);
        const scheduledMinutes = courseSchedules.reduce((total, schedule) => {
          return total + this.timeToMinutes(schedule.end_time) - this.timeToMinutes(schedule.start_time);
        }, 0);
        const limitMinutes = (course.hours_per_week || course.weekly_hours || 0) * 60;
        const rawProgress = limitMinutes > 0 ? (scheduledMinutes / limitMinutes) * 100 : 0;
        const progress = Math.max(0, Math.min(100, rawProgress));
        const isComplete = limitMinutes > 0 && scheduledMinutes >= limitMinutes;
        const isNearLimit = limitMinutes > 0 && !isComplete && rawProgress >= 75;

        return {
          id: course.id,
          name: course.name,
          blocks: courseSchedules.length,
          scheduledMinutes,
          limitMinutes,
          scheduledHoursLabel: (scheduledMinutes / 60).toFixed(2) + 'h',
          limitHoursLabel: ((limitMinutes || 0) / 60).toFixed(2) + 'h',
          progress,
          statusLabel: limitMinutes === 0 ? 'Sin meta' : isComplete ? 'Cubierto' : isNearLimit ? 'En rango' : 'Pendiente',
          statusClass: limitMinutes === 0
            ? 'bg-slate-200 text-slate-600'
            : isComplete
              ? 'bg-emerald-100 text-emerald-700'
              : isNearLimit
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700',
          barClass: limitMinutes === 0
            ? 'bg-slate-400'
            : isComplete
              ? 'bg-emerald-500'
              : isNearLimit
                ? 'bg-amber-500'
                : 'bg-blue-600'
        };
      })
      .filter((row) => row.blocks > 0 || row.limitMinutes > 0)
      .sort((left, right) => right.progress - left.progress || left.name.localeCompare(right.name));
  }

  getLiveDayName() {
    const dayId = Number(this.scheduleForm.get('day_of_week')?.value);
    return this.days.find((day) => day.id === dayId)?.name || 'Selecciona un dia';
  }
}
