import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const PRIVATE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/components/private-layout/private-layout.component').then(m => m.PrivateLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      // ── Admin Dashboard ──────────────────────────────────
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'CERMAT - Panel de Administración'
      },
      // ── Student Dashboard ──────────────────────────────────
      {
        path: 'dashboard/student',
        loadComponent: () => import('./features/student/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
        title: 'CERMAT - Portal del Estudiante'
      },
      // ── Teacher Dashboard ──────────────────────────────────
      {
        path: 'dashboard/teacher',
        loadComponent: () => import('./features/teacher/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'CERMAT - Portal del Docente'
      },
      // ── Apoderado Dashboard ──────────────────────────────────
      {
        path: 'dashboard/apoderado',
        loadComponent: () => import('./features/apoderado/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'CERMAT - Portal de Apoderado'
      },
      // ── Módulos del Estudiante ───────────────────────────
      {
        path: 'attendance/student',
        loadComponent: () => import('./features/student/attendance/student-attendance.component').then(m => m.AttendanceStudentComponent),
        title: 'CERMAT - Mi Asistencia'
      },
      {
        path: 'evaluation/student',
        loadComponent: () => import('./features/student/evaluation/student-grades.component').then(m => m.GradesStudentComponent),
        title: 'CERMAT - Mis Notas'
      },
      {
        path: 'history/student',
        loadComponent: () => import('./features/student/history/student-history.component').then(m => m.StudentHistoryComponent),
        title: 'CERMAT - Mi Historial Academico'
      },
      {
        path: 'tasks/student',
        loadComponent: () => import('./features/student/tasks/student-tasks.component').then(m => m.TasksStudentComponent),
        title: 'CERMAT - Mis Tareas'
      },
      {
        path: 'communications/student',
        loadComponent: () => import('./features/student/communications/student-communications.component').then(m => m.CommunicationsStudentComponent),
        title: 'CERMAT - Mis Comunicados'
      },
      {
        path: 'dashboard/metrics/student',
        loadComponent: () => import('./features/student/metrics/student-metrics.component').then(m => m.MetricsStudentComponent),
        title: 'CERMAT - Mi Progreso'
      },
      {
        path: 'schedule/my',
        loadComponent: () => import('./features/student/schedule/student-schedule.component').then(m => m.ScheduleStudentComponent),
        title: 'CERMAT - Mi Horario'
      },

      // ── Módulos del Apoderado ───────────────────────────
      {
        path: 'attendance/apoderado',
        loadComponent: () => import('./features/apoderado/attendance/apoderado-attendance/apoderado-attendance.component').then(m => m.ApoderadoAttendanceComponent),
        title: 'CERMAT - Asistencia'
      },
      {
        path: 'evaluation/apoderado',
        loadComponent: () => import('./features/apoderado/evaluation/apoderado-evaluation/apoderado-evaluation.component').then(m => m.ApoderadoEvaluationComponent),
        title: 'CERMAT - Notas'
      },
      {
        path: 'finance/apoderado',
        loadComponent: () => import('./features/apoderado/finance/apoderado-finance/apoderado-finance.component').then(m => m.ApoderadoFinanceComponent),
        title: 'CERMAT - Pagos'
      },
      {
        path: 'history/apoderado',
        loadComponent: () => import('./features/apoderado/history/apoderado-history.component').then(m => m.ApoderadoHistoryComponent),
        title: 'CERMAT - Historial Familiar'
      },
      {
        path: 'tasks/apoderado',
        loadComponent: () => import('./features/apoderado/tasks/apoderado-tasks/apoderado-tasks.component').then(m => m.ApoderadoTasksComponent),
        title: 'CERMAT - Tareas'
      },
      {
        path: 'communications/apoderado',
        loadComponent: () => import('./features/apoderado/communications/apoderado-communications/apoderado-communications.component').then(m => m.ApoderadoCommunicationsComponent),
        title: 'CERMAT - Comunicados'
      },
      {
        path: 'messages/apoderado',
        loadComponent: () => import('./features/apoderado/messages/apoderado-messages/apoderado-messages.component').then(m => m.ApoderadoMessagesComponent),
        title: 'CERMAT - Mensajería'
      },
      {
        path: 'dashboard/metrics/apoderado',
        loadComponent: () => import('./features/apoderado/metrics/apoderado-metrics/apoderado-metrics.component').then(m => m.ApoderadoMetricsComponent),
        title: 'CERMAT - Reporte'
      },
      {
        path: 'schedule/apoderado',
        loadComponent: () => import('./features/apoderado/schedule/apoderado-schedule/apoderado-schedule.component').then(m => m.ApoderadoScheduleComponent),
        title: 'CERMAT - Horario'
      },

      // ── Módulos del Docente ───────────────────────────
      {
        path: 'attendance/teacher',
        loadComponent: () => import('./features/teacher/attendance/teacher-attendance/teacher-attendance.component').then(m => m.TeacherAttendanceComponent),
        title: 'CERMAT - Asistencia Docente'
      },
      {
        path: 'evaluation/teacher',
        loadComponent: () => import('./features/teacher/evaluation/teacher-evaluation/teacher-evaluation.component').then(m => m.TeacherEvaluationComponent),
        title: 'CERMAT - Evaluación'
      },
      {
        path: 'history/teacher',
        loadComponent: () => import('./features/teacher/history/teacher-history.component').then(m => m.TeacherHistoryComponent),
        title: 'CERMAT - Historial Docente'
      },
      {
        path: 'tasks/teacher',
        loadComponent: () => import('./features/teacher/tasks/teacher-tasks/teacher-tasks.component').then(m => m.TeacherTasksComponent),
        title: 'CERMAT - Mis Tareas'
      },
      {
        path: 'tasks/grading/teacher',
        loadComponent: () => import('./features/teacher/tasks/teacher-grading/teacher-grading.component').then(m => m.TeacherGradingComponent),
        title: 'CERMAT - Calificar'
      },
      {
        path: 'communications/teacher',
        loadComponent: () => import('./features/teacher/communications/teacher-communications/teacher-communications.component').then(m => m.TeacherCommunicationsComponent),
        title: 'CERMAT - Comunicados'
      },
      {
        path: 'messages/teacher',
        loadComponent: () => import('./features/teacher/messages/teacher-messages/teacher-messages.component').then(m => m.TeacherMessagesComponent),
        title: 'CERMAT - Mensajería'
      },
      {
        path: 'dashboard/metrics/teacher',
        loadComponent: () => import('./features/teacher/metrics/teacher-metrics/teacher-metrics.component').then(m => m.TeacherMetricsComponent),
        title: 'CERMAT - Resumen'
      },
      {
        path: 'schedule/teacher',
        loadComponent: () => import('./features/teacher/schedule/teacher-schedule/teacher-schedule.component').then(m => m.TeacherScheduleComponent),
        title: 'CERMAT - Mi Horario (Docente)'
      },

      // ── Matrículas ───────────────────────────────────────
      {
        path: 'admissions/applications',
        loadComponent: () => import('./features/admin/admissions/enrollment-approvals/enrollment-approvals.component').then(m => m.EnrollmentApprovalsComponent),
        title: 'CERMAT - Solicitudes de Matrícula'
      },

      // ── Asistencia ───────────────────────────────────────
      {
        path: 'attendance/approvals',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'coordinator', 'secretary', 'administrative'] },
        loadComponent: () => import('./features/admin/attendance/attendance-approvals/attendance-approvals.component').then(m => m.AttendanceApprovalsComponent),
        title: 'CERMAT - Aprobación de Justificaciones'
      },

      // ── Reportes ─────────────────────────────────────────
      {
        path: 'reports/academic',
        loadComponent: () => import('./features/admin/reports/academic-reports/academic-reports.component').then(m => m.AcademicReportsComponent),
        title: 'CERMAT - Reportes Académicos'
      },


      // ── Métricas ─────────────────────────────────────────
      {
        path: 'dashboard/metrics/admin',
        loadComponent: () => import('./features/admin/metrics/admin-metrics/admin-metrics.component').then(m => m.AdminMetricsComponent),
        title: 'CERMAT - Métricas del Sistema'
      },

      // ── Horarios ─────────────────────────────────────────
      {
        path: 'schedule/admin',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'coordinator'] },
        loadComponent: () => import('./features/admin/schedule/admin-schedule/admin-schedule.component').then(m => m.AdminScheduleComponent),
        title: 'CERMAT - Gestión de Horarios'
      },
      
      // ── Evaluación ───────────────────────────────────────
      {
        path: 'evaluation/grade-entry',
        loadComponent: () => import('./features/admin/evaluation/grade-entry/grade-entry.component').then(m => m.GradeEntryComponent),
        title: 'CERMAT - Registro de Notas'
      },
      {
        path: 'evaluation/review',
        loadComponent: () => import('./features/admin/evaluation/evaluation-review/evaluation-review.component').then(m => m.EvaluationReviewComponent),
        title: 'CERMAT - Gestión de Evaluaciones'
      },

      // ── Tareas ───────────────────────────────────────────
      {
        path: 'tasks/management',
        loadComponent: () => import('./features/admin/tasks/task-management/task-management.component').then(m => m.TaskManagementComponent),
        title: 'CERMAT - Gestión de Tareas'
      },
      {
        path: 'tasks/grading',
        loadComponent: () => import('./features/admin/tasks/task-grading/task-grading.component').then(m => m.TaskGradingComponent),
        title: 'CERMAT - Calificar Entregas'
      },

      // ── Finanzas ─────────────────────────────────────────
      {
        path: 'finance/catalog/concepts',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance'] },
        loadComponent: () => import('./features/admin/finance/catalog/finance-concepts.component').then(m => m.FinanceConceptsComponent),
        title: 'CERMAT - Conceptos de Pago'
      },
      {
        path: 'finance/catalog/plans',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance'] },
        loadComponent: () => import('./features/admin/finance/catalog/finance-plans.component').then(m => m.FinancePlansComponent),
        title: 'CERMAT - Planes de Pago'
      },
      {
        path: 'finance/catalog/discounts',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance'] },
        loadComponent: () => import('./features/admin/finance/catalog/finance-discounts.component').then(m => m.FinanceDiscountsComponent),
        title: 'CERMAT - Descuentos y Becas'
      },
      {
        path: 'finance/charges/emission',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance'] },
        loadComponent: () => import('./features/admin/finance/charges/finance-emission.component').then(m => m.FinanceEmissionComponent),
        title: 'CERMAT - Emisión de Cargos'
      },
      {
        path: 'finance/charges/student',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance'] },
        loadComponent: () => import('./features/admin/finance/charges/finance-student.component').then(m => m.FinanceStudentComponent),
        title: 'CERMAT - Cuenta Estudiante'
      },
      {
        path: 'finance/cash',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance', 'cashier'] },
        loadComponent: () => import('./features/admin/finance/cash/finance-cash.component').then(m => m.FinanceCashComponent),
        title: 'CERMAT - Caja Diaria'
      },
      {
        path: 'finance/cash/closures',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance', 'cashier'] },
        loadComponent: () => import('./features/admin/finance/cash/finance-closures.component').then(m => m.FinanceClosuresComponent),
        title: 'CERMAT - Historial de Cierres'
      },
      {
        path: 'finance/reports',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance'] },
        loadComponent: () => import('./features/admin/finance/reports/finance-reports.component').then(m => m.FinanceReportsComponent),
        title: 'CERMAT - Reportes Financieros'
      },

      // ── Mensajería y Comunicados ──────────────────────────
      {
        path: 'messages/teacher',
        loadComponent: () => import('./features/admin/messaging/messaging-inbox.component').then(m => m.MessagingInboxComponent),
        title: 'CERMAT - Bandeja de Entrada'
      },
      {
        path: 'communications/teacher',
        loadComponent: () => import('./features/admin/communications/communications-management.component').then(m => m.CommunicationsManagementComponent),
        title: 'CERMAT - Gestionar Comunicados'
      },
      {
        path: 'communications/review',
        loadComponent: () => import('./features/admin/communications/communications-approval.component').then(m => m.CommunicationsApprovalComponent),
        title: 'CERMAT - Aprobar Comunicados'
      },

      // ── Configuración / Ajustes ──────────────────────────
      {
        path: 'settings/academic-years',
        loadComponent: () => import('./features/admin/settings/academic-years.component').then(m => m.AcademicYearsComponent),
        title: 'CERMAT - Años Académicos'
      },
      {
        path: 'settings/periods',
        loadComponent: () => import('./features/admin/settings/periods.component').then(m => m.PeriodsComponent),
        title: 'CERMAT - Periodos'
      },
      {
        path: 'settings/grades',
        loadComponent: () => import('./features/admin/settings/grades-levels.component').then(m => m.GradesLevelsComponent),
        title: 'CERMAT - Grados y Niveles'
      },
      {
        path: 'settings/sections',
        loadComponent: () => import('./features/admin/settings/sections.component').then(m => m.SectionsComponent),
        title: 'CERMAT - Secciones'
      },
      {
        path: 'settings/courses',
        loadComponent: () => import('./features/admin/settings/courses.component').then(m => m.CoursesComponent),
        title: 'CERMAT - Cursos'
      },
      {
        path: 'settings/competencies',
        loadComponent: () => import('./features/admin/settings/competencies.component').then(m => m.CompetenciesComponent),
        title: 'CERMAT - Competencias'
      },
      {
        path: 'settings/teacher-assignments',
        loadComponent: () => import('./features/admin/settings/teacher-assignments.component').then(m => m.TeacherAssignmentsComponent),
        title: 'CERMAT - Asignación Docente'
      },
      {
        path: 'settings/users',
        loadComponent: () => import('./features/admin/settings/admin-users.component').then(m => m.AdminUsersComponent),
        title: 'CERMAT - Usuarios'
      },
      {
        path: 'settings/imports',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'coordinator', 'secretary'] },
        loadComponent: () => import('./features/admin/settings/bulk-import.component').then(m => m.BulkImportComponent),
        title: 'CERMAT - Importacion Masiva'
      },
      {
        path: 'settings/students',
        loadComponent: () => import('./features/admin/settings/students.component').then(m => m.StudentsComponent),
        title: 'CERMAT - Estudiantes'
      },
      {
        path: 'settings/enrollments',
        loadComponent: () => import('./features/admin/settings/enrollment-config.component').then(m => m.EnrollmentConfigComponent),
        title: 'CERMAT - Configuración Matrículas'
      },
      // ── Sitio Web ───────────────────────────────────────
      {
        path: 'settings/news',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'web_editor'] },
        loadComponent: () => import('./features/admin/website/news-management.component').then(m => m.NewsManagementComponent),
        title: 'CERMAT - Gestión de Noticias y Eventos'
      }
    ]
  }
];
