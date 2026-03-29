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
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      
      <app-back-button></app-back-button>

      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Gestión de Matrículas</h1>
          <p class="text-slate-500 text-sm font-medium">Administra las matrículas de estudiantes a cursos</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="flex flex-wrap gap-3 mt-2 mb-6">
        <app-setting-metric-card label="Total Matrículas" [value]="totalEnrollments"></app-setting-metric-card>
        <app-setting-metric-card label="Activas" [value]="activeEnrollments"></app-setting-metric-card>
        <app-setting-metric-card label="Retiradas" [value]="inactiveEnrollments"></app-setting-metric-card>
      </div>

      <!-- Filter Pill -->
      <div class="bg-white border border-slate-100/50 rounded-[2rem] p-4 shadow-sm flex flex-col lg:flex-row items-center gap-4 px-6">
        <div class="flex items-center gap-4 flex-1 w-full">
          <div class="text-slate-400">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Buscar estudiante o curso..." class="flex-1 bg-transparent border-none text-sm font-bold text-[#0F172A] focus:ring-0 placeholder-slate-300">
        </div>
        <div class="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
          <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="flex-1 lg:w-32 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-[#0F172A] uppercase tracking-tighter focus:ring-0 cursor-pointer py-2 px-3">
            <option value="">Estados</option>
            <option value="active">Activo</option>
            <option value="withdrawn">Retirado</option>
          </select>
          <button (click)="clearFilters()" class="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-[#0E3A8A] transition-colors">Limpiar</button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <!-- Enrollments Table -->
      <div *ngIf="!loading" class="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estudiante</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Curso ID</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Matrícula</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let enrollment of filteredEnrollments" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-8 py-5">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-[#0F172A] leading-tight tracking-tight uppercase">{{ enrollment.user?.name + ' ' + (enrollment.user?.last_name || '') || enrollment.user_id }}</span>
                    <span class="text-[10px] font-semibold text-slate-400">User ID: {{ enrollment.user_id }}</span>
                  </div>
                </td>
                <td class="px-8 py-5 text-center">
                  <span class="text-sm font-black text-[#0F172A] tracking-tighter">{{ enrollment.course_id }}</span>
                </td>
                <td class="px-8 py-5">
                  <span [class]="'px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ' + getStatusClass(enrollment.status)">
                    {{ enrollment.status }}
                  </span>
                </td>
                <td class="px-8 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                  {{ enrollment.enrollment_date | date:'dd MMM yyyy' }}
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="filteredEnrollments.length === 0" class="p-12 text-center">
            <p class="text-slate-400 font-bold uppercase tracking-widest text-center">No se encontraron matrículas</p>
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
