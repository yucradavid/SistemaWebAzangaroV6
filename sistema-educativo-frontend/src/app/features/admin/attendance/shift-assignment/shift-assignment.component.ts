import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-shift-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6">
      <h2 class="text-xl font-bold text-slate-800 mb-1">Asignar Turnos</h2>
      <p class="text-sm text-slate-500 mb-6">Asigna secciones y docentes al turno manana o tarde.</p>

      <div *ngIf="loading" class="text-center py-12 text-slate-400">Cargando...</div>

      <div *ngIf="!loading" class="space-y-8">
        <!-- Filtros de Secciones -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-bold text-slate-700 mb-4">Secciones</h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label class="block text-xs text-slate-500 mb-1 font-medium">Nivel</label>
              <select [(ngModel)]="filterLevel"
                class="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 transition-all">
                <option value="">Todos los niveles</option>
                <option *ngFor="let l of uniqueLevels" [value]="l">{{ l }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1 font-medium">Grado</label>
              <select [(ngModel)]="filterGrade"
                class="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 transition-all">
                <option value="">Todos los grados</option>
                <option *ngFor="let g of filteredGrades" [value]="g">{{ g }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1 font-medium">Sección</label>
              <select [(ngModel)]="filterSection"
                class="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 transition-all">
                <option value="">Todas las secciones</option>
                <option *ngFor="let s of filteredSections" [value]="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left py-2 px-3 text-slate-500 font-medium">Seccion</th>
                  <th class="text-left py-2 px-3 text-slate-500 font-medium">Grado</th>
                  <th class="text-left py-2 px-3 text-slate-500 font-medium hidden sm:table-cell">Nivel</th>
                  <th class="text-center py-2 px-3 text-slate-500 font-medium">Turno</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of filteredSectionShifts" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="py-2 px-3 font-medium">{{ s.section_letter }}</td>
                  <td class="py-2 px-3 text-slate-600">{{ s.grade_level?.name || '-' }}</td>
                  <td class="py-2 px-3 text-slate-500 text-xs hidden sm:table-cell">{{ s.grade_level?.level || '-' }}</td>
                  <td class="py-2 px-3 text-center">
                    <select class="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                      [(ngModel)]="s.shift" (ngModelChange)="markSectionDirty()">
                      <option value="">Sin turno</option>
                      <option value="manana">Manana</option>
                      <option value="tarde">Tarde</option>
                    </select>
                  </td>
                </tr>
                <tr *ngIf="filteredSectionShifts.length === 0">
                  <td colspan="4" class="py-6 text-center text-slate-400 text-sm">No hay secciones con los filtros seleccionados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Docentes -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 class="font-bold text-slate-700">Docentes</h3>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <input type="text" [(ngModel)]="teacherSearch" placeholder="Buscar por nombre o DNI..."
                class="pl-9 pr-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 transition-all w-full sm:w-64" />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left py-2 px-3 text-slate-500 font-medium">Docente</th>
                  <th class="text-left py-2 px-3 text-slate-500 font-medium hidden sm:table-cell">DNI</th>
                  <th class="text-center py-2 px-3 text-slate-500 font-medium">Turno</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of filteredTeacherShifts" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="py-2 px-3 font-medium">{{ t.teacher?.first_name }} {{ t.teacher?.last_name }}</td>
                  <td class="py-2 px-3 text-slate-500 text-xs hidden sm:table-cell">{{ t.teacher?.document_number || '-' }}</td>
                  <td class="py-2 px-3 text-center">
                    <select class="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                      [(ngModel)]="t.shift" (ngModelChange)="markTeacherDirty()">
                      <option value="">Sin turno</option>
                      <option value="manana">Manana</option>
                      <option value="tarde">Tarde</option>
                    </select>
                  </td>
                </tr>
                <tr *ngIf="filteredTeacherShifts.length === 0">
                  <td colspan="3" class="py-6 text-center text-slate-400 text-sm">No hay docentes con el filtro aplicado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button *ngIf="sectionsDirty" (click)="saveSections()" [disabled]="saving"
            class="px-5 py-2 bg-cermat-blue-800 text-white rounded-xl font-bold text-sm hover:bg-cermat-blue-900 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar Secciones' }}
          </button>
          <button *ngIf="teachersDirty" (click)="saveTeachers()" [disabled]="saving"
            class="px-5 py-2 bg-cermat-blue-800 text-white rounded-xl font-bold text-sm hover:bg-cermat-blue-900 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar Docentes' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ShiftAssignmentComponent implements OnInit {
  private attendanceService = inject(AttendanceService);

  loading = true;
  saving = false;
  sectionShifts: any[] = [];
  teacherShifts: any[] = [];
  sectionsDirty = false;
  teachersDirty = false;

  filterLevel = '';
  filterGrade = '';
  filterSection = '';
  teacherSearch = '';

  get uniqueLevels(): string[] {
    return [...new Set(this.sectionShifts.map(s => s.grade_level?.level).filter(Boolean))];
  }

  get filteredGrades(): string[] {
    const base = this.filterLevel
      ? this.sectionShifts.filter(s => s.grade_level?.level === this.filterLevel)
      : this.sectionShifts;
    return [...new Set(base.map(s => s.grade_level?.name).filter(Boolean))];
  }

  get filteredSections(): string[] {
    let base = this.sectionShifts;
    if (this.filterLevel) base = base.filter(s => s.grade_level?.level === this.filterLevel);
    if (this.filterGrade) base = base.filter(s => s.grade_level?.name === this.filterGrade);
    return [...new Set(base.map(s => s.section_letter).filter(Boolean))];
  }

  get filteredSectionShifts(): any[] {
    let result = this.sectionShifts;
    if (this.filterLevel) result = result.filter(s => s.grade_level?.level === this.filterLevel);
    if (this.filterGrade) result = result.filter(s => s.grade_level?.name === this.filterGrade);
    if (this.filterSection) result = result.filter(s => s.section_letter === this.filterSection);
    return result;
  }

  get filteredTeacherShifts(): any[] {
    if (!this.teacherSearch.trim()) return this.teacherShifts;
    const term = this.teacherSearch.toLowerCase();
    return this.teacherShifts.filter(t => {
      const name = `${t.teacher?.first_name || ''} ${t.teacher?.last_name || ''}`.toLowerCase();
      const dni = (t.teacher?.document_number || '').toLowerCase();
      return name.includes(term) || dni.includes(term);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.attendanceService.getSectionShifts().subscribe({
      next: (res: any) => {
        this.sectionShifts = (res.data || res || []).map((s: any) => ({ ...s }));
        this.attendanceService.getTeacherShifts().subscribe({
          next: (res2: any) => {
            this.teacherShifts = (res2.data || res2 || []).map((t: any) => ({ ...t }));
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  markSectionDirty(): void { this.sectionsDirty = true; }
  markTeacherDirty(): void { this.teachersDirty = true; }

  saveSections(): void {
    this.saving = true;
    const assignments = this.sectionShifts.map(s => ({
      section_id: s.id,
      shift: s.shift || '',
    }));
    this.attendanceService.updateSectionShifts({ assignments }).subscribe({
      next: () => {
        this.saving = false;
        this.sectionsDirty = false;
        Swal.fire('Guardado', 'Turnos de secciones actualizados.', 'success');
      },
      error: () => { this.saving = false; }
    });
  }

  saveTeachers(): void {
    this.saving = true;
    const assignments = this.teacherShifts
      .filter(t => t.teacher_id)
      .map(t => ({
        teacher_id: t.teacher_id,
        shift: t.shift || '',
      }));
    this.attendanceService.updateTeacherShifts({ assignments }).subscribe({
      next: () => {
        this.saving = false;
        this.teachersDirty = false;
        Swal.fire('Guardado', 'Turnos de docentes actualizados.', 'success');
      },
      error: () => { this.saving = false; }
    });
  }
}
