import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import Swal from 'sweetalert2';
import {
  AdminAttendanceOverview,
  AdminAttendanceTeacherStatus,
  AttendanceAssignment,
  AttendanceJustification,
  AttendanceRecord,
  AttendanceService,
  AttendanceStatus,
  JustificationStatus,
  StudentSummary,
  TeacherAttendanceContextResponse,
} from '@core/services/attendance.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AdminBackButtonComponent } from "@shared/components/back-button/admin-back-button.component";

interface AttendanceState {
  attendanceId?: string;
  status: AttendanceStatus;
  justification: string;
  lockedByApprovedJustification: boolean;
  approvedJustificationReason?: string | null;
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
  selectedDate = new Date().toISOString().split('T')[0];
  searchTerm = '';
  error = '';
  success = '';

  statusFilter: 'todos' | AttendanceStatus = 'todos';
  selectedJustificationStatus: JustificationStatus | '' = 'pendiente';

  context: TeacherAttendanceContextResponse | null = null;
  adminOverview: AdminAttendanceOverview | null = null;
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

  get pendingTeacherStatuses(): AdminAttendanceTeacherStatus[] {
    return (this.adminOverview?.teacher_statuses || []).filter((item) => !item.is_complete);
  }

  recordFor(studentId: string): AttendanceState {
    return this.attendanceRecords[studentId] ?? {
      status: 'presente',
      justification: '',
      lockedByApprovedJustification: false,
      approvedJustificationReason: null,
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
        this.selectedCourseId = this.selectedAssignment.course_id;
        this.selectedSectionId = this.selectedAssignment.section_id;

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
      this.students = [];
      this.attendanceRecords = {};
      this.justifications = [];
      return;
    }

    this.selectedCourseId = this.selectedAssignment.course_id;
    this.selectedSectionId = this.selectedAssignment.section_id;
    this.loadStudents();
    this.loadJustifications();
  }

  onDateChange(): void {
    if (!this.selectedAssignment) {
      this.loadAdminOverview();
      return;
    }

    this.loadAdminOverview();
    this.loadStudents();
    this.loadJustifications();
  }

