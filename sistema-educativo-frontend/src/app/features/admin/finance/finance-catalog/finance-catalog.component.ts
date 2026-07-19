//src/app/features/admin/finance/finance-catalog/finance-catalog.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { FinanceService } from '@core/services/finance.service';
import { FinanceConceptsComponent } from '../catalog/finance-concepts.component';
import { FinancePlansComponent } from '../catalog/finance-plans.component';
import { FinanceDiscountsComponent } from '../catalog/finance-discounts.component';

export type FinanceCatalogTab = 'concepts' | 'plans' | 'discounts';

@Component({
  selector: 'app-finance-catalog',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FinanceConceptsComponent, FinancePlansComponent, FinanceDiscountsComponent],
  templateUrl: './finance-catalog.component.html',
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class FinanceCatalogComponent implements OnInit {
  activeTab: FinanceCatalogTab = 'concepts';

  // Controla la carga perezosa: cada tab instancia su componente
  // (y dispara su propia carga de datos) solo la primera vez que se abre.
  opened: Record<FinanceCatalogTab, boolean> = { concepts: false, plans: false, discounts: false };

  counts: Record<FinanceCatalogTab, number> = { concepts: 0, plans: 0, discounts: 0 };

  // Concepto a resaltar cuando se navega desde el chip de un plan
  highlightConceptId: string | null = null;

  constructor(
    private financeService: FinanceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshCounts();

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab') as FinanceCatalogTab | null;
      if (tab === 'concepts' || tab === 'plans' || tab === 'discounts') {
        this.activeTab = tab;
      }
      this.opened[this.activeTab] = true;
    });
  }

  setTab(tab: FinanceCatalogTab): void {
    this.activeTab = tab;
    this.opened[tab] = true;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onConceptChipClick(conceptId: string): void {
    // Se resetea primero para que Angular detecte el cambio incluso si
    // el usuario hace click dos veces seguidas en el mismo concepto.
    this.highlightConceptId = null;
    this.setTab('concepts');
    setTimeout(() => {
      this.highlightConceptId = conceptId;
    });
  }

  tabButtonClass(tab: FinanceCatalogTab): string {
    const base = 'px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 border active:scale-95';
    return this.activeTab === tab
      ? base + ' bg-cermat-blue-700 text-white border-cermat-blue-700 shadow-md'
      : base + ' bg-white text-slate-600 border-slate-200 hover:border-cermat-blue-300 hover:text-cermat-blue-700';
  }

  private refreshCounts(): void {
    this.financeService.getConcepts({ per_page: 200 }).subscribe({
      next: (res) => (this.counts.concepts = this.financeService.unwrapItems(res).length),
    });
    this.financeService.getPlans({ per_page: 200 }).subscribe({
      next: (res) => (this.counts.plans = this.financeService.unwrapItems(res).length),
    });
    this.financeService.getDiscounts({ per_page: 200 }).subscribe({
      next: (res) => (this.counts.discounts = this.financeService.unwrapItems(res).length),
    });
  }
}
