
//src/app/features/admin/settings/teacher-assignments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { TeacherCourseAssignment, Course, Section, GradeLevel } from '@core/services/academic.service';
import { UserService, User } from '@core/services/user.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { AcademicService } from '@core/services/academic.service';
import { AcademicYear } from '@core/models/AcademicYear';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700 relative">
      <app-back-button></app-back-button>

      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Asignación Docente</h1>
          <p class="text-slate-500 text-sm font-medium">Gestiona la carga institucional de los docentes</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            *ngIf="isAdminOrDirector"
            (click)="openLimitPrompt()"
            class="px-5 py-3 bg-white border-2 border-slate-100 hover:border-[#0E3A8A] text-[#0E3A8A] text-sm font-bold rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Límite: {{ maxCoursesPerTeacher }}
          </button>
          <button
            (click)="openModal()"
            class="px-6 py-3 bg-gradient-to-r from-[#0E3A8A] to-[#C026D3] hover:opacity-90 text-white text-sm font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Asignación
          </button>
        </div>
      </div>

      <!-- KPIs compactos -->
      <div class="flex flex-wrap gap-2 mt-2 mb-4">
        <span class="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100">Total docentes: {{ totalTeachers }}</span>
        <span class="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100">Carga total: {{ totalAssignments }}</span>
        <span class="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100">Cerca del límite: {{ nearLimitCount() }}</span>
        <span class="px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100">En el límite: {{ atLimitCount() }}</span>
      </div>

      <!-- Barra de filtros -->
      <div class="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <select [(ngModel)]="filterLevel" (ngModelChange)="applyFilters()" class="text-sm border border-slate-200 rounded-xl px-3 py-2">
          <option value="">Todos los niveles</option>
          <option value="inicial">Inicial</option>
          <option value="primaria">Primaria</option>
          <option value="secundaria">Secundaria</option>
        </select>

        <select [(ngModel)]="filterGradeId" (ngModelChange)="onGradeFilterChange()" class="text-sm border border-slate-200 rounded-xl px-3 py-2">
          <option value="">Todos los grados</option>
          <option *ngFor="let g of filteredGradeOptions" [value]="g.id">{{ g.name }}</option>
        </select>

        <select [(ngModel)]="filterSectionLetter" (ngModelChange)="applyFilters()" class="text-sm border border-slate-200 rounded-xl px-3 py-2">
          <option value="">Todas las secciones</option>
          <option *ngFor="let s of availableSectionLetters" [value]="s">Sección {{ s }}</option>
        </select>

        <select [(ngModel)]="filterOverloadStatus" (ngModelChange)="applyFilters()" class="text-sm border border-slate-200 rounded-xl px-3 py-2">
          <option value="">Todos los docentes</option>
          <option value="near_limit">Cerca del límite</option>
          <option value="at_limit">En el límite</option>
          <option value="has_override">Con límite personalizado</option>
        </select>

        <input [(ngModel)]="filterSearch" (ngModelChange)="applyFilters()" placeholder="Buscar docente..." class="flex-1 min-w-[180px] text-sm border border-slate-200 rounded-xl px-3 py-2">

        <button *ngIf="hasActiveFilters()" (click)="clearFilters()" class="text-xs text-slate-400 hover:text-slate-600 underline">
          Limpiar filtros
        </button>
      </div>

      <!-- Leyenda de secciones visibles -->
      <div *ngIf="getVisibleSectionsLegend().length > 0" class="flex flex-wrap gap-2 mb-4">
        <span *ngFor="let sec of getVisibleSectionsLegend()"
              class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full"
              [ngClass]="[getSectionColor(sec.id).bg, getSectionColor(sec.id).text]">
          <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getSectionColor(sec.id).dot"></span>
          {{ sec.grade_name }} - {{ sec.section_name }}
        </span>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <!-- Teacher Cards -->
      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div *ngFor="let teacherGroup of filteredTeacherGroups" class="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">

          <div class="absolute -right-10 -top-10 w-32 h-32 bg-slate-50 rounded-full blur-3xl group-hover:bg-blue-50 transition-colors pointer-events-none"></div>

          <!-- Card Header: Teacher Profile -->
          <div class="flex items-start justify-between relative z-10">
            <div class="flex items-center gap-5">
              <div class="w-20 h-20 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                <span class="text-3xl font-bold text-white">{{ teacherGroup.teacher.name.charAt(0) }}</span>
              </div>
              <div class="overflow-hidden">
                <h3 class="text-2xl font-bold text-[#0F172A] tracking-tighter uppercase leading-none truncate" [title]="teacherGroup.teacher.name + ' ' + teacherGroup.teacher.last_name">
                  {{ teacherGroup.teacher.name }}
                </h3>
                <p class="text-sm font-bold text-slate-500 uppercase truncate" [title]="teacherGroup.teacher.last_name">{{ teacherGroup.teacher.last_name }}</p>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                   <span class="px-3 py-1 bg-blue-50 text-[#0E3A8A] rounded-full text-[9px] font-bold uppercase tracking-widest border border-blue-100 shadow-sm">{{ distinctCourseCount(teacherGroup) }} cursos asignados</span>
                   <span *ngIf="teacherGroup.assignments.length !== distinctCourseCount(teacherGroup)" class="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-bold uppercase tracking-widest border border-slate-100">{{ teacherGroup.assignments.length }} secciones</span>
                   <span class="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[9px] font-bold uppercase tracking-widest border border-purple-100">Límite: {{ effectiveLimit(teacherGroup.teacher) }}<span *ngIf="teacherGroup.teacher.max_courses_override != null"> (personalizado)</span></span>
                </div>
              </div>
            </div>
            <button
              *ngIf="isAdminOrDirector"
              (click)="openTeacherLimitModal(teacherGroup.teacher)"
              title="Configurar límite de cursos de este docente"
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#0E3A8A] transition-colors shrink-0 relative z-10">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>

          <!-- Card Body: Assignments -->
          <div class="mt-8 space-y-4 relative z-10 w-full">
            <div *ngFor="let item of teacherGroup.assignments"
                 class="p-4 rounded-2xl border group/item hover:shadow-md transition-all flex items-center justify-between w-full"
                 [ngClass]="[getSectionColor(item.section?.id).bg, getSectionColor(item.section?.id).border, isAssignmentDimmed(item) ? 'opacity-40' : '']">
               <div class="flex items-center gap-3 overflow-hidden w-full">
                  <span class="w-2 h-2 rounded-full shrink-0" [ngClass]="getSectionColor(item.section?.id).dot"></span>
                  <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-[#0E3A8A] font-bold text-[10px] shadow-sm group-hover/item:border-[#0E3A8A] shrink-0">
                    {{ item.course?.code || 'CRS' }}
                  </div>
                  <div class="overflow-hidden flex-1">
                    <h4 class="text-sm font-bold tracking-tighter uppercase leading-tight truncate" [ngClass]="getSectionColor(item.section?.id).text" [title]="item.course?.name">{{ item.course?.name }}</h4>
                    <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                      {{ getSectionDisplayName(item.section) }}
                    </p>
                  </div>
               </div>
               <button (click)="deleteAssignment(item.id)" class="p-2 ml-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>

            <div class="pt-6 border-t border-slate-50">
               <button (click)="openModal(teacherGroup.teacher.id)" class="w-full py-4 bg-white text-[#0E3A8A] border-2 border-slate-100 hover:border-[#0E3A8A] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Agregar curso a este docente
               </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Creation -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-slide-up overflow-hidden border border-slate-100">
          <div class="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E3A8A] to-[#C026D3] flex items-center justify-center shadow-md">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-800 tracking-tight leading-tight">Asignar Curso</h2>
                <p class="text-xs text-slate-400 font-medium">Asigna una carga académica al docente</p>
              </div>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="assignForm" (ngSubmit)="saveAssignment()" class="p-8 space-y-5">

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Docente</label>
              <select formControlName="teacher_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona Docente...</option>
                <option *ngFor="let t of teachers" [value]="t.id">{{ t.name }} {{ t.last_name }}</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Año Académico</label>
              <select formControlName="academic_year_id" (change)="onAssignYearChange()" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona Año...</option>
                <option *ngFor="let ay of academicYears" [value]="ay.id">{{ ay.year }}</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <div class="flex items-center gap-1.5">
                <span *ngIf="selectedLevel" class="text-emerald-500 text-xs">✓</span>
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">1. Nivel</label>
              </div>
              <select [(ngModel)]="selectedLevel" [ngModelOptions]="{standalone: true}" (ngModelChange)="onLevelChange()" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <option value="">Selecciona un nivel...</option>
                <option value="inicial">Inicial</option>
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <div class="flex items-center gap-1.5">
                <span *ngIf="selectedGradeId" class="text-emerald-500 text-xs">✓</span>
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">2. Grado</label>
              </div>
              <select [(ngModel)]="selectedGradeId" [ngModelOptions]="{standalone: true}" (ngModelChange)="onGradeChange()" [disabled]="!selectedLevel" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400">
                <option value="">Selecciona un grado...</option>
                <option *ngFor="let g of availableGrades" [value]="g.id">{{ g.name }}</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <div class="flex items-center gap-1.5">
                <span *ngIf="assignForm.value.section_id" class="text-emerald-500 text-xs">✓</span>
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">3. Sección</label>
              </div>
              <select formControlName="section_id" (change)="checkExistingTeacher()" [disabled]="!selectedGradeId" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400">
                <option value="">Selecciona una sección...</option>
                <option *ngFor="let s of availableSections" [value]="s.id">Sección {{ s.section_letter }} ({{ s.students_count ?? 0 }} alumnos)</option>
              </select>
            </div>

            <div class="space-y-1.5 focus-within:text-blue-600">
              <div class="flex items-center gap-1.5">
                <span *ngIf="assignForm.value.course_id" class="text-emerald-500 text-xs">✓</span>
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400">4. Curso</label>
              </div>
              <select formControlName="course_id" (change)="checkExistingTeacher()" [disabled]="!selectedGradeId" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400">
                <option value="">Selecciona un curso...</option>
                <option *ngFor="let c of availableCourses" [value]="c.id">{{ c.code }} - {{ c.name }}</option>
              </select>
            </div>

            <div *ngIf="existingTeacher" class="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700">
              ⚠️ Ya asignado a: {{ existingTeacher.teacher_name }} desde {{ existingTeacher.assigned_at | date }}
            </div>

            <div class="pt-6 flex gap-3">
              <button type="button" (click)="closeModal()" class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95">
                Cancelar
              </button>
              <button type="submit" [disabled]="assignForm.invalid || isSubmitting" class="flex-[1.5] px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Asignar Curso
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Límite de cursos por docente (wizard 2 pasos) -->
      <div *ngIf="showLimitModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeLimitModal()"></div>
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-slide-up overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col">
          <div class="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div>
              <h2 class="text-xl font-bold text-slate-800 tracking-tight leading-tight">Límite de cursos</h2>
              <p class="text-xs text-slate-400 font-medium">{{ limitModalTeacher?.name }} {{ limitModalTeacher?.last_name }}</p>
            </div>
            <button (click)="closeLimitModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="p-8 space-y-5 overflow-y-auto">
            <!-- PASO 1: elegir el limite -->
            <ng-container *ngIf="limitModalStep === 1">
              <div class="space-y-3">
                <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" [(ngModel)]="limitUseGlobal" [ngModelOptions]="{standalone: true}">
                  Usar límite global ({{ maxCoursesPerTeacher }})
                </label>
                <input *ngIf="!limitUseGlobal" type="number" min="1" [(ngModel)]="limitCustomValue" [ngModelOptions]="{standalone: true}"
                       placeholder="Límite personalizado"
                       class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500">
                <p *ngIf="limitStep1Error" class="text-xs text-red-600 font-semibold">{{ limitStep1Error }}</p>
              </div>

              <div class="pt-4 flex gap-3">
                <button type="button" (click)="closeLimitModal()" class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95">
                  Cancelar
                </button>
                <button type="button" [disabled]="limitSubmitting" (click)="submitLimitStep1()" class="flex-[1.5] px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  <span *ngIf="limitSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Guardar
                </button>
              </div>
            </ng-container>

            <!-- PASO 2: ajustar cursos antes de bajar el limite -->
            <ng-container *ngIf="limitModalStep === 2">
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p class="font-bold text-amber-800 text-sm">
                  ⚠️ {{ limitModalTeacher?.name }} tiene {{ limitCurrentCount }} cursos, pero el nuevo límite es {{ limitRequestedLimit }}.
                </p>
                <p class="text-xs text-amber-700 mt-1">
                  Elige qué hacer con {{ limitCurrentCount - limitRequestedLimit }} curso(s) antes de continuar.
                </p>
              </div>

              <div *ngFor="let course of coursesToReview" class="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p class="font-bold text-sm text-slate-800">{{ course.course_name }}</p>
                  <p class="text-xs text-slate-500">{{ course.sections.length }} sección(es): {{ sectionNames(course) }}</p>
                </div>

                <select [(ngModel)]="course.action" [ngModelOptions]="{standalone: true}" class="text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                  <option value="keep">Mantener</option>
                  <option value="remove">Quitar (sin reasignar)</option>
                  <option value="reassign">Reasignar a otro docente</option>
                </select>

                <select *ngIf="course.action === 'reassign'" [(ngModel)]="course.newTeacherId" [ngModelOptions]="{standalone: true}" class="text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                  <option value="">Seleccionar docente...</option>
                  <option *ngFor="let t of availableTeachersFor(limitModalTeacher)" [value]="t.id">{{ t.name }} {{ t.last_name }}</option>
                </select>
              </div>

              <div class="text-xs font-bold"
                   [class.text-emerald-600]="remainingAfterChanges() <= limitRequestedLimit"
                   [class.text-red-600]="remainingAfterChanges() > limitRequestedLimit">
                Quedarían {{ remainingAfterChanges() }} cursos de {{ limitRequestedLimit }} permitidos
              </div>

              <div class="pt-2 flex gap-3">
                <button type="button" (click)="closeLimitModal()" class="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95">
                  Cancelar
                </button>
                <button type="button"
                        [disabled]="remainingAfterChanges() > limitRequestedLimit || hasUnresolvedReassignments() || limitSubmitting"
                        (click)="confirmLimitChange()"
                        class="flex-[1.5] px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <span *ngIf="limitSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Confirmar cambios
                </button>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TeacherAssignmentsComponent implements OnInit {
  teachers: User[] = [];
  courses: Course[] = [];
  sections: Section[] = [];
  academicYears: AcademicYear[] = [];
  assignments: TeacherCourseAssignment[] = [];
  gradeLevels: GradeLevel[] = [];
  gradeLevelsMap: { [id: string]: string } = {};
  academicYearsMap: { [id: string]: number } = {};
  gradeLevelById: { [id: string]: GradeLevel } = {};

  teacherGroups: { teacher: User, assignments: any[] }[] = [];
  filteredTeacherGroups: any[] = [];

  loading = false;
  showModal = false;
  isSubmitting = false;
  assignForm: FormGroup;

  maxCoursesPerTeacher = 6;
  existingTeacher: { teacher_id: string; teacher_name: string; assigned_at: string } | null = null;
  isAdminOrDirector = false;

  // Selector en cascada Nivel -> Grado -> Sección/Curso del modal "Nueva Asignación"
  selectedLevel = '';
  selectedGradeId = '';
  availableGrades: GradeLevel[] = [];
  availableSections: Section[] = [];
  availableCourses: Course[] = [];

  // Filtros del listado de docentes
  filterLevel = '';
  filterGradeId = '';
  filterSectionLetter = '';
  filterOverloadStatus = '';
  filterSearch = '';
  filteredGradeOptions: GradeLevel[] = [];
  availableSectionLetters: string[] = [];

  private readonly SECTION_COLORS = [
    { bg: 'bg-cermat-blue-50', border: 'border-cermat-blue-300', text: 'text-cermat-blue-700', dot: 'bg-cermat-blue-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', dot: 'bg-violet-500' },
    { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', dot: 'bg-teal-500' },
  ];

  // Wizard de límite de cursos por docente
  showLimitModal = false;
  limitModalStep: 1 | 2 = 1;
  limitModalTeacher: any = null;
  limitUseGlobal = true;
  limitCustomValue: number | null = null;
  limitStep1Error = '';
  limitSubmitting = false;
  limitCurrentCount = 0;
  limitRequestedLimit = 0;
  coursesToReview: Array<{
    course_id: string;
    course_name: string;
    course_code: string;
    assignment_ids: string[];
    sections: { assignment_id: string; section_name: string; grade_name: string }[];
    action: 'keep' | 'remove' | 'reassign';
    newTeacherId: string;
  }> = [];

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private userService: UserService,
    private authService: AuthService
  ) {
    // Note: backend expects `teacher_id` for teacher assignments (not `user_id`)
    this.assignForm = this.fb.group({
      teacher_id: ['', Validators.required],
      academic_year_id: ['', Validators.required],
      course_id: ['', Validators.required],
      section_id: ['', Validators.required]
    });
  }

  get totalTeachers() { return this.teachers.length; }
  get totalAssignments() { return this.assignments.length; }

  ngOnInit() {
    this.isAdminOrDirector = ['admin', 'director'].includes(this.authService.getRole() || '');
    this.loadInitialData();
    if (this.isAdminOrDirector) {
      this.loadMaxCoursesPerTeacher();
    }
  }

  loadMaxCoursesPerTeacher() {
    this.academicService.getMaxCoursesPerTeacher().subscribe({
      next: (res: any) => { this.maxCoursesPerTeacher = res?.value ?? 6; },
      error: () => { /* deja el valor por defecto (6) si el usuario no tiene rol admin/director */ }
    });
  }

  loadInitialData() {
    this.loading = true;
    console.log('Iniciando carga de datos...');
    const startTime = performance.now();

    forkJoin({
      teachers: this.academicService.getTeachers({ per_page: 200, simple: true }),
      courses: this.academicService.getCourses({ per_page: 200, simple: true }),
      sections: this.academicService.getSections({ per_page: 200, simple: true }),
      academicYears: this.academicService.getAcademicYears({ per_page: 50, simple: true }),
      assignments: this.academicService.getTeacherCourseAssignments({ per_page: 200, simple: true }),
      grades: this.academicService.getGradeLevels({ per_page: 200, simple: true })
    }).subscribe({
      next: (res: any) => {
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`Carga de datos completada en ${elapsed}ms`);
        console.log('Datos cargados:', res);

        const teacherData: any[] = res.teachers?.data || res.teachers || [];
        // Normalize teacher shape so template (name/last_name) works
        this.teachers = Array.isArray(teacherData)
          ? teacherData.map(t => ({ ...t, name: t.first_name || t.name, last_name: t.last_name || '' }))
          : [];

        this.courses = res.courses.data || res.courses;
        this.sections = res.sections.data || res.sections;
        this.academicYears = res.academicYears.data || res.academicYears;
        this.academicYearsMap = {};
        this.academicYears.forEach((ay: any) => { this.academicYearsMap[ay.id] = ay.year; });
        this.assignments = res.assignments.data || res.assignments;

        console.log('Docentes:', this.teachers.length, this.teachers);
        console.log('Cursos:', this.courses.length, this.courses);
        console.log('Secciones:', this.sections.length, this.sections);
        console.log('Años académicos:', this.academicYears.length, this.academicYears);
        console.log('Asignaciones:', this.assignments.length, this.assignments);

        const grades = res.grades.data || res.grades;
        this.gradeLevels = grades;
        this.gradeLevelById = {};
        grades.forEach((g: any) => {
          this.gradeLevelsMap[g.id] = g.name;
          this.gradeLevelById[g.id] = g;
        });

        console.log('Niveles de grado:', grades.length, grades);

        this.processGroups();
        this.loading = false;
      },
      error: (err) => {
        console.log('Error al cargar datos:', err);
        this.loading = false;
      }
    });
  }
  distinctCourseCount(teacherGroup: { assignments: any[] }): number {
    const courseIds = new Set(teacherGroup.assignments.map(a => a.course?.id).filter(Boolean));
    return courseIds.size;
  }

  effectiveLimit(teacher: any): number {
    return teacher?.max_courses_override ?? this.maxCoursesPerTeacher;
  }

  openTeacherLimitModal(teacher: any) {
    this.limitModalTeacher = teacher;
    this.limitModalStep = 1;
    this.limitUseGlobal = teacher.max_courses_override == null;
    this.limitCustomValue = teacher.max_courses_override ?? null;
    this.limitStep1Error = '';
    this.coursesToReview = [];
    this.showLimitModal = true;
  }

  closeLimitModal() {
    this.showLimitModal = false;
    this.limitModalTeacher = null;
    this.limitModalStep = 1;
    this.coursesToReview = [];
    this.limitSubmitting = false;
  }

  submitLimitStep1() {
    this.limitStep1Error = '';

    if (!this.limitUseGlobal && (!this.limitCustomValue || this.limitCustomValue < 1)) {
      this.limitStep1Error = 'Ingresa un límite válido (mayor a 0)';
      return;
    }

    const value = this.limitUseGlobal ? null : Number(this.limitCustomValue);
    this.updateTeacherCourseOverride(this.limitModalTeacher.id, value);
  }

  sectionNames(course: { sections: { section_name: string }[] }): string {
    return course.sections.map(s => s.section_name).join(', ');
  }

  availableTeachersFor(teacher: any): any[] {
    return this.teachers.filter(t => t.id !== teacher?.id);
  }

  remainingAfterChanges(): number {
    return this.coursesToReview.filter(c => c.action === 'keep').length;
  }

  hasUnresolvedReassignments(): boolean {
    return this.coursesToReview.some(c => c.action === 'reassign' && !c.newTeacherId);
  }

  confirmLimitChange() {
    if (this.remainingAfterChanges() > this.limitRequestedLimit || this.hasUnresolvedReassignments()) return;

    const removeCourseIds = this.coursesToReview
      .filter(c => c.action === 'remove')
      .map(c => c.course_id);

    const reassignments = this.coursesToReview
      .filter(c => c.action === 'reassign')
      .flatMap(c => c.assignment_ids.map(assignmentId => ({ assignment_id: assignmentId, new_teacher_id: c.newTeacherId })));

    const value = this.limitUseGlobal ? null : Number(this.limitCustomValue);

    this.limitSubmitting = true;
    this.academicService.confirmTeacherMaxCoursesOverride(this.limitModalTeacher.id, {
      max_courses_override: value,
      remove_course_ids: removeCourseIds,
      reassignments
    }).subscribe({
      next: () => {
        this.limitSubmitting = false;
        this.closeLimitModal();
        Swal.fire({
          icon: 'success', title: 'Cursos ajustados y límite actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });
        this.loadInitialData();
      },
      error: (err) => {
        this.limitSubmitting = false;

        if (err.status === 409 && err.error?.error_code === 'EXCEEDS_NEW_LIMIT') {
          // Los cursos cambiaron mientras el admin decidia; recargar el paso 2 con datos frescos.
          this.limitCurrentCount = err.error.current_count;
          this.limitRequestedLimit = err.error.requested_limit;
          this.coursesToReview = (err.error.courses_to_review || []).map((c: any) => ({ ...c, action: 'keep', newTeacherId: '' }));
          Swal.fire('Los cursos cambiaron', 'Revisa la lista actualizada antes de confirmar.', 'warning');
          return;
        }

        if (err.error?.error_code === 'TEACHER_COURSE_LIMIT') {
          Swal.fire('No se pudo reasignar', 'El docente destino ya alcanzó su propio límite de cursos.', 'warning');
          return;
        }

        Swal.fire('Error', err.error?.message || 'No se pudieron aplicar los cambios', 'error');
      }
    });
  }

  private updateTeacherCourseOverride(teacherId: string, value: number | null) {
    this.limitSubmitting = true;
    this.academicService.updateTeacherMaxCoursesOverride(teacherId, value).subscribe({
      next: () => {
        this.limitSubmitting = false;
        this.closeLimitModal();
        Swal.fire({
          icon: 'success', title: 'Límite del docente actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });
        this.loadInitialData();
      },
      error: (err) => {
        this.limitSubmitting = false;

        if (err.status === 409 && err.error?.error_code === 'EXCEEDS_NEW_LIMIT') {
          if (!this.limitModalTeacher || this.limitModalTeacher.id !== teacherId) {
            this.limitModalTeacher = this.teachers.find((t: any) => t.id === teacherId) || null;
          }
          this.limitCurrentCount = err.error.current_count;
          this.limitRequestedLimit = err.error.requested_limit;
          this.limitUseGlobal = value === null;
          this.limitCustomValue = value;
          this.coursesToReview = (err.error.courses_to_review || []).map((c: any) => ({ ...c, action: 'keep', newTeacherId: '' }));
          this.limitModalStep = 2;
          this.showLimitModal = true;
          return;
        }

        Swal.fire('Error', err.error?.message || 'No se pudo actualizar el límite del docente', 'error');
      }
    });
  }

  getSectionDisplayName(sec: any): string {
    if (!sec) return 'Sección desconocida';
    const gradeName = this.gradeLevelsMap[sec.grade_level_id] || 'Grado';
    const letter = sec.section_letter || sec.letter || '';
    const year = this.academicYearsMap[sec.academic_year_id];
    return year ? `${gradeName} - Sección ${letter} (${year})` : `${gradeName} - Sección ${letter}`;
  }

  // Solo muestra las secciones del año académico elegido en el formulario,
  // para no mezclar secciones de distintos años bajo el mismo nombre/letra.
  onAssignYearChange() {
    // El filtro por año ya existente sigue mandando: si cambia el año,
    // la sección deja de ser valida para ese año y se resetea junto al curso.
    this.assignForm.patchValue({ section_id: '', course_id: '' });

    if (this.selectedGradeId) {
      this.recalculateAvailableSections();
    } else {
      this.availableSections = [];
    }

    this.checkExistingTeacher();
  }

  onLevelChange() {
    this.selectedGradeId = '';
    this.assignForm.patchValue({ section_id: '', course_id: '' });
    this.availableGrades = this.gradeLevels.filter(g => g.level === this.selectedLevel);
    this.availableSections = [];
    this.availableCourses = [];
    this.existingTeacher = null;
  }

  onGradeChange() {
    this.assignForm.patchValue({ section_id: '', course_id: '' });
    this.existingTeacher = null;

    this.recalculateAvailableSections();
    this.availableCourses = this.courses.filter(c => c.grade_level_id === this.selectedGradeId);
  }

  private recalculateAvailableSections() {
    const yearId = this.assignForm.value.academic_year_id;
    this.availableSections = this.sections.filter(s =>
      s.grade_level_id === this.selectedGradeId &&
      (!yearId || s.academic_year_id === yearId)
    );
  }

  processGroups() {
    // Ensure we use the right teacher key (backend uses teacher_id)
    const sample = this.assignments?.[0];
    if (sample) {
      console.log('Sample assignment record:', sample);
    }

    this.teacherGroups = this.teachers.map(teacher => {
      // Find all assignments for this teacher
      const teacherAssignments = this.assignments
        .filter(a => (a as any).teacher_id === teacher.id || (a as any).user_id === teacher.id)
        .map((a: any) => {
          const course = this.courses.find(c => c.id === a.course_id);
          const section = this.sections.find(s => s.id === a.section_id);
          const academicYear = this.academicYears.find(ay => ay.id === a.academic_year_id);

          return {
            id: a.id,
            course,
            section,
            academicYear
          };
        });

      return { teacher, assignments: teacherAssignments };
    });

    console.log('Teacher groups processed:', this.teacherGroups);

    this.applyFilters();
  }

  // ---- Filtros ----

  applyFilters() {
    this.recomputeGradeOptions();
    this.recomputeAvailableSectionLetters();

    let list = [...this.teacherGroups];

    if (this.filterSearch) {
      const term = this.filterSearch.toLowerCase();
      list = list.filter(g =>
        g.teacher.name?.toLowerCase().includes(term) || (g.teacher as any).last_name?.toLowerCase().includes(term)
      );
    }

    if (this.filterOverloadStatus) {
      list = list.filter(g => {
        const limit = this.effectiveLimit(g.teacher);
        const count = this.distinctCourseCount(g);
        if (this.filterOverloadStatus === 'near_limit') return count >= limit - 1;
        if (this.filterOverloadStatus === 'at_limit') return count === limit;
        if (this.filterOverloadStatus === 'has_override') return (g.teacher as any).max_courses_override != null;
        return true;
      });
    }

    this.filteredTeacherGroups = list;
  }

  onGradeFilterChange() {
    this.filterSectionLetter = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterLevel || this.filterGradeId || this.filterSectionLetter || this.filterOverloadStatus || this.filterSearch);
  }

  clearFilters() {
    this.filterLevel = '';
    this.filterGradeId = '';
    this.filterSectionLetter = '';
    this.filterOverloadStatus = '';
    this.filterSearch = '';
    this.applyFilters();
  }

  private recomputeGradeOptions() {
    this.filteredGradeOptions = this.filterLevel
      ? this.gradeLevels.filter(g => g.level === this.filterLevel)
      : this.gradeLevels;

    if (this.filterGradeId && !this.filteredGradeOptions.some(g => g.id === this.filterGradeId)) {
      this.filterGradeId = '';
    }
  }

  private recomputeAvailableSectionLetters() {
    let scoped = this.sections;
    if (this.filterGradeId) {
      scoped = scoped.filter(s => s.grade_level_id === this.filterGradeId);
    } else if (this.filterLevel) {
      scoped = scoped.filter(s => this.gradeLevelById[s.grade_level_id]?.level === this.filterLevel);
    }

    const letters = new Set(scoped.map(s => s.section_letter).filter((l): l is string => !!l));
    this.availableSectionLetters = Array.from(letters).sort();

    if (this.filterSectionLetter && !this.availableSectionLetters.includes(this.filterSectionLetter)) {
      this.filterSectionLetter = '';
    }
  }

  // Solo se aplica dimming cuando algun filtro de nivel/grado/seccion esta activo;
  // los filtros de busqueda/estado de limite ya ocultan la card completa.
  isAssignmentDimmed(item: any): boolean {
    if (!this.filterLevel && !this.filterGradeId && !this.filterSectionLetter) return false;
    return !this.assignmentMatchesFilters(item);
  }

  private assignmentMatchesFilters(item: any): boolean {
    const gradeId = item.section?.grade_level_id;

    if (this.filterLevel && this.gradeLevelById[gradeId]?.level !== this.filterLevel) return false;
    if (this.filterGradeId && gradeId !== this.filterGradeId) return false;
    if (this.filterSectionLetter && item.section?.section_letter !== this.filterSectionLetter) return false;

    return true;
  }

  nearLimitCount(): number {
    return this.teacherGroups.filter(g => this.distinctCourseCount(g) >= this.effectiveLimit(g.teacher) - 1).length;
  }

  atLimitCount(): number {
    return this.teacherGroups.filter(g => this.distinctCourseCount(g) === this.effectiveLimit(g.teacher)).length;
  }

  // ---- Colores por sección ----

  getSectionColor(sectionId?: string) {
    const id = sectionId || '';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.SECTION_COLORS.length;
    return this.SECTION_COLORS[index];
  }

  getVisibleSectionsLegend(): { id: string; grade_name: string; section_name: string }[] {
    const seen = new Map<string, { id: string; grade_name: string; section_name: string }>();

    for (const group of this.filteredTeacherGroups) {
      for (const item of group.assignments) {
        const sec = item.section;
        if (!sec?.id || seen.has(sec.id)) continue;

        seen.set(sec.id, {
          id: sec.id,
          grade_name: this.gradeLevelsMap[sec.grade_level_id] || 'Grado',
          section_name: sec.section_letter || sec.letter || ''
        });
      }
    }

    return Array.from(seen.values()).sort((a, b) => (a.grade_name + a.section_name).localeCompare(b.grade_name + b.section_name));
  }

  openModal(preselectedTeacherId?: string) {
    this.assignForm.reset({
      teacher_id: preselectedTeacherId || '',
      academic_year_id: this.academicYears.length > 0 ? this.academicYears[0].id : '',
      course_id: '',
      section_id: ''
    });
    this.existingTeacher = null;
    this.selectedLevel = '';
    this.selectedGradeId = '';
    this.availableGrades = [];
    this.availableSections = [];
    this.availableCourses = [];
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  checkExistingTeacher() {
    const { course_id, section_id, academic_year_id } = this.assignForm.value;
    this.existingTeacher = null;
    if (!course_id || !section_id || !academic_year_id) return;

    this.academicService.getAssignedTeachersByCourseSection({ course_id, section_id, academic_year_id }).subscribe({
      next: (res: any) => {
        const assigned = res?.assigned_teachers || [];
        this.existingTeacher = assigned.length > 0 ? assigned[0] : null;
      },
      error: () => { this.existingTeacher = null; }
    });
  }

  saveAssignment() {
    if (this.assignForm.invalid) return;
    this.isSubmitting = true;

    const payload = {
      ...this.assignForm.value,
      // Backend expects teacher_id, not user_id
      teacher_id: (this.assignForm.value as any).teacher_id || (this.assignForm.value as any).user_id
    };

    this.academicService.checkScheduleConflict(payload).subscribe({
      next: (res: any) => {
        if (res?.has_conflict) {
          this.isSubmitting = false;
          this.handleScheduleConflict(res, payload);
        } else {
          this.proceedCreate(payload);
        }
      },
      error: (err) => {
        // La verificación de cruce es un apoyo preventivo; si falla (ej. red),
        // no bloquea la creación de la asignación.
        console.warn('No se pudo verificar cruce de horario, continuando:', err);
        this.proceedCreate(payload);
      }
    });
  }

  private handleScheduleConflict(conflictRes: any, payload: any) {
    const conflict = conflictRes.conflicting_with?.[0];
    const suggestions: any[] = conflictRes.suggestions || [];

    Swal.fire({
      icon: 'warning',
      title: '⏰ Cruce de horario detectado',
      html: `El docente ya tiene clase en ese horario:
        <br><b>${conflict?.course_name || ''}</b>
        (${conflict?.day || ''} ${conflict?.time || ''})<br><br>
        ${suggestions.length > 0
          ? 'Secciones alternativas disponibles:'
          : 'No hay secciones alternativas libres para este docente en este curso.'}`,
      showCancelButton: suggestions.length > 0,
      confirmButtonText: suggestions.length > 0 ? 'Ver alternativas' : 'Entendido',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && suggestions.length > 0) {
        this.openSuggestionsModal(suggestions, payload);
      }
    });
  }

  private openSuggestionsModal(suggestions: any[], payload: any) {
    Swal.fire({
      title: 'Secciones alternativas',
      input: 'select',
      inputOptions: suggestions.reduce((acc: any, s: any) => {
        acc[s.section_id] = `${s.section_name} · ${s.day} ${s.time}`;
        return acc;
      }, {}),
      inputPlaceholder: 'Selecciona una sección disponible',
      showCancelButton: true,
      confirmButtonText: 'Asignar en esta sección',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.proceedCreate({ ...payload, section_id: result.value });
      }
    });
  }

  private proceedCreate(payload: any) {
    this.isSubmitting = true;
    console.log('Enviando asignación al backend:', payload);

    this.academicService.createTeacherCourseAssignment(payload).subscribe({
      next: (res) => {
        console.log('Respuesta creación asignación:', res);
        this.isSubmitting = false;
        this.closeModal();
        Swal.fire({
          icon: 'success', title: 'Asignación creada', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });

        // Reload all data to ensure references are fresh
        this.loadInitialData();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al crear asignación:', err);

        if (err.error?.error_code === 'TEACHER_COURSE_LIMIT') {
          this.handleTeacherCourseLimitError(err.error, payload);
          return;
        }

        Swal.fire('Error', err.error?.message || 'Error al asignar curso', 'error');
      }
    });
  }

  private handleTeacherCourseLimitError(error: { current: number; max: number }, payload: any) {
    Swal.fire({
      icon: 'info',
      title: '📚 Demasiados cursos asignados',
      html: `Este docente ya tiene <b>${error.current}</b>
        cursos asignados (máximo actual: <b>${error.max}</b>).<br><br>
        ${this.isAdminOrDirector ? '¿Deseas aumentar el límite de cursos permitidos?' : 'Contacta a un administrador o director para ajustar el límite.'}`,
      showCancelButton: this.isAdminOrDirector,
      confirmButtonText: this.isAdminOrDirector ? 'Aumentar límite' : 'Entendido',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.isAdminOrDirector) {
        this.promptLimitScopeChoice(error.max, payload.teacher_id);
      }
    });
  }

  private promptLimitScopeChoice(currentMax: number, teacherId: string) {
    const teacher = this.teachers.find(t => t.id === teacherId) as any;
    const teacherName = teacher ? `${teacher.name} ${teacher.last_name}` : 'este docente';

    Swal.fire({
      icon: 'question',
      title: '¿Para quién aumentar el límite?',
      html: `Puedes subir el límite solo para <b>${teacherName}</b>,
        o cambiar el límite global (afecta a todos los docentes sin límite personalizado).`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Solo este docente',
      denyButtonText: 'Todos los docentes',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.promptIncreaseLimit(currentMax, teacherId);
      } else if (result.isDenied) {
        this.promptIncreaseLimit(currentMax, null);
      }
    });
  }

  private promptIncreaseLimit(currentMax: number, teacherId: string | null) {
    Swal.fire({
      title: teacherId ? 'Nuevo límite para este docente' : 'Nuevo límite global de cursos por docente',
      input: 'number',
      inputValue: currentMax + 1,
      inputAttributes: { min: '1', step: '1' },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || Number(value) < 1) {
          return 'El límite debe ser mayor a 0';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        if (teacherId) {
          this.updateTeacherCourseOverride(teacherId, Number(result.value));
        } else {
          this.updateMaxCoursesPerTeacher(Number(result.value));
        }
      }
    });
  }

  openLimitPrompt() {
    this.promptIncreaseLimit(this.maxCoursesPerTeacher, null);
  }

  private updateMaxCoursesPerTeacher(value: number) {
    this.academicService.updateMaxCoursesPerTeacher(value).subscribe({
      next: (res: any) => {
        this.maxCoursesPerTeacher = res?.value ?? value;
        Swal.fire({
          icon: 'success', title: 'Límite actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo actualizar el límite', 'error');
      }
    });
  }

  deleteAssignment(id: string) {
    Swal.fire({
      title: '¿Quitar asignación?',
      text: "El docente dejará de dictar este curso en la sección.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.academicService.deleteTeacherCourseAssignment(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Removida', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
            this.loadInitialData();
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo remover', 'error')
        });
      }
    });
  }
}
