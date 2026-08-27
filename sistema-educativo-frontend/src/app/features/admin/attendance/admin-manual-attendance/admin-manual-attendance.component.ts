import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';
import {
  AttendanceRecord,
  AttendanceService,
  AttendanceStatus,
  DailyAttendanceCheckpoint,
  DailyAttendanceSectionResponse,
} from '@core/services/attendance.service';
import { AcademicService, GradeLevel, Section } from '@core/services/academic.service';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';
import { fireIosSwal } from '@shared/utils/ios-swal';

type ExportRange = 'day' | 'week' | 'month' | 'all';
type ExportRangePreset = ExportRange | 'custom';

interface AttendanceState {
  status: AttendanceStatus;
  justification: string;
  updatedAt?: string | null;
  noteOpen: boolean;
}

interface SectionLike {
  section_letter?: string;
  grade_level?: { name?: string } | null;
}

@Component({
  selector: 'app-admin-manual-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, SettingFilterDropdownComponent],
  templateUrl: './admin-manual-attendance.component.html',
  styles: [`
    .note-expand { animation: noteExpand 0.25s ease-out; transform-origin: top; }
    @keyframes noteExpand {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `],
})
export class AdminManualAttendanceComponent implements OnInit, AfterViewInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private academicService = inject(AcademicService);
  private refreshSubscription?: Subscription;

  loading = false;
  saving = false;
  exportingCsv = false;
  selectedDate = new Date().toISOString().split('T')[0];
  selectedCheckpoint: DailyAttendanceCheckpoint = 'entrada';
  error = '';
  success = '';
  searchTerm = '';
  statusFilter: 'todos' | AttendanceStatus = 'todos';

  // Cascada Nivel / Grado / Seccion
  levelOptions: Array<{ id: string; name: string }> = [
    { id: 'inicial', name: 'Inicial' },
    { id: 'primaria', name: 'Primaria' },
    { id: 'secundaria', name: 'Secundaria' },
  ];
  gradeLevels: GradeLevel[] = [];
  gradeOptions: Array<{ id: string; name: string }> = [];
  sections: Section[] = [];
  sectionOptions: Array<{ id: string; name: string }> = [];
  loadingSections = false;
  filter = { level: '', gradeLevelId: '', sectionId: '' };
  private activeAcademicYearId = '';

  selectedSection: Section | null = null;
  selectedSectionId = '';
  selectedAcademicYearId = '';

  // Rango de fechas exclusivo para la Exportacion General CSV
  exportRangePreset: ExportRangePreset = 'day';
  exportDateFrom = new Date().toISOString().split('T')[0];
  exportDateTo = new Date().toISOString().split('T')[0];

  students: any[] = [];
  attendanceRecords: Record<string, AttendanceState> = {};
  dailyAttendance: DailyAttendanceSectionResponse | null = null;
  isAutoRefreshEnabled = false;

  ngOnInit(): void {
    this.loadFilterOptions();
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
      noteOpen: false,
    };
  }

  needsJustification(studentId: string): boolean {
    return ['falta', 'justificado'].includes(this.recordFor(studentId).status);
  }

  private loadFilterOptions(): void {
    this.academicService.getAcademicYears({ per_page: 100, simple: true }).subscribe({
      next: (res: any) => {
        const years = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.activeAcademicYearId = years.find((y: any) => y.is_active)?.id || '';
      },
    });

    this.academicService.getGradeLevels({ per_page: 100 }).subscribe({
      next: (res: any) => {
        this.gradeLevels = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.updateGradeOptions();
      },
    });
  }

  onLevelChange(level: string): void {
    this.filter.level = level;
    this.filter.gradeLevelId = '';
    this.filter.sectionId = '';
    this.updateGradeOptions();
    this.clearSections();
    this.clearSelectedSection();
  }

  onGradeChange(gradeLevelId: string): void {
    this.filter.gradeLevelId = gradeLevelId;
    this.filter.sectionId = '';
    this.clearSelectedSection();
    this.loadSections(gradeLevelId);
  }

  onSectionChange(sectionId: string): void {
    this.filter.sectionId = sectionId;
    const section = this.sections.find((s) => s.id === sectionId) || null;
    this.selectedSection = section;
    this.selectedSectionId = section?.id || '';
    this.selectedAcademicYearId = section?.academic_year_id || '';

    if (!section) {
      this.students = [];
      this.attendanceRecords = {};
      this.dailyAttendance = null;
      return;
    }

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

        this.students = Array.from(uniqueStudents.values()).sort((a, b) => {
          const byLastName = `${a.last_name ?? ''}`.localeCompare(`${b.last_name ?? ''}`, 'es', { sensitivity: 'base' });
          if (byLastName !== 0) return byLastName;
          return `${a.first_name ?? ''}`.localeCompare(`${b.first_name ?? ''}`, 'es', { sensitivity: 'base' });
        });

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

  toggleNote(studentId: string): void {
    const record = this.attendanceRecords[studentId];
    if (!record) return;
    this.attendanceRecords[studentId] = { ...record, noteOpen: !record.noteOpen };
  }

  setExportRange(range: ExportRange): void {
    this.exportRangePreset = range;
    const today = new Date();

    if (range === 'day') {
      this.exportDateFrom = this.formatDate(today);
      this.exportDateTo = this.formatDate(today);
    } else if (range === 'week') {
      const first = new Date(today);
      first.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const last = new Date(first);
      last.setDate(first.getDate() + 6);
      this.exportDateFrom = this.formatDate(first);
      this.exportDateTo = this.formatDate(last);
    } else if (range === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      this.exportDateFrom = this.formatDate(first);
      this.exportDateTo = this.formatDate(last);
    } else {
      this.exportDateFrom = '';
      this.exportDateTo = '';
    }
  }

  onExportDateInputChange(): void {
    this.exportRangePreset = 'custom';
  }

  exportGeneralCsv(): void {
    if (!this.selectedSectionId) {
      void fireIosSwal({
        icon: 'warning',
        title: 'Atención',
        text: 'Selecciona nivel, grado y sección antes de exportar.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.exportingCsv = true;
    this.attendanceService.exportDailyAttendanceCsv({
      date_from: this.exportDateFrom || undefined,
      date_to: this.exportDateTo || undefined,
      section_id: this.selectedSectionId,
      academic_year_id: this.selectedAcademicYearId || undefined,
    }).subscribe({
      next: (blob) => {
        this.exportingCsv = false;
        this.downloadBlob(blob, `reporte_general_${this.sectionSlug()}_${this.rangeSlug(this.exportRangePreset)}.csv`);
        void fireIosSwal({
          icon: 'success',
          title: 'Reporte generado',
          text: 'El archivo CSV se descargó correctamente.',
          confirmButtonText: 'Listo',
        });
      },
      error: async (err) => {
        this.exportingCsv = false;
        void fireIosSwal({
          icon: 'error',
          title: 'No se pudo exportar',
          text: await this.extractErrorMessage(err),
          confirmButtonText: 'Entendido',
        });
      }
    });
  }

  openStudentHistory(student: any): void {
    const fullName = `${student.last_name ?? ''}, ${student.first_name ?? ''}`.replace(/^,\s*/, '').trim();

    void fireIosSwal({
      title: fullName || 'Estudiante',
      html: '<div class="py-8 text-sm text-slate-400">Cargando historial...</div>',
      showConfirmButton: false,
      showCloseButton: true,
      width: 520,
    });

    this.attendanceService.getAttendanceHistory({
      student_id: student.id,
      section_id: this.selectedSectionId || undefined,
      per_page: 30,
    }).subscribe({
      next: (res) => {
        if (!Swal.isVisible()) return;
        const records = (res.data || []).filter((item: AttendanceRecord) => item.student_id === student.id);
        Swal.update({ html: this.buildHistoryHtml(records) });
        this.bindHistoryExportButtons(student);
      },
      error: () => {
        if (!Swal.isVisible()) return;
        Swal.update({
          html: '<div class="py-6 text-sm text-rose-500 font-semibold">No se pudo cargar el historial.</div>',
        });
      }
    });
  }

  handleSaveAttendance(): void {
    if (!this.selectedSectionId || !this.selectedAcademicYearId || !this.selectedDate) {
      void fireIosSwal({
        icon: 'warning',
        title: 'Atención',
        text: 'Selecciona nivel, grado, sección y checkpoint.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const invalidStudent = this.students.find((student) => {
      const record = this.attendanceRecords[student.id];
      return ['falta', 'justificado'].includes(record?.status) && !record?.justification?.trim();
    });

    if (invalidStudent) {
      void fireIosSwal({
        icon: 'warning',
        title: 'Comentario requerido',
        text: `Debes registrar un comentario para ${invalidStudent.last_name}, ${invalidStudent.first_name}.`,
        confirmButtonText: 'Entendido',
      });
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
        void fireIosSwal({
          icon: 'success',
          title: 'Guardado',
          text: res.message || 'Asistencia diaria guardada correctamente.',
          confirmButtonText: 'Listo',
        });
        this.loadDailyAttendance();
      },
      error: (err) => {
        this.saving = false;
        void fireIosSwal({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error al guardar asistencia.',
          confirmButtonText: 'Entendido',
        });
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

  sectionLabel(section: SectionLike | null | undefined): string {
    if (!section) return 'Sin sección';
    const grade = section.grade_level?.name || '';
    const letter = section.section_letter || '';
    return `${grade} ${letter}`.trim();
  }

  private buildHistoryHtml(records: AttendanceRecord[]): string {
    const rows = records.length > 0
      ? records.map((r) => `
        <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <div class="min-w-0 text-left">
            <p class="text-xs font-bold text-slate-700">${this.escapeHtml(r.date)}</p>
            <p class="text-[10px] text-slate-500 truncate">${this.escapeHtml(r.justification || 'Sin comentario.')}</p>
          </div>
          <span class="shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${this.getStatusBadgeClass(r.status)}">
            ${this.getStatusLabel(r.status)}
          </span>
        </div>`).join('')
      : '<p class="py-6 text-sm text-slate-400">Sin registros de asistencia.</p>';

    return `
      <div class="space-y-3">
        <div class="max-h-56 overflow-y-auto space-y-2 pr-1">${rows}</div>
        <div class="border-t border-slate-200 pt-3 mt-3">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-left">
            Exportar reporte individual (CSV)
          </p>
          <div class="grid grid-cols-2 gap-2">
            ${this.studentExportButton('day', 'Día')}
            ${this.studentExportButton('week', 'Semana')}
            ${this.studentExportButton('month', 'Mes')}
            ${this.studentExportButton('all', 'Desde el primer día de clases')}
          </div>
        </div>
      </div>`;
  }

  private bindHistoryExportButtons(student: any): void {
    Swal.getHtmlContainer()?.querySelectorAll<HTMLElement>('[data-export-student-range]').forEach((btn) => {
      btn.onclick = () => {
        const range = btn.getAttribute('data-export-student-range') as ExportRange;
        void Swal.close();
        this.exportStudentCsv(student, range);
      };
    });
  }

  private exportStudentCsv(student: any, range: ExportRange): void {
    const rangeDates = this.computeExportRange(range);

    this.attendanceService.exportDailyAttendanceCsv({
      ...rangeDates,
      student_id: student.id,
      section_id: this.selectedSectionId || undefined,
      academic_year_id: this.selectedAcademicYearId || undefined,
    }).subscribe({
      next: (blob) => {
        const studentSlug = `${student.last_name ?? ''}_${student.first_name ?? ''}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9_]/g, '');
        this.downloadBlob(blob, `asistencia_${studentSlug}_${this.rangeSlug(range)}.csv`);
        void fireIosSwal({
          icon: 'success',
          title: 'Reporte generado',
          text: 'El reporte individual se descargó correctamente.',
          confirmButtonText: 'Listo',
        });
      },
      error: async (err) => {
        void fireIosSwal({
          icon: 'error',
          title: 'No se pudo exportar',
          text: await this.extractErrorMessage(err),
          confirmButtonText: 'Entendido',
        });
      }
    });
  }

  private studentExportButton(range: ExportRange, label: string): string {
    return `
      <button type="button" data-export-student-range="${range}"
        class="px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-xs font-bold text-slate-600 hover:text-blue-700 transition-all">
        ${label}
      </button>`;
  }

  private computeExportRange(range: ExportRange): { date_from?: string; date_to?: string } {
    const today = new Date();

    if (range === 'day') {
      const day = this.formatDate(today);
      return { date_from: day, date_to: day };
    }

    if (range === 'week') {
      const first = new Date(today);
      first.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const last = new Date(first);
      last.setDate(first.getDate() + 6);
      return { date_from: this.formatDate(first), date_to: this.formatDate(last) };
    }

    if (range === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { date_from: this.formatDate(first), date_to: this.formatDate(last) };
    }

    return {};
  }

  private rangeSlug(range: ExportRangePreset): string {
    return { day: 'dia', week: 'semana', month: 'mes', all: 'historico', custom: 'personalizado' }[range];
  }

  private sectionSlug(): string {
    return this.sectionLabel(this.selectedSection)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase() || 'seccion';
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private async extractErrorMessage(err: any): Promise<string> {
    const fallback = 'Ocurrió un error inesperado. Intenta nuevamente.';

    if (err?.error instanceof Blob) {
      try {
        const text = await err.error.text();
        return JSON.parse(text)?.message || fallback;
      } catch {
        return fallback;
      }
    }

    return err?.error?.message || fallback;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string
    ));
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private updateGradeOptions(): void {
    const filtered = this.filter.level
      ? this.gradeLevels.filter((g: any) => g.level === this.filter.level)
      : this.gradeLevels;
    this.gradeOptions = filtered.map((g: any) => ({ id: g.id, name: g.name }));
  }

  private loadSections(gradeLevelId: string): void {
    if (!gradeLevelId) {
      this.clearSections();
      return;
    }

    this.loadingSections = true;
    const params: any = { grade_level_id: gradeLevelId, per_page: 100 };
    if (this.activeAcademicYearId) {
      params.academic_year_id = this.activeAcademicYearId;
    }

    this.academicService.getSections(params).subscribe({
      next: (res: any) => {
        this.sections = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.sectionOptions = this.sections.map((s: any) => ({ id: s.id, name: s.section_letter || 'Sección' }));
        this.loadingSections = false;
      },
      error: () => {
        this.loadingSections = false;
        this.clearSections();
      }
    });
  }

  private clearSections(): void {
    this.sections = [];
    this.sectionOptions = [];
    this.loadingSections = false;
  }

  private clearSelectedSection(): void {
    this.selectedSection = null;
    this.selectedSectionId = '';
    this.selectedAcademicYearId = '';
    this.students = [];
    this.attendanceRecords = {};
    this.dailyAttendance = null;
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
        noteOpen: false,
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
        status,
        justification: note,
        updatedAt,
        noteOpen: this.attendanceRecords[student.id]?.noteOpen ?? false,
      };
    });
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshSubscription = interval(10000).subscribe(() => {
      if (this.selectedSectionId && !this.saving) {
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
