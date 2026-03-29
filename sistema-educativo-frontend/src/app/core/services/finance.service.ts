import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export type CollectionResponse<T> = PaginatedResponse<T> | T[] | { data?: T[] };

export interface FeeConcept {
  id: string;
  name: string;
  type: 'matricula' | 'pension' | 'interes' | 'certificado' | 'taller' | 'servicio' | 'otro';
  base_amount: number;
  periodicity: 'unico' | 'mensual' | 'anual' | 'opcional';
  is_active: boolean;
  description?: string | null;
  created_at?: string;
}

export interface PlanInstallment {
  id?: string;
  plan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  description?: string | null;
  created_at?: string;
}

export interface FinancialPlan {
  id: string;
  name: string;
  academic_year_id: string;
  concept_id: string;
  number_of_installments: number;
  installments_count?: number;
  total_amount?: number;
  description?: string | null;
  is_active: boolean;
  academic_year?: any;
  concept?: FeeConcept;
  installments?: PlanInstallment[];
}

export interface Discount {
  id: string;
  name: string;
  type: 'porcentaje' | 'monto_fijo';
  value: number;
  scope: 'todos' | 'pension' | 'matricula' | 'especifico';
  specific_concept_id?: string | null;
  is_active: boolean;
  description?: string | null;
  concept?: FeeConcept;
}

export interface StudentDiscount {
  id: string;
  student_id: string;
  discount_id: string;
  academic_year_id: string;
  notes?: string | null;
  assigned_by?: string | null;
  student?: any;
  discount?: Discount;
  academic_year?: any;
  assigned_by_user?: any;
  created_at?: string | null;
}

export interface Receipt {
  id: string;
  payment_id: string;
  student_id?: string | null;
  number?: string | null;
  issued_at?: string | null;
  total?: number | null;
  notes?: string | null;
  payment?: Payment;
  student?: any;
}

export interface Charge {
  id: string;
  student_id: string;
  academic_year_id: string;
  concept_id: string;
  type: string;
  status: 'pendiente' | 'pagado_parcial' | 'pagado' | 'vencido' | 'anulado' | string;
  amount: number;
  discount_amount?: number | null;
  paid_amount?: number | null;
  due_date?: string | null;
  notes?: string | null;
  created_by?: string | null;
  voided_at?: string | null;
  voided_by?: string | null;
  void_reason?: string | null;
  student?: any;
  concept?: FeeConcept;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  charge_id?: string | null;
  student_id?: string | null;
  amount: number;
  method: string;
  reference?: string | null;
  paid_at: string;
  notes?: string | null;
  voided_at?: string | null;
  voided_by?: string | null;
  void_reason?: string | null;
  student?: any;
  charge?: Charge | null;
  receipt?: Receipt | null;
}

export interface CashClosure {
  id: string;
  closure_date: string;
  opening_time?: string | null;
  closing_time?: string | null;
  opening_balance: number;
  cash_received: number;
  expected_balance: number;
  actual_balance: number;
  difference: number;
  notes?: string | null;
  closed_by?: string | null;
  cashier_id?: string | null;
  total_cash: number;
  total_cards: number;
  total_transfers: number;
  total_yape: number;
  total_plin: number;
  total_amount: number;
  payments_count: number;
  created_at?: string;
  cashier?: any;
  closed_by_user?: any;
}

