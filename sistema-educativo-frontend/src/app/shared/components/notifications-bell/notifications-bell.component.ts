import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, timer } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '@core/services/auth.service';
import { NotificationService, AppNotification } from '@core/services/notification.service';
import { EvaluationService, EvaluationReopenRequest } from '@core/services/evaluation.service';

/**
 * Campana de notificaciones del navbar privado.
 * - Badge con no leídas + dropdown con las últimas 10 (polling cada 30s).
 * - Para admin/director/coordinator: acciones inline Aprobar/Rechazar sobre
 *   solicitudes de reapertura de notas aún pendientes.
 */
@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-bell.component.html'
})
export class NotificationsBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private evaluationService = inject(EvaluationService);
  private authService = inject(AuthService);

  isOpen = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;

  private pendingReopenIds = new Set<string>();
  private role: string | null = null;
  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe(user => {
        this.role = user?.role ?? null;
      })
    );

    // Polling cada 30s (primer disparo inmediato)
    this.subs.add(timer(0, 30000).subscribe(() => this.refresh()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get isApprover(): boolean {
    return this.role === 'admin' || this.role === 'director' || this.role === 'coordinator';
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.refresh();
    }
  }

  close(): void {
    this.isOpen = false;
  }

  refresh(): void {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        const items: AppNotification[] = Array.isArray(res?.data) ? res.data : [];
        this.unreadCount = items.filter(n => n.status === 'no_leida').length;
        this.notifications = items.slice(0, 10);
      },
      error: () => { /* silencioso: el polling reintenta */ }
    });

    if (this.isApprover) {
      this.evaluationService.getReopenRequests({ status: 'pendiente', per_page: 100 }).subscribe({
        next: (res) => {
          const rows: EvaluationReopenRequest[] = Array.isArray(res?.data) ? res.data : [];
          this.pendingReopenIds = new Set(rows.map(r => r.id));
        },
        error: () => { /* silencioso */ }
      });
    }
  }

  isActionableReopen(n: AppNotification): boolean {
    return this.isApprover
      && n.type === 'solicitud_reapertura'
      && n.related_entity_type === 'evaluation_reopen_request'
      && !!n.related_entity_id
      && this.pendingReopenIds.has(n.related_entity_id);
  }

  onNotificationClick(n: AppNotification): void {
    if (n.status !== 'no_leida') {
      return;
    }

    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        n.status = 'leida';
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.status = 'leida');
        this.unreadCount = 0;
      }
    });
  }

  approve(n: AppNotification, event: Event): void {
    event.stopPropagation();

    Swal.fire({
      icon: 'question',
      title: '¿Aprobar reapertura?',
      text: 'El docente podrá editar la nota publicada durante 24 horas.',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b'
    }).then(result => {
      if (!result.isConfirmed || !n.related_entity_id) {
        return;
      }

      this.evaluationService.approveReopenRequest(n.related_entity_id).subscribe({
        next: () => {
          this.pendingReopenIds.delete(n.related_entity_id!);
          this.onNotificationClick(n);
          this.toast('success', 'Solicitud aprobada. El docente tiene 24h para editar.');
          this.refresh();
        },
        error: (err) => this.showError(err, 'No se pudo aprobar la solicitud.')
      });
    });
  }

  reject(n: AppNotification, event: Event): void {
    event.stopPropagation();

    Swal.fire({
      title: 'Rechazar solicitud',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Explica por qué se rechaza la solicitud...',
      inputValidator: (value) => (!value || value.trim().length < 3) ? 'Escribe un motivo (mínimo 3 caracteres).' : undefined,
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b'
    }).then(result => {
      if (!result.isConfirmed || !result.value || !n.related_entity_id) {
        return;
      }

      this.evaluationService.rejectReopenRequest(n.related_entity_id, String(result.value).trim()).subscribe({
        next: () => {
          this.pendingReopenIds.delete(n.related_entity_id!);
          this.onNotificationClick(n);
          this.toast('success', 'Solicitud rechazada.');
          this.refresh();
        },
        error: (err) => this.showError(err, 'No se pudo rechazar la solicitud.')
      });
    });
  }

  private toast(icon: 'success' | 'error', title: string): void {
    Swal.fire({ icon, title, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
  }

  private showError(err: any, fallback: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || fallback });
  }
}
