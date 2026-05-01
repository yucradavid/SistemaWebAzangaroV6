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
    borderColor: string;
  }[];
}

@Component({
  selector: 'app-schedule-student',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#F8FAFC] pb-12">
      <!-- HEADER PREMIUM -->
      <div class="bg-white border-b border-slate-200/60 sticky top-0 z-[100] backdrop-blur-xl bg-white/80">
        <div class="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-6">
            <a routerLink="/app/dashboard/student" class="p-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-xl transition-all group">
              <svg class="w-5 h-5 text-slate-600 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </a>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-1">Mi Horario Personal</p>
              <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                {{ activeAcademicYearLabel }}
                <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] rounded-full border border-blue-100 uppercase tracking-widest">{{ sectionLabel }}</span>
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-4">
             <div class="hidden sm:flex flex-col items-end px-4 border-r border-slate-100">
               <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estudiante</p>
               <p class="text-sm font-bold text-slate-700">{{ studentName }}</p>
             </div>
             <button (click)="printSchedule()" class="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-slate-900/20 active:scale-95 transition-all">Imprimir PDF</button>
          </div>
        </div>
      </div>

      <div class="max-w-[1600px] mx-auto p-6 lg:p-10">
        <div *ngIf="loading" class="py-20 text-center bg-white rounded-[3rem] border border-slate-200/60 shadow-sm">
          <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando con el servidor...</p>
        </div>

        <div *ngIf="!loading && weekSchedule.length === 0" class="py-32 text-center bg-white rounded-[3rem] border border-slate-200/60 shadow-sm">
           <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🗓️</div>
           <h2 class="text-2xl font-black text-slate-900">No hay horario publicado</h2>
           <p class="text-slate-500 mt-2 font-medium">Todavía no se han asignado clases para tu sección.</p>
        </div>

        <!-- GRID DE HORARIO ESTILO ADMIN -->
        <div *ngIf="!loading && weekSchedule.length > 0" class="bg-white border border-slate-200/60 rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative">
          
          <!-- Cabecera de Días -->
          <div class="grid bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md"
               [ngClass]="maxDays === 5 ? 'grid-cols-[80px_repeat(5,1fr)]' : (maxDays === 6 ? 'grid-cols-[80px_repeat(6,1fr)]' : 'grid-cols-[80px_repeat(7,1fr)]')">
            <div class="h-16 flex items-center justify-center text-xl">⏳</div>
            <div *ngFor="let day of weekSchedule" class="h-16 flex flex-col items-center justify-center border-l border-slate-100/60 group">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-[0.25em] group-hover:text-blue-600 transition-colors">{{ day.day.substring(0,3) }}</span>
              <span class="text-xs font-bold text-slate-900">{{ day.day }}</span>
            </div>
          </div>

          <!-- Cuerpo del Horario -->
          <div class="relative grid min-h-[1300px]" 
               [ngClass]="maxDays === 5 ? 'grid-cols-[80px_repeat(5,1fr)]' : (maxDays === 6 ? 'grid-cols-[80px_repeat(6,1fr)]' : 'grid-cols-[80px_repeat(7,1fr)]')"
               [style.height.px]="1300">
            <!-- Eje de Horas -->
            <div class="relative border-r border-slate-100 bg-slate-50/30">
              <div *ngFor="let hour of getHourLabels()" class="absolute w-full flex items-center justify-center" [style.top.%]="getTopPosition(hour + ':00')">
                <span class="text-[10px] font-black text-slate-400 tabular-nums">{{ hour }}:00</span>
              </div>
            </div>

            <!-- Columnas de Días -->
            <div *ngFor="let day of weekSchedule" class="relative border-r border-slate-100/60 group">
              <div class="absolute inset-0 group-hover:bg-blue-50/20 transition-colors pointer-events-none"></div>

              <!-- Bloques de Clase Sólidos -->
              <div *ngFor="let slot of day.slots" 
                   class="absolute left-2 right-2 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden z-10 border border-white/10"
                   [class]="slot.colorBg"
                   [style.top.%]="getTopPosition(slot.startTime)"
                   [style.height.%]="getHeightPercent(slot.startTime, slot.endTime)">
                
                <div class="p-4 flex flex-col h-full text-white relative">
                  <div class="flex flex-col">
                    <h4 class="text-[13px] font-black leading-tight mb-1 uppercase tracking-tight">{{ slot.course }}</h4>
                    <span class="text-[10px] font-bold opacity-90 tabular-nums tracking-wide">{{ slot.startTime }} - {{ slot.endTime }}</span>
                  </div>

                  <div class="mt-auto pt-3 border-t border-white/20">
                    <p class="text-[9px] font-black uppercase tracking-widest opacity-90 truncate">{{ slot.teacher }}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                       <div class="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                       <span class="text-[9px] font-black uppercase tracking-widest opacity-80">{{ slot.room }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LEYENDA INFERIOR -->
        <div class="mt-12 flex flex-wrap items-center justify-between gap-8 p-8 bg-slate-900 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20">
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded-full bg-blue-500 border-4 border-white/20"></div>
              <span class="text-xs font-black uppercase tracking-widest text-slate-200">Matriz Cromática Activa</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white/20"></div>
              <span class="text-xs font-black uppercase tracking-widest text-slate-200">Datos en Tiempo Real</span>
            </div>
          </div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
            * El horario se actualiza automáticamente con la planificación académica centralizada.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .grid-cols-6 { grid-template-columns: 80px repeat(5, 1fr); }
  `]
})
export class ScheduleStudentComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly scheduleService = inject(ScheduleService);

  private readonly palette = [
    { color: 'bg-[#8B5CF6]', colorBg: 'bg-[#8B5CF6]', border: 'border-none' }, // Violeta
    { color: 'bg-[#10B981]', colorBg: 'bg-[#10B981]', border: 'border-none' }, // Esmeralda
    { color: 'bg-[#0EA5E9]', colorBg: 'bg-[#0EA5E9]', border: 'border-none' }, // Celeste
    { color: 'bg-[#84CC16]', colorBg: 'bg-[#84CC16]', border: 'border-none' }, // Lima
    { color: 'bg-[#F59E0B]', colorBg: 'bg-[#F59E0B]', border: 'border-none' }, // Ámbar
    { color: 'bg-[#EC4899]', colorBg: 'bg-[#EC4899]', border: 'border-none' }, // Rosa
    { color: 'bg-[#6366F1]', colorBg: 'bg-[#6366F1]', border: 'border-none' }  // Indigo
  ];

  student: AcademicContextStudent | null = null;
  activeAcademicYearId = '';
  activeAcademicYearLabel = 'Año académico no disponible';

  maxDays = 5;
  gridStartHour = 7;
  gridEndHour = 18;

  schedules: ScheduleBlock[] = [];
  weekSchedule: DaySchedule[] = [];
  courseStyleMap: Record<string, { color: string; colorBg: string; border: string }> = {};

  loading = false;
  errorMessage = '';

  ngOnInit() {
    this.loadAcademicContext();
  }

  get studentName(): string { return this.student?.full_name || 'Estudiante'; }

  get sectionLabel(): string {
    const section = this.student?.section;
    const gradeLabel = section?.grade_level?.name || (section?.grade_level ? `${section.grade_level.level} ${section.grade_level.grade}°` : '');
    const sectionPart = section?.section_letter ? `Sección ${section.section_letter}` : '';
    return [gradeLabel, sectionPart].filter(Boolean).join(' - ');
  }

  private loadAcademicContext() {
    this.loading = true;
    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.activeAcademicYearId = context.active_academic_year?.id || '';
        this.activeAcademicYearLabel = context.active_academic_year?.year ? `Año Académico ${context.active_academic_year.year}` : 'Sin Año Activo';
        this.student = context.students?.[0] || null;
        if (this.activeAcademicYearId && this.student?.section_id) this.loadSchedules();
        else this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private loadSchedules() {
    this.scheduleService.getSchedules({
      academic_year_id: this.activeAcademicYearId,
      section_id: this.student?.section_id!,
      per_page: 200,
      sort: 'start_time',
      dir: 'asc'
    }).subscribe({
      next: (response) => {
        this.schedules = this.extractItems<ScheduleBlock>(response);
        this.calculateMaxDays();
        this.calculateGridRange();
        this.assignCourseStyles();
        this.weekSchedule = this.buildWeekSchedule();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private extractItems<T>(response: any): T[] {
    if (Array.isArray(response)) return response;
    return response?.data?.data || response?.data || [];
  }

  private calculateMaxDays() {
    const daysInSchedules = this.schedules.map(s => Number(s.day_of_week));
    const maxDayFound = Math.max(...daysInSchedules, 5); // Mínimo 5 días
    this.maxDays = maxDayFound > 7 ? 7 : maxDayFound;
  }

  private calculateGridRange() {
    if (this.schedules.length === 0) {
      this.gridStartHour = 7;
      this.gridEndHour = 18;
      return;
    }

    const hours = this.schedules.flatMap(s => [
      this.timeToMinutes(s.start_time) / 60,
      this.timeToMinutes(s.end_time) / 60
    ]);

    const minH = Math.floor(Math.min(...hours));
    const maxH = Math.ceil(Math.max(...hours));

    this.gridStartHour = Math.max(0, minH - 1); // Una hora de margen antes
    this.gridEndHour = Math.min(23, maxH + 1);  // Una hora de margen después
    
    // Asegurar un rango mínimo de 5 horas para que no se vea extraño
    if (this.gridEndHour - this.gridStartHour < 5) {
      this.gridEndHour = this.gridStartHour + 6;
    }
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
    const allDays = [
      { dayId: 1, day: 'Lunes' },
      { dayId: 2, day: 'Martes' },
      { dayId: 3, day: 'Miércoles' },
      { dayId: 4, day: 'Jueves' },
      { dayId: 5, day: 'Viernes' },
      { dayId: 6, day: 'Sábado' },
      { dayId: 7, day: 'Domingo' }
    ];

    return allDays.slice(0, this.maxDays).map((day) => ({
      ...day,
      slots: this.schedules
        .filter((block) => Number(block.day_of_week) === day.dayId)
        .map((block) => ({
          startTime: this.formatTime(block.start_time),
          endTime: this.formatTime(block.end_time),
          course: block.course?.name || 'Curso',
          teacher: this.getTeacherName(block),
          room: block.room_number ? `Aula ${block.room_number}` : 'Sin Aula',
          color: this.courseStyleMap[block.course_id]?.color || 'bg-slate-600',
          colorBg: this.courseStyleMap[block.course_id]?.colorBg || 'bg-slate-50',
          borderColor: this.courseStyleMap[block.course_id]?.border || 'border-slate-200'
        }))
    }));
  }

  private getTeacherName(block: ScheduleBlock): string {
    if (!block.teacher) return 'Sin docente';
    return [block.teacher.first_name, block.teacher.last_name].filter(Boolean).join(' ') || 'Sin docente';
  }

  // HELPER FUNCTIONS FOR GRID LAYOUT
  getHourLabels(): string[] {
    const labels = [];
    for (let i = this.gridStartHour; i <= this.gridEndHour; i++) {
      labels.push(i.toString().padStart(2, '0'));
    }
    return labels;
  }

  getTopPosition(timeStr: string): number {
    const totalMinutes = this.timeToMinutes(timeStr);
    const startRange = this.gridStartHour * 60;
    const endRange = this.gridEndHour * 60;
    const range = endRange - startRange;
    return ((totalMinutes - startRange) / range) * 100;
  }

  getHeightPercent(startStr: string, endStr: string): number {
    const start = this.timeToMinutes(startStr);
    const end = this.timeToMinutes(endStr);
    const range = (this.gridEndHour - this.gridStartHour) * 60;
    return ((end - start) / range) * 100;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => parseInt(value, 10));
    return (hours * 60) + (minutes || 0);
  }

  formatTime(time: string): string { return time ? time.substring(0, 5) : '--:--'; }
  printSchedule() { window.print(); }
}