type QueryFilters = Record<string, string | number | boolean | null | undefined>;

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getConcepts(filters: QueryFilters = {}): Observable<PaginatedResponse<FeeConcept>> {
    return this.http.get<PaginatedResponse<FeeConcept>>(`${this.apiUrl}/fee-concepts`, {
      params: this.buildParams(filters)
    });
  }

  createConcept(concept: Partial<FeeConcept>): Observable<FeeConcept> {
    return this.http.post<FeeConcept>(`${this.apiUrl}/fee-concepts`, concept);
  }

  updateConcept(id: string, concept: Partial<FeeConcept>): Observable<FeeConcept> {
    return this.http.put<FeeConcept>(`${this.apiUrl}/fee-concepts/${id}`, concept);
  }

  deleteConcept(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/fee-concepts/${id}`);
  }

  getPlans(filters: QueryFilters = {}): Observable<PaginatedResponse<FinancialPlan>> {
    return this.http.get<PaginatedResponse<FinancialPlan>>(`${this.apiUrl}/financial-plans`, {
      params: this.buildParams(filters)
    });
  }

  createPlan(plan: Partial<FinancialPlan>): Observable<FinancialPlan> {
    return this.http.post<FinancialPlan>(`${this.apiUrl}/financial-plans`, plan);
  }

  updatePlan(id: string, plan: Partial<FinancialPlan>): Observable<FinancialPlan> {
    return this.http.put<FinancialPlan>(`${this.apiUrl}/financial-plans/${id}`, plan);
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/financial-plans/${id}`);
  }

  getInstallments(filters: QueryFilters = {}): Observable<PaginatedResponse<PlanInstallment>> {
    return this.http.get<PaginatedResponse<PlanInstallment>>(`${this.apiUrl}/plan-installments`, {
      params: this.buildParams(filters)
    });
  }

  createInstallment(data: Partial<PlanInstallment>): Observable<PlanInstallment> {
    return this.http.post<PlanInstallment>(`${this.apiUrl}/plan-installments`, data);
  }

  updateInstallment(id: string, data: Partial<PlanInstallment>): Observable<PlanInstallment> {
    return this.http.put<PlanInstallment>(`${this.apiUrl}/plan-installments/${id}`, data);
  }

  deleteInstallment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/plan-installments/${id}`);
  }

  getDiscounts(filters: QueryFilters = {}): Observable<PaginatedResponse<Discount>> {
    return this.http.get<PaginatedResponse<Discount>>(`${this.apiUrl}/discounts`, {
      params: this.buildParams(filters)
    });
  }

  createDiscount(discount: Partial<Discount>): Observable<Discount> {
    return this.http.post<Discount>(`${this.apiUrl}/discounts`, discount);
  }

  updateDiscount(id: string, discount: Partial<Discount>): Observable<Discount> {
    return this.http.put<Discount>(`${this.apiUrl}/discounts/${id}`, discount);
  }

  deleteDiscount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/discounts/${id}`);
  }

  getStudentDiscounts(filters: QueryFilters = {}): Observable<PaginatedResponse<StudentDiscount>> {
    return this.http.get<PaginatedResponse<StudentDiscount>>(`${this.apiUrl}/student-discounts`, {
      params: this.buildParams(filters)
    });
  }

  createStudentDiscount(data: Partial<StudentDiscount>): Observable<StudentDiscount> {
    return this.http.post<StudentDiscount>(`${this.apiUrl}/student-discounts`, data);
  }

  deleteStudentDiscount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/student-discounts/${id}`);
  }

  getCharges(filters: QueryFilters = {}): Observable<PaginatedResponse<Charge>> {
    return this.http.get<PaginatedResponse<Charge>>(`${this.apiUrl}/charges`, {
      params: this.buildParams(filters)
    });
  }

  emitBatchCharges(data: {
    academic_year_id: string;
    financial_plan_id: string;
    grade_level_id?: string;
    section_id?: string;
  }): Observable<{ message: string; created_count: number }> {
    return this.http.post<{ message: string; created_count: number }>(`${this.apiUrl}/charges/batch`, data);
  }

  getPayments(filters: QueryFilters = {}): Observable<PaginatedResponse<Payment>> {
    return this.http.get<PaginatedResponse<Payment>>(`${this.apiUrl}/payments`, {
      params: this.buildParams(filters)
    });
  }

  createPayment(payment: Partial<Payment>): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments`, payment);
  }

  deletePayment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/payments/${id}`);
  }

  voidPayment(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/${id}/void`, { reason });
  }

  getReceipts(filters: QueryFilters = {}): Observable<PaginatedResponse<Receipt>> {
    return this.http.get<PaginatedResponse<Receipt>>(`${this.apiUrl}/receipts`, {
      params: this.buildParams(filters)
    });
  }

  createReceipt(data: { payment_id: string }): Observable<Receipt> {
    return this.http.post<Receipt>(`${this.apiUrl}/receipts`, data);
  }

  getClosures(filters: QueryFilters = {}): Observable<PaginatedResponse<CashClosure>> {
    return this.http.get<PaginatedResponse<CashClosure>>(`${this.apiUrl}/cash-closures`, {
      params: this.buildParams(filters)
    });
  }

  getClosure(id: string): Observable<CashClosure> {
    return this.http.get<CashClosure>(`${this.apiUrl}/cash-closures/${id}`);
  }

  createClosure(data: Partial<CashClosure>): Observable<CashClosure> {
    return this.http.post<CashClosure>(`${this.apiUrl}/cash-closures`, data);
  }

  updateClosure(id: string, data: Partial<CashClosure>): Observable<CashClosure> {
    return this.http.put<CashClosure>(`${this.apiUrl}/cash-closures/${id}`, data);
  }

  deleteClosure(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cash-closures/${id}`);
  }

  searchStudents(query: string, extraFilters: QueryFilters = {}): Observable<PaginatedResponse<any>> {
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/students`, {
      params: this.buildParams({ q: query, per_page: 20, ...extraFilters })
    });
  }

  voidCharge(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/charges/${id}/void`, { reason });
  }

  unwrapItems<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }

  private buildParams(filters: QueryFilters = {}): HttpParams {
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
