import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AuthService, AcademicContextStudent } from '@core/services/auth.service';
import { PeriodContextService } from '@core/services/period-context.service';
import { ScheduleService } from '@core/services/schedule.service';
import { ReportService, StudentAttendanceRecord } from '@core/services/report.service';
import { EvaluationService, FinalCompetencyResult } from '@core/services/evaluation.service';
import { getEBRColor } from '@shared/utils/grade-converter';

type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';
type GradeEBR = 'AD' | 'A' | 'B' | 'C' | null;

interface ScheduleBlock {
  id: string;
  course_id: string;
  day_of_week: number | string;
  start_time: string;
  end_time: string;
  course?: { id: string; name: string } | null;
  teacher?: { first_name?: string; last_name?: string } | null;
}

interface CourseScheduleView {
  id: string;
  course_id: string;
  course_name: string;
  teacher_name: string;
  day_of_week: number; // 0 (Domingo) - 6 (Sabado), igual a Date.getDay()
  start_time: string;
  end_time: string;
  color: string;
  bgClass: string;
}

interface WeekDay {
  name: string;
  shortName: string;
  dayIndex: number;
  courses: CourseScheduleView[];
}

interface CourseAlert {
  type: 'danger' | 'warning' | 'success' | 'info';
  icon: string;
  message: string;
}

interface CourseSessionView {
  sessionNumber: number;
  date: string;
  status: AttendanceStatus;
}

