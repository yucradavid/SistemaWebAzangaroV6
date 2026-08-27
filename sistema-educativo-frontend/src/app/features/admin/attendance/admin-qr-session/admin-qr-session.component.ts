import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fireIosSwal } from '@shared/utils/ios-swal';
import * as QRCode from 'qrcode';
import { interval, Subscription } from 'rxjs';
import {
  AttendanceAssignment,
  AttendanceService,
  DailyAttendanceCheckpoint,
  DailyAttendanceQrSession,
} from '@core/services/attendance.service';

/**
 * Simplificado a solo 2 botones (Entrada/Salida) para generar el QR que los
 * docentes escanean con su propio celular para autoregistrar su asistencia
 * (ver DailyAttendanceController::selfCheckpoint, rama "teacher"). El
 * section_id/academic_year_id de la sesion es metadata: ensureCanManageSection
 * solo restringe a usuarios con rol "teacher", asi que para un admin cualquier
 * asignacion activa sirve y no hace falta pedirle que elija aula/seccion.
 */
@Component({
  selector: 'app-admin-qr-session',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-6">
      <div *ngIf="loading" class="text-center py-12 text-slate-400">Cargando...</div>
      <div *ngIf="!loading && error" class="text-center py-12 text-rose-500 text-sm">{{ error }}</div>

      <div *ngIf="!loading && !error" class="flex flex-col sm:flex-row gap-4 justify-center items-center py-8">
        <button (click)="generateSession('entrada')"
                class="flex items-center gap-3 bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-emerald-700 transition-all">
          <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Generar QR Docentes — Entrada
        </button>

        <button (click)="generateSession('salida')"
                class="flex items-center gap-3 bg-amber-600 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-amber-700 transition-all">
          <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Generar QR Docentes — Salida
        </button>
      </div>
    </div>
  `
})
export class AdminQrSessionComponent implements OnInit, AfterViewInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private timerSubscription?: Subscription;

  loading = false;
  error = '';

  selectedDate = new Date().toISOString().split('T')[0];
  assignment: AttendanceAssignment | null = null;
  dailyAttendance: { qr_sessions?: DailyAttendanceQrSession[] } | null = null;
  qrCountdown = '';

  ngOnInit(): void {
    this.loadContext();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadContext(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.getTeacherAttendanceContext().subscribe({
      next: (response) => {
        const assignments = response.assignments || [];
        if (assignments.length === 0) {
          this.error = 'No hay asignaciones activas para generar sesiones QR.';
          this.loading = false;
          return;
        }
        this.assignment = assignments[0];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar el contexto.';
        this.loading = false;
      }
    });
  }

  generateSession(checkpoint: DailyAttendanceCheckpoint): void {
    if (!this.assignment) return;

    this.attendanceService.createDailyQrSession({
      section_id: this.assignment.section_id,
      academic_year_id: this.assignment.academic_year_id || '',
      date: this.selectedDate,
      checkpoint,
      late_after_minutes: checkpoint === 'entrada' ? 10 : 0,
      expires_in_minutes: 20,
    }).subscribe({
      next: ({ data }) => this.openQrModal(data, checkpoint),
      error: (err) => {
        void fireIosSwal({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudo abrir la sesión QR.',
          confirmButtonText: 'Entendido',
        });
      }
    });
  }

  private async openQrModal(data: DailyAttendanceQrSession, checkpoint: DailyAttendanceCheckpoint): Promise<void> {
    try {
      const payload = data.qr_payload || '';
      const expiryTime = this.parseUtcDate(data.expires_at);

      const qrDataUrl = await QRCode.toDataURL(payload, {
        width: 450,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
      });

      this.updateCountdown(expiryTime);
      this.startTimer(expiryTime);

      const checkpointLabel = checkpoint === 'entrada' ? 'Entrada QR' : 'Salida QR';

      void fireIosSwal({
        title: checkpointLabel,
        html: `
          <div class="flex flex-col items-center p-4">
            <div class="relative bg-white p-4 rounded-3xl shadow-xl border border-slate-100 mb-4">
              <img src="${qrDataUrl}" alt="QR Code" style="width:450px;height:450px;">
            </div>
            <div class="bg-slate-50 w-full rounded-2xl p-4 border border-slate-200/60 mb-4">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Código de Respaldo</p>
              <p class="text-3xl font-black text-blue-600 tracking-widest text-center tabular-nums">${data.session_code}</p>
            </div>
            <div class="flex items-center gap-3 text-slate-500">
              <div class="flex flex-col items-center">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expira en</span>
                <span id="qr-timer-display" class="text-5xl font-black text-slate-800 tabular-nums">${this.qrCountdown}</span>
              </div>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Cerrar',
        width: '650px',
        didOpen: () => {
          const timerDisplay = document.getElementById('qr-timer-display');
          const intervalId = setInterval(() => {
            if (timerDisplay) {
              timerDisplay.innerText = this.qrCountdown;
            } else {
              clearInterval(intervalId);
            }
          }, 500);
        },
        willClose: () => {
          this.stopTimer();
        }
      });
    } catch {
      void fireIosSwal({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el código QR visual.',
        confirmButtonText: 'Entendido',
      });
    }
  }

  private parseUtcDate(dateStr: string | null | undefined): number {
    if (!dateStr) return Date.now() + 20 * 60000;
    const p = dateStr.match(/\d+/g);
    if (p && p.length >= 6) {
      return Date.UTC(
        parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10),
        parseInt(p[3], 10), parseInt(p[4], 10), parseInt(p[5], 10)
      );
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? Date.now() + 20 * 60000 : date.getTime();
  }

  private startTimer(expiryTime: number): void {
    this.stopTimer();
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateCountdown(expiryTime);
    });
  }

  private updateCountdown(targetTime: number): void {
    const now = new Date().getTime();
    let distance = targetTime - now;

    if (distance > 30 * 60 * 1000) {
      distance -= 5 * 60 * 60 * 1000;
    }

    if (distance < 0) {
      this.qrCountdown = '00:00';
      this.stopTimer();
      return;
    }

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    this.qrCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }
}
