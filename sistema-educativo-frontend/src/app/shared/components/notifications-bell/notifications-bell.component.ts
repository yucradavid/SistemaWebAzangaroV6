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
  template: `
    <div class="relative">
      <!-- Botón campana -->
      <button
        type="button"
        (click)="toggle()"
        class="relative p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200 hover:text-white"
        title="Notificaciones">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span *ngIf="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#1e3a8a]">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </button>

      <!-- Backdrop para cerrar al hacer click fuera -->
      <div *ngIf="isOpen" class="fixed inset-0 z-40" (click)="close()"></div>

      <!-- Dropdown -->
      <div *ngIf="isOpen"
        class="absolute right-0 top-full mt-2 w-[340px] sm:w-[400px] max-h-[70vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl z-50 text-slate-700">
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <span class="text-sm font-bold text-slate-800">Notificaciones</span>
          <button *ngIf="unreadCount > 0" type="button" (click)="markAllAsRead()"
            class="text-[11px] font-bold text-cermat-blue-700 hover:underline">
            Marcar todas como leídas
          </button>
        </div>

        <div *ngIf="notifications.length === 0" class="px-4 py-8 text-center text-sm text-slate-400 font-medium">
          No tienes notificaciones.
        </div>

        <div *ngFor="let n of notifications"
          (click)="onNotificationClick(n)"
          class="px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50"
          [ngClass]="n.status === 'no_leida' ? 'bg-blue-50/60' : ''">
          <div class="flex items-start gap-2">
            <span *ngIf="n.status === 'no_leida'" class="mt-1.5 w-2 h-2 rounded-full bg-cermat-blue-600 shrink-0"></span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-slate-800">{{ n.title || 'Notificación' }}</p>
              <p class="text-xs text-slate-500 mt-0.5 leading-snug">{{ n.message }}</p>
              <p class="text-[10px] text-slate-400 mt-1">{{ n.created_at | date:'dd/MM/yyyy HH:mm' }}</p>

              <!-- Acciones inline para solicitudes de reapertura pendientes -->
              <div *ngIf="isActionableReopen(n)" class="flex gap-2 mt-2">
                <button type="button"
                  (click)="approve(n, $event)"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors active:scale-95">
                  ✅ Aprobar
                </button>
                <button type="button"
                  (click)="reject(n, $event)"
                  class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors active:scale-95">
                  ❌ Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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
