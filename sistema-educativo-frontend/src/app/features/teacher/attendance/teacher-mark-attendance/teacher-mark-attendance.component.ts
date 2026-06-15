import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { AttendanceService, DailyAttendanceCheckpoint } from '@core/services/attendance.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-teacher-mark-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule, BackButtonComponent],
  templateUrl: './teacher-mark-attendance.component.html',
})
export class TeacherMarkAttendanceComponent implements AfterViewInit {
  private attendanceService = inject(AttendanceService);

  ngAfterViewInit(): void {
    createIcons({ icons });
  }

  personalQrInputEntrada = '';
  personalQrInputSalida = '';
  personalQrStatusEntrada: 'idle' | 'success' | 'error' = 'idle';
  personalQrStatusSalida: 'idle' | 'success' | 'error' = 'idle';
  personalQrMessageEntrada = '';
  personalQrMessageSalida = '';
  personalQrSubmittingEntrada = false;
  personalQrSubmittingSalida = false;
  showPersonalScannerEntrada = false;
  showPersonalScannerSalida = false;
  personalDevice: MediaDeviceInfo | undefined;
  personalQrFormats = [BarcodeFormat.QR_CODE];
  personalAvailableDevices: MediaDeviceInfo[] = [];
  personalTodayCheckpoints: { checkpoint: string; time: string }[] = [];

  togglePersonalScanner(checkpoint: DailyAttendanceCheckpoint): void {
    if (checkpoint === 'entrada') {
      this.showPersonalScannerEntrada = !this.showPersonalScannerEntrada;
      if (!this.showPersonalScannerEntrada) this.personalQrMessageEntrada = '';
    } else {
      this.showPersonalScannerSalida = !this.showPersonalScannerSalida;
      if (!this.showPersonalScannerSalida) this.personalQrMessageSalida = '';
    }
  }

  onPersonalCamerasFound(devices: MediaDeviceInfo[]): void {
    if (!devices || devices.length === 0) return;
    this.personalAvailableDevices = devices;
    const backKeywords = ['back', 'trasera', 'rear', 'environment', 'facing back', 'camera2 0'];
    const back = devices.find(d => backKeywords.some(kw => d.label.toLowerCase().includes(kw)));
    this.personalDevice = back || devices[devices.length - 1] || devices[0];
  }

  handlePersonalQrScan(result: string, checkpoint: DailyAttendanceCheckpoint): void {
    if (!result) return;
    let code = result;
    if (result.startsWith('CERMAT_ATTENDANCE|')) {
      const match = result.match(/session=([^|]+)/i);
      if (!match?.[1]) return;
      code = match[1];
    }
    if (checkpoint === 'entrada') {
      this.personalQrInputEntrada = code;
    } else {
      this.personalQrInputSalida = code;
    }
    this.submitPersonalCheckin(checkpoint);
  }

  submitPersonalCheckin(checkpoint: DailyAttendanceCheckpoint): void {
    const rawInput = checkpoint === 'entrada' ? this.personalQrInputEntrada : this.personalQrInputSalida;

    if (!rawInput.trim()) {
      this.setPersonalStatus(checkpoint, 'error', 'Ingresa o escanea el código QR.');
      return;
    }

    let code = rawInput.trim();
    if (code.startsWith('CERMAT_ATTENDANCE|')) {
      const m = code.match(/session=([^|]+)/i);
      code = m ? m[1] : code;
    }
    code = code.toUpperCase();

    if (!/^[A-Z0-9]{8}$/.test(code)) {
      this.setPersonalStatus(checkpoint, 'error', 'Código inválido. Debe tener 8 caracteres alfanuméricos.');
      return;
    }

    if (checkpoint === 'entrada') {
      this.personalQrSubmittingEntrada = true;
    } else {
      this.personalQrSubmittingSalida = true;
    }
    this.setPersonalStatus(checkpoint, 'idle', '');

    this.attendanceService.submitStudentDailyQr(code).subscribe({
      next: (response) => {
        this.setPersonalStatus(checkpoint, 'success', response.message);
        if (checkpoint === 'entrada') {
          this.personalQrSubmittingEntrada = false;
          this.personalQrInputEntrada = '';
          this.showPersonalScannerEntrada = false;
        } else {
          this.personalQrSubmittingSalida = false;
          this.personalQrInputSalida = '';
          this.showPersonalScannerSalida = false;
        }
        const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        this.personalTodayCheckpoints = this.personalTodayCheckpoints.filter(c => c.checkpoint !== response.checkpoint);
        this.personalTodayCheckpoints.push({ checkpoint: response.checkpoint, time });
        setTimeout(() => this.setPersonalStatus(checkpoint, 'idle', ''), 5000);
      },
      error: (err) => {
        this.setPersonalStatus(checkpoint, 'error', err?.error?.message || 'No se pudo registrar la asistencia.');
        if (checkpoint === 'entrada') {
          this.personalQrSubmittingEntrada = false;
        } else {
          this.personalQrSubmittingSalida = false;
        }
      }
    });
  }

  private setPersonalStatus(checkpoint: DailyAttendanceCheckpoint, status: 'idle' | 'success' | 'error', message: string): void {
    if (checkpoint === 'entrada') {
      this.personalQrStatusEntrada = status;
      this.personalQrMessageEntrada = message;
    } else {
      this.personalQrStatusSalida = status;
      this.personalQrMessageSalida = message;
    }
  }

  get personalTodayEntry() { return this.personalTodayCheckpoints.find(c => c.checkpoint === 'entrada') ?? null; }
  get personalTodayExit()  { return this.personalTodayCheckpoints.find(c => c.checkpoint === 'salida') ?? null; }
}
