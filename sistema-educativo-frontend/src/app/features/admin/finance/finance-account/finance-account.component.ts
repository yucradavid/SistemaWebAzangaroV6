//src/app/features/admin/finance/finance-account/finance-account.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceStudentComponent } from '../charges/finance-student.component';
import { FinanceCashComponent } from '../cash/finance-cash.component';
import { FinanceClosuresComponent } from '../cash/finance-closures.component';

export type FinanceAccountTab = 'student' | 'cash' | 'closures';

/**
 * Fusion de Cuenta Corriente + Caja Diaria + Cierres de Caja en un solo
 * modulo con pestanas (mismo patron de tabs por queryParam que
 * finance-catalog.component.ts). Cada pestana sigue siendo el componente
 * original tal cual (con su propio back-button y estado), solo se
 * embebe en lugar de rutear a una pagina aparte.
 */
@Component({
  selector: 'app-finance-account',
  standalone: true,
  imports: [CommonModule, FinanceStudentComponent, FinanceCashComponent, FinanceClosuresComponent],
  template: `
    <div class="max-w-7xl mx-auto px-6 sm:px-10 pt-6 sm:pt-10">
      <div class="flex flex-wrap gap-3">
        <button type="button" (click)="setTab('student')" [class]="tabButtonClass('student')">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Cuenta Corriente
        </button>
        <button type="button" (click)="setTab('cash')" [class]="tabButtonClass('cash')">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Caja Diaria
        </button>
        <button type="button" (click)="setTab('closures')" [class]="tabButtonClass('closures')">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
          Cierres
        </button>
      </div>
    </div>

    <app-finance-student *ngIf="opened.student" [hidden]="activeTab !== 'student'"></app-finance-student>
    <app-finance-cash *ngIf="opened.cash" [hidden]="activeTab !== 'cash'"></app-finance-cash>
    <app-finance-closures *ngIf="opened.closures" [hidden]="activeTab !== 'closures'"></app-finance-closures>
  `
})
export class FinanceAccountComponent implements OnInit {
  activeTab: FinanceAccountTab = 'student';

  // Carga perezosa: cada pestana instancia su componente (y dispara su
  // propia carga de datos) solo la primera vez que se abre.
  opened: Record<FinanceAccountTab, boolean> = { student: false, cash: false, closures: false };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab') as FinanceAccountTab | null;
      if (tab === 'student' || tab === 'cash' || tab === 'closures') {
        this.activeTab = tab;
      }
      this.opened[this.activeTab] = true;
    });
  }

  setTab(tab: FinanceAccountTab): void {
    this.activeTab = tab;
    this.opened[tab] = true;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  tabButtonClass(tab: FinanceAccountTab): string {
    const base = 'px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 border active:scale-95';
    return this.activeTab === tab
      ? base + ' bg-cermat-blue-700 text-white border-cermat-blue-700 shadow-md'
      : base + ' bg-white text-slate-600 border-slate-200 hover:border-cermat-blue-300 hover:text-cermat-blue-700';
  }
}
