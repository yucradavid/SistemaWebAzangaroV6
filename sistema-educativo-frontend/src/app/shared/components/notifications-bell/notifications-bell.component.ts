import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
 * - Al hacer click en un item se marca como leida y, si el tipo tiene una
 *   ruta conocida para el rol del usuario actual, navega ahi (ver
 *   resolveLink). El mapeo es por rol del VIEWER, nunca por datos de la
 *   notificacion, para no poder terminar en una ruta de otro rol.
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
          class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-cermat-blue-700">
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
          [ngClass]="[n.status === 'no_leida' ? (isTutoria(n) ? '' : 'bg-blue-50/60') : '', getTypeAccentClass(n.type)]">
          <div class="flex items-start gap-2">
            <svg *ngIf="isTutoria(n)" class="mt-0.5 w-4 h-4 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
            <span *ngIf="!isTutoria(n) && n.status === 'no_leida'" class="mt-1.5 w-2 h-2 rounded-full bg-cermat-blue-600 shrink-0"></span>
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
  private router = inject(Router);

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

  isTutoria(n: AppNotification): boolean {
    return n.type === 'tutoria_registrada';
  }

  getTypeAccentClass(type: string): string {
    if (type === 'tutoria_registrada') {
      return 'border-l-4 border-rose-500 bg-rose-50/40';
    }

    return '';
  }

  isActionableReopen(n: AppNotification): boolean {
    return this.isApprover
      && n.type === 'solicitud_reapertura'
      && n.related_entity_type === 'evaluation_reopen_request'
      && !!n.related_entity_id
      && this.pendingReopenIds.has(n.related_entity_id);
  }

  onNotificationClick(n: AppNotification): void {
    if (n.status === 'no_leida') {
      this.notificationService.markAsRead(n.id).subscribe({
        next: () => {
          n.status = 'leida';
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    }

    const link = this.resolveLink(n);
    if (link) {
      this.close();
      this.router.navigateByUrl(link);
    }
  }

  // Ruta a la que navegar segun el tipo de notificacion y el rol del
  // usuario que la esta viendo (this.role, nunca datos de la notificacion
  // en si). Solo se mapean tipos que realmente se crean hoy en el backend
  // (tutoria_registrada, comunicado_nuevo, solicitud_reapertura) — el resto
  // del enum (pago_registrado, tarea_nueva, evaluacion_publicada, etc.) no
  // los crea ningun controller todavia, asi que no hay ruta que mapear con
  // evidencia real; se dejan sin accion (mismo comportamiento que hoy).
  private resolveLink(n: AppNotification): string | null {
    const role = this.role;
    // AuthService.mapBackendUser() traduce el rol 'guardian' que devuelve el
    // backend a 'apoderado' para el resto del frontend (ver getHomeRoute()/
    // isAdminWorkspaceRole(), que ya verifican ambos strings por el mismo
    // motivo) — this.role practicamente nunca vale 'guardian' en runtime,
    // asi que hay que comprobar los dos.
    const isGuardian = role === 'apoderado' || role === 'guardian';

    if (n.type === 'tutoria_registrada') {
      if (role === 'student') return '/app/student/tutoria';
      if (isGuardian) return '/app/apoderado/comunicacion/mensajeria';
      if (role === 'teacher') return '/app/teacher/comunicacion/mensajeria';
      if (role && ['admin', 'director', 'coordinator', 'secretary'].includes(role)) return '/app/messages/admin';
      return null;
    }

    if (n.type === 'comunicado_nuevo') {
      // Mismo type se usa tanto para "nuevo mensaje" (MessageController) como
      // para "tu comunicado fue aprobado/archivado" (AnnouncementController).
      // Para guardian es siempre lo primero; para admin-tier es siempre lo
      // segundo; para teacher es ambiguo, se prioriza el caso mas frecuente.
      if (isGuardian) return '/app/apoderado/comunicacion/mensajeria';
      if (role === 'teacher') return '/app/teacher/comunicacion/mensajeria';
      if (role && ['admin', 'director', 'coordinator', 'secretary'].includes(role)) return '/app/communications/admin';
      return null;
    }

    if (n.type === 'solicitud_reapertura') {
      // Admin-tier ya tiene las acciones Aprobar/Rechazar inline en la propia
      // campana (ver isActionableReopen) — no hace falta navegar.
      if (role === 'teacher') return '/app/teacher/academico/evaluacion';
      return null;
    }

    return null;
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
