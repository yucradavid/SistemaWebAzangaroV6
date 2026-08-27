import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminQrSessionComponent } from '../admin-qr-session/admin-qr-session.component';
import { StudentCheckpointComponent } from '../student-checkpoint/student-checkpoint.component';

export type AsistenciaQrTab = 'aula' | 'registro';

/**
 * Fusion de "Sesion QR Aula" + "Checkpoint Auxiliar" en un solo modulo con
 * pestanas (mismo patron de tabs por queryParam que finance-account.component.ts).
 * Cada pestana sigue siendo el componente original tal cual (con su propia
 * logica de escaneo/QR), solo se embebe en lugar de rutear a una pagina aparte.
 */
@Component({
  selector: 'app-asistencia-qr',
  standalone: true,
  imports: [CommonModule, AdminQrSessionComponent, StudentCheckpointComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 pt-6">
      <div class="flex flex-wrap gap-3">
        <button type="button" (click)="setTab('aula')" [class]="tabButtonClass('aula')">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          Sesion QR (Aula)
        </button>
        <button type="button" (click)="setTab('registro')" [class]="tabButtonClass('registro')">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" x2="17" y1="12" y2="12"/></svg>
          Registro Manual / Escaneo
        </button>
      </div>
    </div>

    <app-admin-qr-session *ngIf="opened.aula" [hidden]="activeTab !== 'aula'"></app-admin-qr-session>
    <app-student-checkpoint *ngIf="opened.registro" [hidden]="activeTab !== 'registro'"></app-student-checkpoint>
  `
})
export class AsistenciaQrComponent implements OnInit {
  activeTab: AsistenciaQrTab = 'aula';

  // Carga perezosa: cada pestana instancia su componente (y dispara su
  // propia carga de datos) solo la primera vez que se abre.
  opened: Record<AsistenciaQrTab, boolean> = { aula: false, registro: false };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab') as AsistenciaQrTab | null;
      if (tab === 'aula' || tab === 'registro') {
        this.activeTab = tab;
      }
      this.opened[this.activeTab] = true;
    });
  }

  setTab(tab: AsistenciaQrTab): void {
    this.activeTab = tab;
    this.opened[tab] = true;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  tabButtonClass(tab: AsistenciaQrTab): string {
    const base = 'px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 border active:scale-95';
    return this.activeTab === tab
      ? base + ' bg-cermat-blue-700 text-white border-cermat-blue-700 shadow-md'
      : base + ' bg-white text-slate-600 border-slate-200 hover:border-cermat-blue-300 hover:text-cermat-blue-700';
  }
}
