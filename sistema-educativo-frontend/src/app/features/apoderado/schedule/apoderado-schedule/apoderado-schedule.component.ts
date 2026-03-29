import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createIcons, icons } from 'lucide';
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

interface ScheduleRow {
  key: string;
  startMinutes: number;
  timeLabel: string;
  slots: Record<number, ScheduleBlock | null>;
}

@Component({
  selector: 'app-apoderado-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './apoderado-schedule.component.html',
  styleUrls: ['./apoderado-schedule.component.css']
})
export class ApoderadoScheduleComponent implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly scheduleService = inject(ScheduleService);

  readonly days = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miercoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sabado' }
  ];

  students: AcademicContextStudent[] = [];
  selectedStudentId = '';
  activeAcademicYearId = '';
  activeAcademicYearLabel = '';

  schedules: ScheduleBlock[] = [];
  rows: ScheduleRow[] = [];

  loading = false;
  loadingContext = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadAcademicContext();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  printSchedule() {
    window.print();
  }

  onStudentChange(studentId: string) {
    this.selectedStudentId = studentId;
    this.loadSchedules();
  }

  get selectedStudent(): AcademicContextStudent | null {
    return this.students.find((student) => student.id === this.selectedStudentId) || null;
  }

  get selectedStudentName(): string {
    return this.selectedStudent?.full_name || 'Estudiante';
  }

  get selectedStudentSectionLabel(): string {
    const section = this.selectedStudent?.section;
    const grade = section?.grade_level;
    const gradeLabel = grade?.name || (grade ? `${grade.level} ${grade.grade}` : '');
    const sectionLabel = section?.section_letter ? `Seccion ${section.section_letter}` : '';

    return [gradeLabel, sectionLabel].filter(Boolean).join(' - ');
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

  private loadAcademicContext() {
    this.loadingContext = true;
    this.errorMessage = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.activeAcademicYearId = context.active_academic_year?.id || '';
        this.activeAcademicYearLabel = context.active_academic_year?.year
          ? `Ano academico ${context.active_academic_year.year}`
          : 'Ano academico no disponible';

        this.students = (context.students || []).filter((student) => !!student.section_id);

        if (!this.activeAcademicYearId) {
          this.errorMessage = 'No existe un ano academico activo para consultar el horario.';
        } else if (this.students.length === 0) {
          this.errorMessage = 'No se encontraron estudiantes con seccion asignada para este apoderado.';
        } else {
          this.selectedStudentId = this.students[0].id;
          this.loadSchedules();
        }

        this.loadingContext = false;
      },
      error: () => {
        this.loadingContext = false;
        this.errorMessage = 'No se pudo cargar el contexto academico del apoderado.';
      }
    });
  }

  private loadSchedules() {
    const student = this.selectedStudent;
    if (!student?.section_id || !this.activeAcademicYearId) {
      this.schedules = [];
      this.rows = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.scheduleService.getSchedules({
      academic_year_id: this.activeAcademicYearId,
      section_id: student.section_id,
      per_page: 200,
      sort: 'start_time',
      dir: 'asc'
    }).subscribe({
      next: (response) => {
        this.schedules = this.extractItems<ScheduleBlock>(response).sort((left, right) => {
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
        this.errorMessage = error?.error?.message || 'No se pudo cargar el horario del estudiante.';
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

  private buildRows(blocks: ScheduleBlock[]): ScheduleRow[] {
    const rowMap = new Map<string, ScheduleRow>();

    blocks.forEach((block) => {
      const timeLabel = `${this.formatTime(block.start_time)} - ${this.formatTime(block.end_time)}`;
      const key = `${block.start_time}-${block.end_time}`;

      if (!rowMap.has(key)) {
        rowMap.set(key, {
          key,
          timeLabel,
          startMinutes: this.timeToMinutes(block.start_time),
          slots: this.days.reduce((acc, day) => {
            acc[day.id] = null;
            return acc;
          }, {} as Record<number, ScheduleBlock | null>)
        });
      }

      rowMap.get(key)!.slots[Number(block.day_of_week)] = block;
    });

    return [...rowMap.values()].sort((left, right) => left.startMinutes - right.startMinutes);
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '--:--';
  }

  getTeacherName(block: ScheduleBlock | null): string {
    if (!block?.teacher) {
      return 'Sin docente';
    }

    return [block.teacher.first_name, block.teacher.last_name].filter(Boolean).join(' ') || 'Sin docente';
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => parseInt(value, 10));
    return (hours * 60) + (minutes || 0);
  }

  private refreshIcons() {
    queueMicrotask(() => createIcons({ icons }));
  }
}
