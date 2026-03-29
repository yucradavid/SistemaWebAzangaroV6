//src/app/features/admin/reports/academic-reports/academic-reports.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AcademicYear } from '@core/models/AcademicYear';
import {
  AcademicService,
  Course,
  GradeLevel,
  Period,
  Section,
} from '@core/services/academic.service';
import { EvaluationService } from '@core/services/evaluation.service';
import {
  ReportService,
  SectionAttendanceReportResponse,
  SectionEvaluationReportResponse,
} from '@core/services/report.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { catchError, of } from 'rxjs';

type TabType = 'attendance' | 'evaluation' | 'siagie';
type ReportExportType = 'attendance' | 'evaluation';
type SiagieExportType = 'matricula' | 'asistencia' | 'evaluacion';

interface AttendanceRow {
  student_id: string;
  student_code: string;
  student_name: string;
  attendance_percentage: number;
  total_absences: number;
  total_tardies: number;
  total_justifications: number;
}

interface EvaluationRow {
  student_id: string;
  student_code: string;
  student_name: string;
  competencies: Record<string, string>;
  final_grade: string;
}

@Component({
  selector: 'app-academic-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  templateUrl: './academic-reports.component.html',
})
export class AcademicReportsComponent implements OnInit {
  private academicService = inject(AcademicService);
  private reportService = inject(ReportService);
  private evaluationService = inject(EvaluationService);

  activeTab: TabType = 'attendance';
  loading = false;
  error = '';

  academicYears: AcademicYear[] = [];
  periods: Period[] = [];
  grades: GradeLevel[] = [];
  sections: Section[] = [];
  courses: Course[] = [];

  selectedYear = '';
  selectedPeriod = '';
  selectedGrade = '';
  selectedSection = '';
  selectedCourse = '';
  studentSearch = '';
  showOnlyAtRisk = false;

  attendanceData: AttendanceRow[] = [];
  evaluationData: EvaluationRow[] = [];
  competenciesList: { id: string; description: string }[] = [];

  avgAttendance = 0;
  topAbsentees: string[] = [];
  totalAbsences = 0;

  gradeDistribution = { AD: 0, A: 0, B: 0, C: 0 };
  studentsAtRisk = 0;

  ngOnInit() {
    this.loading = true;
    this.academicService.getAcademicYears().subscribe({
      next: (res) => {
        this.academicYears = this.extractCollection<AcademicYear>(res);
        this.selectedYear = this.academicYears.find((year) => year.is_active)?.id || '';
        this.loading = false;
        this.loadInitialFilters();
      },
      error: () => {
        this.error = 'No se pudieron cargar los anios academicos.';
        this.loading = false;
      }
    });
  }

  loadInitialFilters() {
    this.academicService.getGradeLevels({ per_page: 100, simple: true }).subscribe({
      next: (res) => this.grades = this.extractCollection<GradeLevel>(res),
      error: () => this.error = 'No se pudieron cargar los grados.'
    });

    this.loadPeriods();
  }

  setTab(tab: TabType) {
    this.activeTab = tab;
    this.error = '';
    this.loadTabData();
  }

  onYearChange() {
    this.selectedPeriod = '';
    this.selectedSection = '';
    this.selectedCourse = '';
    this.sections = [];
    this.courses = [];
    this.resetReportData();
    this.loadPeriods();

    if (this.selectedGrade) {
      this.loadSectionsForSelectedGrade();
    }
  }

  onPeriodChange() {
    this.resetReportData();
    this.loadTabData();
  }

  onGradeChange() {
    this.sections = [];
    this.selectedSection = '';
    this.selectedCourse = '';
    this.courses = [];
    this.resetReportData();

    if (this.selectedGrade) {
      this.loadSectionsForSelectedGrade();
    }
  }

  onSectionChange() {
    this.selectedCourse = '';
    this.courses = [];
    this.resetReportData();

    if (this.selectedSection) {
      this.loadCoursesForSelectedSection();
      return;
    }

    this.loadTabData();
  }

  onCourseChange() {
    this.resetReportData();
    this.loadTabData();
  }

  clearFilters() {
    this.selectedPeriod = '';
    this.selectedGrade = '';
    this.selectedSection = '';
    this.selectedCourse = '';
    this.studentSearch = '';
    this.showOnlyAtRisk = false;
    this.sections = [];
    this.courses = [];
    this.resetReportData();
    this.loadPeriods();
  }

