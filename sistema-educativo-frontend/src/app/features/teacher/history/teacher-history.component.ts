import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Period, TeacherCourseAssignment } from '@core/services/academic.service';
import { AttendanceRecord, AttendanceService } from '@core/services/attendance.service';
import { Assignment, TaskService } from '@core/services/task.service';

@Component({
  selector: 'app-teacher-history',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './teacher-history.component.html',
  styles: [':host { display: block; }']
})
export class TeacherHistoryComponent implements OnInit {
  private readonly academicService = inject(AcademicService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly taskService = inject(TaskService);

  loading = false;
  error = '';
  periods: Period[] = [];
  assignments: TeacherCourseAssignment[] = [];
  tasks: Assignment[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  selectedAcademicYearId = '';
  selectedPeriodId = '';
  selectedAssignmentId = '';

  ngOnInit(): void {
    this.loadPeriods();
  }

  get availableYears(): Array<{ id: string; label: string }> {
    const yearMap = new Map<string, string>();

    this.periods.forEach((period) => {
      const yearId = this.getPeriodYearId(period);
      if (!yearId || yearMap.has(yearId)) {
        return;
      }

      yearMap.set(yearId, this.getAcademicYearLabel(period));
    });

    return Array.from(yearMap.entries()).map(([id, label]) => ({ id, label }));
  }

  get filteredPeriods(): Period[] {
    return this.periods.filter((period) => this.getPeriodYearId(period) === this.selectedAcademicYearId);
  }

  get selectedPeriod(): Period | null {
    return this.filteredPeriods.find((period) => period.id === this.selectedPeriodId) || null;
  }

  get selectedAssignment(): TeacherCourseAssignment | null {
    return this.assignments.find((assignment) => assignment.id === this.selectedAssignmentId) || null;
  }

  get selectedAcademicYearLabel(): string {
    const year = this.availableYears.find((item) => item.id === this.selectedAcademicYearId);
    return year?.label || 'Ano academico';
  }

  get selectedPeriodLabel(): string {
    if (!this.selectedPeriod) {
      return 'Periodo historico';
    }

    return `${this.selectedPeriod.name}${this.selectedPeriod.period_number ? ` - Periodo ${this.selectedPeriod.period_number}` : ''}`;
  }

  get selectedAssignmentLabel(): string {
    const assignment = this.selectedAssignment;
    if (!assignment) {
      return 'Curso y seccion';
    }

    const courseName = assignment.course?.name || 'Curso';
    const sectionLetter = assignment.section?.section_letter ? ` - Seccion ${assignment.section.section_letter}` : '';
    const gradeName = this.getAssignmentGradeName(assignment);
    return `${courseName}${gradeName ? ` - ${gradeName}` : ''}${sectionLetter}`;
  }

  get summaryCards(): Array<{ label: string; value: string; helper: string }> {
    return [
      {
        label: 'Cursos',
        value: String(this.assignments.length),
        helper: 'Carga academica del ano seleccionado.',
      },
      {
        label: 'Tareas',
        value: String(this.tasks.length),
        helper: 'Actividades ubicadas dentro del periodo.',
      },
      {
        label: 'Asistencia',
        value: String(this.attendanceRecords.length),
        helper: 'Registros historicos del curso.',
      },
      {
        label: 'Faltas',
        value: String(this.attendanceRecords.filter((record) => record.status === 'falta').length),
        helper: 'Inasistencias registradas.',
      },
      {
        label: 'Tardanzas',
        value: String(this.attendanceRecords.filter((record) => record.status === 'tarde').length),
        helper: 'Tardanzas del periodo.',
      },
    ];
  }

  get attendanceStats(): Array<{ label: string; value: number; className: string }> {
    return [
      {
        label: 'Presentes',
        value: this.attendanceRecords.filter((record) => record.status === 'presente').length,
        className: 'border-emerald-100 bg-emerald-50 text-emerald-800',
      },
      {
        label: 'Tarde',
        value: this.attendanceRecords.filter((record) => record.status === 'tarde').length,
        className: 'border-amber-100 bg-amber-50 text-amber-800',
      },
      {
        label: 'Falta',
        value: this.attendanceRecords.filter((record) => record.status === 'falta').length,
        className: 'border-rose-100 bg-rose-50 text-rose-800',
      },
      {
        label: 'Justificado',
        value: this.attendanceRecords.filter((record) => record.status === 'justificado').length,
        className: 'border-blue-100 bg-blue-50 text-blue-800',
      },
    ];
  }

  get orderedTasks(): Assignment[] {
    return this.tasks.slice().sort((left, right) => {
      return this.getAssignmentTimestamp(right) - this.getAssignmentTimestamp(left);
    });
  }

  get recentAttendance(): AttendanceRecord[] {
    return this.attendanceRecords
      .slice()
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 12);
  }

  onAcademicYearChange(): void {
    this.selectedPeriodId = this.filteredPeriods[0]?.id || '';
    this.loadAssignments();
  }

  onPeriodChange(): void {
    this.loadHistoricalData();
  }

  onAssignmentChange(): void {
    this.loadHistoricalData();
  }

  getAttendanceLabel(status: string): string {
    const map: Record<string, string> = {
      presente: 'Presente',
      tarde: 'Tarde',
      falta: 'Falta',
      justificado: 'Justificado',
    };

    return map[status || ''] || 'Sin estado';
  }

  getAttendanceClass(status: string): string {
    const map: Record<string, string> = {
      presente: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      tarde: 'border-amber-200 bg-amber-50 text-amber-700',
      falta: 'border-rose-200 bg-rose-50 text-rose-700',
      justificado: 'border-blue-200 bg-blue-50 text-blue-700',
    };

    return map[status || ''] || 'border-slate-200 bg-slate-50 text-slate-600';
  }

  getTaskTimingLabel(task: Assignment): string {
    const dueDate = task.due_date ? new Date(task.due_date).getTime() : 0;
    if (!task.due_date) {
      return 'Sin fecha';
    }

    return dueDate < Date.now() ? 'Cerrada' : 'Programada';
  }

  getTaskTimingClass(task: Assignment): string {
    if (!task.due_date) {
      return 'border-slate-200 bg-slate-50 text-slate-600';
    }

    return new Date(task.due_date).getTime() < Date.now()
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';
  }

  getTaskExpectedCount(task: Assignment): number {
    return task.metrics?.expected_count || 0;
  }

  getTaskSubmittedCount(task: Assignment): number {
    return task.metrics?.submitted_count || 0;
  }

  getTaskPendingCount(task: Assignment): number {
    return task.metrics?.pending_count || 0;
  }

  getAssignmentSectionLabel(assignment: TeacherCourseAssignment): string {
    const gradeName = this.getAssignmentGradeName(assignment) || 'Seccion';
    const sectionLetter = assignment.section?.section_letter ? ` - ${assignment.section.section_letter}` : '';
    return `${gradeName}${sectionLetter}`;
  }

  getAttendanceStudentLabel(record: AttendanceRecord): string {
    const student = record.student as any;
    return student?.full_name
      || [student?.last_name, student?.first_name].filter(Boolean).join(', ')
      || 'Estudiante';
  }

  private loadPeriods(): void {
    this.loading = true;
    this.error = '';

    this.academicService.getPeriods({ per_page: 200, is_closed: true }).subscribe({
      next: (response) => {
        this.periods = this.normalizePeriods(response)
          .sort((left, right) =>
            this.getPeriodSortValue(right) - this.getPeriodSortValue(left)
            || (right.period_number || 0) - (left.period_number || 0)
          );

        if (this.periods.length === 0) {
          this.error = 'Todavia no existen periodos cerrados para historial docente.';
          this.loading = false;
          return;
        }

        this.selectedAcademicYearId = this.getPeriodYearId(this.periods[0]);
        this.selectedPeriodId = this.filteredPeriods[0]?.id || this.periods[0].id;
        this.loadAssignments();
      },
      error: () => {
        this.error = 'No se pudieron cargar los periodos historicos.';
        this.loading = false;
      }
    });
  }

  private loadAssignments(): void {
    if (!this.selectedAcademicYearId) {
      this.assignments = [];
      this.tasks = [];
      this.attendanceRecords = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    this.academicService.getTeacherCourseAssignments({
      academic_year_id: this.selectedAcademicYearId,
      per_page: 200,
    }).subscribe({
      next: (response) => {
        this.assignments = this.normalizeAssignments(response)
          .filter((assignment) => !!assignment.course_id && !!assignment.section_id)
          .sort((left, right) => this.getAssignmentSortLabel(left).localeCompare(this.getAssignmentSortLabel(right)));

        if (this.assignments.length === 0) {
          this.selectedAssignmentId = '';
          this.tasks = [];
          this.attendanceRecords = [];
          this.error = 'No tienes cursos asignados en el ano academico seleccionado.';
          this.loading = false;
          return;
        }

        this.selectedAssignmentId = this.assignments[0]?.id || '';
        this.loadHistoricalData();
      },
      error: () => {
        this.assignments = [];
        this.tasks = [];
        this.attendanceRecords = [];
        this.error = 'No se pudo cargar la carga academica historica del docente.';
        this.loading = false;
      }
    });
  }

  private loadHistoricalData(): void {
    const period = this.selectedPeriod;
    const assignment = this.selectedAssignment;

    if (!period || !assignment) {
      this.tasks = [];
      this.attendanceRecords = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    forkJoin({
      tasks: this.taskService.getAssignments({
        course_id: assignment.course_id,
        section_id: assignment.section_id,
        date_from: period.start_date,
        date_to: period.end_date,
        per_page: 200,
        history_scope: true,
      }),
      attendance: this.attendanceService.getAttendanceHistory({
        course_id: assignment.course_id,
        section_id: assignment.section_id,
        date_from: period.start_date,
        date_to: period.end_date,
        per_page: 200,
        history_scope: true,
      }),
    }).subscribe({
      next: ({ tasks, attendance }) => {
        this.tasks = tasks?.data || [];
        this.attendanceRecords = attendance?.data || [];
        this.loading = false;
      },
      error: () => {
        this.tasks = [];
        this.attendanceRecords = [];
        this.error = 'No se pudo cargar el historial del curso seleccionado.';
        this.loading = false;
      }
    });
  }

  private normalizePeriods(response: any): Period[] {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private normalizeAssignments(response: any): TeacherCourseAssignment[] {
    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private getAcademicYearLabel(period: Period): string {
    const year = (period.academicYear as any)?.year ?? (period.academic_year as any)?.year;
    return year ? `Ano ${year}` : 'Ano academico';
  }

  private getPeriodYearId(period: Period): string {
    return (period.academicYear as any)?.id || (period.academic_year as any)?.id || period.academic_year_id;
  }

  private getPeriodSortValue(period: Period): number {
    const year = Number((period.academicYear as any)?.year ?? (period.academic_year as any)?.year ?? 0);
    return Number.isFinite(year) ? year : 0;
  }

  private getAssignmentTimestamp(task: Assignment): number {
    const reference = task.due_date || task.created_at || '';
    const timestamp = new Date(reference).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private getAssignmentSortLabel(assignment: TeacherCourseAssignment): string {
    const course = assignment.course?.name || 'Curso';
    const grade = this.getAssignmentGradeName(assignment);
    const section = assignment.section?.section_letter || '';
    return `${course} ${grade} ${section}`.trim();
  }

  private getAssignmentGradeName(assignment: TeacherCourseAssignment): string {
    return (assignment.section as any)?.grade_level?.name || '';
  }
}
