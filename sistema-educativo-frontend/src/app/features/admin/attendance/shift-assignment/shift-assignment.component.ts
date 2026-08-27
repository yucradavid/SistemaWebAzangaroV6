import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import { AcademicService } from '@core/services/academic.service';
import { fireIosSwal } from '@shared/utils/ios-swal';

@Component({
  selector: 'app-shift-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6">
      <h2 class="text-xl font-bold text-slate-800 mb-1">Asignar Turnos</h2>
      <p class="text-sm text-slate-500 mb-6">Asigna el turno mañana, tarde o ambos a niveles, grados y secciones.</p>

      <div *ngIf="loading" class="text-center py-12 text-slate-400">Cargando...</div>

      <div *ngIf="!loading" class="space-y-8">
        <!-- Filtros de Secciones -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-bold text-slate-700 mb-4">Secciones</h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label class="block text-xs text-slate-500 mb-1 font-medium">Nivel</label>
              <select [(ngModel)]="filterLevel" (ngModelChange)="onLevelFilterChange()"
                class="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 transition-all">
                <option value="">Todos los niveles</option>
                <option *ngFor="let l of levelOptions" [value]="l.id">{{ l.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1 font-medium">Grado</label>
              <select [(ngModel)]="filterGrade" (ngModelChange)="onGradeFilterChange()"
                class="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 transition-all">
                <option value="">Todos los grados</option>
                <option *ngFor="let g of filteredGrades" [value]="g.id">{{ g.name }}</option>
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
                      <option value="manana">Mañana</option>
                      <option value="tarde">Tarde</option>
                      <option value="ambos">Ambos</option>
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

        <div class="flex justify-end gap-3">
          <button (click)="saveChanges()" [disabled]="saving || !sectionsDirty"
            class="px-5 py-2 bg-cermat-blue-800 text-white rounded-xl font-bold text-sm hover:bg-cermat-blue-900 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ShiftAssignmentComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private academicService = inject(AcademicService);

  loading = true;
  saving = false;
  sectionShifts: any[] = [];
  gradeLevels: any[] = [];
  sectionsDirty = false;

  // Mismo catalogo fijo de niveles usado en finance-emission.component.ts:
  // "nivel" no es una entidad propia en BD, es un campo string en grade_levels.
  levelOptions: Array<{ id: string; name: string }> = [
    { id: 'inicial', name: 'Inicial' },
    { id: 'primaria', name: 'Primaria' },
    { id: 'secundaria', name: 'Secundaria' },
  ];

  filterLevel = '';
  filterGrade = '';
  filterSection = '';

  get filteredGrades(): Array<{ id: string; name: string }> {
    const base = this.filterLevel
      ? this.gradeLevels.filter(g => g.level === this.filterLevel)
      : this.gradeLevels;
    return base
      .slice()
      .sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0))
      .map(g => ({ id: g.id, name: g.name }));
  }

  get filteredSections(): string[] {
    let base = this.sectionShifts;
    if (this.filterLevel) base = base.filter(s => s.grade_level?.level === this.filterLevel);
    if (this.filterGrade) base = base.filter(s => s.grade_level_id === this.filterGrade);
    return [...new Set(base.map(s => s.section_letter).filter(Boolean))];
  }

  get filteredSectionShifts(): any[] {
    let result = this.sectionShifts;
    if (this.filterLevel) result = result.filter(s => s.grade_level?.level === this.filterLevel);
    if (this.filterGrade) result = result.filter(s => s.grade_level_id === this.filterGrade);
    if (this.filterSection) result = result.filter(s => s.section_letter === this.filterSection);
    return result;
  }

  onLevelFilterChange(): void {
    this.filterGrade = '';
    this.filterSection = '';
  }

  onGradeFilterChange(): void {
    this.filterSection = '';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.academicService.getGradeLevels({ per_page: 100 }).subscribe({
      next: (res: any) => {
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        this.gradeLevels = items;
      },
      error: () => { this.gradeLevels = []; }
    });

    this.attendanceService.getSectionShifts().subscribe({
      next: (res: any) => {
        this.sectionShifts = (res.data || res || []).map((s: any) => ({ ...s }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  markSectionDirty(): void { this.sectionsDirty = true; }

  saveChanges(): void {
    if (this.saving) return;

    const assignments = this.sectionShifts
      .filter(s => s.id)
      .map(s => ({
        section_id: s.id as string,
        shift: (s.shift || null) as string | null,
      }));

    if (assignments.length === 0) {
      void fireIosSwal({
        icon: 'info',
        title: 'Sin secciones',
        text: 'No hay secciones disponibles para guardar.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.saving = true;
    this.attendanceService.updateSectionShifts({ assignments }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.sectionsDirty = false;
        void fireIosSwal({
          icon: 'success',
          title: 'Cambios guardados',
          text: res?.message || 'Los turnos de las secciones fueron actualizados.',
          confirmButtonText: 'Listo',
        });
      },
      error: (err: any) => {
        this.saving = false;
        void fireIosSwal({
          icon: 'error',
          title: 'No se pudo guardar',
          text: err?.error?.message || 'Ocurrio un error al guardar los turnos. Intenta nuevamente.',
          confirmButtonText: 'Entendido',
        });
      }
    });
  }
}
