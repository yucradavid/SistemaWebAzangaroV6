import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ICONS } from '@core/constants/icons';

interface Metric {
  label: string;
  value: string;
  subValue: string;
  icon: string;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
  percent?: number;
}

@Component({
  selector: 'app-metrics-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <app-back-button link="/app/dashboard/student"></app-back-button>

      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Mi Portal Académico</h1>
        <p class="text-slate-500 font-medium leading-relaxed">Métricas de tu desempeño</p>
      </div>

      <!-- KPI Cards (React Design) -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white border border-slate-200 rounded-[32px] p-6 transition-all hover:shadow-lg group border-t-4 border-t-red-600">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-4xl font-black text-slate-900">{{ assignments.overdue.length }}</span>
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Tareas atrasadas</p>
            </div>
            <div [innerHTML]="getSafeIcon('alertCircle')" class="w-12 h-12 text-red-600 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-[32px] p-6 transition-all hover:shadow-lg group border-t-4 border-t-amber-600">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-4xl font-black text-slate-900">{{ assignments.today.length }}</span>
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Para hoy</p>
            </div>
            <div [innerHTML]="getSafeIcon('clock')" class="w-12 h-12 text-amber-600 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-[32px] p-6 transition-all hover:shadow-lg group border-t-4 border-t-blue-700">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-4xl font-black text-slate-900">{{ assignments.thisWeek.length }}</span>
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Esta semana</p>
            </div>
            <div [innerHTML]="getSafeIcon('calendar')" class="w-12 h-12 text-blue-700 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-[32px] p-6 transition-all hover:shadow-lg group border-t-4 border-t-green-500">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-4xl font-black text-slate-900">{{ getAttendancePercentage() }}%</span>
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Asistencia</p>
            </div>
            <div [innerHTML]="getSafeIcon('trendingUp')" class="w-12 h-12 text-green-500 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>
      </div>

      <!-- Two Column Grid: Tasks & Attendance -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Mis Tareas Card -->
        <div class="bg-white border border-slate-100 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
          <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h2 class="text-xl font-black text-slate-900 tracking-tight">Mis tareas</h2>
            <div [innerHTML]="getSafeIcon('bookOpen')" class="w-5 h-5 text-slate-400"></div>
          </div>
          
          <div class="p-8 flex-1">
            <div *ngIf="assignments.overdue.length === 0 && assignments.today.length === 0 && assignments.thisWeek.length === 0" 
                 class="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <p class="text-slate-400 font-medium">No tienes tareas pendientes</p>
            </div>

            <!-- Task List -->
            <div class="space-y-6">
              <!-- Overdue -->
              <div *ngIf="assignments.overdue.length > 0" class="space-y-3">
                <div class="flex items-center gap-2">
                  <div [innerHTML]="getSafeIcon('alertCircle')" class="w-4 h-4 text-red-600"></div>
                  <p class="text-xs font-black text-red-600 uppercase tracking-widest">Atrasadas</p>
                </div>
                <div *ngFor="let task of assignments.overdue" class="p-5 bg-red-50 border border-red-100 rounded-3xl space-y-3">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="font-black text-slate-900 leading-tight">{{ task.title }}</p>
                      <p class="text-xs font-bold text-slate-500 mt-1">{{ task.courseName }}</p>
                    </div>
                    <span class="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{{ formatDate(task.dueDate) }}</span>
                  </div>
                  <button routerLink="/app/tasks/student" class="w-full py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-sm">
                    Entregar ahora
                  </button>
                </div>
              </div>

              <!-- Today -->
              <div *ngIf="assignments.today.length > 0" class="space-y-3">
                <div class="flex items-center gap-2">
                  <div [innerHTML]="getSafeIcon('clock')" class="w-4 h-4 text-amber-600"></div>
                  <p class="text-xs font-black text-amber-600 uppercase tracking-widest">Hoy</p>
                </div>
                <div *ngFor="let task of assignments.today" class="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="font-black text-slate-900 leading-tight">{{ task.title }}</p>
                      <p class="text-xs font-bold text-slate-500 mt-1">{{ task.courseName }} • Vence {{ formatDate(task.dueDate) }}</p>
                    </div>
                  </div>
                  <button routerLink="/app/tasks/student" class="w-full py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                    Ver detalles
                  </button>
                </div>
              </div>

              <!-- This Week -->
              <div *ngIf="assignments.thisWeek.length > 0" class="space-y-3">
                <div class="flex items-center gap-2">
                  <div [innerHTML]="getSafeIcon('calendar')" class="w-4 h-4 text-blue-700"></div>
                  <p class="text-xs font-black text-blue-700 uppercase tracking-widest">Esta semana</p>
                </div>
                <div *ngFor="let task of assignments.thisWeek" class="p-5 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p class="font-black text-slate-900 leading-tight">{{ task.title }}</p>
                  <p class="text-xs font-bold text-slate-500 mt-1">{{ task.courseName }} • {{ formatDate(task.dueDate) }}</p>
                </div>
              </div>
            </div>

            <button routerLink="/app/tasks/student" class="w-full mt-6 py-4 px-6 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
              Ver todas las tareas
            </button>
          </div>
        </div>

        <!-- Mi Asistencia Card -->
        <div class="bg-white border border-slate-100 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
          <div class="px-8 py-6 border-b border-slate-50">
            <h2 class="text-xl font-black text-slate-900 tracking-tight">Mi asistencia</h2>
          </div>
          
          <div class="p-8 space-y-8 flex-1 flex flex-col justify-center">
            <div class="text-center space-y-2">
              <p class="text-6xl font-black text-indigo-900 tracking-tighter">{{ getAttendancePercentage() }}%</p>
              <p class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Asistencia total</p>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="bg-green-50 rounded-[32px] p-6 text-center space-y-1">
                <p class="text-3xl font-black text-green-600">{{ attendanceStats.presente }}</p>
                <p class="text-[10px] font-black text-green-400 uppercase tracking-widest">Presentes</p>
              </div>
              <div class="bg-amber-50 rounded-[32px] p-6 text-center space-y-1">
                <p class="text-3xl font-black text-amber-600">{{ attendanceStats.tarde }}</p>
                <p class="text-[10px] font-black text-amber-400 uppercase tracking-widest">Tardanzas</p>
              </div>
              <div class="bg-red-50 rounded-[32px] p-6 text-center space-y-1">
                <p class="text-3xl font-black text-red-600">{{ attendanceStats.falta }}</p>
                <p class="text-[10px] font-black text-red-400 uppercase tracking-widest">Faltas</p>
              </div>
            </div>

            <button routerLink="/app/attendance/student" class="w-full py-4 px-6 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
              Ver historial completo
            </button>
          </div>
        </div>
      </div>

      <!-- Progress by Area (Preserved from Angular Design) -->
      <div class="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-10">
        <div class="flex items-center justify-between border-b border-slate-50 pb-6">
          <h3 class="text-2xl font-black text-slate-900 tracking-tight">Rendimiento por Competencias</h3>
          <button class="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline hover:text-indigo-800 transition-colors">Ver detalle completo</button>
        </div>

        <div class="space-y-8 max-w-5xl mx-auto">
          <div *ngFor="let area of areas" class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-slate-700 tracking-tight">{{ area.name }}</span>
              <span class="font-black text-slate-900 text-xl">{{ area.percent }}%</span>
            </div>
            <div class="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
              <div [class]="'h-full rounded-full transition-all duration-[1500ms] ease-out shadow-sm ' + area.color" [style.width.%]="loading ? 0 : area.percent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #F8FAFC; min-h: 100vh; }
  `]
})
export class MetricsStudentComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  
  loading = false;

  assignments = {
    today: [
      { id: '1', title: 'Práctica de Logaritmos', courseName: 'Matemática y Lógica', dueDate: new Date().toISOString() }
    ],
    thisWeek: [
      { id: '2', title: 'Ensayo sobre Cien años de soledad', courseName: 'Comunicación y Literatura', dueDate: new Date(Date.now() + 86400000 * 2).toISOString() },
      { id: '3', title: 'Laboratorio de Célula vegetal', courseName: 'Ciencia y Tecnología', dueDate: new Date(Date.now() + 86400000 * 4).toISOString() }
    ],
    overdue: [
      { id: '4', title: 'Cuestionario de Historia Universal', courseName: 'Ciencia y Tecnología', dueDate: new Date(Date.now() - 86400000).toISOString() }
    ]
  };

  attendanceStats = {
    presente: 24,
    tarde: 3,
    falta: 1,
    total: 28
  };

  areas = [
    { name: 'Matemática y Lógica', percent: 88, color: 'bg-blue-600' },
    { name: 'Comunicación y Literatura', percent: 95, color: 'bg-rose-500' },
    { name: 'Ciencia y Tecnología', percent: 82, color: 'bg-emerald-500' },
    { name: 'Inglés / Idioma Extranjero', percent: 91, color: 'bg-indigo-500' },
    { name: 'Arte y Cultura', percent: 76, color: 'bg-amber-500' }
  ];

  ngOnInit() {
    this.animateLoad();
  }

  animateLoad() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 100);
  }

  getAttendancePercentage(): number {
    if (this.attendanceStats.total === 0) return 0;
    return Math.round((this.attendanceStats.presente / this.attendanceStats.total) * 100);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays < -1) return `Hace ${Math.abs(diffDays)} días`;
    return `En ${diffDays} días`;
  }

  getSafeIcon(name: string): SafeHtml {
    const map: Record<string, string> = {
      alertCircle: ICONS.alertCircle,
      clock: ICONS.clock,
      calendar: ICONS.calendar,
      trendingUp: ICONS.trendingUp,
      bookOpen: ICONS.bookOpen,
    };
    const svg = map[name] || ICONS.activity;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
