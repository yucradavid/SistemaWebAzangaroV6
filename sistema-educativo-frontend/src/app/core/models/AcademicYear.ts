export interface AcademicYear {
    id: string;
    year: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    periods_count?: number;
    sections_count?: number;
    period_histories_count?: number;
    student_discounts_count?: number;
    financial_plans_count?: number;
    created_at?: string;
    updated_at?: string;
}
