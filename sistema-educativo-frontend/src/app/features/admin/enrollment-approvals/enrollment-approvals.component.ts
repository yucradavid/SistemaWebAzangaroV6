import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-enrollment-approvals',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <app-back-button></app-back-button>
      <!-- Header -->
      <div class="flex items-center gap-4">
        <div class="p-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
          <svg class="w-6 h-6 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div>
          <h1 class="text-3xl font-semibold text-slate-900 tracking-tight">Solicitudes de Matrícula</h1>
          <p class="text-slate-500 text-sm font-medium">Gestión y aprobación de procesos de inscripción para el nuevo ciclo</p>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div class="flex-1">
          <label class="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest pl-1">Filtrar por Estado</label>
          <select class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
            <option>Pendientes de Revisión</option>
            <option>Aprobados</option>
            <option>Rechazados</option>
            <option>Todos los registros</option>
          </select>
        </div>
        <div class="pt-5">
          <button class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95">
            Actualizar
          </button>
        </div>
      </div>

      <!-- Empty state / coming soon -->
      <div class="bg-white border border-slate-100 rounded-3xl py-24 text-center shadow-sm">
        <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <h3 class="text-slate-900 font-semibold text-xl mb-2">Módulo en migración</h3>
        <p class="text-slate-500 text-sm max-w-xs mx-auto font-medium leading-relaxed">Las solicitudes de matrícula y la pasarela de pagos se conectarán próximamente.</p>
      </div>
    </div>
  `
})
export class EnrollmentApprovalsComponent {}
