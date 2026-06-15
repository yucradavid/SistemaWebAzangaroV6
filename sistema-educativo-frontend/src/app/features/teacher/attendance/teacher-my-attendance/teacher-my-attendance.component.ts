import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ICONS } from '@core/constants/icons';
import {
  AttendanceService,
  AttendanceStatus,
  TeacherDailyAttendanceRecord,
  TeacherDailyHistoryResponse,
} from '@core/services/attendance.service';
import localeEsPe from '@angular/common/locales/es-PE';

registerLocaleData(localeEsPe);

interface CalendarDay {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  record: TeacherDailyAttendanceRecord | null;
}

@Component({
  selector: 'app-teacher-my-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './teacher-my-attendance.component.html',
  styles: [`
    :host { display: block; background: #F8FAFC; min-height: 100vh; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.25rem; }
  `]
})
export class TeacherMyAttendanceComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private attendanceService = inject(AttendanceService);
  private location = inject(Location);

  readonly dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  loading = false;
  error = '';
  selectedMonth = new Date().toISOString().slice(0, 7);
  selectedCalendarDate = '';
  months: { value: string, label: string }[] = [];
  dailyRecords: TeacherDailyAttendanceRecord[] = [];
  lastSummary: TeacherDailyHistoryResponse | null = null;

  constructor() {
    this.generateMonths();
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadAttendance();
  }

  get sortedRecords(): TeacherDailyAttendanceRecord[] {
    return this.dailyRecords.slice().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  }

  get selectedDailyRecord(): TeacherDailyAttendanceRecord | null {
    if (!this.selectedCalendarDate) {
      return null;
    }
    return this.dailyRecords.find((record) => record.date === this.selectedCalendarDate) || null;
  }

  get totalRecords(): number {
    return this.dailyRecords.length;
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
      const record = this.dailyRecords.find((r) => r.date === dateKey) || null;

      return {
        date: dateKey,
        dayNumber: current.getDate(),
        inCurrentMonth: current.getMonth() === month - 1,
        isToday: dateKey === this.toDateString(new Date()),
        record,
      };
    });
  }

  get statCards() {
    return [
      { label: 'Asistencia efectiva', value: `${this.effectiveAttendanceRate}%`, helper: `${this.effectiveAttendanceCount} registros presentes o justificados`, icon: 'checkCircle2', bgColor: 'bg-green-50', textColor: 'text-green-600', color: 'bg-green-500' },
      { label: 'Tardanzas', value: this.lateCount, helper: `${this.lateRate}% del total mensual`, icon: 'clock', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600', color: 'bg-yellow-400' },
      { label: 'Faltas', value: this.absentCount, helper: `${this.absentRate}% del total mensual`, icon: 'xCircle', bgColor: 'bg-red-50', textColor: 'text-red-600', color: 'bg-red-500' },
      { label: 'Justificadas', value: this.justifiedCount, helper: `${this.justifiedRate}% con sustento registrado`, icon: 'fileText', bgColor: 'bg-blue-50', textColor: 'text-blue-600', color: 'bg-blue-600' },
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
    this.loading = true;
    this.error = '';
    const { dateFrom, dateTo } = this.getMonthRange(this.selectedMonth);

    this.attendanceService.getMyDailyHistory(dateFrom, dateTo).subscribe({
      next: (response) => {
        this.lastSummary = response;
        this.dailyRecords = response.daily_records || [];
        this.syncSelectedCalendarDate();
        this.loading = false;
      },
      error: () => {
        this.dailyRecords = [];
        this.lastSummary = null;
        this.selectedCalendarDate = '';
        this.error = 'No se pudo cargar tu historial de asistencia.';
        this.loading = false;
      }
    });
  }

  selectCalendarDate(day: CalendarDay): void {
    if (!day.inCurrentMonth) {
      return;
    }
    this.selectedCalendarDate = day.date;
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

  getStatusLabel(status?: string | null): string {
    const labels: Record<string, string> = {
      presente: 'Presente',
      tarde: 'Tarde',
      falta: 'Falta',
      justificado: 'Justificado'
    };
    return status ? (labels[status] || labels['presente']) : 'Sin registro';
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

  getCalendarDayClass(day: CalendarDay): string {
    const dominant = day.record?.entry_status || null;
    const base = [
      day.inCurrentMonth ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50' : 'bg-slate-50 border-slate-100 text-slate-300',
      day.isToday ? 'ring-2 ring-cyan-400/50' : '',
      this.selectedCalendarDate === day.date ? 'border-cyan-500 ring-4 ring-cyan-500/10 bg-cyan-50' : '',
      dominant ? this.getStatusStyles(dominant).border : '',
    ];

    return base.filter(Boolean).join(' ');
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
    return this.dailyRecords.filter((record) => record.entry_status === status).length;
  }

  private getPercentage(value: number, total: number): number {
    if (!total) {
      return 0;
    }
    return Math.round((value / total) * 100);
  }

  private syncSelectedCalendarDate(): void {
    const availableDates = new Set(this.dailyRecords.map((record) => record.date));
    if (this.selectedCalendarDate && availableDates.has(this.selectedCalendarDate)) {
      return;
    }
    this.selectedCalendarDate = this.sortedRecords[0]?.date || '';
  }
}
