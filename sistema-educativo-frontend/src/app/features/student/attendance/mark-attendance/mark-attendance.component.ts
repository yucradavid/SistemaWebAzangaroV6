import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import { AttendanceService, DailyAttendanceCheckpoint } from '@core/services/attendance.service';
import { ReportService, StudentDailyAttendanceRecord } from '@core/services/report.service';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZXingScannerModule, BackButtonComponent],
  templateUrl: './mark-attendance.component.html',
  styles: [`
    :host { display: block; background: #F8FAFC; min-height: 100vh; }

    @keyframes scan {
      0%, 100% { top: 0%; }
      50% { top: 100%; }
    }
    .animate-scan {
      animation: scan 2s linear infinite;
    }
  `]
})
export class MarkAttendanceComponent implements OnInit, AfterViewInit {
  private location = inject(Location);
  private authService = inject(AuthService);
  private reportService = inject(ReportService);
  private attendanceService = inject(AttendanceService);
  private route = inject(ActivatedRoute);

  loading = false;
  error = '';
  qrSubmittingEntrada = false;
  qrSubmittingSalida = false;
  qrMessageEntrada = '';
  qrMessageSalida = '';
  qrStatusEntrada: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  qrStatusSalida: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  qrCodeInputEntrada = '';
  qrCodeInputSalida = '';
  courseId: string | null = null;
  studentContext: AcademicContextStudent | null = null;
  todayRecord: StudentDailyAttendanceRecord | null = null;

  // QR Scanner State
  scannerCheckpoint: DailyAttendanceCheckpoint | null = null;
  hasDevices = false;
  hasPermission = false;
  qrFormats = [BarcodeFormat.QR_CODE];
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;

