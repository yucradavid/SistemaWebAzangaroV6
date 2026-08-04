import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { AcademicService, StudentCourseEnrollment } from '@core/services/academic.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-enrollment-config',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, SettingMetricCardComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-700">
      
      <app-back-button></app-back-button>

      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Matrículas</h1>
          <p class="text-slate-500 text-xs font-medium mt-0.5">Administra las matrículas de estudiantes a cursos</p>
        </div>
      </div>

      <!-- Rule A: Stats Chips Row -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 border border-slate-200">
          <span class="text-slate-400 font-medium">Total Matrículas</span>
          <span class="text-slate-900 font-bold">{{ totalEnrollments }}</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200">
          <span class="text-emerald-700 font-medium">Activas</span>
          <span class="text-emerald-900 font-bold">{{ activeEnrollments }}</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 border border-rose-200">
          <span class="text-rose-700 font-medium">Retiradas</span>
          <span class="text-rose-900 font-bold">{{ inactiveEnrollments }}</span>
        </span>
      </div>

      <!-- Rule B: Filter Bar -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div class="relative flex-1 w-full">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Buscar estudiante o curso..." class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400">
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="w-full sm:w-36 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="withdrawn">Retirado</option>
          </select>
          <button (click)="clearFilters()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all whitespace-nowrap">Limpiar</button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <!-- Enrollments Table -->
      <div *ngIf="!loading" class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200">
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estudiante</th>
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Curso ID</th>
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th class="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matrícula</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <tr *ngFor="let enrollment of filteredEnrollments" class="hover:bg-slate-50/60 transition-colors align-middle">
                <td class="px-5 py-4">
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-900 capitalize">{{ enrollment.user?.name + ' ' + (enrollment.user?.last_name || '') || enrollment.user_id }}</span>
                    <span class="text-[11px] text-slate-400">ID: {{ enrollment.user_id }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-center">
                  <span class="font-semibold text-slate-800">{{ enrollment.course_id }}</span>
                </td>
                <td class="px-5 py-4">
                  <span [class]="'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ' + getStatusClass(enrollment.status)">
                    {{ enrollment.status }}
                  </span>
                </td>
                <td class="px-5 py-4 text-[11px] font-medium text-slate-500">
                  {{ enrollment.enrollment_date | date:'dd MMM yyyy' }}
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="filteredEnrollments.length === 0" class="p-12 text-center">
            <p class="text-slate-400 text-xs font-semibold">No se encontraron matrículas con los filtros seleccionados.</p>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EnrollmentConfigComponent implements OnInit {
  enrollments: StudentCourseEnrollment[] = [];
  filteredEnrollments: StudentCourseEnrollment[] = [];
  
  loading = false;
  searchTerm = '';
  statusFilter = '';

  get totalEnrollments() { return this.enrollments.length; }
  get activeEnrollments() { return this.enrollments.filter(e => e.status === 'active').length; }
  get inactiveEnrollments() { return this.enrollments.filter(e => e.status !== 'active').length; }

  constructor(private academicService: AcademicService) {}

  ngOnInit() {
    this.loadEnrollments();
  }

  loadEnrollments() {
    this.loading = true;
    this.academicService.getStudentCourseEnrollments({ per_page: 100 }).subscribe({
      next: (res: any) => {
        this.enrollments = res.data || res;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las matrículas', 'error');
      }
    });
  }

  applyFilters() {
    this.filteredEnrollments = this.enrollments.filter(enrollment => {
      const matchSearch = this.searchTerm === '' || 
                          (enrollment.user_id?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) || 
                          (enrollment.course_id?.toLowerCase() || '').includes(this.searchTerm.toLowerCase());
      
      const matchStatus = this.statusFilter === '' || 
                          enrollment.status === this.statusFilter;

      return matchSearch && matchStatus;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  getStatusClass(status: string) {
    const statuses: any = {
      'active': 'bg-green-50 text-green-600 border-green-100',
      'withdrawn': 'bg-red-50 text-red-600 border-red-100',
    };
    return statuses[status] || 'bg-slate-50 text-slate-600 border-slate-100';
  }
}
