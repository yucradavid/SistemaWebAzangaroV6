import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Period } from './academic.service';

/**
 * Estado global del trimestre/periodo seleccionado en el navbar.
 * Lo consumen los modulos (notas, asistencia, ...) para filtrar por period_id.
 */
@Injectable({ providedIn: 'root' })
export class PeriodContextService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private selectedPeriodSubject = new BehaviorSubject<Period | null>(null);
  selectedPeriod$ = this.selectedPeriodSubject.asObservable();

  private periodsSubject = new BehaviorSubject<Period[]>([]);
  periods$ = this.periodsSubject.asObservable();

  private loaded = false;

  get currentPeriod(): Period | null {
    return this.selectedPeriodSubject.getValue();
  }

  get currentPeriodId(): string | null {
    return this.currentPeriod?.id ?? null;
  }

  /**
   * Carga los periodos una sola vez. Si ya se cargaron, no vuelve a pedirlos
   * (evita llamadas duplicadas cuando el layout se reinicializa).
   */
  loadPeriods(force = false): void {
    if (this.loaded && !force) {
      return;
    }
    this.loaded = true;

    this.http.get<any>(`${this.apiUrl}/periods`, { params: { per_page: '50' } }).subscribe({
      next: (res) => {
        const periods: Period[] = this.extractPeriods(res);
        // Orden: año academico desc y numero de periodo desc (mas reciente primero).
        periods.sort((a, b) => {
          const yearA = a.academic_year?.year ?? a.academicYear?.year ?? 0;
          const yearB = b.academic_year?.year ?? b.academicYear?.year ?? 0;
          if (yearA !== yearB) return Number(yearB) - Number(yearA);
          return (b.period_number ?? 0) - (a.period_number ?? 0);
        });

        this.periodsSubject.next(periods);

        // Mantener seleccion previa si sigue existiendo.
        const previousId = this.currentPeriodId;
        if (previousId && periods.some((p) => p.id === previousId)) {
          return;
        }

        // Default: el periodo "Actual" (is_closed = false) mas reciente.
        // Si no hay ninguno abierto, caer al periodo mas reciente disponible.
        const active = periods.find((p) => !p.is_closed) ?? periods[0] ?? null;
        this.selectedPeriodSubject.next(active);
      },
      error: () => {
        this.loaded = false; // permitir reintento
        this.periodsSubject.next([]);
      }
    });
  }

  selectPeriod(period: Period): void {
    this.selectedPeriodSubject.next(period);
  }

  private extractPeriods(res: any): Period[] {
    if (Array.isArray(res)) return res as Period[];
    if (Array.isArray(res?.data)) return res.data as Period[];
    if (Array.isArray(res?.data?.data)) return res.data.data as Period[];
    return [];
  }
}
