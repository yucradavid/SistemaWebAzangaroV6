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
  templateUrl: './student-schedule.component.html',
  styleUrls: ['./student-schedule.component.css']
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
