import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Section } from '@core/services/academic.service';
import {
  ReportService,
  SectionAttendanceReportRow,
  SectionAttendanceReportResponse,
} from '@core/services/report.service';

@Component({
  selector: 'app-section-attendance-history',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './section-attendance-history.component.html',
  styleUrls: ['./section-attendance-history.component.css'],
})
export class SectionAttendanceHistoryComponent implements OnInit {
  private academicService = inject(AcademicService);
  private reportService = inject(ReportService);

  sections: Section[] = [];
  selectedSectionId = '';
  dateFrom = '';
  dateTo = '';
  loading = false;
  error = '';
  report: SectionAttendanceReportResponse | null = null;

  ngOnInit(): void {
    const today = new Date();
    this.dateTo = today.toISOString().split('T')[0];

    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateFrom = periodStart.toISOString().split('T')[0];

    this.academicService.getSections().subscribe({
      next: (response) => {
        this.sections = response.data || response || [];
      },
      error: () => undefined,
    });
  }

  onSectionChange(): void {
    this.report = null;
    this.error = '';
  }

  loadReport(): void {
    if (!this.selectedSectionId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.reportService.getSectionAttendanceReport(this.selectedSectionId, {
      date_from: this.dateFrom || undefined,
      date_to: this.dateTo || undefined,
    }).subscribe({
      next: (response) => {
        this.report = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al generar el reporte.';
        this.loading = false;
      },
    });
  }

  getAttendanceBadgeClass(percentage: number): string {
    if (percentage >= 90) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (percentage >= 75) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
}
  