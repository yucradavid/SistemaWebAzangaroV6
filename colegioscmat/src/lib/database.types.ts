export type UserRole = 'admin' | 'director' | 'coordinator' | 'secretary' | 'teacher' | 'student' | 'guardian' | 'finance' | 'cashier' | 'web_editor';
export type EducationLevel = 'inicial' | 'primaria' | 'secundaria';
export type AttendanceStatus = 'presente' | 'tarde' | 'falta' | 'justificado';
export type EvaluationGrade = 'AD' | 'A' | 'B' | 'C';
export type EvaluationStatus = 'borrador' | 'publicada' | 'cerrada';
export type SubmissionStatus = 'pendiente' | 'entregada' | 'revisada' | 'atrasada';
export type AnnouncementStatus = 'borrador' | 'pendiente_aprobacion' | 'publicado' | 'archivado';
export type AnnouncementAudience = 'todos' | 'docentes' | 'estudiantes' | 'apoderados' | 'seccion_especifica';
export type ChargeType = 'matricula' | 'pension' | 'material' | 'uniforme' | 'otro';
export type ChargeStatus = 'pendiente' | 'pagado_parcial' | 'pagado' | 'vencido';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'yape' | 'plin' | 'pasarela';
export type JustificationStatus = 'pendiente' | 'aprobada' | 'rechazada';
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1=Lunes, 7=Domingo
export type PublicNewsStatus = 'borrador' | 'publicado' | 'archivado';
export type PublicNewsCategory = 'institucional' | 'academico' | 'eventos' | 'deportes' | 'tecnologia' | 'admisiones' | 'logros' | 'comunidad' | 'otro';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          dni: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      academic_years: {
        Row: {
          id: string;
          year: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          year?: number;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
        };
      };
      students: {
        Row: {
          id: string;
          user_id: string | null;
          student_code: string;
          first_name: string;
          last_name: string;
          dni: string | null;
          birth_date: string | null;
          gender: string | null;
          address: string | null;
          section_id: string | null;
          enrollment_date: string;
          status: string;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      guardians: {
        Row: {
          id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          dni: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          relationship: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          user_id: string | null;
          teacher_code: string;
          first_name: string;
          last_name: string;
          dni: string | null;
          phone: string | null;
          email: string | null;
          specialization: string | null;
          hire_date: string;
          status: string;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      courses: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          grade_level_id: string;
          hours_per_week: number;
          color: string; // Color hexadecimal para UI
          created_at: string;
        };
      };
      course_schedules: {
        Row: {
          id: string;
          academic_year_id: string;
          section_id: string;
          course_id: string;
          teacher_id: string | null;
          day_of_week: DayOfWeek;
          start_time: string; // HH:MM:SS format
          end_time: string; // HH:MM:SS format
          room_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academic_year_id: string;
          section_id: string;
          course_id: string;
          teacher_id?: string | null;
          day_of_week: DayOfWeek;
          start_time: string;
          end_time: string;
          room_number?: string | null;
        };
        Update: {
          academic_year_id?: string;
          section_id?: string;
          course_id?: string;
          teacher_id?: string | null;
          day_of_week?: DayOfWeek;
          start_time?: string;
          end_time?: string;
          room_number?: string | null;
        };
      };
      sections: {
        Row: {
          id: string;
          academic_year_id: string;
          grade_level_id: string;
          section_letter: string;
          capacity: number;
          created_at: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          section_id: string;
          course_id: string | null;
          date: string;
          status: AttendanceStatus;
          justification: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      evaluations: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          competency_id: string;
          period_id: string;
          grade: EvaluationGrade | null;
          observations: string | null;
          status: EvaluationStatus;
          recorded_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          section_id: string;
          title: string;
          description: string | null;
          instructions: string | null;
          due_date: string;
          max_score: number;
          attachment_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      assignment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          submission_text: string | null;
          attachment_url: string | null;
          score: number | null;
          feedback: string | null;
          status: SubmissionStatus;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      charges: {
        Row: {
          id: string;
          student_id: string;
          academic_year_id: string;
          type: ChargeType;
          description: string;
          amount: number;
          discount: number;
          final_amount: number;
          due_date: string;
          status: ChargeStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          charge_id: string;
          student_id: string;
          amount: number;
          payment_method: PaymentMethod;
          transaction_ref: string | null;
          notes: string | null;
          received_by: string | null;
          payment_date: string;
          created_at: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          audience: AnnouncementAudience;
          section_id: string | null;
          status: AnnouncementStatus;
          priority: string;
          attachment_url: string | null;
          created_by: string | null;
          approved_by: string | null;
          published_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      attendance_justifications: {
        Row: {
          id: string;
          attendance_id: string;
          student_id: string;
          guardian_id: string | null;
          reason: string;
          attachment_url: string | null;
          status: JustificationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attendance_id: string;
          student_id: string;
          guardian_id?: string | null;
          reason: string;
          attachment_url?: string | null;
          status?: JustificationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_justifications']['Insert']>;
      };
      student_course_enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          section_id: string;
          academic_year_id: string;
          enrollment_date: string;
          status: 'active' | 'dropped' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          section_id: string;
          academic_year_id: string;
          enrollment_date?: string;
          status?: 'active' | 'dropped' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_course_enrollments']['Insert']>;
      };
      public_news: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          excerpt: string;
          content: string | null;
          image_url: string | null;
          category: PublicNewsCategory;
          author: string;
          status: PublicNewsStatus;
          is_featured: boolean;
          published_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string | null;
          excerpt: string;
          content?: string | null;
          image_url?: string | null;
          category?: PublicNewsCategory;
          author?: string;
          status?: PublicNewsStatus;
          is_featured?: boolean;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['public_news']['Insert']>;
      };
    };
    Functions: {
      check_schedule_overlap: {
        Args: {
          p_section_id: string;
          p_day_of_week: number;
          p_start_time: string;
          p_end_time: string;
          p_schedule_id?: string | null;
        };
        Returns: boolean;
      };
    };
  };
}
