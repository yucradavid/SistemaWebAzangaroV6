import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { ReportService } from '@core/services/report.service';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  templateUrl: './admin-metrics.component.html'
})
export class AdminMetricsComponent implements OnInit {
  private reportService = inject(ReportService);

  kpis = [
    { label: 'Total Alumnos', value: '...', change: 'Actualizando', positive: true },
    { label: 'Asistencia Hoy', value: '...', change: 'Registrado', positive: true },
    { label: 'Cargos Pendientes', value: '...', change: 'Vencidos', positive: false },
    { label: 'Comunicados', value: '...', change: 'Publicados', positive: true },
  ];
  charts = ['Asistencia Mensual', 'Rendimiento Académico', 'Ingresos Financieros', 'Nuevas Matrículas'];

  ngOnInit() {
    this.reportService.getDashboardStats().subscribe({
      next: (data) => {
        this.kpis[0].value = data.students_count.toString();
        this.kpis[1].value = data.attendance_today.length.toString(); // Simplified count of categories
        this.kpis[2].value = data.charges_pending_count.toString();
        this.kpis[3].value = data.announcements_published_count.toString();
      },
      error: (err) => console.error('Error fetching metrics', err)
    });
  }
}