  loadStudents(): void {
    if (!this.selectedCourseId || !this.selectedSectionId) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.attendanceService
      .getStudentsForAttendance(this.selectedCourseId, this.selectedSectionId, this.selectedAssignment?.academic_year_id)
      .subscribe({
        next: (res) => {
          this.students = (res.data || [])
            .map((enrollment: any) => enrollment.student ?? null)
            .filter((student: StudentSummary | null) => !!student) as StudentSummary[];

          this.initRecords();
          this.loadExistingAttendance();
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

    if (current.lockedByApprovedJustification && field === 'status') {
      return;
    }

    this.attendanceRecords[studentId] = {
      ...current,
      [field]: value,
    };
  }

  markFilteredStudentsPresent(): void {
    this.filteredStudents.forEach((student) => {
      if (this.attendanceRecords[student.id]?.lockedByApprovedJustification) {
        return;
      }

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
      course_id: this.selectedCourseId,
      section_id: this.selectedSectionId,
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
    if (!this.selectedCourseId || !this.selectedSectionId || !this.selectedDate) {
      void Swal.fire('Atencion', 'Selecciona curso, seccion y fecha.', 'warning');
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

    const payload = {
      date: this.selectedDate,
      course_id: this.selectedCourseId,
      section_id: this.selectedSectionId,
      records: this.students.map((student) => ({
        student_id: student.id,
        status: this.attendanceRecords[student.id]?.status ?? 'presente',
        justification: this.attendanceRecords[student.id]?.justification ?? '',
      })),
    };

    this.attendanceService.saveBatchAttendance(payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.success = 'Asistencia guardada correctamente.';
        void Swal.fire('Guardado', res.message || 'Asistencia guardada correctamente.', 'success');
        this.loadAdminOverview();
        this.loadExistingAttendance();
        this.loadJustifications();
      },
      error: (err) => {
        this.saving = false;
        void Swal.fire('Error', err.error?.message || 'Error al guardar asistencia.', 'error');
      }
    });
  }

  approve(item: AttendanceJustification): void {
    void Swal.fire({
      title: 'Aprobar justificacion',
      text: `Se marcara como justificada la asistencia de ${this.studentFullName(item.attendance?.student || null)}.`,
      input: 'textarea',
      inputLabel: 'Comentario de revision (opcional)',
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
          void Swal.fire('Aprobada', 'La justificacion fue aprobada.', 'success');
          this.loadAdminOverview();
          this.loadJustifications();
          this.loadExistingAttendance();
        },
        error: (err) => {
          void Swal.fire('Error', err.error?.message || 'No se pudo aprobar la justificacion.', 'error');
        }
      });
    });
  }

  reject(item: AttendanceJustification): void {
    void Swal.fire({
      title: 'Rechazar justificacion',
      text: `La solicitud de ${this.studentFullName(item.attendance?.student || null)} quedara rechazada.`,
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
          void Swal.fire('Rechazada', 'La justificacion fue rechazada.', 'success');
          this.loadAdminOverview();
          this.loadJustifications();
          this.loadExistingAttendance();
        },
        error: (err) => {
          void Swal.fire('Error', err.error?.message || 'No se pudo rechazar la justificacion.', 'error');
        }
      });
    });
  }

  exportCurrentAttendance(): void {
    if (!this.filteredStudents.length) {
      void Swal.fire('Sin datos', 'No hay estudiantes para exportar con los filtros actuales.', 'info');
      return;
    }

    const rows = [
      ['Fecha', 'Curso', 'Seccion', 'Codigo', 'Estudiante', 'Estado', 'Comentario', 'Ultima actualizacion'],
      ...this.filteredStudents.map((student) => {
        const record = this.attendanceRecords[student.id];
        return [
          this.selectedDate,
          this.selectedAssignment?.course?.name || '',
          this.sectionLabel(this.selectedAssignment?.section || null),
          student.student_code || '',
          this.studentFullName(student),
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
    link.download = `asistencia-admin-${this.selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  canEditStudent(studentId: string): boolean {
    return !this.attendanceRecords[studentId]?.lockedByApprovedJustification;
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
      return 'Sin asignacion';
    }

    const course = assignment.course?.code
      ? `${assignment.course.code} - ${assignment.course?.name || 'Curso'}`
      : assignment.course?.name || 'Curso';

    const teacherName = [assignment.teacher?.first_name, assignment.teacher?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    const parts = [
      course,
      this.sectionLabel(assignment.section || null),
      teacherName ? `Docente: ${teacherName}` : '',
    ].filter(Boolean);

    return parts.join(' | ');
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

  teacherFullName(status: AdminAttendanceTeacherStatus | AttendanceAssignment | null | undefined): string {
    const teacher = status?.teacher;
    return [teacher?.first_name, teacher?.last_name].filter(Boolean).join(' ') || 'Sin docente';
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
        lockedByApprovedJustification: false,
        approvedJustificationReason: null,
        updatedAt: null,
        history: [],
        historyOpen: false,
        historyLoading: false,
      };
    });
  }

  private loadExistingAttendance(): void {
    this.attendanceService.getAttendanceHistory({
      course_id: this.selectedCourseId,
      section_id: this.selectedSectionId,
      date: this.selectedDate,
      per_page: 200,
    }).subscribe({
      next: (res) => {
        const rows = res.data || [];

        rows.forEach((attendance) => {
          const approvedJustification = (attendance.justifications || []).find(
            (justification) => justification.status === 'aprobada'
          );

          this.attendanceRecords[attendance.student_id] = {
            attendanceId: attendance.id,
            status: attendance.status,
            justification: attendance.justification || approvedJustification?.reason || '',
            lockedByApprovedJustification: !!approvedJustification,
            approvedJustificationReason: approvedJustification?.reason || null,
            updatedAt: attendance.updated_at || attendance.created_at || null,
            history: this.attendanceRecords[attendance.student_id]?.history || [],
            historyOpen: false,
            historyLoading: false,
          };
        });

        this.loading = false;
        this.refreshIcons();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar la asistencia existente.';
        this.loading = false;
      }
    });
  }
}
