import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import Swal from 'sweetalert2';
import {
  AdminAttendanceOverview,
  AttendanceAssignment,
  AttendanceJustification,
  AttendanceRecord,
  AttendanceService,
  AttendanceStatus,
  DailyAttendanceCheckpoint,
  DailyAttendanceQrSession,
  DailyAttendanceSectionResponse,
  JustificationStatus,
  StudentSummary,
  TeacherAttendanceContextResponse,
} from '@core/services/attendance.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AdminBackButtonComponent } from '@shared/components/back-button/admin-back-button.component';

interface AttendanceState {
  status: AttendanceStatus;
  justification: string;
  updatedAt?: string | null;
  history: AttendanceRecord[];
  historyOpen: boolean;
  historyLoading: boolean;
}

@Component({
  selector: 'app-attendance-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, AdminBackButtonComponent],
  templateUrl: './attendance-approvals.component.html',
})
export class AttendanceApprovalsComponent implements OnInit, AfterViewInit {
  private attendanceService = inject(AttendanceService);

  loading = false;
  saving = false;
  justificationsLoading = false;
  overviewLoading = false;

  selectedCourseId = '';
  selectedSectionId = '';
  selectedAcademicYearId = '';
  selectedDate = new Date().toISOString().split('T')[0];
  selectedCheckpoint: DailyAttendanceCheckpoint = 'entrada';
  searchTerm = '';
  error = '';
  success = '';

  statusFilter: 'todos' | AttendanceStatus = 'todos';
  selectedJustificationStatus: JustificationStatus | '' = 'pendiente';

  context: TeacherAttendanceContextResponse | null = null;
  adminOverview: AdminAttendanceOverview | null = null;
  dailyAttendance: DailyAttendanceSectionResponse | null = null;
  assignments: AttendanceAssignment[] = [];
  selectedAssignment: AttendanceAssignment | null = null;
  students: StudentSummary[] = [];
  justifications: AttendanceJustification[] = [];
  attendanceRecords: Record<string, AttendanceState> = {};

  ngOnInit(): void {
    this.loadContext();
  }

  ngAfterViewInit(): void {
    this.initIcons();
  }

