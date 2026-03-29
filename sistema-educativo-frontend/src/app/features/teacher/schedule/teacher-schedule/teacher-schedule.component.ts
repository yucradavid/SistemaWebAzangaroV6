import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { createIcons, icons } from 'lucide';
import { AcademicService } from '@core/services/academic.service';
import { AuthService } from '@core/services/auth.service';
import { ScheduleService } from '@core/services/schedule.service';

interface TeacherScheduleBlock {
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
  section?: {
    id: string;
    section_letter?: string;
  } | null;
}

interface TeacherScheduleRow {
  key: string;
  startMinutes: number;
  timeLabel: string;
  slots: Record<number, TeacherScheduleBlock | null>;
}

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-schedule.component.html',
  styleUrls: ['./teacher-schedule.component.css']
})
export class TeacherScheduleComponent implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly academicService = inject(AcademicService);
  private readonly scheduleService = inject(ScheduleService);

  readonly days = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miercoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sabado' }
  ];

  teacherId = '';
  teacherName = 'Docente';
  activeAcademicYearId = '';
  activeAcademicYearLabel = 'Ano academico no disponible';

  schedules: TeacherScheduleBlock[] = [];
  rows: TeacherScheduleRow[] = [];

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadTeacherSchedule();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  printSchedule() {
    window.print();
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

  get totalSections(): number {
    return new Set(this.schedules.map((block) => block.section_id)).size;
  }

  get totalCourses(): number {
    return new Set(this.schedules.map((block) => block.course_id)).size;
  }

  private loadTeacherSchedule() {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      this.errorMessage = 'No se pudo identificar al usuario autenticado.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.activeAcademicYearId = context.active_academic_year?.id || '';
        this.activeAcademicYearLabel = context.active_academic_year?.year
          ? `Ano academico ${context.active_academic_year.year}`
          : 'Ano academico no disponible';

        if (!this.activeAcademicYearId) {
          this.loading = false;
          this.errorMessage = 'No existe un ano academico activo para consultar tu horario.';
          return;
        }

        this.resolveTeacher(currentUser.id);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar el contexto academico del docente.';
      }
    });
  }

  private resolveTeacher(userId: string) {
    this.academicService.getTeachers({ user_id: userId, per_page: 20 }).subscribe({
      next: (response) => {
        const teachers = this.extractItems<any>(response);
        const teacher = teachers[0];

        if (!teacher?.id) {
          this.loading = false;
          this.errorMessage = 'No se encontro un perfil docente asociado a tu usuario.';
          return;
        }

        this.teacherId = teacher.id;
        this.teacherName = [teacher.first_name, teacher.last_name].filter(Boolean).join(' ') || 'Docente';
        this.fetchSchedules();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo identificar el docente autenticado.';
      }
    });
  }

  private fetchSchedules() {
    this.scheduleService.getSchedules({
      academic_year_id: this.activeAcademicYearId,
      teacher_id: this.teacherId,
      per_page: 200,
      sort: 'start_time',
      dir: 'asc'
    }).subscribe({
      next: (response) => {
        this.schedules = this.extractItems<TeacherScheduleBlock>(response).sort((left, right) => {
          const leftDay = Number(left.day_of_week) - Number(right.day_of_week);
          if (leftDay !== 0) {
            return leftDay;
          }

          return this.timeToMinutes(left.start_time) - this.timeToMinutes(right.start_time);
        });
        this.rows = this.buildRows(this.schedules);
        this.loading = false;
        this.refreshIcons();
      },
      error: (error) => {
        this.loading = false;
        this.schedules = [];
        this.rows = [];
        this.errorMessage = error?.error?.message || 'No se pudo cargar el horario del docente.';
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

  private buildRows(blocks: TeacherScheduleBlock[]): TeacherScheduleRow[] {
    const rowMap = new Map<string, TeacherScheduleRow>();

    blocks.forEach((block) => {
      const key = `${block.start_time}-${block.end_time}`;
      const label = `${this.formatTime(block.start_time)} - ${this.formatTime(block.end_time)}`;

      if (!rowMap.has(key)) {
        rowMap.set(key, {
          key,
          timeLabel: label,
          startMinutes: this.timeToMinutes(block.start_time),
          slots: this.days.reduce((acc, day) => {
            acc[day.id] = null;
            return acc;
          }, {} as Record<number, TeacherScheduleBlock | null>)
        });
      }

      rowMap.get(key)!.slots[Number(block.day_of_week)] = block;
    });

    return [...rowMap.values()].sort((left, right) => left.startMinutes - right.startMinutes);
  }

  getSlotTitle(block: TeacherScheduleBlock | null): string {
    if (!block) {
      return 'Libre';
    }

    const course = block.course?.name || 'Curso';
    const section = block.section?.section_letter ? `(${block.section.section_letter})` : '';
    return `${course} ${section}`.trim();
  }

  getSlotMeta(block: TeacherScheduleBlock | null): string {
    if (!block) {
      return 'Sin asignacion';
    }

    return block.room_number ? `Aula ${block.room_number}` : 'Aula no definida';
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => parseInt(value, 10));
    return (hours * 60) + (minutes || 0);
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '--:--';
  }

  private refreshIcons() {
    queueMicrotask(() => createIcons({ icons }));
  }
}