  clearSearch() {
    this.studentSearch = '';
    this.showOnlyAtRisk = false;
  }

  refresh() {
    this.error = '';

    if (!this.selectedYear) {
      this.loadInitialFilters();
      return;
    }

    this.loadPeriods();

    if (this.selectedGrade) {
      this.loadSectionsForSelectedGrade();
    }

    if (this.selectedSection) {
      this.loadCoursesForSelectedSection();
      return;
    }

    this.loadTabData();
  }

  get canQuerySectionReports(): boolean {
    return !!(this.selectedYear && this.selectedSection);
  }

  get filteredAttendanceData(): AttendanceRow[] {
    const query = this.studentSearch.trim().toLowerCase();

    return this.attendanceData.filter((row) => {
      if (!query) {
        return true;
      }

      return [row.student_code, row.student_name]
        .some((value) => String(value || '').toLowerCase().includes(query));
    });
  }

  get filteredEvaluationData(): EvaluationRow[] {
    const query = this.studentSearch.trim().toLowerCase();

    return this.evaluationData.filter((row) => {
      const matchesSearch = !query || [row.student_code, row.student_name]
        .some((value) => String(value || '').toLowerCase().includes(query));

      if (!matchesSearch) {
        return false;
      }

      if (!this.showOnlyAtRisk) {
        return true;
      }

      return this.isEvaluationRowAtRisk(row);
    });
  }

  get attendanceRowsForView(): AttendanceRow[] {
    return this.filteredAttendanceData;
  }

  get evaluationRowsForView(): EvaluationRow[] {
    return this.filteredEvaluationData;
  }

  get attendanceRowsCount(): number {
    return this.filteredAttendanceData.length;
  }

  get evaluationRowsCount(): number {
    return this.filteredEvaluationData.length;
  }

  get hasActiveSearch(): boolean {
    return !!this.studentSearch.trim() || this.showOnlyAtRisk;
  }

  get selectedFiltersSummary(): Array<{ label: string; value: string }> {
    return [
      { label: 'Anio', value: this.currentYearLabel() },
      { label: 'Periodo', value: this.currentPeriodLabel() },
      { label: 'Grado', value: this.currentGradeLabel() },
      { label: 'Seccion', value: this.currentSectionLabel() },
      ...(this.activeTab === 'evaluation' ? [{ label: 'Curso', value: this.currentCourseLabel() }] : []),
    ];
  }

  get reportHint(): string {
    if (!this.selectedYear) {
      return 'Selecciona un anio academico para habilitar los filtros del consolidado.';
    }

    if (!this.selectedGrade) {
      return 'Selecciona un grado para cargar secciones y consultar reportes.';
    }

    if (!this.selectedSection) {
      return 'Selecciona una seccion para cargar datos reales del backend.';
    }

    if (this.activeTab === 'evaluation' && this.selectedCourse) {
      return 'El consolidado muestra solo el curso seleccionado.';
    }

    if (this.activeTab === 'evaluation') {
      return 'Sin curso seleccionado, se muestra el resumen completo de la seccion.';
    }

    return 'Los datos mostrados provienen del backend y respetan el periodo seleccionado.';
  }

