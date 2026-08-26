import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { AttendanceService } from '@core/services/attendance.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-checkpoint',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <h2 class="text-xl font-bold text-slate-800 mb-1">Marcar Asistencia Estudiantes</h2>
      <p class="text-sm text-slate-500 mb-6">Escanea el QR del carnet o ingresa el codigo manualmente.</p>

      <!-- Botón cámara -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 class="font-bold text-slate-700 text-sm">Modo de Registro</h3>
            <p class="text-xs text-slate-500 mt-1">Selecciona cómo deseas registrar la asistencia</p>
          </div>
          <div class="flex gap-2">
            <button (click)="scannerActive = false"
              [ngClass]="!scannerActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" x2="17" y1="12" y2="12"/></svg>
              Manual
            </button>
            <button (click)="toggleScanner()"
              [ngClass]="scannerActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" x2="17" y1="12" y2="12"/></svg>
              {{ scannerActive ? 'Cerrar Cámara' : 'Abrir Cámara / Escanear QR' }}
            </button>
          </div>
        </div>

        <!-- Scanner de cámara -->
        <div *ngIf="scannerActive" class="mb-4">
          <div class="rounded-xl overflow-hidden border-2 border-slate-200 bg-black relative" style="max-width: 400px; margin: 0 auto;">
            <zxing-scanner
              [formats]="qrFormats"
              [device]="device"
              (camerasFound)="onCamerasFound($event)"
              (camerasNotFound)="onCamerasNotFound()"
              (permissionResponse)="onPermissionResponse($event)"
              (scanSuccess)="handleQrScan($event)">
            </zxing-scanner>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-56 h-56 border-2 border-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/20 relative">
                <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-full h-0.5 bg-emerald-400/60 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-center">
              <p class="text-white text-xs font-medium">Apunta la cámara al código QR del estudiante</p>
            </div>
          </div>
          <p *ngIf="scannerError" class="text-xs text-rose-500 mt-2 text-center">{{ scannerError }}</p>
        </div>

        <!-- Formulario manual -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" [hidden]="scannerActive">
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
export class StudentCheckpointComponent implements OnInit {
  private attendanceService = inject(AttendanceService);

  qrCode = '';
  checkpoint = 'entrada';
  marking = false;
  lastResult: any = null;
  todayRecords: any[] = [];
  today = new Date().toISOString().split('T')[0];

  scannerActive = false;
  scannerError = '';
  device: MediaDeviceInfo | undefined;
  qrFormats = [BarcodeFormat.QR_CODE];
  availableDevices: MediaDeviceInfo[] = [];

  get lateRecords(): any[] {
    return this.todayRecords.filter(r => r.status === 'tarde');
  }

  ngOnInit(): void {
    this.loadTodayRecords();
  }

  toggleScanner(): void {
    this.scannerActive = !this.scannerActive;
    this.scannerError = '';
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    if (!devices || devices.length === 0) return;
    this.availableDevices = devices;
    const backKeywords = ['back', 'trasera', 'rear', 'environment', 'facing back', 'camera2 0'];
    const back = devices.find(d => backKeywords.some(kw => d.label.toLowerCase().includes(kw)));
    this.device = back || devices[devices.length - 1] || devices[0];
  }

  onCamerasNotFound(): void {
    this.scannerError = 'No se encontraron cámaras disponibles.';
  }

  onPermissionResponse(granted: boolean): void {
    if (!granted) {
      this.scannerError = 'No se pudo acceder a la cámara. Verifica los permisos del navegador.';
    }
  }

  handleQrScan(result: string): void {
    if (!result) return;
    this.qrCode = result;
    this.scannerActive = false;
    this.markCheckpoint();
  }

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
