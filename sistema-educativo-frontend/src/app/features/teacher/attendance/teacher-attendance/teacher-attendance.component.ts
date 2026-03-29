import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import { AttendanceService } from '@core/services/attendance.service';
import { AuthService } from '@core/services/auth.service';
import Swal from 'sweetalert2';

type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';

interface AttendanceState {
  attendanceId?: string;
  status: AttendanceStatus;
  justification: string;
  lockedByApprovedJustification: boolean;
  approvedJustificationReason?: string | null;
  updatedAt?: string | null;
  history: any[];
  historyOpen: boolean;
  historyLoading: boolean;
}

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-attendance.component.html',
  styleUrls: ['./teacher-attendance.component.css']
})
export class TeacherAttendanceComponent implements OnInit, AfterViewInit {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);

  loading = false;
  saving = false;
  selectedCourseId = '';
  selectedSectionId = '';
  selectedDate = new Date().toISOString().split('T')[0];
  error = '';
  success = '';
  searchTerm = '';
  statusFilter: 'todos' | AttendanceStatus = 'todos';

  teacher: any = null;
  assignments: any[] = [];
  students: any[] = [];
  attendanceRecords: Record<string, AttendanceState> = {};
  selectedAssignment: any = null;

  ngOnInit(): void {
    this.loadTeacherContext();
  }

  ngAfterViewInit(): void {
    this.initIcons();
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
    return this.students.filter((student) => this.attendanceRecords[student.id]?.lockedByApprovedJustification).length;
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

  private initIcons() {
    createIcons({ icons });
  }

  private refreshIcons() {
    setTimeout(() => this.initIcons(), 0);
  }

  loadTeacherContext() {
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
        this.selectedCourseId = this.selectedAssignment.course_id;
        this.selectedSectionId = this.selectedAssignment.section_id;
        this.loadStudents();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar el contexto de asistencia.';
        this.loading = false;
      }
    });
  }

  onAssignmentChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedAssignment = this.assignments.find((assignment) => assignment.id === id) || null;

    if (!this.selectedAssignment) {
      this.selectedCourseId = '';
      this.selectedSectionId = '';
      this.students = [];
      this.attendanceRecords = {};
      return;
    }

    this.selectedCourseId = this.selectedAssignment.course_id;
    this.selectedSectionId = this.selectedAssignment.section_id;
    this.loadStudents();
  }

  onDateChange() {
    if (!this.selectedAssignment) {
      return;
    }

    this.loadStudents();
  }

  loadStudents() {
    if (!this.selectedCourseId || !this.selectedSectionId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.attendanceService.getStudentsForAttendance(this.selectedCourseId, this.selectedSectionId).subscribe({
      next: (res) => {
        this.students = (res.data || [])
          .map((enrollment: any) => enrollment.student ?? enrollment.students ?? null)
          .filter((student: any) => !!student);

        this.initRecords();
        this.loadExistingAttendance();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar estudiantes.';
        this.loading = false;
      }
    });
  }

  private initRecords() {
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

  private loadExistingAttendance() {
    this.attendanceService.getAttendanceHistory({
      course_id: this.selectedCourseId,
      section_id: this.selectedSectionId,
      date: this.selectedDate,
      per_page: 200,
    }).subscribe({
      next: (res) => {
        const rows = res.data || [];

        rows.forEach((attendance: any) => {
          const approvedJustification = (attendance.justifications || []).find(
            (justification: any) => justification.status === 'aprobada'
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

  updateAttendance(studentId: string, field: 'status' | 'justification', value: string) {
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

  markFilteredStudentsPresent() {
    this.filteredStudents.forEach((student) => {
      if (this.attendanceRecords[student.id]?.lockedByApprovedJustification) {
        return;
      }

      this.updateAttendance(student.id, 'status', 'presente');
      if (!this.attendanceRecords[student.id]?.justification) {
        this.updateAttendance(student.id, 'justification', '');
      }
    });
  }

  toggleHistory(studentId: string) {
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
        record.history = (res.data || []).filter((item: any) => item.student_id === studentId);
        record.historyLoading = false;
        this.refreshIcons();
      },
      error: () => {
        record.historyLoading = false;
        record.history = [];
      }
    });
  }

  handleSaveAttendance() {
    if (!this.selectedCourseId || !this.selectedSectionId || !this.selectedDate) {
      Swal.fire('Atención', 'Selecciona curso, sección y fecha.', 'warning');
      return;
    }

    const invalidStudent = this.students.find((student) => {
      const record = this.attendanceRecords[student.id];
      return ['falta', 'justificado'].includes(record?.status) && !record?.justification?.trim();
    });

    if (invalidStudent) {
      Swal.fire(
        'Comentario requerido',
        `Debes registrar un comentario para ${invalidStudent.last_name}, ${invalidStudent.first_name}.`,
        'warning'
      );
      return;
    }

    this.saving = true;

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
        Swal.fire('Guardado', res.message || 'Asistencia guardada correctamente.', 'success');
        this.loadExistingAttendance();
      },
      error: (err) => {
        this.saving = false;
        Swal.fire('Error', err.error?.message || 'Error al guardar asistencia.', 'error');
      }
    });
  }

  exportCurrentAttendance() {
    if (!this.filteredStudents.length) {
      Swal.fire('Sin datos', 'No hay estudiantes para exportar con los filtros actuales.', 'info');
      return;
    }

    const rows = [
      ['Fecha', 'Curso', 'Sección', 'Código', 'Estudiante', 'Estado', 'Comentario', 'Última actualización'],
      ...this.filteredStudents.map((student) => {
        const record = this.attendanceRecords[student.id];
        return [
          this.selectedDate,
          this.selectedAssignment?.course?.name || '',
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
    link.download = `asistencia-${this.selectedDate}.csv`;
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

  formatDateTime(value?: string | null): string {
    if (!value) {
      return 'Sin cambios';
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
