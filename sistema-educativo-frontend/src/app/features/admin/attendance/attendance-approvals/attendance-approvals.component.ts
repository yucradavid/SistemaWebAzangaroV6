import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import Swal from 'sweetalert2';
import * as QRCode from 'qrcode';
import { interval, Subscription } from 'rxjs';
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
export class AttendanceApprovalsComponent implements OnInit, AfterViewInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private timerSubscription?: Subscription;
  qrCountdown = '';

  loading = false;
  saving = false;
  justificationsLoading = false;
  overviewLoading = false;
  showInfoNote = true;
  isAutoRefreshEnabled = false;
  visualizationMode: 'full' | 'initials' = 'initials';
  recentlyMarkedIds = new Set<string>();
  private refreshSubscription?: Subscription;

  selectedCourseId = '';
  selectedSectionId = '';
  selectedAcademicYearId = '';
  selectedDate = new Date().toLocaleDateString('en-CA');
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

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopAutoRefresh();
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

  handleOpenQr(checkpoint: DailyAttendanceCheckpoint = this.selectedCheckpoint): void {
    if (!this.selectedAssignment) return;

    // Buscar si ya existe una sesión activa para hoy y este checkpoint
    const existingSession = this.getActiveQrSession(checkpoint);

    if (existingSession) {
      this.openQrModal(existingSession, checkpoint);
      return;
    }

    this.createNewQrSession(checkpoint);
  }

  getActiveQrSession(checkpoint: DailyAttendanceCheckpoint): DailyAttendanceQrSession | null {
    return (this.dailyAttendance?.qr_sessions || []).find(
      (session) => {
        const isActive = session.status === 'activo' && session.checkpoint_type === checkpoint;
        if (!isActive) return false;

        const expiry = this.parseUtcDate(session.expires_at);
        return expiry > Date.now();
      }
    ) || null;
  }

  get activeQrSession(): DailyAttendanceQrSession | null {
    return this.getActiveQrSession(this.selectedCheckpoint);
  }

  checkpointLabel(checkpoint: DailyAttendanceCheckpoint): string {
    return checkpoint === 'entrada' ? 'Entrada QR' : 'Salida QR';
  }

  get currentCheckpointLabel(): string {
    return this.checkpointLabel(this.selectedCheckpoint);
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

  createNewQrSession(checkpoint: DailyAttendanceCheckpoint = this.selectedCheckpoint): void {
    this.attendanceService.createDailyQrSession({
      section_id: this.selectedSectionId,
      academic_year_id: this.selectedAcademicYearId,
      date: this.selectedDate,
      checkpoint,
      late_after_minutes: checkpoint === 'entrada' ? 10 : 0,
      expires_in_minutes: 20,
    }).subscribe({
      next: ({ data }) => {
        this.openQrModal(data, checkpoint);
        this.loadDailyAttendance();
      },
      error: (err) => {
        void Swal.fire('Error', err.error?.message || 'No se pudo abrir la sesión QR.', 'error');
      }
    });
  }

  private async openQrModal(data: DailyAttendanceQrSession, checkpoint: DailyAttendanceCheckpoint = this.selectedCheckpoint): Promise<void> {
    try {
      const payload = data.qr_payload || '';
      const expiryTime = this.parseUtcDate(data.expires_at);

      const qrDataUrl = await QRCode.toDataURL(payload, {
        width: 450,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      });

      this.updateCountdown(expiryTime, data.session_code);
      this.startTimer(expiryTime, data.session_code);

      void Swal.fire({
        title: `<span class="text-2xl font-black text-slate-800">${this.checkpointLabel(checkpoint)}</span>`,
        html: `
          <div class="flex flex-col items-center p-4">
            <div class="relative bg-white p-4 rounded-3xl shadow-xl border border-slate-100 mb-4 group transition-all hover:scale-[1.02]">
              <img src="${qrDataUrl}" alt="QR Code" style="width:450px;height:450px;">
              <div class="absolute inset-0 border-4 border-blue-600/10 rounded-3xl pointer-events-none"></div>
            </div>
            <p style="color:#64748b; font-size:13px; text-align:center; margin-top:8px; margin-bottom:16px;">
              Muestra este código para que alumnos y docentes registren su asistencia
            </p>

            <div class="bg-slate-50 w-full rounded-2xl p-4 border border-slate-200/60 mb-4">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Código de Respaldo</p>
              <p class="text-3xl font-black text-blue-600 tracking-widest text-center tabular-nums">${data.session_code}</p>
            </div>

            <div class="flex items-center gap-3 text-slate-500">
              <div class="flex flex-col items-center">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expira en</span>
                <span id="qr-timer-display" class="text-5xl font-black text-slate-800 tabular-nums">${this.qrCountdown}</span>
              </div>
            </div>
            <button id="regenerate-btn" class="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">Regenerar QR</button>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Listo',
        confirmButtonColor: '#4f46e5',
        didOpen: () => {
          const timerDisplay = document.getElementById('qr-timer-display');
          const regenBtn = document.getElementById('regenerate-btn');
          regenBtn?.addEventListener('click', () => this.regenerateQr(checkpoint));
          
          const intervalId = setInterval(() => {
            if (timerDisplay) {
              timerDisplay.innerText = this.qrCountdown;
            } else {
              clearInterval(intervalId);
            }
          }, 500); 
        },
        willClose: () => {
          this.stopTimer();
        }
      });
    } catch (err) {
      void Swal.fire('Error', 'No se pudo generar el código QR visual.', 'error');
    }
  }

  private parseUtcDate(dateStr: string | null | undefined): number {
    if (!dateStr) return Date.now() + 20 * 60000;
    
    const p = dateStr.match(/\d+/g);
    
    if (p && p.length >= 6) {
      return Date.UTC(
        parseInt(p[0], 10),
        parseInt(p[1], 10) - 1,
        parseInt(p[2], 10),
        parseInt(p[3], 10),
        parseInt(p[4], 10),
        parseInt(p[5], 10)
      );
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? Date.now() + 20 * 60000 : date.getTime();
  }

  private startTimer(expiryTime: number, sessionCode: string): void {
    this.stopTimer();
    
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateCountdown(expiryTime, sessionCode);
    });
  }

  private updateCountdown(targetTime: number, sessionCode: string): void {
    const now = new Date().getTime();
    let distance = targetTime - now;

    if (distance > 30 * 60 * 1000) {
      distance -= 5 * 60 * 60 * 1000;
    }

    if (distance < 0) {
      this.qrCountdown = '00:00';
      this.stopTimer();
      
      const modal = Swal.getHtmlContainer();
      if (modal) {
        const timerEl = modal.querySelector('.text-5xl');
        if (timerEl) {
          timerEl.classList.remove('text-slate-800');
          timerEl.classList.add('text-rose-500');
        }
        
        const helpText = modal.querySelector('.text-slate-500');
        if (helpText) helpText.innerHTML = '<span class="text-rose-600 font-bold">Sesión expirada</span>';
      }
      return;
    }

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    this.qrCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  regenerateQr(checkpoint: DailyAttendanceCheckpoint = this.selectedCheckpoint): void {
    Swal.close();
    this.createNewQrSession(checkpoint);
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
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
        // Detectar nuevos marcados por QR para el efecto "glow"
        if (this.isAutoRefreshEnabled) {
          const oldRecords = { ...this.attendanceRecords };
          this.dailyAttendance = response;
          this.syncAttendanceStateFromDaily();
          
          (response.students || []).forEach(row => {
            const wasNotMarked = !oldRecords[row.student_id]?.justification?.includes('Marcado por QR');
            const isNowMarked = row.entry_note?.includes('Marcado por QR');
            
            if (wasNotMarked && isNowMarked) {
              this.recentlyMarkedIds.add(row.student_id);
              setTimeout(() => this.recentlyMarkedIds.delete(row.student_id), 10000); // 10 seg de brillo
            }
          });
        } else {
          this.dailyAttendance = response;
          this.syncAttendanceStateFromDaily();
        }
        
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

  toggleAutoRefresh(): void {
    this.isAutoRefreshEnabled = !this.isAutoRefreshEnabled;
    if (this.isAutoRefreshEnabled) {
      this.startAutoRefresh();
      void Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Auto-refresco activado (cada 10s)',
        showConfirmButton: false,
        timer: 2000
      });
    } else {
      this.stopAutoRefresh();
    }
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

  toggleVisualizationMode(): void {
    this.visualizationMode = this.visualizationMode === 'full' ? 'initials' : 'full';
  }

  getStatusColorClass(studentId: string, type: 'bg' | 'text' | 'border'): string {
    const status = this.recordFor(studentId).status;
    const colors: Record<string, any> = {
      presente: { 
        bg: 'bg-emerald-500', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200', 
        bgLight: 'bg-emerald-100/90' 
      },
      tarde: { 
        bg: 'bg-amber-500', 
        text: 'text-amber-700', 
        border: 'border-amber-200', 
        bgLight: 'bg-amber-100/90' 
      },
      falta: { 
        bg: 'bg-rose-500', 
        text: 'text-rose-700', 
        border: 'border-rose-200', 
        bgLight: 'bg-rose-100/90' 
      },
      justificado: { 
        bg: 'bg-indigo-500', 
        text: 'text-indigo-700', 
        border: 'border-indigo-200', 
        bgLight: 'bg-indigo-100/90' 
      }
    };

    const color = colors[status] || { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200', bgLight: 'bg-white' };
    
    if (type === 'bg') return this.visualizationMode === 'full' ? color.bgLight : color.bg;
    return color[type];
  }

  hasQrMarking(studentId: string): boolean {
    const record = this.recordFor(studentId);
    return record.justification?.includes('Marcado por QR') || false;
  }

  isRecentlyMarked(studentId: string): boolean {
    return this.recentlyMarkedIds.has(studentId);
  }

  unlockQr(studentId: string): void {
    const record = this.recordFor(studentId);
    record.justification = ''; // Limpiar la marca de QR
    // Al limpiar la nota, el hasQrMarking será false y los botones se habilitarán
  }
}
