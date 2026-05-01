import { Component, OnInit, inject, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Course, GradeLevel, Section } from '@core/services/academic.service';
import { ScheduleService } from '@core/services/schedule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-8 max-w-[1600px] mx-auto space-y-6 text-slate-700 font-sans">
      <app-back-button></app-back-button>

      <!-- Header -->
      <div class="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,58,138,0.1),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#eff6ff_48%,#f8fafc_100%)] p-6 sm:p-10 shadow-sm">
        <div class="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl"></div>
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.4em] text-blue-600">Gestor de Horarios</p>
            <h1 class="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">Planificación Académica</h1>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-3 bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-2 px-4 shadow-sm">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vista:</span>
              <select [(ngModel)]="maxDays" class="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer">
                <option [ngValue]="5">Lunes a Viernes</option>
                <option [ngValue]="6">Lunes a Sábado</option>
                <option [ngValue]="7">Lunes a Domingo</option>
              </select>
            </div>
            <button (click)="printSchedule()" class="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-blue-600 hover:text-blue-700 transition-all shadow-sm">Imprimir</button>
                      <div class="flex items-center gap-3">
              <button (click)="openModal()" [disabled]="!selectedSectionId" class="px-8 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold shadow-xl active:scale-95 transition-all disabled:opacity-30">Nuevo Bloque</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Grado Académico</label>
          <select [(ngModel)]="selectedGradeId" (change)="onGradeChange()" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
            <option value="">Seleccionar grado</option>
            <option *ngFor="let grade of grades" [value]="grade.id">{{ grade.name || (grade.level + ' ' + grade.grade + '°') }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Sección</label>
          <select [(ngModel)]="selectedSectionId" (change)="onSectionChange()" [disabled]="!selectedGradeId" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all disabled:opacity-40">
            <option value="">Seleccionar sección</option>
            <option *ngFor="let section of sections" [value]="section.id">Sección {{ section.section_letter }}</option>
          </select>
        </div>
        <div class="md:col-span-2 flex items-center gap-5 bg-blue-50/50 border border-blue-100 rounded-3xl px-6 py-4">
          <div class="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20 text-xl">📅</div>
          <div>
            <p class="text-base font-semibold text-blue-900 tracking-tight">{{ getSelectedGradeName() || 'Esperando selección...' }}</p>
            <p class="text-xs text-blue-700 font-medium tracking-wide">Sección {{ getSelectedSectionLetter() || '...' }} • {{ schedules.length }} bloques programados</p>
          </div>
        </div>
      </div>

      <!-- ESTANTERÍA DE CAMBIOS PENDIENTES (SHELF UI) -->
      <div *ngIf="getPendingChangesCount() > 0" class="animate-in slide-in-from-top duration-300">
        <div class="bg-indigo-50/50 border-2 border-indigo-100 rounded-[2.5rem] p-6 shadow-lg shadow-indigo-100/20">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-4">
                <div class="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Borradores</div>
                <h3 class="text-lg font-black text-slate-800 tracking-tight">Cambios sin guardar</h3>
              </div>
              
              <!-- Cards de Cambios -->
              <div class="flex flex-wrap gap-3">
                <div *ngFor="let change of pendingChanges | keyvalue" 
                     (click)="toggleSelection(change.key)"
                     class="relative flex items-center gap-4 p-3 pr-5 bg-white rounded-2xl border-2 transition-all cursor-pointer group shadow-sm select-none"
                     [class.border-indigo-600]="isSelected(change.key)"
                     [class.bg-indigo-50]="isSelected(change.key)"
                     [class.border-slate-100]="!isSelected(change.key)">
                  
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md transition-transform group-hover:scale-110"
                       [class]="getCourseColor(change.value.course_id)">
                    {{ getCourseName(change.value.course_id).substring(0,1) }}
                  </div>
                  
                  <div>
                    <p class="text-[11px] font-black text-slate-700 leading-tight">{{ getCourseName(change.value.course_id) }}</p>
                    <p class="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">
                      {{ days[change.value.day_of_week - 1].name.substring(0,3) }} | {{ change.value.start_time }} - {{ change.value.end_time }}
                    </p>
                  </div>

                  <!-- Badge de Seleccionado -->
                  <div *ngIf="isSelected(change.key)" class="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg scale-110">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Acciones Masivas -->
            <div class="flex items-center gap-3 bg-white p-4 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/20">
              <button (click)="discardAllChanges()" class="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Descartar Todo</button>
              <button (click)="saveBatchChanges()" [disabled]="saving || selectedChangeIds.size === 0"
                      class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all disabled:opacity-30 disabled:scale-95 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                {{ saving ? 'Guardando...' : 'Aplicar Seleccionados (' + selectedChangeIds.size + ')' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- GRID PRINCIPAL (FONDO) -->
      <div *ngIf="selectedSectionId" class="bg-white border border-slate-200 rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative">
        <div *ngIf="loading" class="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-4 text-sm font-medium text-slate-500 tracking-widest uppercase">Cargando horario...</p>
        </div>

        <div class="overflow-x-auto">
          <div class="min-w-[1100px]">
            <!-- Header Días -->
            <div class="grid grid-cols-[100px_repeat(var(--days-count),1fr)] bg-slate-50/50 border-b border-slate-100" [style.--days-count]="maxDays">
              <div class="h-16 border-r border-slate-100 flex items-center justify-center">
                 <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round"></path></svg>
              </div>
              <div *ngFor="let day of getVisibleDays()" class="h-16 border-r border-slate-100 flex items-center justify-center">
                <span class="text-xs font-bold uppercase text-slate-500 tracking-[0.2em]">{{ day.name }}</span>
              </div>
            </div>

            <!-- Grid Content -->
            <div class="relative grid grid-cols-[100px_repeat(var(--days-count),1fr)]" [style.--days-count]="maxDays" [style.height.px]="gridHeight">
              <div class="relative border-r border-slate-100 bg-slate-50/20">
                <div *ngFor="let hour of getHourLabels()" class="absolute w-full flex items-center justify-center" [style.top.%]="getTopPosition(hour + ':00')">
                  <span class="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-full border border-slate-50 shadow-sm">{{ hour }}:00</span>
                </div>
              </div>
              <div *ngFor="let day of getVisibleDays()" class="relative border-r border-slate-100 group">
                <div *ngFor="let h of getHourLabels()" class="absolute w-full border-t border-slate-100/50" [style.top.%]="getTopPosition(h + ':00')"></div>
                <div *ngFor="let block of getSchedulesByDay(day.id)" class="absolute left-2 right-2 rounded-2xl p-4 text-white shadow-xl shadow-black/10 transition-all hover:z-20 hover:scale-[1.03] group/block overflow-hidden"
                     [class]="getCourseColor(block.course_id)" 
                     [class.opacity-20]="selectedChangeIds.size > 0 && !isSelected(block.id)"
                     [class.blur-[2px]]="selectedChangeIds.size > 0 && !isSelected(block.id)"
                     [style.top]="'calc(' + getTopPosition(block.start_time) + '% + 1px)'" 
                     [style.height]="'calc(' + getHeightPercent(block.start_time, block.end_time) + '% - 2px)'">
                  <div class="flex flex-col h-full relative z-10">
                    <div class="flex items-start justify-between">
                      <p class="text-xs font-semibold uppercase tracking-tighter truncate w-full">{{ block.course?.name || getCourseName(block.course_id) }}</p>
                      <div class="flex items-center gap-1.5 opacity-0 group-hover/block:opacity-100 transition-all transform translate-x-2 group-hover/block:translate-x-0">
                        <button (click)="editBlock(block)" class="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-colors flex items-center justify-center">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>
                        <button (click)="deleteBlock(block.id, $event)" class="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg transition-colors flex items-center justify-center">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>
                      </div>
                    </div>
                    <p class="text-[10px] font-medium opacity-90 mt-1 tracking-wide">{{ formatTime(block.start_time) }} - {{ formatTime(block.end_time) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CENTRAL REFINADO -->
      <div *ngIf="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" (click)="closeModal()"></div>
        
        <div class="relative z-10 w-full max-w-[1400px] bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col lg:flex-row h-full max-h-[85vh] border border-slate-100">
          
          <!-- LADO IZQUIERDO: FORMULARIO ESTILIZADO -->
          <div class="w-full lg:w-[460px] p-10 lg:p-14 flex flex-col border-r border-slate-50 overflow-y-auto">
            <div class="flex items-center justify-between mb-10">
              <div>
                <h2 class="text-3xl font-semibold text-slate-900 tracking-tight">Nuevo Bloque</h2>
                <p class="text-xs font-medium text-blue-500 mt-2 uppercase tracking-[0.2em]">{{ getSelectedGradeName() }} • SECC. {{ getSelectedSectionLetter() }}</p>
              </div>
              <button (click)="closeModal()" class="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center active:scale-90 text-xl">✕</button>
            </div>

            <form [formGroup]="scheduleForm" (ngSubmit)="saveBlock()" class="space-y-8 flex-1">
              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Asignatura / Curso</label>
                <select formControlName="course_id" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-base font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                  <option value="">Elegir curso</option>
                  <option *ngFor="let course of courses" [value]="course.id">{{ course.name }}</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Docente Asignado</label>
                <select formControlName="teacher_id" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-base font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                  <option value="">Sin docente asignado</option>
                  <option *ngFor="let teacher of teachers" [value]="teacher.id">{{ teacher.first_name }} {{ teacher.last_name }}</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Día de la Semana</label>
                <select formControlName="day_of_week" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-base font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                  <option *ngFor="let day of getVisibleDays()" [value]="day.id">{{ day.name }}</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Hora Inicio</label>
                  <input type="time" formControlName="start_time" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-base font-medium text-slate-700 focus:border-blue-500 transition-all">
                </div>
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Hora Fin</label>
                  <input type="time" formControlName="end_time" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-base font-medium text-slate-700 focus:border-blue-500 transition-all">
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Aula o Laboratorio</label>
                <input type="text" formControlName="room_number" placeholder="Ej: Aula 102" class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-base font-medium text-slate-700 focus:border-blue-500 transition-all">
              </div>

              <div *ngIf="overlapError" class="p-5 rounded-3xl border border-red-200 bg-red-50/50 flex items-start gap-4 animate-shake">
                <div class="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20 text-xl font-bold">!</div>
                <div>
                  <p class="text-sm font-semibold text-red-900">Conflicto detectado</p>
                  <p class="text-[11px] text-red-700 font-medium mt-1 leading-relaxed">El horario ya está ocupado. Revisa las zonas verdes en la previsualización.</p>
                </div>
              </div>
            </form>

            <div class="pt-10 border-t border-slate-50 space-y-4">
              <button (click)="saveBlock()" [disabled]="scheduleForm.invalid || saving || overlapError" class="w-full rounded-2xl bg-blue-600 px-8 py-5 text-base font-semibold text-white disabled:opacity-30 shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all">
                {{ saving ? 'Sincronizando...' : (editingBlockId ? 'Actualizar Horario' : 'Guardar Bloque') }}
              </button>
              
              <div *ngIf="editingBlockId" class="flex items-center gap-3">
                <button type="button" (click)="deleteBlock(editingBlockId, $event)" class="flex-1 rounded-2xl bg-red-50 text-red-600 border border-red-100 px-6 py-4 text-sm font-bold hover:bg-red-100 transition-all">
                  Eliminar Bloque
                </button>
                <button type="button" (click)="resetFormToNew()" class="flex-1 rounded-2xl bg-slate-50 text-slate-600 border border-slate-100 px-6 py-4 text-sm font-bold hover:bg-slate-100 transition-all">
                  Nuevo Bloque
                </button>
              </div>

              <!-- BOTÓN DE LIMPIEZA TOTAL DE PLANIFICACIÓN -->
              <button *ngIf="getPendingChangesCount() > 0" type="button" (click)="discardAllChanges()" 
                      class="w-full mt-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 transition-all">
                ♻️ Limpiar Toda la Planificación
              </button>
            </div>
          </div>

          <!-- LADO DERECHO: PREVISUALIZACIÓN AMPLIADA -->
          <div class="hidden lg:flex flex-1 bg-slate-50/30 flex-col overflow-hidden">
            
            <!-- ESTANTERÍA DENTRO DEL MODAL -->
            <div *ngIf="getPendingChangesCount() > 0" class="p-8 bg-indigo-50/50 border-b border-indigo-100 animate-in slide-in-from-top duration-200">
              <div class="flex items-center justify-between mb-4 px-2">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                  <span class="text-[10px] font-black uppercase text-indigo-700 tracking-widest">Cambios Pendientes</span>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="discardAllChanges()" class="px-3 py-2 text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Descartar Todo</button>
                  <button (click)="saveBatchChanges()" [disabled]="selectedChangeIds.size === 0" 
                          class="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-30">
                    APLICAR SELECCIONADOS ({{selectedChangeIds.size}})
                  </button>
                </div>
              </div>
              <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div *ngFor="let change of pendingChanges | keyvalue" 
                     (click)="toggleSelection(change.key)"
                     class="shrink-0 w-36 p-3 bg-white rounded-2xl border-2 transition-all cursor-pointer shadow-sm group select-none"
                     [class.border-indigo-600]="isSelected(change.key)"
                     [class.bg-indigo-50]="isSelected(change.key)"
                     [class.border-slate-100]="!isSelected(change.key)">
                  <div class="flex items-center gap-2 mb-2">
                     <div class="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px] font-bold" [class]="getCourseColor(change.value.course_id)">{{ (change.value.course?.name || getCourseName(change.value.course_id)).substring(0,1) }}</div>
                     <p class="text-[10px] font-black text-slate-700 truncate group-hover:text-indigo-600">{{ change.value.course?.name || getCourseName(change.value.course_id) }}</p>
                  </div>
                  <p class="text-[8px] text-slate-500 font-bold uppercase tracking-tight">{{ change.value.start_time }} - {{ change.value.end_time }}</p>
                </div>
              </div>
            </div>

            <div class="p-8 border-b border-slate-100 bg-white/60 backdrop-blur-md flex items-center justify-between px-10">
              <h3 class="text-lg font-semibold text-slate-800 tracking-tight">Previsualización del Horario</h3>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30"></div>
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disponible</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/30"></div>
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cruce</span>
                </div>
              </div>
            </div>

            <!-- Mini Grid Ampliado -->
            <div class="flex-1 overflow-y-auto p-10">
              <div class="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden relative">
                <div class="grid grid-cols-[70px_repeat(var(--days-count),1fr)] bg-slate-50/80 border-b border-slate-100" [style.--days-count]="maxDays">
                  <div class="h-12 flex items-center justify-center text-lg">⏳</div>
                  <div *ngFor="let day of getVisibleDays()" class="h-12 flex items-center justify-center border-l border-slate-100">
                    <span class="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">{{ day.name.substring(0,3) }}</span>
                  </div>
                </div>

                <div class="relative grid grid-cols-[70px_repeat(var(--days-count),1fr)]" [style.--days-count]="maxDays" [style.height.px]="650">
                  <div class="relative border-r border-slate-100 bg-slate-50/10">
                    <div *ngFor="let hour of getHourLabels()" class="absolute w-full flex items-center justify-center" [style.top.%]="getTopPosition(hour + ':00')">
                      <span class="text-[9px] font-bold text-slate-500 uppercase">{{ hour }}:00</span>
                    </div>
                  </div>

                  <div *ngFor="let day of getVisibleDays()" class="relative border-r border-slate-100">
                    <!-- BLOQUE FANTASMA INTERACTIVO (PREVISUALIZACIÓN Y EDICIÓN) -->
                    <div *ngIf="scheduleForm.get('course_id')?.value && scheduleForm.get('start_time')?.value && scheduleForm.get('end_time')?.value && currentFormDay === day.id"
                         (mousedown)="onMouseDownGhost($event)"
                         class="absolute left-1 right-1 rounded-lg border-2 border-dashed border-white shadow-2xl z-[150] cursor-move overflow-hidden transition-shadow ring-4 ring-indigo-500/30"
                         [class]="getCourseColor(scheduleForm.get('course_id')?.value)"
                         [style.top.%]="getTopPosition(scheduleForm.get('start_time')?.value)"
                         [style.height.%]="getHeightPercent(scheduleForm.get('start_time')?.value, scheduleForm.get('end_time')?.value)">
                         
                         <!-- Handle Superior (Resize Ghost) -->
                         <div class="absolute top-0 left-0 right-0 h-3 cursor-ns-resize z-[160] hover:bg-white/20" (mousedown)="onResizeStartGhost($event, 'top')"></div>

                         <div class="p-2 flex flex-col h-full bg-white/10 backdrop-blur-sm pointer-events-none">
                           <span class="text-[8px] font-black uppercase text-white/80 tracking-widest">EDITANDO</span>
                           <span class="text-[11px] font-bold text-white leading-tight truncate">{{ getCourseName(scheduleForm.get('course_id')?.value) }}</span>
                           <span class="text-[9px] font-medium text-white/90 mt-auto">{{ scheduleForm.get('start_time')?.value }} - {{ scheduleForm.get('end_time')?.value }}</span>
                         </div>

                         <!-- Handle Inferior (Resize Ghost) -->
                         <div class="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize z-[160] hover:bg-white/20" (mousedown)="onResizeStartGhost($event, 'bottom')"></div>
                    </div>

                    <!-- SUGERENCIA INTELIGENTE: Huecos Libres Detectados -->
                    <ng-container *ngIf="overlapError || scheduleForm.get('course_id')?.value">
                      <div *ngFor="let slot of getSlotsByDay(day.id)" 
                           class="absolute left-0.5 right-0.5 rounded-lg bg-emerald-500/10 animate-suggestion border border-emerald-500/20 flex items-center justify-center group/slot z-[100]"
                           [style.top.%]="getTopPositionFromMinutes(slot.start)" 
                           [style.height.%]="getHeightPercentFromMinutes(slot.start, slot.end)">
                        <button type="button" 
                                (mousedown)="$event.stopPropagation(); applySuggestion(slot)" 
                                class="opacity-0 group-hover/slot:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-2xl transition-all transform hover:scale-110 active:scale-95 uppercase tracking-wider z-[110]">
                          Asignar aquí
                        </button>
                      </div>
                    </ng-container>

                    <!-- Bloques Existentes (Se oculta el que se está editando) -->
                    <div *ngFor="let block of getSchedulesByDay(day.id)" 
                         [style.display]="editingBlockId === block.id ? 'none' : 'block'"
                         (mousedown)="onMouseDown($event, block)"
                         class="absolute left-0.5 right-0.5 rounded-lg p-2 text-white shadow-sm overflow-hidden cursor-move hover:ring-2 hover:ring-white/50 transition-all hover:z-40 group/mini select-none"
                         [class]="getCourseColor(block.course_id)" 
                         [class.opacity-20]="selectedChangeIds.size > 0 && !isSelected(block.id)"
                         [class.blur-[1px]]="selectedChangeIds.size > 0 && !isSelected(block.id)"
                         [style.top.%]="getTopPosition(block.start_time)" 
                         [style.height.%]="getHeightPercent(block.start_time, block.end_time)">
                         
                         <!-- Handles de los demás bloques -->
                         <div class="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-50" (mousedown)="onResizeStart($event, block, 'top')"></div>
                         
                         <!-- INDICADOR DE BORRADOR (CAMBIO PENDIENTE) -->
                         <div *ngIf="pendingChanges[block.id]" class="absolute top-1 left-1 bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[7px] font-black tracking-widest text-white shadow-sm border border-white/30 animate-pulse">
                           MODIFICADO
                         </div>

                         <div class="flex flex-col h-full pointer-events-none">
                           <p class="text-[10px] font-medium uppercase leading-tight truncate tracking-tight">{{ block.course?.name || getCourseName(block.course_id) }}</p>
                           <p class="text-[8px] font-bold opacity-80 mt-0.5">{{ formatTime(block.start_time) }} - {{ formatTime(block.end_time) }}</p>
                         </div>
                         <div class="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-50" (mousedown)="onResizeStart($event, block, 'bottom')"></div>
                    </div>

                    <!-- GHOST BLOCK (PREVIEW) -->
                    <div *ngIf="currentFormDay === day.id && scheduleForm.get('start_time')?.value && scheduleForm.get('end_time')?.value"
                         class="absolute left-1 right-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center z-30 transition-all duration-300 shadow-xl"
                         [ngClass]="overlapError ? 'border-red-500 bg-red-50/80 animate-pulse' : 'border-blue-500 bg-blue-50/80 shadow-blue-500/20'"
                         [style.top.%]="getTopPosition(scheduleForm.get('start_time')?.value)"
                         [style.height.%]="getHeightPercent(scheduleForm.get('start_time')?.value, scheduleForm.get('end_time')?.value)">
                      <span class="text-[9px] font-bold uppercase tracking-widest" [ngClass]="overlapError ? 'text-red-700' : 'text-blue-700'">{{ overlapError ? 'CRUCE' : 'OK' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Informativo -->
            <div class="p-8 bg-white border-t border-slate-50 px-10">
               <div class="flex items-center gap-4 p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100 shadow-sm">
                 <div class="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-500/20 animate-bounce-slow">✨</div>
                 <div>
                    <p class="text-xs font-semibold text-emerald-900 uppercase tracking-tight">Sugerencia Visual Activada</p>
                    <p class="text-[10px] font-medium text-emerald-700 mt-0.5 leading-relaxed">
                      Si hay un cruce, busca los días con parpadeo verde. Representan zonas libres garantizadas.
                    </p>
                 </div>
               </div>
            </div>

            <!-- MODAL DE GESTIÓN POR LOTES (BATCH SAVE) -->
            <div *ngIf="showBatchModal" class="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
                <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">Cambios Pendientes</h2>
                    <p class="text-slate-500 text-sm mt-1">Revisa los movimientos realizados antes de aplicar.</p>
                  </div>
                  <button (click)="showBatchModal = false" class="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400">✕</button>
                </div>

                <div class="p-8 max-h-[400px] overflow-y-auto space-y-3">
                  <div *ngFor="let change of pendingChanges | keyvalue" class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" [class]="getCourseColor(change.value.course_id)">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                      </div>
                      <div>
                        <p class="font-bold text-slate-700">{{ change.value.course?.name || getCourseName(change.value.course_id) }}</p>
                        <p class="text-xs text-slate-500 font-medium uppercase tracking-tighter">
                          {{ days[change.value.day_of_week - 1].name }} | {{ change.value.start_time }} - {{ change.value.end_time }}
                        </p>
                      </div>
                    </div>
                    <button (click)="removePendingChange(change.key)" class="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round"></path></svg>
                    </button>
                  </div>
                </div>

                <div class="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button (click)="discardAllChanges()" class="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors">Descartar Todo</button>
                  <button (click)="saveBatchChanges()" [disabled]="saving"
                          class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all disabled:opacity-50">
                    {{ saving ? 'Guardando...' : 'Aplicar Todos los Cambios' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .animate-suggestion { animation: pulseGreen 1.5s infinite; }
    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-bounce-slow { animation: bounce 3s infinite; }
    
    @keyframes pulseGreen {
      0%, 100% { opacity: 0.1; }
      50% { opacity: 0.35; background-color: #10b981; }
    }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
    @keyframes slideUp {
      from { transform: translateY(60px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    @media print {
      @page { size: landscape; margin: 0.5cm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
    }
  `]
})
export class AdminScheduleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private academicService = inject(AcademicService);
  private scheduleService = inject(ScheduleService);

  gridStartHour = 7;
  gridEndHour = 16;
  maxDays = 6;
  gridHeight = 1000;

  days = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' }
  ];

  colorPalette = ['bg-[#8B5CF6]', 'bg-[#10B981]', 'bg-[#00A1DE]', 'bg-[#84CC16]', 'bg-[#EC4899]', 'bg-[#F59E0B]', 'bg-[#EF4444]', 'bg-[#06B6D4]', 'bg-[#6366F1]'];
  courseColorMap: Record<string, string> = {};

  grades: GradeLevel[] = [];
  sections: Section[] = [];
  courses: Course[] = [];
  teachers: any[] = [];
  schedules: any[] = [];

  selectedGradeId = '';
  selectedSectionId = '';
  activeAcademicYearId = '';

  loading = false;
  showModal = false;
  saving = false;
  overlapError = false;
  editingBlockId: string | null = null;
  scheduleForm: FormGroup;

  // BATCH PLANNING STATE
  pendingChanges: Record<string, any> = {}; 
  selectedChangeIds: Set<string> = new Set();
  showBatchModal = false;

  toggleSelection(id: string) {
    if (this.selectedChangeIds.has(id)) {
      this.selectedChangeIds.delete(id);
    } else {
      this.selectedChangeIds.add(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedChangeIds.has(id);
  }

  draggingBlock: any = null;
  resizeType: 'top' | 'bottom' | null = null;
  dragStartY = 0;
  dragStartMinutes = 0;
  dragStartEndMinutes = 0;

  constructor() {
    this.scheduleForm = this.fb.group({
      course_id: ['', Validators.required],
      teacher_id: [''],
      day_of_week: [1, Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      room_number: ['']
    });

    this.scheduleForm.valueChanges.subscribe(() => {
      this.checkConflicts();
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.draggingBlock) return;
    
    const miniGrid = document.querySelector('.relative.grid-cols-\\[70px_repeat\\(var\\(--days-count\\)\\,1fr\\)\\]');
    if (!miniGrid) return;

    const rect = miniGrid.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
    const minutes = Math.round(((relativeY / 650) * totalMinutes + (this.gridStartHour * 60)) / 15) * 15;

    if (this.resizeType === 'top') {
      const currentEnd = this.timeToMinutes(this.scheduleForm.get('end_time')?.value);
      if (minutes < currentEnd) {
        this.scheduleForm.patchValue({ start_time: this.minutesToTime(minutes) });
        this.updatePendingChange();
      }
    } else if (this.resizeType === 'bottom') {
      const currentStart = this.timeToMinutes(this.scheduleForm.get('start_time')?.value);
      if (minutes > currentStart) {
        this.scheduleForm.patchValue({ end_time: this.minutesToTime(minutes) });
        this.updatePendingChange();
      }
    } else {
      const deltaMinutes = minutes - this.dragStartY;
      const newStart = Math.max(this.gridStartHour * 60, Math.min(this.gridEndHour * 60, this.dragStartMinutes + deltaMinutes));
      const duration = this.dragStartEndMinutes - this.dragStartMinutes;
      const newEnd = newStart + duration;

      if (newEnd <= this.gridEndHour * 60) {
        this.scheduleForm.patchValue({
          start_time: this.minutesToTime(newStart),
          end_time: this.minutesToTime(newEnd)
        });
      }

      const relativeX = event.clientX - rect.left - 70;
      const columnWidth = (rect.width - 70) / this.maxDays;
      const dayIndex = Math.floor(relativeX / columnWidth) + 1;
      if (dayIndex >= 1 && dayIndex <= this.maxDays) {
        this.scheduleForm.patchValue({ day_of_week: dayIndex });
      }
      this.updatePendingChange();
    }
  }

  updatePendingChange() {
    if (this.editingBlockId) {
      const formVal = this.scheduleForm.getRawValue();
      const original = this.schedules.find(s => s.id === this.editingBlockId);
      this.pendingChanges[this.editingBlockId] = {
        ...original,
        ...formVal
      };
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.draggingBlock = null;
    this.resizeType = null;
  }

  onMouseDownGhost(event: MouseEvent) {
    event.preventDefault();
    this.draggingBlock = { id: 'GHOST' };
    this.resizeType = null;
    this.initDragData(event, this.scheduleForm.get('start_time')?.value, this.scheduleForm.get('end_time')?.value);
  }

  onResizeStartGhost(event: MouseEvent, type: 'top' | 'bottom') {
    event.stopPropagation();
    event.preventDefault();
    this.draggingBlock = { id: 'GHOST' };
    this.resizeType = type;
  }

  private initDragData(event: MouseEvent, startTime: string, endTime: string) {
    const miniGrid = document.querySelector('.relative.grid-cols-\\[70px_repeat\\(var\\(--days-count\\)\\,1fr\\)\\]');
    if (miniGrid) {
      const rect = miniGrid.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
      this.dragStartY = Math.round(((relativeY / 650) * totalMinutes + (this.gridStartHour * 60)) / 15) * 15;
      this.dragStartMinutes = this.timeToMinutes(startTime);
      this.dragStartEndMinutes = this.timeToMinutes(endTime);
    }
  }

  onMouseDown(event: MouseEvent, block: any) {
    event.preventDefault();
    this.editBlock(block);
    this.draggingBlock = block;
    this.resizeType = null;
    this.initDragData(event, block.start_time, block.end_time);
  }

  onResizeStart(event: MouseEvent, block: any, type: 'top' | 'bottom') {
    event.stopPropagation();
    event.preventDefault();
    this.editBlock(block);
    this.draggingBlock = block;
    this.resizeType = type;
  }

  ngOnInit() {
    this.loadAcademicYears();
    this.loadGrades();
    this.loadTeachers();
  }

  getVisibleDays() {
    return this.days.slice(0, this.maxDays);
  }

  getHourLabels() {
    const hours = [];
    for (let i = this.gridStartHour; i <= this.gridEndHour; i++) hours.push(i);
    return hours;
  }

  getTopPosition(timeStr: string): number {
    if (!timeStr) return 0;
    const minutes = this.timeToMinutes(timeStr);
    const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
    return ((minutes - (this.gridStartHour * 60)) / totalMinutes) * 100;
  }

  getHeightPercent(start: string, end: string): number {
    if (!start || !end) return 0;
    const diff = this.timeToMinutes(end) - this.timeToMinutes(start);
    const totalRange = (this.gridEndHour - this.gridStartHour) * 60;
    return (diff / totalRange) * 100;
  }

  checkConflicts() {
    const { start_time, end_time, day_of_week } = this.scheduleForm.getRawValue();
    if (!start_time || !end_time || !day_of_week) { this.overlapError = false; return; }
    const startMin = this.timeToMinutes(start_time);
    const endMin = this.timeToMinutes(end_time);
    if (endMin <= startMin) { this.overlapError = true; return; }
    const merged = this.schedules.map(s => this.pendingChanges[s.id] || s);
    this.overlapError = merged.some(block => {
      if (this.editingBlockId === block.id) return false;
      if (Number(block.day_of_week) !== Number(day_of_week)) return false;
      const bStart = this.timeToMinutes(block.start_time);
      const bEnd = this.timeToMinutes(block.end_time);
      return (startMin < bEnd) && (endMin > bStart);
    });

    this.updateSuggestions();
  }

  get currentFormDay(): number {
    return Number(this.scheduleForm.get('day_of_week')?.value);
  }

  // ALGORITMO INTELIGENTE DE HUECOS LIBRES (Estabilizado)
  suggestions: any[] = [];

  getSlotsByDay(dayId: number): any[] {
    return this.suggestions.filter(s => s.dayId === dayId);
  }

  updateSuggestions() {
    const slots: any[] = [];
    const gridStart = this.gridStartHour * 60;
    const gridEnd = this.gridEndHour * 60;
    const minGapMinutes = 15;

    this.getVisibleDays().forEach(day => {
      const dayBlocks = this.getSchedulesByDay(day.id)
        .filter(b => b.id !== this.editingBlockId)
        .map(b => ({ start: this.timeToMinutes(b.start_time), end: this.timeToMinutes(b.end_time) }))
        .sort((a, b) => a.start - b.start);

      let currentPointer = gridStart;

      dayBlocks.forEach(block => {
        if (block.start - currentPointer >= minGapMinutes) {
          slots.push({ dayId: day.id, start: currentPointer, end: block.start });
        }
        currentPointer = Math.max(currentPointer, block.end);
      });

      if (gridEnd - currentPointer >= minGapMinutes) {
        slots.push({ dayId: day.id, start: currentPointer, end: gridEnd });
      }
    });

    this.suggestions = slots;
  }

  applySuggestion(slot: any) {
    const startStr = this.minutesToTime(slot.start);
    const endStr = this.minutesToTime(slot.end);

    this.scheduleForm.patchValue({
      day_of_week: slot.dayId,
      start_time: startStr,
      end_time: endStr
    });
    
    this.updateSuggestions();
    this.checkConflicts();
    Swal.fire({ icon: 'success', title: 'Espacio optimizado aplicado', text: `Rango sugerido: ${startStr} - ${endStr}`, toast: true, position: 'top-end', timer: 2500, showConfirmButton: false });
  }

  getTopPositionFromMinutes(minutes: number): number {
    const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
    return ((minutes - (this.gridStartHour * 60)) / totalMinutes) * 100;
  }

  getHeightPercentFromMinutes(start: number, end: number): number {
    const totalRange = (this.gridEndHour - this.gridStartHour) * 60;
    return ((end - start) / totalRange) * 100;
  }

  minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private loadAcademicYears() {
    this.academicService.getAcademicYears({ per_page: 200 }).subscribe({
      next: (response) => {
        const items = this.extractItems<any>(response);
        const activeYear = items.find((year) => year.is_active);
        this.activeAcademicYearId = activeYear?.id || '';
      }
    });
  }

  private loadGrades() {
    this.academicService.getGradeLevels({ per_page: 200 }).subscribe({
      next: (response) => this.grades = this.extractItems<GradeLevel>(response)
    });
  }

  private loadTeachers() {
    this.academicService.getTeachers({ per_page: 200 }).subscribe({
      next: (response) => this.teachers = this.extractItems<any>(response)
    });
  }

  onGradeChange() {
    this.sections = []; this.selectedSectionId = ''; if (!this.selectedGradeId) return;
    this.academicService.getSections({ academic_year_id: this.activeAcademicYearId, grade_level_id: this.selectedGradeId, per_page: 200 }).subscribe({
      next: (response) => this.sections = this.extractItems<Section>(response)
    });
  }

  onSectionChange() { if (!this.selectedSectionId) return; this.loadCoursesForSection(); this.loadSchedules(); }
  private loadCoursesForSection() { this.academicService.getCourses({ section_id: this.selectedSectionId, academic_year_id: this.activeAcademicYearId, per_page: 200 }).subscribe({ next: (response) => this.courses = this.extractItems<Course>(response) }); }
  getPendingChangesCount(): number {
    return Object.keys(this.pendingChanges).length;
  }

  removePendingChange(id: string) {
    delete this.pendingChanges[id];
    if (this.getPendingChangesCount() === 0) {
      this.showBatchModal = false;
    }
  }

  saveBatchChanges() {
    let selectedIds = Array.from(this.selectedChangeIds);
    if (selectedIds.length === 0) return;

    // 1. VALIDACIÓN DE DEPENDENCIAS (Verificar si faltan liberadores de espacio)
    for (const id of selectedIds) {
      const nextPos = this.pendingChanges[id];
      // Buscar quién ocupa este sitio actualmente en la base de datos
      const blocker = this.schedules.find(s => s.id !== id && this.checkOverlap(nextPos, s));
      
      if (blocker) {
        // Si el bloqueador tiene un cambio pendiente pero NO ha sido seleccionado
        if (this.pendingChanges[blocker.id] && !this.selectedChangeIds.has(blocker.id)) {
          const targetName = this.getCourseName(nextPos.course_id, nextPos);
          const blockerName = this.getCourseName(blocker.course_id, blocker);
          
          Swal.fire({
            icon: 'info',
            title: 'Acción requerida',
            text: `Para mover "${targetName}", primero debes incluir en el guardado el cambio de "${blockerName}" para que libere el espacio.`,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#4f46e5'
          });
          return;
        }
      }
    }

    // 2. ALGORITMO DE PRIORIDAD DE LIBERACIÓN (Sorting de dependencias)
    selectedIds.sort((idA, idB) => {
      const nextA = this.pendingChanges[idA];
      const nextB = this.pendingChanges[idB];
      const prevA = this.schedules.find(s => s.id === idA);
      const prevB = this.schedules.find(s => s.id === idB);
      if (!prevA || !prevB) return 0;

      // ¿A quiere entrar donde todavía está B? (B debe ir antes)
      const aNeedsBToMove = this.checkOverlap(nextA, prevB);
      // ¿B quiere entrar donde todavía está A? (A debe ir antes)
      const bNeedsAToMove = this.checkOverlap(nextB, prevA);

      if (aNeedsBToMove && !bNeedsAToMove) return 1; // B va primero
      if (bNeedsAToMove && !aNeedsBToMove) return -1; // A va primero
      return 0;
    });

    this.saving = true;
    
    // GUARDADO SECUENCIAL ROBUSTO
    import('rxjs').then(({ from, concatMap, of, catchError, finalize }) => {
      from(selectedIds).pipe(
        concatMap(id => {
          const rawItem = this.pendingChanges[id];
          const payload = {
            course_id: rawItem.course_id,
            teacher_id: rawItem.teacher_id || '',
            day_of_week: Number(rawItem.day_of_week),
            start_time: this.formatTime(rawItem.start_time),
            end_time: this.formatTime(rawItem.end_time),
            room_number: rawItem.room_number || '',
            academic_year_id: this.activeAcademicYearId,
            section_id: this.selectedSectionId
          };

          return this.scheduleService.updateSchedule(id, payload).pipe(
            catchError(err => {
              const serverMsg = err.error?.message || err.error?.error || 'Conflicto de validación';
              return of({ error: true, id, msg: serverMsg });
            })
          );
        }),
        finalize(() => {
          this.saving = false;
          this.loadSchedules();
        })
      ).subscribe({
        next: (res: any) => {
          if (res && !res.error) {
            // El concatMap garantiza orden, así que podemos usar shift() sobre la lista ordenada
            const currentId = selectedIds.shift();
            if (currentId) {
              delete this.pendingChanges[currentId];
              this.selectedChangeIds.delete(currentId);
            }
          } else if (res.error) {
            const courseName = this.getCourseName(this.pendingChanges[res.id]?.course_id);
            Swal.fire({ 
              icon: 'error', 
              title: `Error en ${courseName}`, 
              text: res.msg,
              toast: true, position: 'top-end', timer: 5000 
            });
            selectedIds.shift();
          }
        },
        complete: () => {
          if (this.getPendingChangesCount() === 0) {
            Swal.fire({ icon: 'success', title: '¡Hecho!', text: 'Todos los cambios se sincronizaron en el orden correcto.', toast: true, position: 'top-end', timer: 3000 });
          }
        }
      });
    });
  }

  // Helper para detectar solapamiento entre un bloque nuevo y uno antiguo
  private checkOverlap(blockA: any, blockB: any): boolean {
    if (Number(blockA.day_of_week) !== Number(blockB.day_of_week)) return false;
    const startA = this.timeToMinutes(blockA.start_time);
    const endA = this.timeToMinutes(blockA.end_time);
    const startB = this.timeToMinutes(blockB.start_time);
    const endB = this.timeToMinutes(blockB.end_time);
    return (startA < endB && endA > startB);
  }

  discardAllChanges() {
    Swal.fire({ title: '¿Descartar todo?', text: 'Se perderán todos los movimientos que no hayas guardado.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, descartar', cancelButtonText: 'Mantener' }).then(result => {
      if (result.isConfirmed) {
        this.pendingChanges = {};
        this.selectedChangeIds.clear();
      }
    });
  }

  loadSchedules() { this.loading = true; this.scheduleService.getSchedules({ academic_year_id: this.activeAcademicYearId, section_id: this.selectedSectionId, per_page: 200, sort: 'day_of_week', dir: 'asc' }).subscribe({ next: (response) => { this.schedules = this.extractItems<any>(response); this.assignColors(); this.loading = false; }, error: () => this.loading = false }); }
  private extractItems<T>(response: any): T[] { if (Array.isArray(response)) return response; return response?.data?.data || response?.data || []; }
  assignColors() { this.courseColorMap = {}; const uniqueIds = [...new Set(this.schedules.map(s => s.course_id))]; uniqueIds.forEach((id, idx) => this.courseColorMap[id] = this.colorPalette[idx % this.colorPalette.length]); }
  getSchedulesByDay(dayId: number) {
    const merged = this.schedules.map(s => this.pendingChanges[s.id] || s);
    return merged.filter((s) => Number(s.day_of_week) === dayId).sort((a, b) => this.timeToMinutes(a.start_time) - this.timeToMinutes(b.start_time));
  }
  openModal() { if (this.courses.length === 0) { Swal.fire('Sin cursos', 'La sección no tiene cursos configurados.', 'warning'); return; } this.resetFormToNew(); this.showModal = true; this.updateSuggestions(); }
  closeModal() { this.showModal = false; this.overlapError = false; this.editingBlockId = null; }
  editBlock(block: any) { this.editingBlockId = block.id; this.scheduleForm.patchValue({ course_id: block.course_id, teacher_id: block.teacher_id || '', day_of_week: Number(block.day_of_week), start_time: this.formatTime(block.start_time), end_time: this.formatTime(block.end_time), room_number: block.room_number || '' }); this.showModal = true; this.updateSuggestions(); }
  resetFormToNew() { this.editingBlockId = null; this.scheduleForm.reset({ course_id: '', teacher_id: '', day_of_week: 1, start_time: '08:00', end_time: '09:00', room_number: '' }); }
  saveBlock() {
    if (this.scheduleForm.invalid || this.overlapError) return;
    this.saving = true;
    const payload = { ...this.scheduleForm.getRawValue(), academic_year_id: this.activeAcademicYearId, section_id: this.selectedSectionId };
    const request$ = this.editingBlockId ? this.scheduleService.updateSchedule(this.editingBlockId, payload) : this.scheduleService.createSchedule(payload);
    
    request$.subscribe({
      next: () => {
        this.saving = false;
        if (this.editingBlockId) {
          delete this.pendingChanges[this.editingBlockId];
          this.selectedChangeIds.delete(this.editingBlockId);
        }
        this.closeModal();
        this.loadSchedules();
        Swal.fire({ icon: 'success', title: 'Horario actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || err.error?.error || 'No se pudo guardar el bloque.';
        Swal.fire('Error de Validación', msg, 'error');
      }
    });
  }
  deleteBlock(id: string, event: Event) { event.stopPropagation(); Swal.fire({ title: '¿Eliminar bloque?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' }).then((result) => { if (result.isConfirmed) { this.scheduleService.deleteSchedule(id).subscribe({ next: () => { this.loadSchedules(); Swal.fire('Eliminado', '', 'success'); } }); } }); }
  printSchedule() { window.print(); }
  private timeToMinutes(timeStr: string): number { if (!timeStr) return 0; const [h, m] = timeStr.split(':').map(Number); return h * 60 + (m || 0); }
  formatTime(timeStr: string): string { return timeStr ? timeStr.substring(0, 5) : ''; }
  getCourseColor(courseId: string): string { return this.courseColorMap[courseId] || 'bg-slate-500'; }
  getCourseName(courseId: string | number, block?: any): string { 
    if (block?.course?.name) return block.course.name;
    const idStr = String(courseId);
    return this.courses.find(c => String(c.id) === idStr)?.name || ''; 
  }
  getSelectedGradeName() { const grade = this.grades.find(g => g.id === this.selectedGradeId); return grade ? (grade.name || `${grade.level} ${grade.grade}°`) : ''; }
  getSelectedSectionLetter() { return this.sections.find(s => s.id === this.selectedSectionId)?.section_letter || ''; }
}
