import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import localeEsPe from '@angular/common/locales/es-PE';
import { ICONS } from '@core/constants/icons';
import { AttendanceService } from '@core/services/attendance.service';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import {
  ReportService,
  StudentAttendanceJustificationData,
  StudentAttendanceRecord,
  StudentAttendanceSummaryResponse,
} from '@core/services/report.service';

registerLocaleData(localeEsPe);

type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';

interface GuardianAttendanceRecordView {
  id: string;
  date: string;
  status: AttendanceStatus;
  justification: string | null;
  course: {
    id: string;
    name: string;
    code: string;
  };
  justification_data?: StudentAttendanceJustificationData | null;
}

interface CalendarDay {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  records: GuardianAttendanceRecordView[];
  dominantStatus: AttendanceStatus | null;
}

interface JustificationDraft {
  attendanceId: string;
  date: string;
  courseName: string;
  courseCode: string;
  reason: string;
  rejectedReviewNote: string | null;
}

@Component({
  selector: 'app-apoderado-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './apoderado-attendance.component.html',
  styleUrls: ['./apoderado-attendance.component.css'],
  styles: [`
    :host { display: block; background: #F8FAFC; min-height: 100vh; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.25rem; }
  `]
})
export class ApoderadoAttendanceComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private reportService = inject(ReportService);
  private attendanceService = inject(AttendanceService);

  readonly dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  students: AcademicContextStudent[] = [];
  attendance: GuardianAttendanceRecordView[] = [];
  months: { value: string; label: string }[] = [];
  selectedStudentId = '';
  selectedMonth = new Date().toISOString().slice(0, 7);
  selectedCourseId = 'all';
  selectedCalendarDate = '';
  loading = false;
  error = '';
  successMessage = '';
  modalError = '';
  isModalOpen = false;
  isSubmittingJustification = false;
  lastSummary: StudentAttendanceSummaryResponse | null = null;
  justificationDraft: JustificationDraft = this.createEmptyDraft();

  constructor() {
    this.generateMonths();
  }

  ngOnInit(): void {
    this.loadAcademicContext();
  }

  get selectedStudent(): AcademicContextStudent | null {
    return this.students.find((student) => student.id === this.selectedStudentId) || null;
  }

  get filteredAttendance(): GuardianAttendanceRecordView[] {
    const records = this.selectedCourseId === 'all'
      ? this.attendance
      : this.attendance.filter((record) => record.course.id === this.selectedCourseId);

    return records.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  get availableCourses(): Array<{ id: string; name: string; code: string }> {
    const courseMap = new Map<string, { id: string; name: string; code: string }>();

    this.attendance.forEach((record) => {
      if (!courseMap.has(record.course.id)) {
        courseMap.set(record.course.id, record.course);
      }
    });

    return Array.from(courseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  get selectedDateRecords(): GuardianAttendanceRecordView[] {
    if (!this.selectedCalendarDate) {
      return [];
    }

    return this.filteredAttendance.filter((record) => this.toDateString(new Date(record.date)) === this.selectedCalendarDate);
  }

  get actionableRecords(): GuardianAttendanceRecordView[] {
    return this.filteredAttendance.filter((record) => this.canJustify(record)).slice(0, 5);
  }

  get totalRecords(): number {
    return this.filteredAttendance.length;
  }

  get presentCount(): number {
    return this.countByStatus('presente');
  }

  get lateCount(): number {
    return this.countByStatus('tarde');
  }

  get absentCount(): number {
    return this.countByStatus('falta');
  }

  get justifiedCount(): number {
    return this.countByStatus('justificado');
  }

  get pendingJustificationsCount(): number {
    return this.filteredAttendance.filter((record) => record.justification_data?.status === 'pendiente').length;
  }

  get effectiveAttendanceCount(): number {
    return this.presentCount + this.justifiedCount;
  }

  get effectiveAttendanceRate(): number {
    return this.getPercentage(this.effectiveAttendanceCount, this.totalRecords);
  }

  get lateRate(): number {
    return this.getPercentage(this.lateCount, this.totalRecords);
  }

  get absentRate(): number {
    return this.getPercentage(this.absentCount, this.totalRecords);
  }

  get monthLabel(): string {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  }

  get riskAlert(): { title: string; message: string; icon: string; containerClass: string } | null {
    if (this.totalRecords === 0 || !this.selectedStudent) {
      return null;
    }

    if (this.absentCount >= 3 || this.effectiveAttendanceRate < 80) {
      return {
        title: 'Seguimiento urgente',
        message: `${this.selectedStudent.full_name} acumula ${this.absentCount} faltas y ${this.effectiveAttendanceRate}% de asistencia efectiva.`,
        icon: 'alertCircle',
        containerClass: 'bg-rose-50 border-rose-200 text-rose-700',
      };
    }

    if (this.lateCount >= 4 || this.effectiveAttendanceRate < 90) {
      return {
        title: 'Riesgo por tardanzas',
        message: `${this.selectedStudent.full_name} registra ${this.lateCount} tardanzas en el periodo filtrado.`,
        icon: 'clock',
        containerClass: 'bg-amber-50 border-amber-200 text-amber-700',
      };
    }

    return {
      title: 'Seguimiento estable',
      message: `${this.selectedStudent.full_name} mantiene ${this.effectiveAttendanceRate}% de asistencia efectiva este mes.`,
      icon: 'checkCircle2',
      containerClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    };
  }

  get calendarDays(): CalendarDay[] {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const offset = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((offset + lastDay.getDate()) / 7) * 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - offset);

    return Array.from({ length: totalCells }, (_, index) => {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + index);
      const dateKey = this.toDateString(current);
      const records = this.filteredAttendance.filter((record) => this.toDateString(new Date(record.date)) === dateKey);

      return {
        date: dateKey,
        dayNumber: current.getDate(),
        inCurrentMonth: current.getMonth() === month - 1,
        isToday: dateKey === this.toDateString(new Date()),
        records,
        dominantStatus: this.resolveDominantStatus(records),
      };
    });
  }

  get statCards() {
    return [
      {
        label: 'Asistencia efectiva',
        value: `${this.effectiveAttendanceRate}%`,
        helper: `${this.effectiveAttendanceCount} registros presentes o justificados`,
        icon: 'checkCircle2',
        color: 'bg-emerald-500',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
      },
      {
        label: 'Tardanzas',
        value: this.lateCount,
        helper: `${this.lateRate}% del total mensual`,
        icon: 'clock',
        color: 'bg-amber-400',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
      },
      {
        label: 'Faltas',
        value: this.absentCount,
        helper: `${this.absentRate}% del total mensual`,
        icon: 'xCircle',
        color: 'bg-rose-500',
        bgColor: 'bg-rose-50',
        textColor: 'text-rose-600',
      },
      {
        label: 'Por revisar',
        value: this.pendingJustificationsCount,
        helper: `${this.actionableRecords.length} registros listos para justificar`,
        icon: 'fileText',
        color: 'bg-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
      },
    ];
  }

  onStudentChange(): void {
    this.selectedCourseId = 'all';
    this.selectedCalendarDate = '';
    this.closeModal();
    this.loadAttendance();
  }

  onCourseChange(): void {
    this.syncSelectedCalendarDate();
  }

  selectCalendarDate(day: CalendarDay): void {
    if (!day.inCurrentMonth) {
      return;
    }

    this.selectedCalendarDate = day.date;
  }

  openJustificationModal(record: GuardianAttendanceRecordView): void {
    if (!this.canJustify(record)) {
      return;
    }

    this.modalError = '';
    this.isModalOpen = true;
    this.justificationDraft = {
      attendanceId: record.id,
      date: record.date,
      courseName: record.course.name,
      courseCode: record.course.code,
      reason: record.justification_data?.status === 'rechazada' ? record.justification_data.reason : '',
      rejectedReviewNote: record.justification_data?.status === 'rechazada'
        ? record.justification_data.review_notes || null
        : null,
    };
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalError = '';
    this.isSubmittingJustification = false;
    this.justificationDraft = this.createEmptyDraft();
  }

  submitJustification(): void {
    if (!this.justificationDraft.attendanceId || !this.justificationDraft.reason.trim()) {
      this.modalError = 'Debes ingresar el motivo de la justificacion.';
      return;
    }

    this.isSubmittingJustification = true;
    this.modalError = '';

    this.attendanceService.createJustification({
      attendance_id: this.justificationDraft.attendanceId,
      reason: this.justificationDraft.reason.trim(),
    }).subscribe({
      next: () => {
        this.successMessage = 'La justificacion fue enviada correctamente.';
        this.closeModal();
        this.loadAttendance();
        window.setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.isSubmittingJustification = false;
        this.modalError = error?.error?.message || 'No se pudo enviar la justificacion.';
      }
    });
  }

  getSafeIcon(name: string): SafeHtml {
    const svg = (ICONS as Record<string, string>)[name] || ICONS.calendar;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getStatusStyles(status: string) {
    const styles: Record<string, any> = {
      presente: { border: 'border-emerald-100 bg-emerald-50/20', bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'checkCircle2', badgeColor: 'bg-emerald-600' },
      tarde: { border: 'border-amber-100 bg-amber-50/20', bg: 'bg-amber-100', text: 'text-amber-600', icon: 'clock', badgeColor: 'bg-amber-500' },
      falta: { border: 'border-rose-100 bg-rose-50/20', bg: 'bg-rose-100', text: 'text-rose-700', icon: 'xCircle', badgeColor: 'bg-rose-600' },
      justificado: { border: 'border-blue-100 bg-blue-50/20', bg: 'bg-blue-100', text: 'text-blue-600', icon: 'fileText', badgeColor: 'bg-blue-600' },
    };

    return styles[status] || styles['presente'];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      presente: 'Presente',
      tarde: 'Tarde',
      falta: 'Falta',
      justificado: 'Justificado',
    };

    return labels[status] || labels['presente'];
  }

  getJustificationStyles(status: string): string {
    if (status === 'aprobada') return 'bg-emerald-500 text-white';
    if (status === 'rechazada') return 'bg-rose-500 text-white';
    return 'bg-blue-500 text-white';
  }

  getCalendarDayClass(day: CalendarDay): string {
    const base = [
      day.inCurrentMonth ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50' : 'bg-slate-50 border-slate-100 text-slate-300',
      day.isToday ? 'ring-2 ring-cyan-400/50' : '',
      this.selectedCalendarDate === day.date ? 'border-cyan-500 ring-4 ring-cyan-500/10 bg-cyan-50' : '',
      day.dominantStatus ? this.getStatusStyles(day.dominantStatus).border : '',
    ];

    return base.filter(Boolean).join(' ');
  }

  getCalendarBadgeClass(status: AttendanceStatus): string {
    return {
      presente: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      tarde: 'bg-amber-50 text-amber-700 border border-amber-100',
      falta: 'bg-rose-50 text-rose-700 border border-rose-100',
      justificado: 'bg-blue-50 text-blue-700 border border-blue-100',
    }[status];
  }

  canJustify(record: GuardianAttendanceRecordView): boolean {
    const status = record.justification_data?.status;
    const isPendingOrApproved = status === 'pendiente' || status === 'aprobada';

    return ['falta', 'tarde'].includes(record.status) && !isPendingOrApproved;
  }

  getJustificationActionLabel(record: GuardianAttendanceRecordView): string {
    return record.justification_data?.status === 'rechazada'
      ? 'Reenviar justificacion'
      : 'Enviar justificacion';
  }

  private generateMonths(): void {
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long' });
      this.months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
  }

  private loadAcademicContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.students = context.students || [];
        this.selectedStudentId = this.students[0]?.id || '';

        if (!this.students.length) {
          this.error = 'Tu usuario no tiene estudiantes vinculados.';
          this.loading = false;
          return;
        }

        this.loadAttendance();
      },
      error: () => {
        this.error = 'No se pudo obtener el contexto academico del apoderado.';
        this.loading = false;
      }
    });
  }

  loadAttendance(): void {
    if (!this.selectedStudentId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';
    const { dateFrom, dateTo } = this.getMonthRange(this.selectedMonth);

    this.reportService.getAttendanceSummary(this.selectedStudentId, dateFrom, dateTo).subscribe({
      next: (response) => {
        this.lastSummary = response;
        this.attendance = (response.records || []).map((record) => this.mapRecord(record));
        this.syncSelectedCourse();
        this.syncSelectedCalendarDate();
        this.loading = false;
      },
      error: () => {
        this.attendance = [];
        this.lastSummary = null;
        this.selectedCalendarDate = '';
        this.error = 'No se pudo cargar la asistencia del estudiante seleccionado.';
        this.loading = false;
      }
    });
  }

  private getMonthRange(monthValue: string): { dateFrom: string; dateTo: string } {
    const [year, month] = monthValue.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    return {
      dateFrom: this.toDateString(start),
      dateTo: this.toDateString(end),
    };
  }

  private toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private countByStatus(status: AttendanceStatus): number {
    return this.filteredAttendance.filter((record) => record.status === status).length;
  }

  private getPercentage(value: number, total: number): number {
    if (!total) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  private resolveDominantStatus(records: GuardianAttendanceRecordView[]): AttendanceStatus | null {
    if (records.some((record) => record.status === 'falta')) return 'falta';
    if (records.some((record) => record.status === 'tarde')) return 'tarde';
    if (records.some((record) => record.status === 'justificado')) return 'justificado';
    if (records.some((record) => record.status === 'presente')) return 'presente';
    return null;
  }

  private syncSelectedCourse(): void {
    if (this.selectedCourseId === 'all') {
      return;
    }

    const exists = this.availableCourses.some((course) => course.id === this.selectedCourseId);
    if (!exists) {
      this.selectedCourseId = 'all';
    }
  }

  private syncSelectedCalendarDate(): void {
    const availableDates = new Set(this.filteredAttendance.map((record) => this.toDateString(new Date(record.date))));
    if (this.selectedCalendarDate && availableDates.has(this.selectedCalendarDate)) {
      return;
    }

    this.selectedCalendarDate = this.filteredAttendance[0]
      ? this.toDateString(new Date(this.filteredAttendance[0].date))
      : '';
  }

  private mapRecord(record: StudentAttendanceRecord): GuardianAttendanceRecordView {
    return {
      id: record.id,
      date: record.date,
      status: record.status,
      justification: record.justification,
      course: {
        id: record.course_id,
        name: record.course_name,
        code: record.course_code,
      },
      justification_data: this.parseJustificationData(record.justification_data),
    };
  }

  private parseJustificationData(
    value: StudentAttendanceRecord['justification_data']
  ): StudentAttendanceJustificationData | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as StudentAttendanceJustificationData;
      } catch {
        return null;
      }
    }

    return value;
  }

  private createEmptyDraft(): JustificationDraft {
    return {
      attendanceId: '',
      date: '',
      courseName: '',
      courseCode: '',
      reason: '',
      rejectedReviewNote: null,
    };
  }
}