  get showScanner(): boolean {
    return this.scannerCheckpoint !== null;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['course_id']) {
        this.courseId = params['course_id'];
      }
    });
    this.loadAcademicContext();
  }

  ngAfterViewInit(): void {
    createIcons({ icons });
  }

  goBack(): void {
    this.location.back();
  }

  submitQrCheckpoint(checkpoint: DailyAttendanceCheckpoint): void {
    const rawInput = checkpoint === 'entrada' ? this.qrCodeInputEntrada : this.qrCodeInputSalida;

    if (!rawInput.trim()) {
      this.setQrStatus(checkpoint, 'error', 'Ingresa o escanea el código QR.');
      return;
    }

    let sessionCode = rawInput.trim();
    if (sessionCode.startsWith('CERMAT_ATTENDANCE|')) {
      const match = sessionCode.match(/session=([^|]+)/i);
      sessionCode = match ? match[1] : sessionCode;
    }
    sessionCode = sessionCode.toUpperCase();

    const QR_PATTERN = /^[A-Z0-9]{8}$/;
    if (!QR_PATTERN.test(sessionCode)) {
      this.setQrStatus(checkpoint, 'error', 'Código inválido. Debe tener exactamente 8 caracteres alfanuméricos.');
      return;
    }

    if (checkpoint === 'entrada') {
      this.qrSubmittingEntrada = true;
    } else {
      this.qrSubmittingSalida = true;
    }
    this.setQrStatus(checkpoint, 'idle', '');

    this.attendanceService.submitStudentDailyQr(sessionCode).subscribe({
      next: (response) => {
        this.setQrStatus(checkpoint, 'success', response.message);
        if (checkpoint === 'entrada') {
          this.qrSubmittingEntrada = false;
          this.qrCodeInputEntrada = '';
        } else {
          this.qrSubmittingSalida = false;
          this.qrCodeInputSalida = '';
        }
        this.scannerCheckpoint = null;
        this.loadTodayRecord();
        setTimeout(() => this.setQrStatus(checkpoint, 'idle', ''), 5000);
      },
      error: (error) => {
        this.setQrStatus(checkpoint, 'error', error?.error?.message || 'No se pudo registrar la asistencia.');
        if (checkpoint === 'entrada') {
          this.qrSubmittingEntrada = false;
        } else {
          this.qrSubmittingSalida = false;
        }
      }
    });
  }

  private setQrStatus(checkpoint: DailyAttendanceCheckpoint, status: 'idle' | 'loading' | 'success' | 'error', message: string): void {
    if (checkpoint === 'entrada') {
      this.qrStatusEntrada = status;
      this.qrMessageEntrada = message;
    } else {
      this.qrStatusSalida = status;
      this.qrMessageSalida = message;
    }
  }

  // QR Scanner Methods
  toggleScanner(checkpoint: DailyAttendanceCheckpoint): void {
    if (this.scannerCheckpoint === checkpoint) {
      this.scannerCheckpoint = null;
    } else {
      this.scannerCheckpoint = checkpoint;
    }
  }

  closeScanner(): void {
    this.scannerCheckpoint = null;
  }

  handleQrCodeScan(result: string): void {
    if (!result || !this.scannerCheckpoint) return;
    const checkpoint = this.scannerCheckpoint;

    // Parse Payload: CERMAT_ATTENDANCE|session=CODE|checkpoint=TYPE|date=YYYY-MM-DD
    if (result.startsWith('CERMAT_ATTENDANCE|')) {
      const parts = result.split('|');
      const sessionPart = parts.find(p => p.startsWith('session='));
      if (sessionPart) {
        const code = sessionPart.split('=')[1];
        if (code) {
          this.setQrCodeInput(checkpoint, code);
          this.submitQrCheckpoint(checkpoint);
        }
      }
    } else {
      // Direct code or unknown format
      this.setQrCodeInput(checkpoint, result);
      this.submitQrCheckpoint(checkpoint);
    }
  }

  private setQrCodeInput(checkpoint: DailyAttendanceCheckpoint, value: string): void {
    if (checkpoint === 'entrada') {
      this.qrCodeInputEntrada = value;
    } else {
      this.qrCodeInputSalida = value;
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    if (!devices || devices.length === 0) return;

    this.availableDevices = devices;
    this.hasDevices = true;

    const backKeywords = ['back', 'trasera', 'rear', 'environment',
                          'facing back', 'camera2 0', '0,'];

    const backCamera = devices.find(d => {
      const label = d.label.toLowerCase();
      return backKeywords.some(kw => label.includes(kw));
    });

    this.currentDevice = backCamera || devices[devices.length - 1] || devices[0];
  }

  onPermissionResponse(result: boolean): void {
    this.hasPermission = result;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      presente: 'Presente',
      tarde: 'Tarde',
      falta: 'Falta',
      justificado: 'Justificado'
    };
    return labels[status] || labels['presente'];
  }

  getCalendarBadgeClass(status: AttendanceStatus): string {
    return {
      presente: 'bg-green-50 text-green-700 border border-green-100',
      tarde: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
      falta: 'bg-red-50 text-red-700 border border-red-100',
      justificado: 'bg-blue-50 text-blue-700 border border-blue-100',
    }[status];
  }

  getOptionalCalendarBadgeClass(status?: AttendanceStatus | null): string {
    return status
      ? this.getCalendarBadgeClass(status)
      : 'bg-slate-200 text-slate-600 border border-slate-300';
  }

  private loadAcademicContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.studentContext = context.students?.[0] || null;
        if (!this.studentContext) {
          this.error = 'Tu usuario no tiene un estudiante vinculado.';
          this.loading = false;
          return;
        }
        this.loadTodayRecord();
      },
      error: () => {
        this.error = 'No se pudo obtener el contexto academico del estudiante.';
        this.loading = false;
      }
    });
  }

  private loadTodayRecord(): void {
    if (!this.studentContext?.id) {
      this.loading = false;
      return;
    }

    this.reportService.getAttendanceSummary(this.studentContext.id).subscribe({
      next: (response) => {
        this.todayRecord = response.today_record || null;
        this.loading = false;
      },
      error: () => {
        this.todayRecord = null;
        this.loading = false;
      }
    });
  }
}
