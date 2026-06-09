import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import Swal from 'sweetalert2';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import {
  AttendanceAssignment,
  AttendanceRecord,
  AttendanceService,
  AttendanceStatus,
  DailyAttendanceCheckpoint,
  DailyAttendanceSectionResponse,
} from '@core/services/attendance.service';
import { AuthService } from '@core/services/auth.service';

interface AttendanceState {
  status: AttendanceStatus;
  justification: string;
  updatedAt?: string | null;
  history: AttendanceRecord[];
  historyOpen: boolean;
  historyLoading: boolean;
}

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './teacher-attendance.component.html',
  styleUrls: ['./teacher-attendance.component.css']
})
export class TeacherAttendanceComponent implements OnInit, AfterViewInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);

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

  teacher: any = null;
  assignments: AttendanceAssignment[] = [];
  students: any[] = [];
  attendanceRecords: Record<string, AttendanceState> = {};
  selectedAssignment: AttendanceAssignment | null = null;
  dailyAttendance: DailyAttendanceSectionResponse | null = null;

  // ── Tab principal ────────────────────────────────────
  activeMainTab: 'students' | 'personal' = 'students';

  // ── Mi Asistencia (personal QR) ──────────────────────
  personalQrInput = '';
  personalQrStatus: 'idle' | 'success' | 'error' = 'idle';
  personalQrMessage = '';
  personalQrSubmitting = false;
  showPersonalScanner = false;
  personalDevice: MediaDeviceInfo | undefined;
  personalQrFormats = [BarcodeFormat.QR_CODE];
  personalAvailableDevices: MediaDeviceInfo[] = [];
  personalTodayCheckpoints: { checkpoint: string; time: string }[] = [];

  // ── Polling auto-refresh alumnos ─────────────────────
  private pollingInterval: any = null;

  ngOnInit(): void {
    this.loadTeacherContext();
  }

  ngAfterViewInit(): void {
    this.initIcons();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
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
    return this.students.filter((student) => this.attendanceRecords[student.id]?.status === 'presente').length;
  }

  get lateCount(): number {
    return this.students.filter((student) => this.attendanceRecords[student.id]?.status === 'tarde').length;
  }

  get absentCount(): number {
    return this.students.filter((student) => this.attendanceRecords[student.id]?.status === 'falta').length;
  }

  get justifiedCount(): number {
    return this.students.filter((student) => this.attendanceRecords[student.id]?.status === 'justificado').length;
  }

  get approvedJustificationCount(): number {
    return 0;
  }

  get currentCheckpointLabel(): string {
    return this.selectedCheckpoint === 'entrada' ? 'Entrada QR' : 'Salida QR';
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

  loadTeacherContext(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.getTeacherAttendanceContext().subscribe({
      next: (response) => {
        this.teacher = response.teacher;
        this.assignments = response.assignments || [];

        if (this.authService.getRole() === 'teacher' && !this.teacher) {
          this.error = response.message || 'No se encontró el perfil de docente.';
          this.loading = false;
          return;
        }

        if (this.assignments.length === 0) {
          this.error = 'No tienes asignaciones activas para registrar asistencia.';
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
    this.selectedAssignment = this.assignments.find((assignment) => assignment.id === id) || null;

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

  onDateChange(): void {
    if (this.selectedAssignment) {
      this.loadDailyAttendance();
    }
  }

  onCheckpointChange(): void {
    this.syncAttendanceStateFromDaily();
  }

  loadStudents(): void {
    if (!this.selectedSectionId || !this.selectedAcademicYearId) {
      return;
    }

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
    if (!current) {
      return;
    }

    this.attendanceRecords[studentId] = {
      ...current,
      [field]: value,
    };
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
    if (!record) {
      return;
    }

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
      date_to: this.selectedDate,
      per_page: 5,
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
        const extra = res.skipped_count
          ? `<br><small>${res.skipped_count} estudiantes fueron omitidos por tener justificación aprobada.</small>`
          : '';
        void Swal.fire('Guardado', `${res.message}${extra}`, 'success');
        this.loadDailyAttendance();
      },
      error: (err) => {
        this.saving = false;
        void Swal.fire('Error', err.error?.message || 'Error al guardar asistencia.', 'error');
      }
    });
  }

  exportCurrentAttendance(): void {
    if (!this.filteredStudents.length) {
      void Swal.fire('Sin datos', 'No hay estudiantes para exportar con los filtros actuales.', 'info');
      return;
    }

    const rows = [
      ['Fecha', 'Checkpoint', 'Sección', 'Código', 'Estudiante', 'Estado', 'Comentario', 'Última actualización'],
      ...this.filteredStudents.map((student) => {
        const record = this.attendanceRecords[student.id];
        return [
          this.selectedDate,
          this.currentCheckpointLabel,
          `${this.selectedAssignment?.section?.grade_level?.name || ''} ${this.selectedAssignment?.section?.section_letter || ''}`.trim(),
          student.student_code || '',
          `${student.last_name || ''}, ${student.first_name || ''}`.trim(),
          this.getStatusLabel(record?.status || 'presente'),
          record?.justification || '',
          this.formatDateTime(record?.updatedAt || null),
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencia-${this.selectedCheckpoint}-${this.selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getStatusLabel(status: AttendanceStatus): string {
    return {
      presente: 'Presente',
      tarde: 'Tarde',
      falta: 'Falta',
      justificado: 'Justificado',
    }[status];
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
    if (!value) {
      return 'Sin cambios';
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
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
    if (!this.selectedSectionId || !this.selectedAcademicYearId || !this.selectedDate) {
      return;
    }

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
        if (!this.pollingInterval) this.startPolling();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar la asistencia diaria.';
        this.loading = false;
      }
    });
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      if (this.selectedAssignment && !this.saving) {
        this.loadDailyAttendance();
      }
    }, 15000);
  }

  // ── Mi Asistencia (QR personal del docente) ──────────

  togglePersonalScanner(): void {
    this.showPersonalScanner = !this.showPersonalScanner;
    if (!this.showPersonalScanner) this.personalQrMessage = '';
  }

  onPersonalCamerasFound(devices: MediaDeviceInfo[]): void {
    if (!devices || devices.length === 0) return;
    this.personalAvailableDevices = devices;
    const backKeywords = ['back', 'trasera', 'rear', 'environment', 'facing back', 'camera2 0'];
    const back = devices.find(d => backKeywords.some(kw => d.label.toLowerCase().includes(kw)));
    this.personalDevice = back || devices[devices.length - 1] || devices[0];
  }

  handlePersonalQrScan(result: string): void {
    if (!result) return;
    if (result.startsWith('CERMAT_ATTENDANCE|')) {
      const match = result.match(/session=([^|]+)/i);
      if (match?.[1]) { this.personalQrInput = match[1]; this.submitPersonalCheckin(); }
    } else {
      this.personalQrInput = result;
      this.submitPersonalCheckin();
    }
  }

  submitPersonalCheckin(): void {
    if (!this.personalQrInput.trim()) {
      this.personalQrStatus = 'error';
      this.personalQrMessage = 'Ingresa o escanea el código QR.';
      return;
    }

    let code = this.personalQrInput.trim();
    if (code.startsWith('CERMAT_ATTENDANCE|')) {
      const m = code.match(/session=([^|]+)/i);
      code = m ? m[1] : code;
    }
    code = code.toUpperCase();

    if (!/^[A-Z0-9]{8}$/.test(code)) {
      this.personalQrStatus = 'error';
      this.personalQrMessage = 'Código inválido. Debe tener 8 caracteres alfanuméricos.';
      return;
    }

    this.personalQrSubmitting = true;
    this.personalQrStatus = 'idle';
    this.personalQrMessage = '';

    this.attendanceService.submitStudentDailyQr(code).subscribe({
      next: (response) => {
        this.personalQrStatus = 'success';
        this.personalQrMessage = response.message;
        this.personalQrSubmitting = false;
        this.personalQrInput = '';
        this.showPersonalScanner = false;
        const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        this.personalTodayCheckpoints = this.personalTodayCheckpoints.filter(c => c.checkpoint !== response.checkpoint);
        this.personalTodayCheckpoints.push({ checkpoint: response.checkpoint, time });
        setTimeout(() => { this.personalQrStatus = 'idle'; this.personalQrMessage = ''; }, 5000);
      },
      error: (err) => {
        this.personalQrStatus = 'error';
        this.personalQrMessage = err?.error?.message || 'No se pudo registrar la asistencia.';
        this.personalQrSubmitting = false;
      }
    });
  }

  get personalTodayEntry() { return this.personalTodayCheckpoints.find(c => c.checkpoint === 'entrada') ?? null; }
  get personalTodayExit()  { return this.personalTodayCheckpoints.find(c => c.checkpoint === 'salida') ?? null; }

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

}
