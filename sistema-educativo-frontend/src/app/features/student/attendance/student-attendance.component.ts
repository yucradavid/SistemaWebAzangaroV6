import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ICONS } from '@core/constants/icons';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import { AttendanceService } from '@core/services/attendance.service';
import {
  ReportService,
  StudentAttendanceJustificationData,
  StudentAttendanceRecord,
  StudentAttendanceSummaryResponse,
  StudentDailyAttendanceRecord,
} from '@core/services/report.service';
import localeEsPe from '@angular/common/locales/es-PE';

registerLocaleData(localeEsPe);

type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';

interface AttendanceRecordView {
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
  records: AttendanceRecordView[];
  dominantStatus: AttendanceStatus | null;
}

@Component({
  selector: 'app-attendance-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-attendance.component.html',
  styles: [`
    :host { display: block; background: #F8FAFC; min-h: 100vh; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.25rem; }
  `]
})
export class AttendanceStudentComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private reportService = inject(ReportService);
  private attendanceService = inject(AttendanceService);

  readonly dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  loading = false;
  qrSubmitting = false;
  error = '';
  qrMessage = '';
  selectedMonth = new Date().toISOString().slice(0, 7);
  selectedCourseId = 'all';
  selectedCalendarDate = '';
  qrCodeInput = '';
  months: { value: string, label: string }[] = [];
  attendance: AttendanceRecordView[] = [];
  dailyAttendance: StudentDailyAttendanceRecord[] = [];
  studentContext: AcademicContextStudent | null = null;
  lastSummary: StudentAttendanceSummaryResponse | null = null;

  constructor() {
    this.generateMonths();
  }

  ngOnInit() {
    this.loadAcademicContext();
  }

  get filteredAttendance(): AttendanceRecordView[] {
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

  get selectedDateRecords(): AttendanceRecordView[] {
    if (!this.selectedCalendarDate) {
      return [];
    }
    return this.filteredAttendance.filter((record) => this.toDateString(new Date(record.date)) === this.selectedCalendarDate);
  }

  get selectedDailyRecord(): StudentDailyAttendanceRecord | null {
    if (!this.selectedCalendarDate) {
      return null;
    }

    return this.dailyAttendance.find((record) => record.date === this.selectedCalendarDate) || null;
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

  get justifiedRate(): number {
    return this.getPercentage(this.justifiedCount, this.totalRecords);
  }

  get monthLabel(): string {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  }

  get riskAlert(): { title: string; message: string; icon: string; containerClass: string } | null {
    if (this.totalRecords === 0) {
      return null;
    }

    if (this.absentCount >= 3 || this.effectiveAttendanceRate < 80) {
      return {
        title: 'Seguimiento urgente',
        message: `Acumulas ${this.absentCount} faltas y una asistencia efectiva de ${this.effectiveAttendanceRate}%.`,
        icon: 'alertCircle',
        containerClass: 'bg-rose-50 border-rose-200 text-rose-700',
      };
    }

    if (this.lateCount >= 4 || this.effectiveAttendanceRate < 90) {
      return {
        title: 'Riesgo de inasistencias',
        message: `Llevas ${this.lateCount} tardanzas en el periodo filtrado. Conviene mejorar tu puntualidad.`,
        icon: 'clock',
        containerClass: 'bg-amber-50 border-amber-200 text-amber-700',
      };
    }

    return {
      title: 'Buen seguimiento',
      message: `Tu asistencia efectiva va en ${this.effectiveAttendanceRate}%. Mantén este ritmo durante el mes.`,
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
      { label: 'Asistencia efectiva', value: `${this.effectiveAttendanceRate}%`, helper: `${this.effectiveAttendanceCount} registros presentes o justificados`, icon: 'checkCircle2', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
      { label: 'Tardanzas', value: this.lateCount, helper: `${this.lateRate}% del total mensual`, icon: 'clock', color: 'bg-yellow-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
      { label: 'Faltas', value: this.absentCount, helper: `${this.absentRate}% del total mensual`, icon: 'xCircle', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-600' },
      { label: 'Justificadas', value: this.justifiedCount, helper: `${this.justifiedRate}% con sustento registrado`, icon: 'fileText', color: 'bg-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    ];
  }

  generateMonths() {
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long' });
      this.months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
  }

  loadAttendance() {
    if (!this.studentContext?.id) {
      return;
    }

    this.loading = true;
    this.error = '';
    const { dateFrom, dateTo } = this.getMonthRange(this.selectedMonth);

    this.reportService.getAttendanceSummary(this.studentContext.id, dateFrom, dateTo).subscribe({
      next: (response) => {
        this.lastSummary = response;
        this.attendance = (response.records || []).map((record) => this.mapRecord(record));
        this.dailyAttendance = response.daily_records || [];
        this.syncSelectedCourse();
        this.syncSelectedCalendarDate();
        this.loading = false;
      },
      error: () => {
        this.attendance = [];
        this.dailyAttendance = [];
        this.lastSummary = null;
        this.selectedCalendarDate = '';
        this.error = 'No se pudo cargar tu historial de asistencia.';
        this.loading = false;
      }
    });
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

  submitQrCheckpoint(): void {
    if (!this.qrCodeInput.trim()) {
      this.qrMessage = 'Ingresa o escanea el código QR.';
      return;
    }

    this.qrSubmitting = true;
    this.qrMessage = '';

    this.attendanceService.submitStudentDailyQr(this.qrCodeInput.trim()).subscribe({
      next: (response) => {
        this.qrSubmitting = false;
        this.qrCodeInput = '';
        this.qrMessage = response.message;
        this.loadAttendance();
      },
      error: (error) => {
        this.qrSubmitting = false;
        this.qrMessage = error?.error?.message || 'No se pudo registrar tu marcación QR.';
      }
    });
  }

  getSafeIcon(name: string): SafeHtml {
    const svg = (ICONS as any)[name] || ICONS.calendar;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getStatusStyles(status: string) {
    const styles: Record<string, any> = {
      presente: { border: 'border-green-100 bg-green-50/20', bg: 'bg-green-100', text: 'text-green-600', icon: 'checkCircle2', badgeColor: 'bg-green-600' },
      tarde: { border: 'border-yellow-100 bg-yellow-50/20', bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'clock', badgeColor: 'bg-yellow-500' },
      falta: { border: 'border-red-100 bg-red-50/20', bg: 'bg-red-100', text: 'text-red-700', icon: 'xCircle', badgeColor: 'bg-red-600' },
      justificado: { border: 'border-blue-100 bg-blue-50/20', bg: 'bg-blue-100', text: 'text-blue-600', icon: 'fileText', badgeColor: 'bg-blue-600' },
    };
    return styles[status] || styles['presente'];
  }

  getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      presente: 'Presente',
      tarde: 'Tarde',
      falta: 'Falta',
      justificado: 'Justificado'
    };
    return labels[status] || labels['presente'];
  }

  getJustificationStyles(status: string) {
    if (status === 'aprobada') return 'bg-green-500 text-white';
    if (status === 'rechazada') return 'bg-red-500 text-white';
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
      presente: 'bg-green-50 text-green-700 border border-green-100',
      tarde: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
      falta: 'bg-red-50 text-red-700 border border-red-100',
      justificado: 'bg-blue-50 text-blue-700 border border-blue-100',
    }[status];
  }

  getOptionalCalendarBadgeClass(status?: AttendanceStatus | null): string {
    return status
      ? this.getCalendarBadgeClass(status)
      : 'bg-slate-200 text-slate-600 border border-slate-300';
  }

  private loadAcademicContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.studentContext = context.students?.[0] || null;
        if (!this.studentContext) {
          this.error = 'Tu usuario no tiene un estudiante vinculado.';
          this.loading = false;
          return;
        }
        this.loadAttendance();
      },
      error: () => {
        this.error = 'No se pudo obtener el contexto academico del estudiante.';
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

  private resolveDominantStatus(records: AttendanceRecordView[]): AttendanceStatus | null {
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

  private mapRecord(record: StudentAttendanceRecord): AttendanceRecordView {
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
}