  get filteredStudents(): StudentSummary[] {
    return this.students.filter((student) => {
      const fullName = this.studentFullName(student).toLowerCase();
      const code = (student.student_code || '').toLowerCase();
      const term = this.searchTerm.trim().toLowerCase();

      const matchesSearch = !term || fullName.includes(term) || code.includes(term);
      const matchesStatus = this.statusFilter === 'todos' || this.attendanceRecords[student.id]?.status === this.statusFilter;

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

  get pendingJustificationsCount(): number {
    return this.justifications.filter((item) => item.status === 'pendiente').length;
  }

  get activeQrSession(): DailyAttendanceQrSession | null {
    return (this.dailyAttendance?.qr_sessions || []).find(
      (session) => session.checkpoint_type === this.selectedCheckpoint && session.status === 'activo'
    ) || null;
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

  loadContext(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.getTeacherAttendanceContext().subscribe({
      next: (response) => {
        this.context = response;
        this.assignments = response.assignments || [];
        this.loadAdminOverview();

        if (this.assignments.length === 0) {
          this.error = 'No hay asignaciones activas para gestionar asistencia.';
          this.loading = false;
          this.justifications = [];
          return;
        }

        this.selectedAssignment = this.assignments[0];
        this.applyAssignment(this.selectedAssignment);
        this.loadStudents();
        this.loadJustifications();
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
      this.justifications = [];
      this.dailyAttendance = null;
      return;
    }

    this.applyAssignment(this.selectedAssignment);
    this.loadStudents();
    this.loadJustifications();
  }

  onDateChange(): void {
    this.loadAdminOverview();
    if (this.selectedAssignment) {
      this.loadDailyAttendance();
      this.loadJustifications();
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
    this.success = '';

    this.attendanceService
      .getStudentsForSectionAttendance(this.selectedSectionId, this.selectedAcademicYearId)
      .subscribe({
        next: (res) => {
          const uniqueStudents = new Map<string, StudentSummary>();
          (res.data || []).forEach((enrollment: any) => {
            const student = enrollment.student ?? null;
            if (student?.id && !uniqueStudents.has(student.id)) {
              uniqueStudents.set(student.id, student);
            }
          });

          this.students = Array.from(uniqueStudents.values()).sort((a, b) =>
            this.studentFullName(a).localeCompare(this.studentFullName(b))
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

  loadAdminOverview(): void {
    this.overviewLoading = true;

    this.attendanceService.getAdminOverview({
      date: this.selectedDate || undefined,
    }).subscribe({
      next: (response) => {
        this.adminOverview = response;
        this.overviewLoading = false;
      },
      error: () => {
        this.adminOverview = null;
        this.overviewLoading = false;
      }
    });
  }

  loadJustifications(): void {
    this.justificationsLoading = true;

    this.attendanceService.getJustifications({
      status: this.selectedJustificationStatus,
      course_id: this.selectedCourseId || undefined,
      section_id: this.selectedSectionId || undefined,
      date: this.selectedDate || undefined,
      per_page: 100,
    }).subscribe({
      next: (res) => {
        this.justifications = res.data || [];
        this.justificationsLoading = false;
        this.refreshIcons();
      },
      error: () => {
        this.justifications = [];
        this.justificationsLoading = false;
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
      this.updateAttendance(student.id, 'justification', '');
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
      course_id: this.selectedCourseId || undefined,
      section_id: this.selectedSectionId || undefined,
      date_to: this.selectedDate,
      per_page: 5,
    }).subscribe({
      next: (res) => {
        record.history = (res.data || []).filter((item) => item.student_id === studentId);
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
        `Debes registrar un comentario para ${this.studentFullName(invalidStudent)}.`,
        'warning'
      );
      return;
    }

    this.saving = true;
    this.success = '';

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
        this.success = 'Asistencia diaria guardada correctamente.';
        void Swal.fire('Guardado', res.message || 'Asistencia diaria guardada correctamente.', 'success');
        this.loadAdminOverview();
        this.loadDailyAttendance();
        this.loadJustifications();
      },
      error: (err) => {
        this.saving = false;
        void Swal.fire('Error', err.error?.message || 'Error al guardar asistencia.', 'error');
      }
    });
  }

  createQrSession(): void {
    if (!this.selectedSectionId || !this.selectedAcademicYearId || !this.selectedDate) {
      void Swal.fire('Atención', 'Selecciona aula y fecha antes de abrir el QR.', 'warning');
      return;
    }

    this.attendanceService.createDailyQrSession({
      section_id: this.selectedSectionId,
      academic_year_id: this.selectedAcademicYearId,
      date: this.selectedDate,
      checkpoint: this.selectedCheckpoint,
      late_after_minutes: this.selectedCheckpoint === 'entrada' ? 10 : 0,
      expires_in_minutes: 20,
    }).subscribe({
      next: ({ data }) => {
        void Swal.fire({
          title: `${this.currentCheckpointLabel} abierto`,
          html: `
            <div style="text-align:left">
              <p><strong>Código:</strong> ${data.session_code}</p>
              <p><strong>Payload QR:</strong></p>
              <code style="word-break:break-all;display:block;padding:12px;background:#f8fafc;border-radius:8px;">${data.qr_payload}</code>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Cerrar'
        });
        this.loadDailyAttendance();
      },
      error: (err) => {
        void Swal.fire('Error', err.error?.message || 'No se pudo abrir la sesión QR.', 'error');
      }
    });
  }

  approve(item: AttendanceJustification): void {
    void Swal.fire({
      title: 'Aprobar justificación',
      text: `Se marcará como justificada la asistencia de ${this.studentFullName(item.attendance?.student || null)}.`,
      input: 'textarea',
      inputLabel: 'Comentario de revisión (opcional)',
      inputValue: item.review_notes || '',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const reviewNotes = typeof result.value === 'string' ? result.value.trim() : '';

      this.attendanceService.approveJustification(item.id, {
        review_notes: reviewNotes || null,
      }).subscribe({
        next: () => {
          void Swal.fire('Aprobada', 'La justificación fue aprobada.', 'success');
          this.loadAdminOverview();
          this.loadJustifications();
          this.loadDailyAttendance();
        },
        error: (err) => {
          void Swal.fire('Error', err.error?.message || 'No se pudo aprobar la justificación.', 'error');
        }
      });
    });
  }

  reject(item: AttendanceJustification): void {
    void Swal.fire({
      title: 'Rechazar justificación',
      text: `La solicitud de ${this.studentFullName(item.attendance?.student || null)} quedará rechazada.`,
      input: 'textarea',
      inputLabel: 'Motivo de rechazo',
      inputValue: item.review_notes || '',
      inputValidator: (value) => value?.trim() ? null : 'Debes ingresar un motivo de rechazo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.attendanceService.rejectJustification(item.id, {
        review_notes: String(result.value || '').trim(),
      }).subscribe({
        next: () => {
          void Swal.fire('Rechazada', 'La justificación fue rechazada.', 'success');
          this.loadAdminOverview();
          this.loadJustifications();
          this.loadDailyAttendance();
        },
        error: (err) => {
          void Swal.fire('Error', err.error?.message || 'No se pudo rechazar la justificación.', 'error');
        }
      });
    });
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

  getJustificationStatusBadgeClass(status: JustificationStatus): string {
    return {
      pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
      aprobada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rechazada: 'bg-rose-50 text-rose-700 border-rose-200',
    }[status];
  }

  assignmentLabel(assignment: AttendanceAssignment | null | undefined): string {
    if (!assignment) {
      return 'Sin asignación';
    }

    const course = assignment.course?.code
      ? `${assignment.course.code} - ${assignment.course?.name || 'Curso'}`
      : assignment.course?.name || 'Curso';

    const teacherName = [assignment.teacher?.first_name, assignment.teacher?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return [course, this.sectionLabel(assignment.section || null), teacherName ? `Docente: ${teacherName}` : '']
      .filter(Boolean)
      .join(' | ');
  }

  sectionLabel(section: AttendanceAssignment['section'] | AttendanceRecord['section'] | null | undefined): string {
    const grade = section?.grade_level?.name || 'Sin grado';
    const letter = section?.section_letter || '';
    return `${grade} ${letter}`.trim();
  }

  studentFullName(student: StudentSummary | null | undefined): string {
    if (!student) {
      return 'Sin estudiante';
    }

    return [student.last_name, student.first_name].filter(Boolean).join(', ') || 'Sin nombre';
  }

  guardianFullName(item: AttendanceJustification): string {
    return [item.guardian?.first_name, item.guardian?.last_name].filter(Boolean).join(' ') || 'Sin apoderado';
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
        status: 'presente',
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
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar la asistencia diaria.';
        this.loading = false;
      }
    });
  }

  private syncAttendanceStateFromDaily(): void {
    const dailyRows = new Map((this.dailyAttendance?.students || []).map((row) => [row.student_id, row]));

    this.students.forEach((student) => {
      const row = dailyRows.get(student.id);
      const status = this.selectedCheckpoint === 'entrada'
        ? row?.entry_status ?? 'presente'
        : row?.exit_status ?? 'presente';
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
