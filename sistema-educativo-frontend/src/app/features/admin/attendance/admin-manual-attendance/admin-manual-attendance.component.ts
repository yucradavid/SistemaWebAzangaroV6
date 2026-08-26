import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';
import {
  AttendanceAssignment,
  AttendanceRecord,
  AttendanceService,
  AttendanceStatus,
  DailyAttendanceCheckpoint,
  DailyAttendanceSectionResponse,
} from '@core/services/attendance.service';

interface AttendanceState {
  status: AttendanceStatus;
  justification: string;
  updatedAt?: string | null;
  history: AttendanceRecord[];
  historyOpen: boolean;
  historyLoading: boolean;
}

@Component({
  selector: 'app-admin-manual-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manual-attendance.component.html',
})
export class AdminManualAttendanceComponent implements OnInit, AfterViewInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private refreshSubscription?: Subscription;

  loading = false;
  saving = false;
  selectedCourseId = '';
  selectedSectionId = '';
  selectedAcademicYearId = '';
  selectedDate = new Date().toISOString().split('T')[0];
  selectedCheckpoint: DailyAttendanceCheckpoint = 'entrada';
  error = '';
  success = '';
  searchTerm = '';
  statusFilter: 'todos' | AttendanceStatus = 'todos';

  dateRange: 'day' | 'week' | 'month' = 'day';
  dateFrom = new Date().toISOString().split('T')[0];
  dateTo = new Date().toISOString().split('T')[0];

  assignments: AttendanceAssignment[] = [];
  students: any[] = [];
  attendanceRecords: Record<string, AttendanceState> = {};
  selectedAssignment: AttendanceAssignment | null = null;
  dailyAttendance: DailyAttendanceSectionResponse | null = null;
  isAutoRefreshEnabled = false;

  ngOnInit(): void {
    this.loadContext();
  }

  ngAfterViewInit(): void {
    this.initIcons();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  get filteredStudents(): any[] {
    return this.students.filter((student) => {
      const fullName = `${student.last_name ?? ''} ${student.first_name ?? ''}`.toLowerCase();
      const matchesSearch =
        !this.searchTerm ||
        fullName.includes(this.searchTerm.toLowerCase()) ||
        (student.student_code ?? '').toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        this.statusFilter === 'todos' ||
        this.attendanceRecords[student.id]?.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get presentCount(): number {
    return this.students.filter((s) => this.attendanceRecords[s.id]?.status === 'presente').length;
  }

  get lateCount(): number {
    return this.students.filter((s) => this.attendanceRecords[s.id]?.status === 'tarde').length;
  }

  get absentCount(): number {
    return this.students.filter((s) => this.attendanceRecords[s.id]?.status === 'falta').length;
  }

  get justifiedCount(): number {
    return this.students.filter((s) => this.attendanceRecords[s.id]?.status === 'justificado').length;
  }

  recordFor(studentId: string): AttendanceState {
    return this.attendanceRecords[studentId] ?? {
      status: 'presente',
      justification: '',
      updatedAt: null,
      history: [],
      historyOpen: false,
      historyLoading: false,
    };
  }

  needsJustification(studentId: string): boolean {
    return ['falta', 'justificado'].includes(this.recordFor(studentId).status);
  }

  setDateRange(range: 'day' | 'week' | 'month'): void {
    this.dateRange = range;
    const today = new Date();

    if (range === 'day') {
      this.dateFrom = this.formatDate(today);
      this.dateTo = this.formatDate(today);
    } else if (range === 'week') {
      const first = new Date(today);
      first.setDate(today.getDate() - today.getDay() + 1);
      const last = new Date(first);
      last.setDate(first.getDate() + 6);
      this.dateFrom = this.formatDate(first);
      this.dateTo = this.formatDate(last);
    } else {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      this.dateFrom = this.formatDate(first);
      this.dateTo = this.formatDate(last);
    }

    this.selectedDate = this.dateFrom;
    this.onDateRangeChange();
  }

  onDateRangeChange(): void {
    this.selectedDate = this.dateFrom;
    if (this.selectedAssignment) {
      this.loadDailyAttendance();
    }
  }

  loadContext(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.getTeacherAttendanceContext().subscribe({
      next: (response) => {
        this.assignments = response.assignments || [];

        if (this.assignments.length === 0) {
          this.error = 'No hay asignaciones activas para gestionar asistencia.';
          this.loading = false;
          return;
        }

        this.selectedAssignment = this.assignments[0];
        this.applyAssignment(this.selectedAssignment);
        this.loadStudents();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar el contexto de asistencia.';
        this.loading = false;
      }
    });
  }

  onAssignmentChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedAssignment = this.assignments.find((a) => a.id === id) || null;

    if (!this.selectedAssignment) {
      this.selectedCourseId = '';
      this.selectedSectionId = '';
      this.selectedAcademicYearId = '';
      this.students = [];
      this.attendanceRecords = {};
      this.dailyAttendance = null;
      return;
    }

    this.applyAssignment(this.selectedAssignment);
    this.loadStudents();
  }

  onCheckpointChange(): void {
    this.syncAttendanceStateFromDaily();
  }

  loadStudents(): void {
    if (!this.selectedSectionId || !this.selectedAcademicYearId) return;

    this.loading = true;
    this.error = '';

    this.attendanceService.getStudentsForSectionAttendance(this.selectedSectionId, this.selectedAcademicYearId).subscribe({
      next: (res) => {
        const uniqueStudents = new Map<string, any>();
        (res.data || []).forEach((enrollment: any) => {
          const student = enrollment.student ?? enrollment.students ?? null;
          if (student?.id && !uniqueStudents.has(student.id)) {
            uniqueStudents.set(student.id, student);
          }
        });

        this.students = Array.from(uniqueStudents.values()).sort((a, b) =>
          `${a.last_name ?? ''} ${a.first_name ?? ''}`.localeCompare(`${b.last_name ?? ''} ${b.first_name ?? ''}`)
        );

        this.initRecords();
        this.loadDailyAttendance();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar estudiantes.';
        this.loading = false;
      }
    });
  }

  updateAttendance(studentId: string, field: 'status' | 'justification', value: string): void {
    const current = this.attendanceRecords[studentId];
    if (!current) return;
    this.attendanceRecords[studentId] = { ...current, [field]: value };
  }

  markFilteredStudentsPresent(): void {
    this.filteredStudents.forEach((student) => {
      this.updateAttendance(student.id, 'status', 'presente');
      if (!this.attendanceRecords[student.id]?.justification) {
        this.updateAttendance(student.id, 'justification', '');
      }
    });
  }

  toggleHistory(studentId: string): void {
    const record = this.attendanceRecords[studentId];
    if (!record) return;

    record.historyOpen = !record.historyOpen;
    if (!record.historyOpen || record.history.length > 0) {
      this.refreshIcons();
      return;
    }

    record.historyLoading = true;
    this.attendanceService.getAttendanceHistory({
      student_id: studentId,
      section_id: this.selectedSectionId,
      course_id: this.selectedCourseId || undefined,
      date_from: this.dateFrom,
      date_to: this.dateTo,
      per_page: 10,
    }).subscribe({
      next: (res) => {
        record.history = (res.data || []).filter((item: AttendanceRecord) => item.student_id === studentId);
        record.historyLoading = false;
        this.refreshIcons();
      },
      error: () => {
        record.historyLoading = false;
        record.history = [];
      }
    });
  }

  handleSaveAttendance(): void {
    if (!this.selectedSectionId || !this.selectedAcademicYearId || !this.selectedDate) {
      void Swal.fire('Atención', 'Selecciona aula, fecha y checkpoint.', 'warning');
      return;
    }

    const invalidStudent = this.students.find((student) => {
      const record = this.attendanceRecords[student.id];
      return ['falta', 'justificado'].includes(record?.status) && !record?.justification?.trim();
    });

    if (invalidStudent) {
      void Swal.fire(
        'Comentario requerido',
        `Debes registrar un comentario para ${invalidStudent.last_name}, ${invalidStudent.first_name}.`,
        'warning'
      );
      return;
    }

    this.saving = true;

    this.attendanceService.saveDailySectionAttendance({
      section_id: this.selectedSectionId,
      academic_year_id: this.selectedAcademicYearId,
      date: this.selectedDate,
      checkpoint: this.selectedCheckpoint,
      records: this.students.map((student) => ({
        student_id: student.id,
        status: this.attendanceRecords[student.id]?.status ?? 'presente',
        note: this.attendanceRecords[student.id]?.justification ?? '',
      })),
    }).subscribe({
      next: (res) => {
        this.saving = false;
        this.success = res.message || 'Asistencia diaria guardada correctamente.';
        void Swal.fire('Guardado', res.message || 'Asistencia diaria guardada correctamente.', 'success');
        this.loadDailyAttendance();
      },
      error: (err) => {
        this.saving = false;
        void Swal.fire('Error', err.error?.message || 'Error al guardar asistencia.', 'error');
      }
    });
  }

  toggleAutoRefresh(): void {
    this.isAutoRefreshEnabled = !this.isAutoRefreshEnabled;
    if (this.isAutoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  getStatusLabel(status: AttendanceStatus): string {
    return { presente: 'Presente', tarde: 'Tarde', falta: 'Falta', justificado: 'Justificado' }[status];
  }

  getStatusBadgeClass(status: AttendanceStatus): string {
    return {
      presente: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tarde: 'bg-amber-50 text-amber-700 border-amber-200',
      falta: 'bg-rose-50 text-rose-700 border-rose-200',
      justificado: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    }[status];
  }

  formatDateTime(value?: string | null): string {
    if (!value) return 'Sin cambios';
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  sectionLabel(section: AttendanceAssignment['section'] | null | undefined): string {
    if (!section) return 'Sin sección';
    const grade = section.grade_level?.name || '';
    const letter = section.section_letter || '';
    return `${grade} ${letter}`.trim();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private applyAssignment(assignment: AttendanceAssignment): void {
    this.selectedAssignment = assignment;
    this.selectedCourseId = assignment.course_id;
    this.selectedSectionId = assignment.section_id;
    this.selectedAcademicYearId = assignment.academic_year_id || '';
  }

  private initIcons(): void {
    createIcons({ icons });
  }

  private refreshIcons(): void {
    setTimeout(() => this.initIcons(), 0);
  }

  private initRecords(): void {
    this.attendanceRecords = {};
    this.students.forEach((student) => {
      this.attendanceRecords[student.id] = {
        status: 'falta',
        justification: '',
        updatedAt: null,
        history: [],
        historyOpen: false,
        historyLoading: false,
      };
    });
  }

  private loadDailyAttendance(): void {
    if (!this.selectedSectionId || !this.selectedAcademicYearId || !this.selectedDate) return;

    this.attendanceService.getDailySectionAttendance(
      this.selectedSectionId,
      this.selectedAcademicYearId,
      this.selectedDate
    ).subscribe({
      next: (response) => {
        this.dailyAttendance = response;
        this.syncAttendanceStateFromDaily();
        this.loading = false;
        this.refreshIcons();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar la asistencia diaria.';
        this.loading = false;
      }
    });
  }

  private syncAttendanceStateFromDaily(): void {
    const dailyRows = new Map(
      (this.dailyAttendance?.students || []).map((row) => [row.student_id, row])
    );

    this.students.forEach((student) => {
      const row = dailyRows.get(student.id);
      const status = this.selectedCheckpoint === 'entrada'
        ? row?.entry_status ?? 'falta'
        : row?.exit_status ?? 'falta';
      const note = this.selectedCheckpoint === 'entrada'
        ? row?.entry_note ?? ''
        : row?.exit_note ?? '';
      const updatedAt = this.selectedCheckpoint === 'entrada'
        ? row?.entry_marked_at ?? null
        : row?.exit_marked_at ?? null;

      this.attendanceRecords[student.id] = {
        ...this.attendanceRecords[student.id],
        status,
        justification: note,
        updatedAt,
        history: this.attendanceRecords[student.id]?.history || [],
        historyOpen: false,
        historyLoading: false,
      };
    });
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshSubscription = interval(10000).subscribe(() => {
      if (this.selectedAssignment && !this.saving) {
        this.loadDailyAttendance();
      }
    });
  }

  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }
}
