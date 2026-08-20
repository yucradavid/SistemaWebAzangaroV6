export type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';
export type JustificationStatus = 'pendiente' | 'aprobada' | 'rechazada';
export type DailyAttendanceCheckpoint = 'entrada' | 'salida';

export interface GradeLevelSummary {
  id: string;
  name: string;
  level?: string;
  grade?: number;
}

export interface SectionSummary {
  id: string;
  section_letter?: string;
  grade_level?: GradeLevelSummary | null;
}

export interface CourseSummary {
  id: string;
  code?: string;
  name?: string;
}

export interface TeacherSummary {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface StudentSummary {
  id: string;
  first_name?: string;
  last_name?: string;
  student_code?: string;
}

export interface GuardianSummary {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface AcademicYearSummary {
  id: string;
  year?: number;
  is_active?: boolean;
}

export interface AttendanceAssignment {
  id: string;
  course_id: string;
  section_id: string;
  academic_year_id?: string;
  teacher_id?: string;
  is_active?: boolean;
  teacher?: TeacherSummary | null;
  course?: CourseSummary | null;
  section?: SectionSummary | null;
  academic_year?: AcademicYearSummary | null;
}

export interface TeacherAttendanceContextResponse {
  teacher: TeacherSummary | null;
  assignments: AttendanceAssignment[];
  message?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  section_id: string;
  date: string;
  status: AttendanceStatus;
  justification?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  student?: StudentSummary | null;
  course?: CourseSummary | null;
  section?: SectionSummary | null;
  justifications?: AttendanceJustification[];
}

export interface AttendanceJustification {
  id: string;
  attendance_id: string;
  guardian_id: string;
  reason: string;
  status: JustificationStatus;
  created_at: string;
  reviewed_at?: string | null;
  review_notes?: string | null;
  attendance?: AttendanceRecord | null;
  guardian?: GuardianSummary | null;
}

export interface AdminAttendanceAssignmentStatus {
  assignment_id: string;
  teacher_id?: string | null;
  teacher?: TeacherSummary | null;
  course_id: string;
  course?: CourseSummary | null;
  section_id: string;
  section?: SectionSummary | null;
  academic_year_id?: string | null;
  student_count: number;
  recorded_count: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  justified_count: number;
  pending_justifications_count: number;
  is_registered: boolean;
  completion_rate: number;
  last_recorded_at?: string | null;
}

export interface AdminAttendanceTeacherStatus {
  teacher_id?: string | null;
  teacher?: TeacherSummary | null;
  total_assignments: number;
  registered_assignments: number;
  pending_assignments: number;
  is_complete: boolean;
  pending_details: Array<{
    assignment_id: string;
    course?: CourseSummary | null;
    section?: SectionSummary | null;
    student_count: number;
  }>;
}

export interface AdminAttendanceOverview {
  date: string;
  summary: {
    assignments_total: number;
    assignments_registered: number;
    assignments_pending: number;
    students_expected: number;
    records_captured: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    justified_count: number;
    pending_justifications_count: number;
    coverage_rate: number;
  };
  teacher_statuses: AdminAttendanceTeacherStatus[];
  assignment_statuses: AdminAttendanceAssignmentStatus[];
}

export interface AttendanceHistoryFilters {
  date?: string;
  date_from?: string;
  date_to?: string;
  student_id?: string;
  course_id?: string;
  section_id?: string;
  status?: AttendanceStatus;
  per_page?: number;
  history_scope?: boolean;
}

export interface AttendanceJustificationFilters {
  status?: JustificationStatus | '';
  guardian_id?: string;
  attendance_id?: string;
  student_id?: string;
  course_id?: string;
  section_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
}

export interface AdminAttendanceOverviewFilters {
  date?: string;
  course_id?: string;
  section_id?: string;
  teacher_id?: string;
}

export interface DailyAttendanceStudentRecord {
  student_id: string;
  student?: StudentSummary | null;
  entry_status?: AttendanceStatus | null;
  entry_note?: string | null;
  entry_marked_at?: string | null;
  entry_source?: string | null;
  exit_status?: AttendanceStatus | null;
  exit_note?: string | null;
  exit_marked_at?: string | null;
  exit_source?: string | null;
  effective_status?: AttendanceStatus | null;
}

export interface DailyAttendanceQrSession {
  id: string;
  section_id: string;
  academic_year_id: string;
  date: string;
  checkpoint_type: DailyAttendanceCheckpoint;
  session_code: string;
  token: string;
  status: 'activo' | 'cerrado' | 'expirado' | string;
  late_after_minutes: number;
  opened_at?: string | null;
  expires_at?: string | null;
  closed_at?: string | null;
  notes?: string | null;
  qr_payload: string;
}

export interface DailyAttendanceSectionResponse {
  date: string;
  section_id: string;
  academic_year_id: string;
  summary: {
    students_total: number;
    entry_present_count: number;
    entry_late_count: number;
    entry_absent_count: number;
    entry_justified_count: number;
    exit_recorded_count: number;
  };
  students: DailyAttendanceStudentRecord[];
  scheduled_courses: Array<{
    course_id: string;
    course_name?: string;
    course_code?: string;
    start_time?: string;
    end_time?: string;
  }>;
  uses_schedule: boolean;
  qr_sessions: DailyAttendanceQrSession[];
}

export interface TeacherDailyAttendanceRecord {
  id: string;
  teacher_id: string;
  section_id: string;
  academic_year_id: string;
  date: string;
  entry_status?: AttendanceStatus | null;
  entry_note?: string | null;
  entry_marked_at?: string | null;
  entry_source?: string | null;
  exit_status?: AttendanceStatus | null;
  exit_note?: string | null;
  exit_marked_at?: string | null;
  exit_source?: string | null;
  effective_status?: AttendanceStatus | null;
}

export interface TeacherDailyHistoryResponse {
  teacher_id: string;
  filters: {
    date_from?: string | null;
    date_to?: string | null;
  };
  counts_by_status: Array<{ status: string; total: number }>;
  daily_records: TeacherDailyAttendanceRecord[];
}

export interface DailyAttendanceBatchResponse {
  message: string;
  processed_count: number;
  skipped_count: number;
  propagated_records_count: number;
  skipped_students: Array<{
    student_id: string;
    reason: string;
  }>;
}
