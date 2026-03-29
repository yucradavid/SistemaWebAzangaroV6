import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { ReportService } from '@core/services/report.service';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <app-back-button></app-back-button>
      <div class="flex items-center gap-4">
        <div class="p-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
          <svg class="w-6 h-6 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div>
          <h1 class="text-3xl font-semibold text-slate-900 tracking-tight">Métricas del Sistema</h1>
          <p class="text-slate-500 text-sm font-medium">KPIs, estadísticas e indicadores clave de gestión institucional</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div *ngFor="let kpi of kpis" class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{{ kpi.label }}</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-semibold text-slate-900 tracking-tighter">{{ kpi.value }}</h3>
            <span class="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg" 
                  [class.bg-green-50]="kpi.positive" [class.text-green-600]="kpi.positive"
                  [class.bg-red-50]="!kpi.positive" [class.text-red-600]="!kpi.positive">
              <svg *ngIf="kpi.positive" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <svg *ngIf="!kpi.positive" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
              {{ kpi.change }}
            </span>
          </div>
        </div>
      </div>

      <!-- Charts placeholder -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div *ngFor="let chart of charts" class="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm group">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-slate-900 font-bold text-lg tracking-tight">{{ chart }}</h3>
            <button class="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
          <div class="h-56 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <div class="p-4 bg-white rounded-full shadow-sm mb-3">
              <svg class="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 13h18"/><path d="M9 21V9"/><path d="M15 21V13"/></svg>
            </div>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Gráfico no disponible</p>
            <p class="text-slate-300 text-[10px] mt-1 italic">Conexión con almacén de datos pendiente</p>
          </div>
        </div>
      </div>
    </div>
  `
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
