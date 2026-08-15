
//src/app/features/admin/settings/teacher-assignments.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
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
        <span class="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100">Total docentes: {{ totalTeachersCache }}</span>
        <span class="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100">Carga total: {{ totalAssignmentsCache }}</span>
        <span class="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100">Cerca del límite: {{ nearLimitCountCache }}</span>
        <span class="px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100">En el límite: {{ atLimitCountCache }}</span>
      </div>

      <!-- Barra de filtros: 4 dropdowns multi-select (nivel/grado/seccion/docente,
           AND entre categorias, OR dentro de la misma categoria) + estado de carga
           (single-select) + busqueda libre. -->
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 leading-relaxed">
          <!-- Nivel -->
          <div class="relative" data-filter-dropdown>
            <button type="button" (click)="toggleDropdown('level')"
                    class="flex items-center gap-2 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-slate-300 transition-colors">
              <svg class="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              Nivel
              <span *ngIf="selectedLevels.length > 0" class="bg-cermat-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ selectedLevels.length }}</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform" [class.rotate-180]="openDropdown === 'level'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div *ngIf="openDropdown === 'level'" class="absolute z-20 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 min-w-[180px]">
              <label *ngFor="let lvl of levels" class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                <input type="checkbox" [checked]="selectedLevels.includes(lvl.value)" (change)="toggleLevelSelection(lvl.value)">
                {{ lvl.label }}
              </label>
            </div>
          </div>

          <!-- Grado -->
          <div class="relative" data-filter-dropdown>
            <button type="button" (click)="toggleDropdown('grade')"
                    class="flex items-center gap-2 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-slate-300 transition-colors">
              <svg class="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Grado
              <span *ngIf="selectedGradeIds.length > 0" class="bg-cermat-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ selectedGradeIds.length }}</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform" [class.rotate-180]="openDropdown === 'grade'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div *ngIf="openDropdown === 'grade'" class="absolute z-20 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 min-w-[200px] max-h-[280px] overflow-y-auto">
              <p *ngIf="filteredGradeOptions.length === 0" class="text-xs text-slate-400 px-2 py-1.5">Sin grados disponibles</p>
              <label *ngFor="let g of filteredGradeOptions" class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                <input type="checkbox" [checked]="selectedGradeIds.includes(g.id)" (change)="toggleGradeSelection(g.id)">
                {{ g.name }}
              </label>
            </div>
          </div>

          <!-- Sección (letra) -->
          <div class="relative" data-filter-dropdown>
            <button type="button" (click)="toggleDropdown('section')"
                    class="flex items-center gap-2 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-slate-300 transition-colors">
              <svg class="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M6 21V4a1 1 0 0 1 1-1h7l5 5v13"/><path d="M14 3v5h5"/></svg>
              Sección
              <span *ngIf="selectedSectionLetters.length > 0" class="bg-cermat-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ selectedSectionLetters.length }}</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform" [class.rotate-180]="openDropdown === 'section'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div *ngIf="openDropdown === 'section'" class="absolute z-20 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 min-w-[160px] max-h-[280px] overflow-y-auto">
              <p *ngIf="availableSectionLetters.length === 0" class="text-xs text-slate-400 px-2 py-1.5">Sin secciones disponibles</p>
              <label *ngFor="let s of availableSectionLetters" class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                <input type="checkbox" [checked]="selectedSectionLetters.includes(s)" (change)="toggleSectionLetterSelection(s)">
                Sección {{ s }}
              </label>
            </div>
          </div>

          <!-- Docente -->
          <div class="relative" data-filter-dropdown>
            <button type="button" (click)="toggleDropdown('teacher')"
                    class="flex items-center gap-2 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-slate-300 transition-colors">
              <svg class="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Docente
              <span *ngIf="selectedTeacherIds.length > 0" class="bg-cermat-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ selectedTeacherIds.length }}</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform" [class.rotate-180]="openDropdown === 'teacher'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div *ngIf="openDropdown === 'teacher'" class="absolute z-20 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 min-w-[220px] max-h-[280px] overflow-y-auto">
              <label *ngFor="let t of teachers" class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                <input type="checkbox" [checked]="selectedTeacherIds.includes(t.id)" (change)="toggleTeacherSelection(t.id)">
                {{ t.name }} {{ t.last_name }}
              </label>
            </div>
          </div>

          <select [(ngModel)]="filterOverloadStatus" (ngModelChange)="applyFilters()" class="text-sm font-semibold border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-slate-300 transition-colors focus:outline-none focus:border-cermat-blue-400">
            <option value="">Todos los docentes</option>
            <option value="near_limit">Cerca del límite</option>
            <option value="at_limit">En el límite</option>
            <option value="has_override">Con límite personalizado</option>
          </select>

          <input [(ngModel)]="filterSearch" (ngModelChange)="applyFilters()" placeholder="Buscar docente..." class="flex-1 min-w-[180px] text-sm border-2 border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-slate-300 transition-colors focus:outline-none focus:border-cermat-blue-400">

          <button *ngIf="hasActiveFilters()" (click)="clearFilters()" class="text-xs text-slate-400 hover:text-slate-600 underline">
            Limpiar filtros
          </button>
        </div>

        <!-- Chips de filtros activos, en el orden real de seleccion -->
        <div *ngIf="activeFilterChips().length > 0" class="flex flex-wrap gap-2 mt-3 px-1">
          <span *ngFor="let chip of activeFilterChips()" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-cermat-blue-50 text-cermat-blue-700 px-3 py-1.5 rounded-full">
            {{ chip.label }}
            <button type="button" (click)="removeFilterChip(chip)" class="hover:text-cermat-blue-900">✕</button>
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <!-- Filtro EXCLUSIVO de sección: boton + panel con acordeon por nivel (izquierda)
           + expandir/colapsar todo (derecha). Reutiliza toggleSectionFilter()/
           clearSectionFilter() sin tocarlos — solo cambia la presentacion visual. -->
      <div *ngIf="!loading" class="flex items-center flex-wrap gap-3 mb-4">
        <div class="relative" data-filter-dropdown>
          <button type="button" (click)="toggleSectionPanel()"
                  class="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 flex items-center gap-2 hover:border-slate-300 bg-white transition-colors">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            Filtrar por sección
            <span *ngIf="filterSectionId" class="bg-cermat-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              {{ getSelectedSectionLabel() }}
            </span>
            <svg class="w-4 h-4 text-slate-400 transition-transform" [class.rotate-180]="sectionPanelOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <div *ngIf="sectionPanelOpen" class="absolute z-20 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-[340px] max-h-[420px] overflow-y-auto">
            <button type="button" (click)="clearSectionFilter(); sectionPanelOpen = false"
                    class="w-full text-left text-sm font-bold text-cermat-blue-600 hover:bg-cermat-blue-50 rounded-lg px-3 py-2 mb-2">
              ✓ Todas las secciones
            </button>

            <div *ngFor="let level of levels">
              <ng-container *ngIf="getSectionsForLevel(level.value).length > 0">
                <div class="border-t border-slate-100 first:border-t-0 pt-2 mt-2">
                  <button type="button" (click)="toggleLevelAccordion(level.value)"
                          class="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider py-1.5">
                    {{ level.label }}
                    <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-90]="expandedLevelAccordion === level.value" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  <div *ngIf="expandedLevelAccordion === level.value" class="pl-2 space-y-1 mt-1">
                    <button *ngFor="let sec of getSectionsForLevel(level.value); trackBy: trackBySectionId"
                            type="button"
                            (click)="selectSectionFilter(sec.id)"
                            [class.bg-cermat-blue-50]="filterSectionId === sec.id"
                            class="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full shrink-0" [ngClass]="getSectionColor(sec.grade_level_id, sec.section_letter).dot"></span>
                      <span class="truncate">{{ sec.grade_name }} - Sección {{ sec.section_letter }}</span>
                      <span class="text-xs text-slate-400 ml-auto shrink-0">{{ sec.year }}</span>
                    </button>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

        <button *ngIf="filteredTeacherGroups.length > 0" type="button" (click)="toggleExpandAll()"
                class="ml-auto text-xs font-bold text-cermat-blue-700 hover:text-cermat-blue-800 flex items-center gap-1.5 whitespace-nowrap">
          <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="areAllExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 9l-7 7-7-7"/>
          </svg>
          {{ areAllExpanded() ? 'Colapsar todo' : 'Expandir todo' }}
        </button>
      </div>

      <!-- Teacher Cards: layout tipo masonry (columnas independientes con flex, no CSS Grid)
           para que al colapsar/expandir una card las demas de su fila no queden con un
           hueco vacio — cada columna crece a su propia altura, sin alinearse por fila. -->
      <div *ngIf="!loading" class="flex gap-4 items-start">
        <div *ngFor="let column of teacherColumnsCache; trackBy: trackByColumnIndex" class="flex-1 flex flex-col gap-4 min-w-0">
        <div *ngFor="let teacherGroup of column; trackBy: trackByTeacherId" class="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300"
             [ngClass]="filterSectionId && teacherHasSectionMatch(teacherGroup) ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'">

          <!-- Header SIEMPRE visible, clickeable. Altura consistente lograda con ESTRUCTURA
               (dos bloques: nombre+resumen de tamaño natural, y una segunda fila de límite
               con altura fija h-8 que SIEMPRE se renderiza para todos los docentes, con o
               sin override) en vez de recortar contenido con una altura total forzada. -->
          <div (click)="toggleTeacherExpanded(teacherGroup.teacher.id)"
               class="p-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-cermat-blue-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                {{ teacherGroup.teacher.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-slate-900 text-base truncate" [title]="teacherGroup.teacher.name + ' ' + teacherGroup.teacher.last_name">
                  {{ teacherGroup.teacher.name }} {{ teacherGroup.teacher.last_name }}
                </p>
                <div class="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-semibold">
                  <span>{{ distinctCourseCount(teacherGroup) }} cursos</span>
                  <span class="text-slate-300">•</span>
                  <span>{{ teacherGroup.assignments.length }} secciones</span>
                  <span *ngIf="filterSectionId && teacherHasSectionMatch(teacherGroup)" class="text-emerald-600 font-bold">• ✓ Coincide con el filtro</span>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button *ngIf="isAdminOrDirector"
                        (click)="$event.stopPropagation(); openTeacherLimitModal(teacherGroup.teacher)"
                        title="Configurar límite de cursos de este docente"
                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                  <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
                <svg class="w-5 h-5 text-slate-400 transition-transform duration-200" [class.rotate-180]="isTeacherExpanded(teacherGroup.teacher.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            <!-- SEGUNDA FILA: siempre presente, altura fija h-8, igual para TODOS los
                 docentes (con o sin override) — solo cambia el texto/color del chip. -->
            <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between h-8">
              <span class="text-xs font-semibold text-slate-500">Límite de cursos asignados</span>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                    [ngClass]="teacherGroup.teacher.max_courses_override != null ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600'">
                {{ effectiveLimit(teacherGroup.teacher) }}
                <span *ngIf="teacherGroup.teacher.max_courses_override != null" class="ml-1 text-[10px] font-normal opacity-75">(personalizado)</span>
              </span>
            </div>
          </div>

          <!-- Contenido expandible -->
          <div *ngIf="isTeacherExpanded(teacherGroup.teacher.id)" class="border-t border-slate-100">

            <!-- Filtros internos de este docente -->
            <div *ngIf="getSectionsInUse(teacherGroup).length > 1" class="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2">
              <div class="relative">
                <select [(ngModel)]="teacherInternalGradeFilter[teacherGroup.teacher.id]" [ngModelOptions]="{standalone: true}" (ngModelChange)="recalculateAll()"
                        class="appearance-none text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg pl-3 pr-8 py-2 bg-white hover:border-slate-300 focus:outline-none focus:border-cermat-blue-400 focus:ring-2 focus:ring-cermat-blue-100 transition-all cursor-pointer">
                  <option value="">Todos los grados</option>
                  <option *ngFor="let g of getGradesInUse(teacherGroup)" [value]="g.id">{{ g.name }}</option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
              <div class="relative">
                <select [(ngModel)]="teacherInternalSectionFilter[teacherGroup.teacher.id]" [ngModelOptions]="{standalone: true}" (ngModelChange)="recalculateAll()"
                        class="appearance-none text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg pl-3 pr-8 py-2 bg-white hover:border-slate-300 focus:outline-none focus:border-cermat-blue-400 focus:ring-2 focus:ring-cermat-blue-100 transition-all cursor-pointer">
                  <option value="">Todas las secciones</option>
                  <option *ngFor="let s of getSectionsInUse(teacherGroup)" [value]="s.id">Sección {{ s.letter }}</option>
                </select>
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            <!-- Lista de cursos -->
            <div class="p-4 space-y-3">
              <p *ngIf="getFilteredAssignments(teacherGroup).length === 0 && teacherGroup.assignments.length > 0" class="text-xs text-slate-400 italic px-1 py-2">
                Este docente no tiene cursos en la sección seleccionada.
              </p>
              <p *ngIf="teacherGroup.assignments.length === 0" class="text-xs text-slate-400 italic px-1 py-2">
                Sin cursos asignados.
              </p>
              <div *ngFor="let item of getFilteredAssignments(teacherGroup); trackBy: trackByAssignmentId"
                   class="p-4 rounded-2xl border hover:shadow-md transition-all flex items-center justify-between w-full leading-relaxed"
                   [ngClass]="[getSectionColor(item.section?.grade_level_id, item.section?.section_letter).bg, getSectionColor(item.section?.grade_level_id, item.section?.section_letter).border, isAssignmentDimmed(item) ? 'opacity-40' : '']">
                 <div class="flex items-center gap-3 overflow-hidden w-full">
                    <span class="w-2 h-2 rounded-full shrink-0" [ngClass]="getSectionColor(item.section?.grade_level_id, item.section?.section_letter).dot"></span>
                    <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-cermat-blue-700 font-bold text-[10px] shadow-sm shrink-0">
                      {{ item.course?.code || 'CRS' }}
                    </div>
                    <div class="overflow-hidden flex-1">
                      <h4 class="font-semibold text-sm leading-normal truncate" [ngClass]="getSectionColor(item.section?.grade_level_id, item.section?.section_letter).text" [title]="item.course?.name">{{ item.course?.name }}</h4>
                      <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p class="text-xs font-semibold text-slate-500 truncate">
                          {{ gradeLevelsMap[item.section?.grade_level_id] || 'Grado' }} - Sección {{ item.section?.section_letter || item.section?.letter }}
                        </p>
                        <span *ngIf="academicYearsMap[item.section?.academic_year_id]" class="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                          {{ academicYearsMap[item.section?.academic_year_id] }}
                        </span>
                      </div>
                      <div *ngIf="item.section?.capacity" class="flex items-center gap-2 text-xs mt-1.5">
                        <span class="font-bold text-slate-600">{{ item.section?.students_count ?? 0 }}/{{ item.section?.capacity }}</span>
                        <div class="flex-1 h-1.5 bg-slate-200/70 rounded-full overflow-hidden max-w-[60px]">
                          <div class="h-full rounded-full transition-all"
                               [ngClass]="{
                                 'bg-emerald-500': occupancyPct(item.section) < 70,
                                 'bg-amber-500': occupancyPct(item.section) >= 70 && occupancyPct(item.section) < 100,
                                 'bg-red-500': occupancyPct(item.section) >= 100
                               }"
                               [style.width.%]="occupancyPct(item.section)"></div>
                        </div>
                        <span *ngIf="occupancyPct(item.section) >= 85" class="text-[10px] font-bold" [ngClass]="occupancyPct(item.section) >= 100 ? 'text-red-600' : 'text-amber-600'">
                          {{ occupancyPct(item.section) >= 100 ? '⚠️ Al límite' : '⚠️ Casi lleno' }}
                        </span>
                      </div>
                    </div>
                 </div>
                 <button (click)="deleteAssignment(item.id)" class="p-2 ml-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                 </button>
              </div>

              <button (click)="openModal(teacherGroup.teacher.id)" class="w-full py-3 bg-white text-cermat-blue-700 border-2 border-slate-100 hover:border-cermat-blue-700 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar curso a este docente
              </button>
            </div>
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
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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

  // Filtros del listado de docentes — combinables (multi-select), mantienen el
  // orden de seleccion. AND entre categorias distintas, OR dentro de la misma categoria.
  selectedLevels: string[] = [];
  selectedGradeIds: string[] = [];
  selectedSectionLetters: string[] = [];
  selectedTeacherIds: string[] = [];
  filterOverloadStatus = '';
  filterSearch = '';
  // Filtro EXCLUSIVO de sección (panel con acordeón, MEJORA 3) — distinto de
  // selectedSectionLetters: este reordena/auto-expande docentes (ver toggleSectionFilter),
  // los otros solo atenúan filas dentro de las cards ya visibles.
  filterSectionId = '';
  filteredGradeOptions: GradeLevel[] = [];
  availableSectionLetters: string[] = [];

  readonly levels = [
    { value: 'inicial', label: 'Inicial' },
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
  ];

  openDropdown: 'level' | 'grade' | 'section' | 'teacher' | null = null;
  sectionPanelOpen = false;
  expandedLevelAccordion: string | null = null;

  // Estado colapsado/expandido de las cards de docente. Solo en memoria del componente:
  // siempre inicia vacio (todas colapsadas) al entrar/recargar la pagina, y NO se guarda
  // en sessionStorage para evitar que sobreviva a un logout/login dentro de la misma pestaña.
  expandedTeacherIds = new Set<string>();

  // ---- Guardias temporales anti-loop (diagnostico) ----
  // Instrumentacion TEMPORAL: cuenta llamadas por funcion (+docente) dentro de una misma
  // interaccion del usuario. Si algo dispara un loop real, esto lanza un Error visible en
  // consola con el stack ANTES de que el hilo principal se congele silenciosamente, en vez
  // de dejar que el navegador se cuelgue sin pista alguna. NO quitar hasta confirmar la
  // causa raiz real del colgado reportado.
  private _loopGuardCounts = new Map<string, number>();

  private guardAgainstLoop(fnName: string, teacherId?: string): void {
    const key = fnName + (teacherId ? ':' + teacherId : '');
    const count = (this._loopGuardCounts.get(key) ?? 0) + 1;
    this._loopGuardCounts.set(key, count);

    if (count > 200) {
      const stack = new Error().stack;
      console.error(
        '🔴 LOOP DETECTADO en ' + fnName +
        (teacherId ? ' para docente ' + teacherId : '') +
        ': ' + count + ' llamadas. Stack:\n' + stack
      );
      throw new Error('LOOP_DETECTADO:' + fnName + ':' + count);
    }
  }

  private resetLoopGuards(): void {
    this._loopGuardCounts.clear();
  }

  // Filtros internos por docente (Grado/Seccion), aplican solo dentro de la card expandida
  teacherInternalGradeFilter: { [teacherId: string]: string } = {};
  teacherInternalSectionFilter: { [teacherId: string]: string } = {};

  private readonly SECTION_COLORS = [
    { bg: 'bg-cermat-blue-50', border: 'border-cermat-blue-300', text: 'text-cermat-blue-700', dot: 'bg-cermat-blue-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', dot: 'bg-violet-500' },
    { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', dot: 'bg-teal-500' },
    { bg: 'bg-lime-50', border: 'border-lime-300', text: 'text-lime-700', dot: 'bg-lime-500' },
    { bg: 'bg-fuchsia-50', border: 'border-fuchsia-300', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
    { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700', dot: 'bg-sky-500' },
    { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', dot: 'bg-indigo-500' },
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


  ngOnInit() {
    this.isAdminOrDirector = ['admin', 'director'].includes(this.authService.getRole() || '');
    // Estado explicito: todas las cards inician colapsadas y sin filtro de sección activo
    // cada vez que se entra a esta pantalla (no se restaura de sessionStorage ni de ningún otro lado).
    this.expandedTeacherIds = new Set();
    this.filterSectionId = '';
    this.updateColumnCount();
    this.loadInitialData();
    if (this.isAdminOrDirector) {
      this.loadMaxCoursesPerTeacher();
    }
  }

  // ---- Layout tipo masonry: columnas independientes en vez de CSS Grid ----
  // Con CSS Grid, colapsar/expandir una card no reacomoda a sus vecinas de fila
  // (la fila mantiene el alto de la card mas alta, dejando huecos). En su lugar,
  // distribuimos sortedTeacherGroups en N columnas independientes (flex), asignando
  // cada docente a la columna con MENOR peso acumulado (greedy bin-packing, igual
  // que Pinterest). No se mide el DOM real: se usa un peso ESTIMADO por card segun
  // su contenido (colapsada vs expandida, cantidad de cursos visibles, etc).
  columnCount = 3;

  @HostListener('window:resize')
  onResize(): void {
    this.updateColumnCount();
    this.recalculateAll();
  }

  private updateColumnCount(): void {
    const width = window.innerWidth;
    if (width < 768) this.columnCount = 1;
    else if (width < 1024) this.columnCount = 2;
    else this.columnCount = 3;
  }

  private calculateCardWeight(teacherGroup: { teacher: User; assignments: any[] }): number {
    this.guardAgainstLoop('calculateCardWeight', teacherGroup.teacher.id);
    const HEADER_WEIGHT = 2;      // nombre + resumen + fila de limite
    const FILTERS_ROW_WEIGHT = 1; // selects internos de grado/seccion
    const COURSE_ROW_WEIGHT = 1.2; // cada curso visible dentro de la card expandida
    const ADD_BUTTON_WEIGHT = 0.8; // boton "Agregar curso a este docente"

    let weight = HEADER_WEIGHT;

    if (!this.isTeacherExpanded(teacherGroup.teacher.id)) {
      return weight; // colapsada: solo el header
    }

    if (this.getSectionsInUse(teacherGroup).length > 1) {
      weight += FILTERS_ROW_WEIGHT;
    }

    const visibleCourses = this.getFilteredAssignments(teacherGroup);
    weight += Math.max(visibleCourses.length, 1) * COURSE_ROW_WEIGHT;
    weight += ADD_BUTTON_WEIGHT;

    return weight;
  }

  // IMPORTANTE: teacherColumns NO es un getter. Un getter que arma un array-de-arrays
  // nuevo en cada ciclo de change detection, consumido por un *ngFor sin trackBy, hace
  // que Angular destruya y reconstruya el DOM de TODAS las cards en cada tick (no solo
  // re-vincule datos) — eso fue lo que causaba el cuelgue al hacer click en los filtros
  // de sección (que ademas auto-expanden varias cards a la vez). En su lugar, es una
  // propiedad cacheada que solo se recalcula explicitamente cuando algo relevante
  // cambia de verdad (ver recalculateColumns() y sus puntos de llamada).
  teacherColumnsCache: any[][] = [];

  recalculateColumns(): void {
    const columns: any[][] = Array.from({ length: this.columnCount }, () => []);
    const columnWeights: number[] = new Array(this.columnCount).fill(0);

    for (const teacherGroup of this.sortedTeacherGroups) {
      let minIndex = 0;
      for (let i = 1; i < this.columnCount; i++) {
        if (columnWeights[i] < columnWeights[minIndex]) {
          minIndex = i;
        }
      }
      columns[minIndex].push(teacherGroup);
      columnWeights[minIndex] += this.calculateCardWeight(teacherGroup);
    }

    this.teacherColumnsCache = columns;
  }

  // KPIs del header (Total docentes / Carga total / Cerca del límite / En el límite).
  // Mismo problema que teacherColumns: nearLimitCount()/atLimitCount() eran metodos
  // llamados directamente en el template ({{ nearLimitCount() }}), y totalTeachers/
  // totalAssignments eran getters ({{ totalTeachers }}) — ambas formas se re-evaluan
  // en CADA ciclo de change detection igual que un getter. nearLimitCount/atLimitCount
  // ademas iteraban TODOS los docentes llamando a distinctCourseCount() en cada
  // evaluacion — exactamente el mismo patron que causo el cuelgue de teacherColumns.
  // Ahora son propiedades cacheadas, recalculadas solo cuando algo relevante cambia.
  totalTeachersCache = 0;
  totalAssignmentsCache = 0;
  nearLimitCountCache = 0;
  atLimitCountCache = 0;

  private recalculateKpis(): void {
    this.totalTeachersCache = this.teachers.length;
    this.totalAssignmentsCache = this.assignments.length;
    // Misma logica exacta que los metodos anteriores (no se cambio ningun umbral):
    // "cerca del limite" incluye a quien ya esta en el limite (count >= limit - 1).
    this.nearLimitCountCache = this.teacherGroups.filter(g => this.distinctCourseCount(g) >= this.effectiveLimit(g.teacher) - 1).length;
    this.atLimitCountCache = this.teacherGroups.filter(g => this.distinctCourseCount(g) === this.effectiveLimit(g.teacher)).length;
  }

  // Punto unico de recalculo: columnas (masonry) y KPIs dependen del mismo estado base
  // (teacherGroups/filteredTeacherGroups), asi que siempre se recalculan juntos para
  // no olvidar ninguno en un punto de llamada nuevo.
  recalculateAll(): void {
    this.recalculateColumns();
    this.recalculateKpis();
  }

  // trackBy para los *ngFor de columnas/cards/cursos: aunque los arrays cambien de
  // referencia (recalculateColumns crea arrays nuevos), Angular reutiliza el DOM
  // existente en vez de destruir y reconstruir todo, mientras la clave (id) no cambie.
  trackByColumnIndex(index: number): number {
    return index;
  }

  trackByTeacherId(_index: number, teacherGroup: { teacher: User }): string {
    return teacherGroup.teacher.id;
  }

  trackByAssignmentId(_index: number, item: { id: string }): string {
    return item.id;
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
    this.guardAgainstLoop('distinctCourseCount');
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
    this.resetLoopGuards();
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

    if (this.selectedTeacherIds.length > 0) {
      list = list.filter(g => this.selectedTeacherIds.includes(g.teacher.id));
    }

    this.filteredTeacherGroups = list;
    this.recalculateAll();
  }

  // ---- Filtros combinables (multi-select) de nivel/grado/sección/docente ----

  private toggleInArray(arr: string[], value: string): void {
    const idx = arr.indexOf(value);
    if (idx === -1) arr.push(value); else arr.splice(idx, 1);
  }

  toggleDropdown(name: 'level' | 'grade' | 'section' | 'teacher'): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  toggleLevelSelection(value: string): void {
    this.toggleInArray(this.selectedLevels, value);
    this.applyFilters();
  }

  toggleGradeSelection(value: string): void {
    this.toggleInArray(this.selectedGradeIds, value);
    this.applyFilters();
  }

  toggleSectionLetterSelection(value: string): void {
    this.toggleInArray(this.selectedSectionLetters, value);
    this.applyFilters();
  }

  toggleTeacherSelection(value: string): void {
    this.toggleInArray(this.selectedTeacherIds, value);
    this.applyFilters();
  }

  getLevelLabel(value: string): string {
    return this.levels.find(l => l.value === value)?.label || value;
  }

  getGradeLabel(value: string): string {
    return this.gradeLevelsMap[value] || value;
  }

  getSectionLetterLabel(value: string): string {
    return 'Sección ' + value;
  }

  getTeacherLabel(value: string): string {
    const t = this.teachers.find(t => t.id === value) as any;
    return t ? `${t.name} ${t.last_name}` : value;
  }

  // Chips en el orden REAL de seleccion: primero los niveles agregados (en el orden
  // en que se marcaron), luego grados, luego secciones, luego docentes.
  activeFilterChips(): { type: 'level' | 'grade' | 'section' | 'teacher'; value: string; label: string }[] {
    const chips: { type: 'level' | 'grade' | 'section' | 'teacher'; value: string; label: string }[] = [];
    this.selectedLevels.forEach(v => chips.push({ type: 'level', value: v, label: this.getLevelLabel(v) }));
    this.selectedGradeIds.forEach(v => chips.push({ type: 'grade', value: v, label: this.getGradeLabel(v) }));
    this.selectedSectionLetters.forEach(v => chips.push({ type: 'section', value: v, label: this.getSectionLetterLabel(v) }));
    this.selectedTeacherIds.forEach(v => chips.push({ type: 'teacher', value: v, label: this.getTeacherLabel(v) }));
    return chips;
  }

  removeFilterChip(chip: { type: string; value: string }): void {
    if (chip.type === 'level') this.toggleInArray(this.selectedLevels, chip.value);
    else if (chip.type === 'grade') this.toggleInArray(this.selectedGradeIds, chip.value);
    else if (chip.type === 'section') this.toggleInArray(this.selectedSectionLetters, chip.value);
    else if (chip.type === 'teacher') this.toggleInArray(this.selectedTeacherIds, chip.value);
    this.applyFilters();
  }

  // Cierra cualquier dropdown/panel abierto al hacer click fuera de el.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-filter-dropdown]')) {
      this.openDropdown = null;
      this.sectionPanelOpen = false;
    }
  }

  hasActiveFilters(): boolean {
    return this.selectedLevels.length > 0 || this.selectedGradeIds.length > 0 ||
      this.selectedSectionLetters.length > 0 || this.selectedTeacherIds.length > 0 ||
      !!this.filterOverloadStatus || !!this.filterSearch || !!this.filterSectionId;
  }

  clearFilters() {
    this.selectedLevels = [];
    this.selectedGradeIds = [];
    this.selectedSectionLetters = [];
    this.selectedTeacherIds = [];
    this.filterOverloadStatus = '';
    this.filterSearch = '';
    this.filterSectionId = '';
    // Reset explicito: antes, limpiar filtros no tocaba expandedTeacherIds, asi que un
    // docente auto-expandido por un filtro de sección anterior (ver toggleSectionFilter)
    // seguia expandido despues de "Limpiar filtros" — parecia un auto-expand fantasma.
    // Ahora limpiar filtros SIEMPRE colapsa todo, sin excepcion.
    this.expandedTeacherIds = new Set();
    this.applyFilters();
  }

  toggleSectionFilter(sectionId: string) {
    this.resetLoopGuards();
    const activating = this.filterSectionId !== sectionId;
    this.filterSectionId = activating ? sectionId : '';
    this.applyFilters();

    // Al activar un filtro de sección, auto-expandir a los docentes que coinciden
    // para que el admin vea sus cursos de inmediato. Al desactivar, no forzar colapso.
    if (activating) {
      for (const group of this.teacherGroups) {
        if (this.teacherHasSectionMatch(group)) {
          this.expandedTeacherIds.add(group.teacher.id);
        }
      }
      // Recalcular de nuevo: applyFilters() ya recalculo columnas/KPIs arriba, pero el
      // peso de las cards recien auto-expandidas solo es correcto despues de este bucle.
      this.recalculateAll();
    }
  }

  clearSectionFilter() {
    this.filterSectionId = '';
    this.applyFilters();
  }

  // ---- Panel de sección con acordeón por nivel (MEJORA 3) ----
  // Presentacion visual unicamente: envuelve toggleSectionFilter()/clearSectionFilter()
  // ya existentes, sin cambiar su comportamiento (auto-expand, reordenamiento, etc).

  toggleSectionPanel(): void {
    this.sectionPanelOpen = !this.sectionPanelOpen;
  }

  toggleLevelAccordion(level: string): void {
    this.expandedLevelAccordion = this.expandedLevelAccordion === level ? null : level;
  }

  getSectionsForLevel(level: string): { id: string; grade_name: string; section_name: string; grade_level_id: string; section_letter: string; year: number | string }[] {
    return this.getVisibleSectionsLegend().filter(sec => this.gradeLevelById[sec.grade_level_id]?.level === level);
  }

  selectSectionFilter(sectionId: string): void {
    this.toggleSectionFilter(sectionId);
    this.sectionPanelOpen = false;
  }

  getSelectedSectionLabel(): string {
    const sec = this.getVisibleSectionsLegend().find(s => s.id === this.filterSectionId);
    return sec ? `${sec.grade_name} - ${sec.section_name}` : '';
  }

  trackBySectionId(_index: number, sec: { id: string }): string {
    return sec.id;
  }

  teacherHasSectionMatch(teacherGroup: { assignments: any[] }): boolean {
    this.guardAgainstLoop('teacherHasSectionMatch');
    if (!this.filterSectionId) return false;
    return teacherGroup.assignments.some(item => item.section?.id === this.filterSectionId);
  }

  // Reordena (sin mutar datos ni llamar al backend) priorizando a los docentes
  // que coinciden con el filtro de sección activo; sin filtro, mantiene el orden normal.
  get sortedTeacherGroups(): any[] {
    if (!this.filterSectionId) return this.filteredTeacherGroups;

    const withMatch: any[] = [];
    const withoutMatch: any[] = [];

    for (const group of this.filteredTeacherGroups) {
      (this.teacherHasSectionMatch(group) ? withMatch : withoutMatch).push(group);
    }

    return [...withMatch, ...withoutMatch];
  }

  private recomputeGradeOptions() {
    this.filteredGradeOptions = this.selectedLevels.length > 0
      ? this.gradeLevels.filter(g => this.selectedLevels.includes(g.level))
      : this.gradeLevels;

    // Poda selecciones de grado que ya no son validas para los niveles elegidos,
    // en vez de vaciar todo — preserva lo que el usuario ya marco y aun aplica.
    this.selectedGradeIds = this.selectedGradeIds.filter(id => this.filteredGradeOptions.some(g => g.id === id));
  }

  private recomputeAvailableSectionLetters() {
    let scoped = this.sections;
    if (this.selectedGradeIds.length > 0) {
      scoped = scoped.filter(s => this.selectedGradeIds.includes(s.grade_level_id));
    } else if (this.selectedLevels.length > 0) {
      scoped = scoped.filter(s => this.selectedLevels.includes(this.gradeLevelById[s.grade_level_id]?.level));
    }

    const letters = new Set(scoped.map(s => s.section_letter).filter((l): l is string => !!l));
    this.availableSectionLetters = Array.from(letters).sort();

    this.selectedSectionLetters = this.selectedSectionLetters.filter(l => this.availableSectionLetters.includes(l));
  }

  // Solo se aplica dimming cuando algun filtro de nivel/grado/seccion esta activo;
  // los filtros de busqueda/estado de limite/docente ya ocultan la card completa.
  isAssignmentDimmed(item: any): boolean {
    if (!this.selectedLevels.length && !this.selectedGradeIds.length && !this.selectedSectionLetters.length) return false;
    return !this.assignmentMatchesFilters(item);
  }

  // AND entre categorias (nivel Y grado Y sección), OR dentro de la misma categoria
  // (ej. nivel="primaria" O nivel="secundaria" si ambos estan marcados).
  private assignmentMatchesFilters(item: any): boolean {
    const gradeId = item.section?.grade_level_id;

    if (this.selectedLevels.length && !this.selectedLevels.includes(this.gradeLevelById[gradeId]?.level)) return false;
    if (this.selectedGradeIds.length && !this.selectedGradeIds.includes(gradeId)) return false;
    if (this.selectedSectionLetters.length && !this.selectedSectionLetters.includes(item.section?.section_letter)) return false;

    return true;
  }


  // ---- Expandir / colapsar cards de docente ----

  isTeacherExpanded(teacherId: string): boolean {
    return this.expandedTeacherIds.has(teacherId);
  }

  toggleTeacherExpanded(teacherId: string) {
    this.resetLoopGuards();
    if (this.expandedTeacherIds.has(teacherId)) {
      this.expandedTeacherIds.delete(teacherId);
    } else {
      this.expandedTeacherIds.add(teacherId);
    }
    this.recalculateAll();
  }

  areAllExpanded(): boolean {
    return this.filteredTeacherGroups.length > 0 &&
      this.filteredTeacherGroups.every(g => this.expandedTeacherIds.has(g.teacher.id));
  }

  toggleExpandAll() {
    this.resetLoopGuards();
    if (this.areAllExpanded()) {
      this.filteredTeacherGroups.forEach(g => this.expandedTeacherIds.delete(g.teacher.id));
    } else {
      this.filteredTeacherGroups.forEach(g => this.expandedTeacherIds.add(g.teacher.id));
    }
    this.recalculateAll();
  }

  // ---- Filtros internos por docente + capacidad de sección ----

  getGradesInUse(teacherGroup: { assignments: any[] }): { id: string; name: string }[] {
    this.guardAgainstLoop('getGradesInUse');
    const seen = new Map<string, { id: string; name: string }>();
    for (const item of teacherGroup.assignments) {
      const gradeId = item.section?.grade_level_id;
      if (!gradeId || seen.has(gradeId)) continue;
      seen.set(gradeId, { id: gradeId, name: this.gradeLevelsMap[gradeId] || 'Grado' });
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getSectionsInUse(teacherGroup: { assignments: any[] }): { id: string; letter: string }[] {
    this.guardAgainstLoop('getSectionsInUse');
    const seen = new Map<string, { id: string; letter: string }>();
    for (const item of teacherGroup.assignments) {
      const sec = item.section;
      if (!sec?.id || seen.has(sec.id)) continue;
      seen.set(sec.id, { id: sec.id, letter: sec.section_letter || sec.letter || '' });
    }
    return Array.from(seen.values()).sort((a, b) => a.letter.localeCompare(b.letter));
  }

  // Combina (AND) el filtro global exclusivo de la leyenda (filterSectionId, oculta filas)
  // con los filtros internos de Grado/Sección de esta card especifica.
  getFilteredAssignments(teacherGroup: { teacher: User; assignments: any[] }): any[] {
    this.guardAgainstLoop('getFilteredAssignments', teacherGroup.teacher.id);
    const gradeFilter = this.teacherInternalGradeFilter[teacherGroup.teacher.id];
    const sectionFilter = this.teacherInternalSectionFilter[teacherGroup.teacher.id];

    return teacherGroup.assignments.filter(item => {
      if (this.filterSectionId && item.section?.id !== this.filterSectionId) return false;
      if (gradeFilter && item.section?.grade_level_id !== gradeFilter) return false;
      if (sectionFilter && item.section?.id !== sectionFilter) return false;
      return true;
    });
  }

  occupancyPct(section: any): number {
    if (!section?.capacity) return 0;
    return Math.round(((section.students_count ?? 0) / section.capacity) * 100);
  }

  // ---- Colores por sección ----

  // El color se deriva de grado+letra (no del id de seccion) para que la misma
  // combinacion (ej. "1ro - A") sea visualmente identificable independientemente
  // del año academico, y para que grados distintos con la misma letra no colisionen.
  getSectionColor(gradeLevelId?: string, sectionLetter?: string) {
    const key = `${gradeLevelId || ''}::${sectionLetter || ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.SECTION_COLORS.length;
    return this.SECTION_COLORS[index];
  }

  getVisibleSectionsLegend(): { id: string; grade_name: string; section_name: string; grade_level_id: string; section_letter: string; year: number | string }[] {
    this.guardAgainstLoop('getVisibleSectionsLegend');
    const seen = new Map<string, { id: string; grade_name: string; section_name: string; grade_level_id: string; section_letter: string; year: number | string }>();

    for (const group of this.filteredTeacherGroups) {
      for (const item of group.assignments) {
        const sec = item.section;
        if (!sec?.id || seen.has(sec.id)) continue;

        seen.set(sec.id, {
          id: sec.id,
          grade_name: this.gradeLevelsMap[sec.grade_level_id] || 'Grado',
          section_name: sec.section_letter || sec.letter || '',
          grade_level_id: sec.grade_level_id,
          section_letter: sec.section_letter || sec.letter || '',
          year: this.academicYearsMap[sec.academic_year_id] || ''
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
