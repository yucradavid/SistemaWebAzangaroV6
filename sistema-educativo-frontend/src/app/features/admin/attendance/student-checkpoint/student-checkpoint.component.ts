import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import { interval, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-checkpoint',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <h2 class="text-xl font-bold text-slate-800 mb-1">Marcar Asistencia Estudiantes</h2>
      <p class="text-sm text-slate-500 mb-6">Escanea el QR del carnet o ingresa el codigo manualmente.</p>

      <!-- Formulario de marcacion -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Codigo QR / Codigo estudiante</label>
            <input type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-mono"
              [(ngModel)]="qrCode" placeholder="Escanear o escribir codigo..."
              (keyup.enter)="markCheckpoint()" autofocus />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Tipo</label>
            <select class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
              [(ngModel)]="checkpoint">
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div>
            <button (click)="markCheckpoint()" [disabled]="!qrCode || marking"
              class="w-full px-4 py-2.5 bg-cermat-blue-800 text-white rounded-lg text-sm font-bold hover:bg-cermat-blue-900 disabled:opacity-50 transition-colors">
              {{ marking ? 'Registrando...' : 'Registrar' }}
            </button>
          </div>
        </div>

        <!-- Ultimo resultado -->
        <div *ngIf="lastResult" class="mt-4 p-3 rounded-lg text-sm"
          [ngClass]="{
            'bg-emerald-50 border border-emerald-200 text-emerald-700': lastResult.status === 'presente',
            'bg-amber-50 border border-amber-200 text-amber-700': lastResult.status === 'tarde',
            'bg-red-50 border border-red-200 text-red-700': lastResult.status === 'falta'
          }">
          <strong>{{ lastResult.student?.full_name }}</strong> - {{ lastResult.status | uppercase }}
          <span class="text-xs ml-2">({{ lastResult.checkpoint }})</span>
        </div>
      </div>

      <!-- Historial del dia -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-bold text-slate-700 text-sm">Historial de Hoy ({{ today }})</h3>
          <span class="text-xs text-slate-500">{{ todayRecords.length }} registros</span>
        </div>

        <div *ngIf="!todayRecords.length" class="text-center py-8 text-slate-400 text-sm">
          Sin registros hoy
        </div>

        <div *ngIf="todayRecords.length" class="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
          <div *ngFor="let r of todayRecords" class="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
            <span class="w-2 h-2 rounded-full shrink-0"
              [ngClass]="{
                'bg-emerald-500': r.status === 'presente',
                'bg-amber-500': r.status === 'tarde',
                'bg-red-500': r.status === 'falta'
              }"></span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-800 truncate">{{ r.student?.full_name }}</div>
              <div class="text-xs text-slate-500">{{ r.checkpoint }} - {{ r.status }}</div>
            </div>
            <div *ngIf="r.status === 'tarde' && r.student?.guardians?.length" class="shrink-0">
              <button (click)="openWhatsApp(r)"
                class="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600 flex items-center gap-1">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Boton notificar todos -->
      <div *ngIf="lateRecords.length" class="bg-amber-50 rounded-xl border border-amber-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-amber-700 text-sm">Notificar Tardanzas</h3>
            <p class="text-xs text-amber-600 mt-1">
              {{ lateRecords.length }} estudiantes con tardanza. Se abrira WhatsApp uno por uno (cola manual).
            </p>
          </div>
          <button (click)="notifyAllLate()"
            class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Notificar Todos (Cola)
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-2 italic">Nota: Cada notificacion se abre en una pestana separada de WhatsApp. Debes enviar manualmente cada mensaje.</p>
      </div>
    </div>
  `
})
export class StudentCheckpointComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);

  qrCode = '';
  checkpoint = 'entrada';
  marking = false;
  lastResult: any = null;
  todayRecords: any[] = [];
  today = new Date().toISOString().split('T')[0];

  get lateRecords(): any[] {
    return this.todayRecords.filter(r => r.status === 'tarde');
  }

  ngOnInit(): void {
    this.loadTodayRecords();
  }

  ngOnDestroy(): void {}

  markCheckpoint(): void {
    if (!this.qrCode) return;
    this.marking = true;

    this.attendanceService.studentCheckpoint({
      qr_code: this.qrCode,
      checkpoint: this.checkpoint,
    }).subscribe({
      next: (res: any) => {
        this.marking = false;
        this.lastResult = res;
        this.todayRecords.unshift({
          student: res.student,
          status: res.status,
          checkpoint: res.checkpoint,
          time: new Date().toLocaleTimeString(),
        });
        this.qrCode = '';

        const icon = res.status === 'presente' ? 'success' : res.status === 'tarde' ? 'warning' : 'info';
        Swal.fire({
          icon: icon as any,
          title: res.status === 'presente' ? 'Presente' : res.status === 'tarde' ? 'Tardanza' : res.status,
          text: `${res.student?.full_name} - ${res.checkpoint}`,
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.marking = false;
        Swal.fire('Error', err.error?.message || err.error?.errors?.qr_code?.[0] || 'No se pudo registrar.', 'error');
      }
    });
  }

  openWhatsApp(record: any): void {
    const guardian = record.student?.guardians?.[0];
    if (!guardian?.phone) {
      Swal.fire('Sin telefono', 'El apoderado no tiene numero de telefono registrado.', 'info');
      return;
    }

    const phone = guardian.phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Estimado/a apoderado/a, se le informa que su hijo/a ${record.student?.full_name} registro tardanza hoy (${this.today}).`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  notifyAllLate(): void {
    const lateRecords = this.lateRecords;
    if (!lateRecords.length) return;

    Swal.fire({
      title: `Notificar ${lateRecords.length} tardanzas`,
      html: 'Se abrira WhatsApp para cada apoderado. <strong>Debes enviar cada mensaje manualmente.</strong>',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Abrir colas',
    }).then((result) => {
      if (result.isConfirmed) {
        let delay = 0;
        for (const record of lateRecords) {
          setTimeout(() => this.openWhatsApp(record), delay);
          delay += 800;
        }
      }
    });
  }

  loadTodayRecords(): void {
    this.todayRecords = [];
  }
}