  get quickStats(): Array<{ label: string; value: string; tone: string }> {
    if (this.activeTab === 'attendance') {
      return [
        { label: 'Filas visibles', value: String(this.attendanceRowsCount), tone: 'bg-white text-slate-900 border-slate-200' },
        { label: 'Promedio', value: `${this.avgAttendance.toFixed(1)}%`, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { label: 'Faltas', value: String(this.totalAbsences), tone: 'bg-rose-50 text-rose-700 border-rose-200' },
        { label: 'Secciones', value: String(this.sections.length), tone: 'bg-blue-50 text-blue-700 border-blue-200' },
      ];
    }

    if (this.activeTab === 'evaluation') {
      return [
        { label: 'Filas visibles', value: String(this.evaluationRowsCount), tone: 'bg-white text-slate-900 border-slate-200' },
        { label: 'En riesgo', value: String(this.studentsAtRisk), tone: 'bg-rose-50 text-rose-700 border-rose-200' },
        { label: 'Competencias', value: String(this.competenciesList.length), tone: 'bg-amber-50 text-amber-700 border-amber-200' },
        { label: 'Cursos', value: String(this.courses.length), tone: 'bg-blue-50 text-blue-700 border-blue-200' },
      ];
    }

    return [
      { label: 'Anio', value: this.currentYearLabel(), tone: 'bg-white text-slate-900 border-slate-200' },
      { label: 'Secciones', value: String(this.sections.length), tone: 'bg-blue-50 text-blue-700 border-blue-200' },
      { label: 'Cursos', value: String(this.courses.length), tone: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      { label: 'Estado', value: this.canQuerySectionReports ? 'Listo' : 'Pendiente', tone: this.canQuerySectionReports ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' },
    ];
  }

  attendanceBadgeClass(pct: number): string {
    if (pct >= 90) return 'bg-green-100 text-green-800 border border-green-200';
    if (pct >= 75) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-red-100 text-red-800 border border-red-200';
  }

  gradeBadgeClass(grade: string): string {
    const map: Record<string, string> = {
      AD: 'bg-green-100 text-green-800 border border-green-200',
      A: 'bg-blue-100 text-blue-800 border border-blue-200',
      B: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      C: 'bg-red-100 text-red-800 border border-red-200',
    };
    return map[grade] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
  }

  exportCSV(type: ReportExportType) {
    if (type === 'attendance') {
      if (!this.filteredAttendanceData.length) {
        this.error = 'No hay datos de asistencia para exportar.';
        return;
      }

      const rows = this.filteredAttendanceData.map((row) => ({
        Codigo: row.student_code,
        Alumno: row.student_name,
        Asistencia: `${row.attendance_percentage.toFixed(1)}%`,
        Faltas: row.total_absences,
        Tardanzas: row.total_tardies,
        Justificaciones: row.total_justifications,
      }));

      this.downloadCsv(this.buildFilename('reporte-asistencia', 'csv'), rows);
      return;
    }

    if (!this.filteredEvaluationData.length) {
      this.error = 'No hay datos de evaluacion para exportar.';
      return;
    }

    const rows = this.filteredEvaluationData.map((row) => {
      const exportRow: Record<string, string | number> = {
        Codigo: row.student_code,
        Alumno: row.student_name,
      };

      this.competenciesList.forEach((competency) => {
        exportRow[competency.description] = row.competencies[competency.id] || '-';
      });

      exportRow['Final'] = row.final_grade;
      return exportRow;
    });

    this.downloadCsv(this.buildFilename('reporte-evaluacion', 'csv'), rows);
  }

  exportPDF(type: ReportExportType) {
    if (type === 'attendance') {
      if (!this.filteredAttendanceData.length) {
        this.error = 'No hay datos de asistencia para imprimir.';
        return;
      }

      this.openPrintWindow(
        'Reporte de Asistencia',
        this.buildPrintSubtitle(),
        this.buildAttendancePrintBody()
      );
      return;
    }

    if (!this.filteredEvaluationData.length) {
      this.error = 'No hay datos de evaluacion para imprimir.';
      return;
    }

    this.openPrintWindow(
      'Reporte de Evaluacion',
      this.buildPrintSubtitle(),
      this.buildEvaluationPrintBody()
    );
  }

  exportSIAGIE(type: SiagieExportType) {
    if (!this.ensureSectionContext()) {
      return;
    }

    this.error = '';
    this.loading = true;

    if (type === 'matricula') {
      this.exportSiagieEnrollment();
      return;
    }

    if (type === 'asistencia') {
      this.reportService.getSectionAttendanceReport(this.selectedSection, this.buildAttendanceParams()).subscribe({
        next: (response) => {
          this.loading = false;
          this.downloadCsv(
            this.buildFilename('siagie-asistencia', 'csv'),
            response.rows.map((row) => ({
              Codigo: row.student_code,
              Alumno: row.student_name,
              Asistencia: `${row.attendance_percentage.toFixed(1)}%`,
              Faltas: row.total_absences,
              Tardanzas: row.total_tardies,
              Justificaciones: row.total_justifications,
              Periodo: this.currentPeriodLabel(),
            }))
          );
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo generar el archivo SIAGIE de asistencia.';
        }
      });
      return;
    }

    this.prepareEvaluationExport((response) => {
      this.downloadCsv(
        this.buildFilename('siagie-evaluacion', 'csv'),
        response.rows.map((row) => {
          const exportRow: Record<string, string | number> = {
            Codigo: row.student_code,
            Alumno: row.student_name,
          };

          response.competencies.forEach((competency) => {
            exportRow[competency.description] = row.competencies[competency.id] || '-';
          });

          exportRow['Final'] = row.final_grade;
          exportRow['Periodo'] = this.currentPeriodLabel();
          return exportRow;
        })
      );
    }, false);
  }

  private loadPeriods() {
    if (!this.selectedYear) {
      this.periods = [];
      return;
    }

    this.academicService.getPeriods({ academic_year_id: this.selectedYear, per_page: 100, simple: true }).subscribe({
      next: (res) => {
        this.periods = this.extractCollection<Period>(res);
        if (this.selectedPeriod && !this.periods.some((period) => period.id === this.selectedPeriod)) {
          this.selectedPeriod = '';
        }
        this.loadTabData();
      },
      error: () => this.error = 'No se pudieron cargar los periodos.'
    });
  }

  private loadTabData() {
    if (this.activeTab === 'attendance') {
      this.loadAttendanceReport();
      return;
    }

    if (this.activeTab === 'evaluation') {
      this.loadEvaluationReport();
    }
  }

  private loadAttendanceReport() {
    if (!this.ensureSectionContext(false)) {
      this.attendanceData = [];
      this.avgAttendance = 0;
      this.totalAbsences = 0;
      this.topAbsentees = [];
      return;
    }

    this.loading = true;
    this.error = '';

    this.reportService.getSectionAttendanceReport(this.selectedSection, this.buildAttendanceParams()).subscribe({
      next: (response) => {
        this.applyAttendanceReport(response);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el consolidado de asistencia.';
        this.loading = false;
      }
    });
  }

  private loadEvaluationReport() {
    if (!this.ensureSectionContext(false)) {
      this.evaluationData = [];
      this.competenciesList = [];
      this.gradeDistribution = { AD: 0, A: 0, B: 0, C: 0 };
      this.studentsAtRisk = 0;
      return;
    }

    this.loading = true;
    this.error = '';

    this.prepareEvaluationExport(() => undefined, true);
  }

  private prepareEvaluationExport(
    onSuccess: (response: SectionEvaluationReportResponse) => void,
    updateState = false
  ) {
    const loadReport = () => {
      this.reportService.getSectionEvaluationReport(this.selectedSection, this.buildEvaluationParams()).subscribe({
        next: (response) => {
          if (updateState) {
            this.applyEvaluationReport(response);
          }

          this.loading = false;
          onSuccess(response);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo cargar el consolidado de evaluacion.';
        }
      });
    };

    if (this.selectedPeriod) {
      loadReport();
      return;
    }

    this.evaluationService.recalculateSectionEvaluationSummary(this.selectedYear, this.selectedSection).pipe(
      catchError(() => of(null))
    ).subscribe(() => loadReport());
  }

  private applyAttendanceReport(response: SectionAttendanceReportResponse) {
    const rows = Array.isArray(response?.rows) ? response.rows : [];

    this.attendanceData = rows.map((row) => ({
      student_id: row.student_id,
      student_code: row.student_code,
      student_name: row.student_name,
      attendance_percentage: Number(row.attendance_percentage || 0),
      total_absences: Number(row.total_absences || 0),
      total_tardies: Number(row.total_tardies || 0),
      total_justifications: Number(row.total_justifications || 0),
    }));

    this.avgAttendance = Number(response?.stats?.avg_attendance || 0);
    this.totalAbsences = Number(response?.stats?.total_absences || 0);
    this.topAbsentees = this.attendanceData
      .slice()
      .sort((a, b) => b.total_absences - a.total_absences)
      .slice(0, 3)
      .map((row) => row.student_name);
  }

  private applyEvaluationReport(response: SectionEvaluationReportResponse) {
    this.competenciesList = Array.isArray(response?.competencies)
      ? response.competencies.map((item) => ({
          id: item.id,
          description: item.description,
        }))
      : [];

    this.evaluationData = Array.isArray(response?.rows)
      ? response.rows.map((row) => ({
          student_id: row.student_id,
          student_code: row.student_code,
          student_name: row.student_name,
          competencies: row.competencies || {},
          final_grade: row.final_grade || '-',
        }))
      : [];

    this.gradeDistribution = response?.stats?.grade_distribution || { AD: 0, A: 0, B: 0, C: 0 };
    this.studentsAtRisk = Number(response?.stats?.students_at_risk || 0);
  }

  private exportSiagieEnrollment() {
    this.academicService.getEnrolledStudents({
      section_id: this.selectedSection,
      academic_year_id: this.selectedYear,
      per_page: 500,
    }).subscribe({
      next: (response) => {
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.data) ? response.data.data : [];
        const uniqueStudents = new Map<string, Record<string, string | number>>();

        data.forEach((item: any) => {
          const student = item?.student;
          if (!student?.id || uniqueStudents.has(student.id)) {
            return;
          }

          uniqueStudents.set(student.id, {
            Codigo: student.student_code || 'SIN-COD',
            Alumno: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Estudiante',
            DNI: student.dni || '',
            Grado: this.currentGradeLabel(),
            Seccion: this.currentSectionLabel(),
            Estado: item?.status || 'active',
            Anio: this.currentYearLabel(),
          });
        });

        this.loading = false;
        this.downloadCsv(this.buildFilename('siagie-matricula', 'csv'), Array.from(uniqueStudents.values()));
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo generar el archivo SIAGIE de matricula.';
      }
    });
  }

  private buildAttendanceParams(): Record<string, string | undefined> {
    return {
      academic_year_id: this.selectedYear || undefined,
      period_id: this.selectedPeriod || undefined,
    };
  }

  private buildEvaluationParams(): Record<string, string | undefined> {
    return {
      academic_year_id: this.selectedYear || undefined,
      period_id: this.selectedPeriod || undefined,
      course_id: this.selectedCourse || undefined,
    };
  }

  private ensureSectionContext(showMessage = true): boolean {
    if (this.selectedYear && this.selectedSection) {
      return true;
    }

    if (showMessage) {
      this.error = 'Selecciona anio academico y seccion antes de generar el reporte.';
    }

    return false;
  }

  private buildFilename(prefix: string, extension: 'csv' | 'pdf'): string {
    const year = this.currentYearLabel().replace(/\s+/g, '-');
    const section = this.currentSectionLabel().replace(/\s+/g, '-');
    const period = this.currentPeriodLabel().replace(/\s+/g, '-');
    return `${prefix}-${year}-${section}-${period}.${extension}`.toLowerCase();
  }

  private downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
    if (!rows.length) {
      this.error = 'No hay datos para exportar con los filtros actuales.';
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => this.toCsvValue(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private openPrintWindow(title: string, subtitle: string, body: string) {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
    if (!printWindow) {
      this.error = 'El navegador bloqueo la ventana de impresion.';
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${this.escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            p { margin: 0 0 18px; color: #475569; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #475569; }
            td, th { border: 1px solid #e2e8f0; padding: 8px 10px; }
            td { font-size: 13px; }
            .metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
            .metric-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
            .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
            .metric-value { font-size: 20px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>${this.escapeHtml(title)}</h1>
          <p>${this.escapeHtml(subtitle)}</p>
          ${body}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private buildAttendancePrintBody(): string {
    const tableRows = this.attendanceData.length
      ? this.filteredAttendanceData.map((row) => `
          <tr>
            <td>${this.escapeHtml(row.student_code)}</td>
            <td>${this.escapeHtml(row.student_name)}</td>
            <td style="text-align:center;">${row.attendance_percentage.toFixed(1)}%</td>
            <td style="text-align:center;">${row.total_absences}</td>
            <td style="text-align:center;">${row.total_tardies}</td>
            <td style="text-align:center;">${row.total_justifications}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" style="text-align:center;">Sin datos para imprimir.</td></tr>`;

    return `
      <div class="metric-grid">
        ${this.printCard('Asistencia promedio', `${this.avgAttendance.toFixed(1)}%`)}
        ${this.printCard('Faltas', String(this.totalAbsences))}
        ${this.printCard('Top inasistencia', this.topAbsentees.join(', ') || 'Sin datos')}
      </div>
      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Alumno</th>
            <th>% Asistencia</th>
            <th>Faltas</th>
            <th>Tardanzas</th>
            <th>Justificaciones</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
  }

  private buildEvaluationPrintBody(): string {
    const headerCells = this.competenciesList
      .map((competency) => `<th>${this.escapeHtml(competency.description)}</th>`)
      .join('');

    const tableRows = this.filteredEvaluationData.length
      ? this.filteredEvaluationData.map((row) => `
          <tr>
            <td>${this.escapeHtml(row.student_code)}</td>
            <td>${this.escapeHtml(row.student_name)}</td>
            ${this.competenciesList.map((competency) => `
              <td style="text-align:center;">${this.escapeHtml(row.competencies[competency.id] || '-')}</td>
            `).join('')}
            <td style="text-align:center;">${this.escapeHtml(row.final_grade)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="${this.competenciesList.length + 3}" style="text-align:center;">Sin datos para imprimir.</td></tr>`;

    return `
      <div class="metric-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
        ${this.printCard('Riesgo academico', String(this.studentsAtRisk))}
        ${this.printCard('Distribucion', `AD ${this.gradeDistribution.AD}% | A ${this.gradeDistribution.A}% | B ${this.gradeDistribution.B}% | C ${this.gradeDistribution.C}%`)}
      </div>
      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Alumno</th>
            ${headerCells}
            <th>Final</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
  }

  private printCard(label: string, value: string): string {
    return `
      <div class="metric-card">
        <div class="metric-label">${this.escapeHtml(label)}</div>
        <div class="metric-value">${this.escapeHtml(value)}</div>
      </div>
    `;
  }

  private buildPrintSubtitle(): string {
    return `Anio academico: ${this.currentYearLabel()} | Grado: ${this.currentGradeLabel()} | Seccion: ${this.currentSectionLabel()} | Periodo: ${this.currentPeriodLabel()} | Generado: ${new Date().toLocaleString()}`;
  }

  currentYearLabel(): string {
    return String(this.academicYears.find((year) => year.id === this.selectedYear)?.year || 'sin-anio');
  }

  currentGradeLabel(): string {
    const grade = this.grades.find((item) => item.id === this.selectedGrade);
    return grade ? (grade.name || `${grade.grade}° ${grade.level}`) : 'sin-grado';
  }

  currentSectionLabel(): string {
    const section = this.sections.find((item) => item.id === this.selectedSection);
    return section?.section_letter || 'sin-seccion';
  }

  currentPeriodLabel(): string {
    const period = this.periods.find((item) => item.id === this.selectedPeriod);
    return period?.name || 'anual';
  }

  currentCourseLabel(): string {
    const course = this.courses.find((item) => item.id === this.selectedCourse);
    return course?.name || 'todos';
  }

  private toCsvValue(value: string | number | undefined): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private resetReportData() {
    this.attendanceData = [];
    this.evaluationData = [];
    this.competenciesList = [];
    this.avgAttendance = 0;
    this.topAbsentees = [];
    this.totalAbsences = 0;
    this.gradeDistribution = { AD: 0, A: 0, B: 0, C: 0 };
    this.studentsAtRisk = 0;
  }

  private loadSectionsForSelectedGrade() {
    if (!this.selectedYear) {
      this.sections = [];
      return;
    }

    this.academicService.getSections({
      academic_year_id: this.selectedYear || undefined,
      grade_level_id: this.selectedGrade,
      per_page: 200,
      simple: true,
    }).subscribe({
      next: (res) => {
        this.sections = this.extractCollection<Section>(res);
        if (this.selectedSection && !this.sections.some((section) => section.id === this.selectedSection)) {
          this.selectedSection = '';
        }
      },
      error: () => this.error = 'No se pudieron cargar las secciones.'
    });
  }

  private loadCoursesForSelectedSection() {
    if (!this.selectedSection || !this.selectedYear) {
      this.courses = [];
      return;
    }

    this.academicService.getCourses({
      section_id: this.selectedSection,
      academic_year_id: this.selectedYear || undefined,
      grade_level_id: this.selectedGrade || undefined,
      per_page: 200,
      simple: true,
    }).subscribe({
      next: (res) => {
        this.courses = this.extractCollection<Course>(res);
        if (this.selectedCourse && !this.courses.some((course) => course.id === this.selectedCourse)) {
          this.selectedCourse = '';
        }
        this.loadTabData();
      },
      error: () => this.error = 'No se pudieron cargar los cursos.'
    });
  }

  private extractCollection<T>(response: any): T[] {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private isEvaluationRowAtRisk(row: EvaluationRow): boolean {
    const values = Object.values(row.competencies || {});
    const weakCompetencies = values.filter((value) => value === 'B' || value === 'C').length;
    return weakCompetencies >= 2 || row.final_grade === 'C';
  }
}