interface CourseCompetencyView {
  competencyName: string;
  grade: GradeEBR;
  statusLabel: string;
}

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  templateUrl: './student-courses.component.html',
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }

    .schedule-panel-enter {
      animation: expandPanel 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .schedule-panel-leave {
      animation: collapsePanel 0.25s ease-in forwards;
    }

    @keyframes expandPanel {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes collapsePanel {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(-8px); }
    }

    .course-card {
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .course-card:hover {
      box-shadow: 0 12px 40px -8px rgba(0,0,0,0.12);
      transform: translateY(-1px);
    }

    .btn-action {
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .btn-action:active { transform: scale(0.96); }
  `]
})
export class StudentCoursesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private periodCtx = inject(PeriodContextService);
  private scheduleService = inject(ScheduleService);
  private reportService = inject(ReportService);
  private evaluationService = inject(EvaluationService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  private readonly DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  private readonly DAY_SHORT  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Mapeo de nombres de dia (sin tildes) -> indice Date.getDay() (0=Domingo)
  private readonly SCHEDULE_DAY_MAP: Record<string, number> = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
  };

  // Orden de presentacion del horario completo (Lunes -> Domingo)
  private readonly WEEK_DAY_ORDER: { index: number; name: string; short: string }[] = [
    { index: 1, name: 'Lunes',     short: 'Lun' },
    { index: 2, name: 'Martes',    short: 'Mar' },
    { index: 3, name: 'Miércoles', short: 'Mié' },
    { index: 4, name: 'Jueves',    short: 'Jue' },
    { index: 5, name: 'Viernes',   short: 'Vie' },
    { index: 6, name: 'Sábado',    short: 'Sáb' },
    { index: 0, name: 'Domingo',   short: 'Dom' },
  ];

  private readonly COURSE_COLORS: { hex: string; bg: string }[] = [
    { hex: '#8B5CF6', bg: 'bg-[#8B5CF6]' }, // violeta
    { hex: '#10B981', bg: 'bg-[#10B981]' }, // verde
    { hex: '#3B82F6', bg: 'bg-[#3B82F6]' }, // azul
    { hex: '#84CC16', bg: 'bg-[#84CC16]' }, // lima
    { hex: '#EC4899', bg: 'bg-[#EC4899]' }, // rosa
    { hex: '#F59E0B', bg: 'bg-[#F59E0B]' }, // amarillo
    { hex: '#EF4444', bg: 'bg-[#EF4444]' }, // rojo
    { hex: '#06B6D4', bg: 'bg-[#06B6D4]' }, // cyan
  ];

  // ─── Grid config ───────────────────────────────────────────────────────────
  readonly gridStartHour = 6;
  readonly gridEndHour   = 20;
  readonly gridHeightPx  = 560;

  loading = false;
  error = '';

  student: AcademicContextStudent | null = null;
  activeAcademicYearId = '';
  studentName = 'Estudiante';

  currentDate: Date = new Date();
  showFullSchedule = false;
  isMobile = false;

  allCourseSchedules: CourseScheduleView[] = [];
  attendanceRecords: StudentAttendanceRecord[] = [];
  evaluationResults: FinalCompetencyResult[] = [];

  selectedCourseId: string | null = null;
  activeView: 'notes' | 'attendance' | null = null;

  ngOnInit(): void {
    this.checkViewport();
    this.loadContext();

    // Selector global de trimestre: al cambiar, recarga cursos/horarios
    // usando el academic_year_id del periodo seleccionado.
    this.periodCtx.selectedPeriod$
      .pipe(takeUntil(this.destroy$))
      .subscribe((period) => {
        if (period && this.student?.id) {
          this.loadAll(period.academic_year_id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkViewport();
  }

  private checkViewport(): void {
    this.isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  }

  private loadContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.activeAcademicYearId = context.active_academic_year?.id || '';
        this.student = context.students?.[0] || null;
        this.studentName = this.student?.full_name || 'Estudiante';

        // Si ya hay un trimestre global seleccionado, usar su anio academico.
        const currentPeriod = this.periodCtx.currentPeriod;
        const yearId = currentPeriod?.academic_year_id || this.activeAcademicYearId;

        if (this.student && yearId) {
          this.loadAll(yearId);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'No se pudo cargar el contexto académico.';
        this.loading = false;
      },
    });
  }

  private loadAll(academicYearId?: string): void {
    const studentId = this.student!.id;
    const yearId = academicYearId ?? this.activeAcademicYearId;

    this.loading = true;
    this.error = '';

    forkJoin({
      schedules: this.scheduleService.getSchedules({
        academic_year_id: yearId,
        section_id: this.student?.section_id || '',
        per_page: 200,
        sort: 'start_time',
        dir: 'asc',
      }),
      attendance: this.reportService.getAttendanceSummary(studentId),
      evaluation: this.evaluationService.getEvaluationSummary(yearId, studentId),
    }).subscribe({
      next: ({ schedules, attendance, evaluation }) => {
        const blocks = this.extractItems<ScheduleBlock>(schedules);
        this.allCourseSchedules = this.buildScheduleViews(blocks);
        this.attendanceRecords = attendance?.records || [];
        this.evaluationResults = evaluation?.final_results || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la información de cursos.';
        this.loading = false;
      },
    });
  }

  private extractItems<T>(response: any): T[] {
    if (Array.isArray(response)) return response;
    return response?.data?.data || response?.data || [];
  }

  private buildScheduleViews(blocks: ScheduleBlock[]): CourseScheduleView[] {
    const colorByCourse = new Map<string, { hex: string; bg: string }>();
    let colorIndex = 0;

    return blocks.map((block) => {
      if (!colorByCourse.has(block.course_id)) {
        colorByCourse.set(block.course_id, this.COURSE_COLORS[colorIndex % this.COURSE_COLORS.length]);
        colorIndex++;
      }
      const c = colorByCourse.get(block.course_id)!;

      return {
        id: block.id,
        course_id: block.course_id,
        course_name: block.course?.name || 'Curso',
        teacher_name: this.getTeacherName(block),
        day_of_week: this.normalizeDayOfWeek(block.day_of_week),
        start_time: block.start_time ? block.start_time.substring(0, 5) : '--:--',
        end_time: block.end_time ? block.end_time.substring(0, 5) : '--:--',
        color: c.hex,
        bgClass: c.bg,
      };
    });
  }

  private getTeacherName(block: ScheduleBlock): string {
    if (!block.teacher) return 'Docente';
    return [block.teacher.first_name, block.teacher.last_name].filter(Boolean).join(' ') || 'Docente';
  }

  // Normaliza day_of_week del backend (numero ISO 1-7 o nombre en texto) a indice Date.getDay() (0-6, 0=Domingo)
  private normalizeDayOfWeek(value: number | string): number {
    if (typeof value === 'string') {
      const normalized = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return this.SCHEDULE_DAY_MAP[normalized] ?? 0;
    }
    return value % 7;
  }

  // ─── Grid helpers ──────────────────────────────────────────────────────────

  getHourLabels(): number[] {
    const hours: number[] = [];
    for (let h = this.gridStartHour; h <= this.gridEndHour; h++) {
      hours.push(h);
    }
    return hours;
  }

  getTopPosition(time: string): number {
    const [h, m] = time.split(':').map(Number);
    const totalMins = (this.gridEndHour - this.gridStartHour) * 60;
    const offsetMins = (h - this.gridStartHour) * 60 + (m || 0);
    return Math.max(0, Math.min(100, (offsetMins / totalMins) * 100));
  }

  getHeightPercent(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const totalMins = (this.gridEndHour - this.gridStartHour) * 60;
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(0, (duration / totalMins) * 100);
  }

  /** Devuelve los bloques de horario para un dayIndex (0=Dom) */
  getSchedulesByDayIndex(dayIndex: number): CourseScheduleView[] {
    return this.allCourseSchedules
      .filter(cs => cs.day_of_week === dayIndex)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  // ─── Navegacion de dias ─────────────────────────────────────────────────────

  get currentDayName(): string {
    return this.DAY_NAMES[this.currentDate.getDay()];
  }

  get todayDayName(): string {
    return this.DAY_NAMES[new Date().getDay()];
  }

  get currentDateFormatted(): string {
    return this.currentDate.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  }

  navigateDay(direction: 'prev' | 'next'): void {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    this.currentDate = d;
    this.selectedCourseId = null;
    this.activeView = null;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /** Cursos del dia navegado (panel derecho) */
  get coursesForCurrentDay(): CourseScheduleView[] {
    const dayIndex = this.currentDate.getDay();
    return this.allCourseSchedules
      .filter((cs) => cs.day_of_week === dayIndex)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  /** Cursos del dia de HOY (panel izquierdo, siempre el dia real) */
  get todaySchedule(): CourseScheduleView[] {
    const todayIndex = new Date().getDay();
    return this.allCourseSchedules
      .filter((cs) => cs.day_of_week === todayIndex)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  get weekSchedule(): WeekDay[] {
    return this.WEEK_DAY_ORDER.map(({ index, name, short }) => ({
      name,
      shortName: short,
      dayIndex: index,
      courses: this.allCourseSchedules
        .filter((cs) => cs.day_of_week === index)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }));
  }

  /** Dias visibles en el horario completo (solo los que tienen clases) */
  get weekScheduleWithClasses(): WeekDay[] {
    return this.weekSchedule.filter(d => d.courses.length > 0);
  }

  // Lista de cursos matriculados (uno por cada course_id), sin importar el dia
  get allCourses(): CourseScheduleView[] {
    const seen = new Set<string>();
    const result: CourseScheduleView[] = [];
    this.allCourseSchedules.forEach((cs) => {
      if (!seen.has(cs.course_id)) {
        seen.add(cs.course_id);
        result.push(cs);
      }
    });
    return result;
  }

  // Texto con todos los dias/horas en que se imparte un curso
  getCourseDayTime(courseId: string): string {
    return this.allCourseSchedules
      .filter((cs) => cs.course_id === courseId)
      .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
      .map((cs) => `${this.DAY_SHORT[cs.day_of_week]} ${cs.start_time}–${cs.end_time}`)
      .join(' · ');
  }

  // Color hex del curso (para usar en border-left inline style)
  getCourseHexColor(courseId: string): string {
    return this.allCourseSchedules.find(cs => cs.course_id === courseId)?.color ?? '#3B82F6';
  }

  /** Cursos matriculados ordenados: primero los que tienen clase el dia seleccionado (por hora), luego el resto alfabeticamente */
  get sortedCourses(): CourseScheduleView[] {
    const dayIndex = this.currentDate.getDay();

    const coursesWithClassToday = new Set(
      this.allCourseSchedules
        .filter((cs) => cs.day_of_week === dayIndex)
        .map((cs) => cs.course_id)
    );

    return [...this.allCourses].sort((a, b) => {
      const aToday = coursesWithClassToday.has(a.course_id);
      const bToday = coursesWithClassToday.has(b.course_id);

      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;

      if (aToday && bToday) {
        const aTime = this.allCourseSchedules
          .find((cs) => cs.course_id === a.course_id && cs.day_of_week === dayIndex)?.start_time ?? '99:99';
        const bTime = this.allCourseSchedules
          .find((cs) => cs.course_id === b.course_id && cs.day_of_week === dayIndex)?.start_time ?? '99:99';
        return aTime.localeCompare(bTime);
      }

      return a.course_name.localeCompare(b.course_name);
    });
  }

  /** Indica si el curso tiene clase en la fecha indicada */
  hasClassOnDay(courseId: string, date: Date): boolean {
    const dayIndex = date.getDay();
    return this.allCourseSchedules.some((cs) => cs.course_id === courseId && cs.day_of_week === dayIndex);
  }

  /** Rango horario del curso en la fecha indicada, ej. "07:30 - 09:15" */
  getClassTimeForDay(courseId: string, date: Date): string {
    const dayIndex = date.getDay();
    const schedule = this.allCourseSchedules.find((cs) => cs.course_id === courseId && cs.day_of_week === dayIndex);
    return schedule ? `${schedule.start_time} - ${schedule.end_time}` : '';
  }

  // ─── Alertas predictivas ────────────────────────────────────────────────────

  private get evaluationByCourse(): Record<string, FinalCompetencyResult[]> {
    const map: Record<string, FinalCompetencyResult[]> = {};
    this.evaluationResults.forEach((item) => {
      if (!map[item.course_id]) map[item.course_id] = [];
      map[item.course_id].push(item);
    });
    return map;
  }

  getCourseAlerts(courseId: string): CourseAlert[] {
    const alerts: CourseAlert[] = [];

    // --- ASISTENCIA ---
    const attendanceRecords = this.attendanceRecords.filter((r) => r.course_id === courseId);
    const faltas    = attendanceRecords.filter((r) => r.status === 'falta').length;
    const tardanzas = attendanceRecords.filter((r) => r.status === 'tarde').length;
    const total     = attendanceRecords.length;

    if (faltas >= 2) {
      alerts.push({ type: 'danger',  icon: 'warn',    message: `${faltas} falta${faltas > 1 ? 's' : ''} - riesgo de inhabilitación` });
    } else if (tardanzas >= 3) {
      alerts.push({ type: 'warning', icon: 'clock',   message: `${tardanzas} tardanzas registradas` });
    } else if (total > 0 && faltas === 0 && tardanzas === 0) {
      alerts.push({ type: 'success', icon: 'check',   message: 'Asistencia perfecta' });
    }

    // --- NOTAS EBR ---
    const courseResults = this.evaluationByCourse[courseId] || [];
    const grades = courseResults.map((r) => r.final_level).filter((g): g is 'AD' | 'A' | 'B' | 'C' => !!g);

    if (grades.length > 0) {
      const gradeToNum: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };
      const avg        = grades.reduce((sum, g) => sum + (gradeToNum[g] ?? 0), 0) / grades.length;
      const avgRounded = Math.round(avg);

      if (avgRounded <= 1) {
        alerts.push({ type: 'danger',  icon: 'trend-down', message: 'Promedio C - necesitas apoyo urgente' });
      } else if (avgRounded === 4) {
        alerts.push({ type: 'success', icon: 'star',       message: 'Excelente rendimiento, ¡sigue así!' });
      } else if (avgRounded === 3) {
        alerts.push({ type: 'info',    icon: 'info',       message: 'Buen rendimiento, nivel A' });
      }
    }

    return alerts;
  }

  getCourseCardBorder(courseId: string): string {
    const alerts = this.getCourseAlerts(courseId);
    if (alerts.some((a) => a.type === 'danger'))  return 'border-l-red-500';
    if (alerts.some((a) => a.type === 'warning')) return 'border-l-amber-400';
    if (alerts.some((a) => a.type === 'success')) return 'border-l-emerald-500';
    return 'border-l-slate-300';
  }

  /** Devuelve el tipo de alerta más prioritario para el indicador del card */
  getCourseTopAlertType(courseId: string): 'danger' | 'warning' | 'success' | 'info' | 'none' {
    const alerts = this.getCourseAlerts(courseId);
    if (alerts.some(a => a.type === 'danger'))  return 'danger';
    if (alerts.some(a => a.type === 'warning')) return 'warning';
    if (alerts.some(a => a.type === 'success')) return 'success';
    if (alerts.some(a => a.type === 'info'))    return 'info';
    return 'none';
  }

  // Indica si el curso tiene clases HOY
  isCourseToday(courseId: string): boolean {
    const todayIndex = new Date().getDay();
    return this.allCourseSchedules.some(cs => cs.course_id === courseId && cs.day_of_week === todayIndex);
  }

  // ─── Paneles de Notas / Asistencia ─────────────────────────────────────────

  openCourseNotes(courseId: string): void {
    this.router.navigate(['/app/evaluation/student'], { queryParams: { course_id: courseId } });
  }

  openCourseAttendance(courseId: string): void {
    this.router.navigate(['/app/attendance/student'], { queryParams: { course_id: courseId } });
  }

  getCourseCompetencies(courseId: string): CourseCompetencyView[] {
    return (this.evaluationByCourse[courseId] || []).map((r) => ({
      competencyName: r.competency?.name || 'Competencia',
      grade: r.final_level,
      statusLabel: this.getEvaluationStatusLabel(r.current_status),
    }));
  }

  getCourseSessions(courseId: string): CourseSessionView[] {
    return this.attendanceRecords
      .filter((r) => r.course_id === courseId)
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((record, index) => ({
        sessionNumber: index + 1,
        date: record.date,
        status: record.status,
      }));
  }

  // ─── Badges y colores ───────────────────────────────────────────────────────

  getGradeBadgeClass(grade: GradeEBR): string {
    return getEBRColor(grade);
  }

  getAttendanceBadgeClass(status: AttendanceStatus): string {
    const map: Record<AttendanceStatus, string> = {
      presente:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
      tarde:      'bg-amber-50   text-amber-700   border border-amber-200',
      falta:      'bg-red-50     text-red-700     border border-red-200',
      justificado:'bg-blue-50    text-blue-700    border border-blue-200',
    };
    return map[status];
  }

  getAttendanceStatusLabel(status: AttendanceStatus): string {
    const map: Record<AttendanceStatus, string> = {
      presente:   'Presente',
      tarde:      'Tardanza',
      falta:      'Falta',
      justificado:'Justificado',
    };
    return map[status];
  }

  private getEvaluationStatusLabel(status?: string | null): string {
    const map: Record<string, string> = {
      borrador:  'Borrador',
      publicada: 'Publicada',
      cerrada:   'Cerrada',
    };
    return status ? (map[status] || status) : 'Sin estado';
  }
}
