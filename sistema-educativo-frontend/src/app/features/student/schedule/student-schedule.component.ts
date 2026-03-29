import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, AcademicContextStudent } from '@core/services/auth.service';
import { ScheduleService } from '@core/services/schedule.service';

interface ScheduleBlock {
  id: string;
  academic_year_id: string;
  section_id: string;
  course_id: string;
  teacher_id?: string | null;
  day_of_week: number | string;
  start_time: string;
  end_time: string;
  room_number?: string | null;
  course?: {
    id: string;
    name: string;
  } | null;
  teacher?: {
    first_name?: string;
    last_name?: string;
  } | null;
}

interface DaySchedule {
  dayId: number;
  day: string;
  slots: {
    startTime: string;
    endTime: string;
    course: string;
    teacher: string;
    room: string;
    color: string;
    colorBg: string;
  }[];
}

@Component({
  selector: 'app-schedule-student',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <a routerLink="/app/dashboard/student" class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium group">
        <div class="p-1.5 bg-white border border-slate-200 rounded-lg group-hover:bg-slate-50 transition-colors shadow-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        Volver al Panel
      </a>

      <div class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_36%),linear-gradient(135deg,#ffffff_0%,#eff6ff_48%,#f8fafc_100%)] p-6 sm:p-8 shadow-sm">
        <div class="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-blue-200/20 blur-3xl"></div>
        <div class="absolute right-0 top-0 h-24 w-24 rounded-full bg-indigo-200/20 blur-2xl"></div>

        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-[11px] font-black uppercase tracking-[0.35em] text-blue-700">Portal Estudiantil</p>
            <h1 class="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Mi Horario Escolar</h1>
            <p class="text-slate-600 mt-3 font-medium leading-relaxed">
              Vista semanal conectada al backend con tu seccion y ano academico activo.
            </p>
          </div>

          <div class="flex items-center gap-4 bg-white/90 backdrop-blur border border-slate-200 p-2 rounded-2xl shadow-sm">
            <div class="flex items-center gap-2 px-3 py-1 border-r border-slate-100">
              <div class="w-3 h-3 rounded-full bg-indigo-600"></div>
              <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activo</span>
            </div>
            <p class="text-xs font-black text-slate-900 pr-2">{{ activeAcademicYearLabel }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Estudiante</p>
          <p class="mt-3 text-lg font-bold text-slate-900 leading-tight">{{ studentName }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">{{ sectionLabel || 'Seccion no disponible' }}</p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Bloques</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ totalBlocks }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">Sesiones registradas</p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Horas</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ totalHoursLabel }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">Carga semanal</p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Cursos</p>
          <p class="mt-3 text-3xl font-semibold text-slate-900">{{ totalCourses }}</p>
          <p class="mt-2 text-sm font-medium text-slate-500">Cursos programados</p>
        </div>
      </div>

      <div *ngIf="loading" class="bg-white rounded-[32px] border border-slate-200 shadow-sm p-12 text-center">
        <div class="mx-auto w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-sm font-semibold text-slate-500">Cargando horario desde el backend...</p>
      </div>

      <div *ngIf="!loading && errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </div>

      <div *ngIf="!loading && !errorMessage && weekSchedule.length === 0" class="bg-white rounded-[32px] border border-slate-200 shadow-sm p-12 text-center">
        <p class="text-lg font-bold text-slate-900">No hay horario publicado</p>
        <p class="mt-2 text-sm text-slate-500">Todavia no se encontraron bloques para tu seccion.</p>
      </div>

      <div *ngIf="!loading && !errorMessage && weekSchedule.length > 0" class="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden overflow-x-auto">
        <div class="min-w-[1000px] grid grid-cols-5 divide-x divide-slate-100">
          <div *ngFor="let day of weekSchedule" class="flex flex-col divide-y divide-slate-50">
            <div class="p-6 bg-slate-50/50 text-center">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dia</p>
              <h3 class="text-lg font-black text-slate-900">{{ day.day | uppercase }}</h3>
            </div>

            <div class="p-4 space-y-4 min-h-[600px] hover:bg-slate-50/20 transition-colors">
              <div *ngFor="let slot of day.slots"
                   [class]="'group p-5 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ' + slot.colorBg + ' ' + (slot.colorBg.includes('slate') ? 'border-slate-100 opacity-60' : 'border-transparent')">

                <div class="flex flex-col h-full gap-4">
                  <div class="flex items-start justify-between">
                    <div class="p-2 bg-white/40 backdrop-blur-md rounded-xl shadow-sm">
                      <svg class="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                    </div>
                    <span class="text-[10px] font-black text-slate-600/60 tracking-wider">{{ slot.startTime }} - {{ slot.endTime }}</span>
                  </div>

                  <div>
                    <h4 class="text-sm font-black text-slate-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{{ slot.course }}</h4>
                    <p class="text-[10px] font-bold text-slate-600/70 uppercase tracking-tight">{{ slot.teacher }}</p>
                  </div>

                  <div class="mt-auto flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" [ngClass]="slot.color"></div>
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ slot.room }}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="day.slots.length === 0" class="flex flex-col items-center justify-center py-20 opacity-30">
                <svg class="w-12 h-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span class="text-[10px] font-black uppercase mt-4">Sin clases</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-6 p-6 bg-slate-900 rounded-[32px] text-white">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 text-xs font-bold">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            Matriz cromatica automatica
          </div>
          <div class="flex items-center gap-2 text-xs font-bold">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            Datos desde backend
          </div>
        </div>

        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
          * Los cambios del horario dependen de la publicacion administrativa.
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #F8FAFC; min-height: 100vh; }
  `]
})
export class ScheduleStudentComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly scheduleService = inject(ScheduleService);

  private readonly palette = [
    { color: 'bg-blue-500', colorBg: 'bg-blue-50' },
    { color: 'bg-rose-500', colorBg: 'bg-rose-50' },
    { color: 'bg-emerald-500', colorBg: 'bg-emerald-50' },
    { color: 'bg-indigo-500', colorBg: 'bg-indigo-50' },
    { color: 'bg-amber-500', colorBg: 'bg-amber-50' },
    { color: 'bg-cyan-500', colorBg: 'bg-cyan-50' }
  ];

  student: AcademicContextStudent | null = null;
  activeAcademicYearId = '';
  activeAcademicYearLabel = 'Ano academico no disponible';

  schedules: ScheduleBlock[] = [];
  weekSchedule: DaySchedule[] = [];
  courseStyleMap: Record<string, { color: string; colorBg: string }> = {};

  loading = false;
  errorMessage = '';

  ngOnInit() {
    this.loadAcademicContext();
  }

  get studentName(): string {
    return this.student?.full_name || 'Estudiante';
  }

  get sectionLabel(): string {
    const section = this.student?.section;
    const grade = section?.grade_level;
    const gradeLabel = grade?.name || (grade ? `${grade.level} ${grade.grade}` : '');
    const sectionPart = section?.section_letter ? `Seccion ${section.section_letter}` : '';
    return [gradeLabel, sectionPart].filter(Boolean).join(' - ');
  }

  get totalBlocks(): number {
    return this.schedules.length;
  }

  get totalHoursLabel(): string {
    const totalMinutes = this.schedules.reduce((sum, block) => {
      return sum + (this.timeToMinutes(block.end_time) - this.timeToMinutes(block.start_time));
    }, 0);

    return (totalMinutes / 60).toFixed(2) + 'h';
  }

  get totalCourses(): number {
    return new Set(this.schedules.map((block) => block.course_id)).size;
  }

  private loadAcademicContext() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.activeAcademicYearId = context.active_academic_year?.id || '';
        this.activeAcademicYearLabel = context.active_academic_year?.year
          ? `Ano academico ${context.active_academic_year.year}`
          : 'Ano academico no disponible';

        this.student = context.students?.[0] || null;

        if (!this.activeAcademicYearId) {
          this.loading = false;
          this.errorMessage = 'No existe un ano academico activo para consultar tu horario.';
          return;
        }

        if (!this.student?.section_id) {
          this.loading = false;
          this.errorMessage = 'Tu usuario no tiene una seccion academica asignada.';
          return;
        }

        this.loadSchedules();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar tu contexto academico.';
      }
    });
  }

  private loadSchedules() {
    if (!this.student?.section_id || !this.activeAcademicYearId) {
      this.loading = false;
      this.schedules = [];
      this.weekSchedule = [];
      return;
    }

    this.scheduleService.getSchedules({
      academic_year_id: this.activeAcademicYearId,
      section_id: this.student.section_id,
      per_page: 200,
      sort: 'start_time',
      dir: 'asc'
    }).subscribe({
      next: (response) => {
        this.schedules = this.extractItems<ScheduleBlock>(response).sort((left, right) => {
          const dayDiff = Number(left.day_of_week) - Number(right.day_of_week);
          if (dayDiff !== 0) {
            return dayDiff;
          }
          return this.timeToMinutes(left.start_time) - this.timeToMinutes(right.start_time);
        });
        this.assignCourseStyles();
        this.weekSchedule = this.buildWeekSchedule();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.schedules = [];
        this.weekSchedule = [];
        this.errorMessage = error?.error?.message || 'No se pudo cargar tu horario.';
      }
    });
  }

  private extractItems<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    return [];
  }

  private assignCourseStyles() {
    this.courseStyleMap = {};
    let colorIndex = 0;

    [...new Set(this.schedules.map((block) => block.course_id))].forEach((courseId) => {
      this.courseStyleMap[courseId] = this.palette[colorIndex % this.palette.length];
      colorIndex++;
    });
  }

  private buildWeekSchedule(): DaySchedule[] {
    return [
      { dayId: 1, day: 'Lunes', slots: [] },
      { dayId: 2, day: 'Martes', slots: [] },
      { dayId: 3, day: 'Miercoles', slots: [] },
      { dayId: 4, day: 'Jueves', slots: [] },
      { dayId: 5, day: 'Viernes', slots: [] }
    ].map((day) => ({
      ...day,
      slots: this.schedules
        .filter((block) => Number(block.day_of_week) === day.dayId)
        .map((block) => ({
          startTime: this.formatTime(block.start_time),
          endTime: this.formatTime(block.end_time),
          course: block.course?.name || 'Curso',
          teacher: this.getTeacherName(block),
          room: block.room_number ? `Aula ${block.room_number}` : 'Sin aula',
          color: this.courseStyleMap[block.course_id]?.color || 'bg-slate-500',
          colorBg: this.courseStyleMap[block.course_id]?.colorBg || 'bg-slate-50'
        }))
    }));
  }

  private getTeacherName(block: ScheduleBlock): string {
    if (!block.teacher) {
      return 'Sin docente';
    }

    return [block.teacher.first_name, block.teacher.last_name].filter(Boolean).join(' ') || 'Sin docente';
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => parseInt(value, 10));
    return (hours * 60) + (minutes || 0);
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '--:--';
  }
}
