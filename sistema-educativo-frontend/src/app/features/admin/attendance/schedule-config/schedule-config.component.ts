import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-schedule-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6">
      <h2 class="text-xl font-bold text-slate-800 mb-1">Configuracion de Horarios</h2>
      <p class="text-sm text-slate-500 mb-6">Define los rangos de hora para entrada y salida de cada turno.</p>

      <div *ngIf="loading" class="text-center py-12 text-slate-400">Cargando configuracion...</div>

      <div *ngIf="!loading" class="space-y-6">
        <div *ngFor="let shift of shifts" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <h3 class="font-bold text-slate-700">{{ shift === 'manana' ? 'Turno Manana' : 'Turno Tarde' }}</h3>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let cp of checkpoints" class="border border-slate-100 rounded-lg p-4">
                <h4 class="font-semibold text-sm text-slate-600 mb-3">{{ cp === 'entrada' ? 'Entrada' : 'Salida' }}</h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Hora inicio ventana</label>
                    <input type="time" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      [(ngModel)]="getConfig(shift, cp).window_start" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Despues de esta hora = tarde</label>
                    <input type="time" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      [(ngModel)]="getConfig(shift, cp).late_after" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Fin de ventana</label>
                    <input type="time" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      [(ngModel)]="getConfig(shift, cp).window_end" />
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="checkbox" class="rounded border-slate-300"
                      [(ngModel)]="getConfig(shift, cp).is_active" />
                    <label class="text-xs text-slate-500">Activo</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button (click)="saveAll()" [disabled]="saving"
            class="px-6 py-2.5 bg-cermat-blue-800 text-white rounded-xl font-bold text-sm hover:bg-cermat-blue-900 disabled:opacity-50 transition-colors">
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ScheduleConfigComponent implements OnInit {
  private attendanceService = inject(AttendanceService);

  loading = true;
  saving = false;
  configs: any[] = [];
  shifts = ['manana', 'tarde'];
  checkpoints = ['entrada', 'salida'];

  ngOnInit(): void {
    this.load();
  }

  getConfig(shift: string, checkpointType: string): any {
    return this.configs.find(c => c.shift === shift && c.checkpoint_type === checkpointType)
      || { shift, checkpoint_type: checkpointType, window_start: '00:00', late_after: '', window_end: '23:59', is_active: true };
  }

  load(): void {
    this.attendanceService.getScheduleConfig().subscribe({
      next: (res: any) => {
        this.configs = res.data || res || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  saveAll(): void {
    this.saving = true;
    let pending = 0;
    let errors = 0;

    for (const shift of this.shifts) {
      for (const cp of this.checkpoints) {
        const cfg = this.getConfig(shift, cp);
        pending++;
        const payload: any = {
          window_start: cfg.window_start,
          window_end: cfg.window_end,
          is_active: cfg.is_active,
        };
        if (cfg.late_after && cfg.late_after.trim() !== '') {
          payload.late_after = cfg.late_after;
        }
        this.attendanceService.updateScheduleConfig(shift, cp, payload).subscribe({
          next: () => {
            pending--;
            if (pending === 0) {
              this.saving = false;
              if (errors === 0) {
                Swal.fire('Guardado', 'Configuracion actualizada correctamente.', 'success');
              }
            }
          },
          error: () => { pending--; errors++; this.saving = false; }
        });
      }
    }
  }
}
