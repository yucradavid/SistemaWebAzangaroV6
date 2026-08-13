import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { ICONS } from './core/constants/icons';

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
        path: 'attendance/mark',
        loadComponent: () => import('./features/student/attendance/mark-attendance/mark-attendance.component').then(m => m.MarkAttendanceComponent),
        title: 'CERMAT - Marcar Asistencia'
      },
      {
        path: 'evaluation/student',
        loadComponent: () => import('./features/student/evaluation/student-grades.component').then(m => m.GradesStudentComponent),
        title: 'CERMAT - Mis Notas'
      },
      {
        path: 'courses/student',
        loadComponent: () => import('./features/student/courses/student-courses.component').then(m => m.StudentCoursesComponent),
        title: 'CERMAT - Mis Cursos'
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

      // ── Módulos unificados del Apoderado (shell con pestañas) ─────────
      {
        path: 'apoderado/asistencia-horario',
        data: {
          moduleTitle: 'Asistencia y Horario',
          tabs: [
            { path: 'asistencia', label: 'Asistencia', icon: ICONS.calendarCheck },
            { path: 'horario', label: 'Horario', icon: ICONS.clock }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Asistencia y Horario',
        children: [
          { path: '', redirectTo: 'asistencia', pathMatch: 'full' },
          {
            path: 'asistencia',
            loadComponent: () => import('./features/apoderado/attendance/apoderado-attendance/apoderado-attendance.component').then(m => m.ApoderadoAttendanceComponent),
            title: 'CERMAT - Asistencia'
          },
          {
            path: 'horario',
            loadComponent: () => import('./features/apoderado/schedule/apoderado-schedule/apoderado-schedule.component').then(m => m.ApoderadoScheduleComponent),
            title: 'CERMAT - Horario'
          }
        ]
      },
      {
        path: 'apoderado/academico',
        data: {
          moduleTitle: 'Académico',
          tabs: [
            { path: 'notas', label: 'Notas', icon: ICONS.graduationCap },
            { path: 'tareas', label: 'Tareas', icon: ICONS.bookOpen },
            { path: 'reporte', label: 'Reporte', icon: ICONS.activity }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Académico',
        children: [
          { path: '', redirectTo: 'notas', pathMatch: 'full' },
          {
            path: 'notas',
            loadComponent: () => import('./features/apoderado/evaluation/apoderado-evaluation/apoderado-evaluation.component').then(m => m.ApoderadoEvaluationComponent),
            title: 'CERMAT - Notas'
          },
          {
            path: 'tareas',
            loadComponent: () => import('./features/apoderado/tasks/apoderado-tasks/apoderado-tasks.component').then(m => m.ApoderadoTasksComponent),
            title: 'CERMAT - Tareas'
          },
          {
            path: 'reporte',
            loadComponent: () => import('./features/apoderado/metrics/apoderado-metrics/apoderado-metrics.component').then(m => m.ApoderadoMetricsComponent),
            title: 'CERMAT - Reporte'
          }
        ]
      },
      {
        path: 'apoderado/comunicacion',
        data: {
          moduleTitle: 'Comunicados y Mensajería',
          tabs: [
            { path: 'comunicados', label: 'Comunicados', icon: ICONS.megaphone },
            { path: 'mensajeria', label: 'Mensajería', icon: ICONS.mail }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Comunicados y Mensajería',
        children: [
          { path: '', redirectTo: 'comunicados', pathMatch: 'full' },
          {
            path: 'comunicados',
            loadComponent: () => import('./features/apoderado/communications/apoderado-communications/apoderado-communications.component').then(m => m.ApoderadoCommunicationsComponent),
            title: 'CERMAT - Comunicados'
          },
          {
            path: 'mensajeria',
            loadComponent: () => import('./features/apoderado/messages/apoderado-messages/apoderado-messages.component').then(m => m.ApoderadoMessagesComponent),
            title: 'CERMAT - Mensajería'
          }
        ]
      },
      {
        path: 'apoderado/pagos-historial',
        data: {
          moduleTitle: 'Pagos e Historial',
          tabs: [
            { path: 'pagos', label: 'Pagos', icon: ICONS.creditCard },
            { path: 'historial', label: 'Historial', icon: ICONS.fileText }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Pagos e Historial',
        children: [
          { path: '', redirectTo: 'pagos', pathMatch: 'full' },
          {
            path: 'pagos',
            loadComponent: () => import('./features/apoderado/finance/apoderado-finance/apoderado-finance.component').then(m => m.ApoderadoFinanceComponent),
            title: 'CERMAT - Pagos'
          },
          {
            path: 'historial',
            loadComponent: () => import('./features/apoderado/history/apoderado-history.component').then(m => m.ApoderadoHistoryComponent),
            title: 'CERMAT - Historial'
          }
        ]
      },

      // ── Módulos del Docente ───────────────────────────
      {
        path: 'attendance/mark/teacher',
        loadComponent: () => import('./features/teacher/attendance/teacher-mark-attendance/teacher-mark-attendance.component').then(m => m.TeacherMarkAttendanceComponent),
        title: 'CERMAT - Marcar Asistencia'
      },
      {
        path: 'attendance/teacher/menu',
        loadComponent: () => import('./features/teacher/attendance/teacher-attendance-menu/teacher-attendance-menu.component').then(m => m.TeacherAttendanceMenuComponent),
        title: 'CERMAT - Asistencia'
      },
      {
        path: 'attendance/teacher/my',
        loadComponent: () => import('./features/teacher/attendance/teacher-my-attendance/teacher-my-attendance.component').then(m => m.TeacherMyAttendanceComponent),
        title: 'CERMAT - Mi Asistencia'
      },
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
        path: 'finance/catalog',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'finance'] },
        loadComponent: () => import('./features/admin/finance/finance-catalog/finance-catalog.component').then(m => m.FinanceCatalogComponent),
        title: 'CERMAT - Catálogo Financiero'
      },
      // Rutas antiguas: redirigen al catálogo unificado, preservando el tab via query param
      {
        path: 'finance/catalog/concepts',
        redirectTo: () => '/app/finance/catalog?tab=concepts',
        pathMatch: 'full'
      },
      {
        path: 'finance/catalog/plans',
        redirectTo: () => '/app/finance/catalog?tab=plans',
        pathMatch: 'full'
      },
      {
        path: 'finance/catalog/discounts',
        redirectTo: () => '/app/finance/catalog?tab=discounts',
        pathMatch: 'full'
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
        path: 'settings/academic-calendar',
        loadComponent: () => import('./features/admin/settings/academic-calendar/academic-calendar.component').then(m => m.AcademicCalendarComponent),
        title: 'CERMAT - Calendario Académico'
      },
      // Rutas antiguas: redirigen al calendario unificado
      {
        path: 'settings/academic-years',
        redirectTo: 'settings/academic-calendar',
        pathMatch: 'full'
      },
      {
        path: 'settings/periods',
        redirectTo: 'settings/academic-calendar',
        pathMatch: 'full'
      },
      {
        path: 'settings/academic-structure',
        loadComponent: () => import('./features/admin/settings/academic-structure/academic-structure.component').then(m => m.AcademicStructureComponent),
        title: 'CERMAT - Estructura Académica'
      },
      // Rutas antiguas: redirigen a la estructura unificada
      {
        path: 'settings/grades',
        redirectTo: 'settings/academic-structure',
        pathMatch: 'full'
      },
      {
        path: 'settings/sections',
        redirectTo: 'settings/academic-structure',
        pathMatch: 'full'
      },
      {
        path: 'settings/study-plan',
        loadComponent: () => import('./features/admin/settings/study-plan/study-plan.component').then(m => m.StudyPlanComponent),
        title: 'CERMAT - Plan de Estudios'
      },
      // Rutas antiguas: redirigen al plan de estudios unificado
      {
        path: 'settings/courses',
        redirectTo: 'settings/study-plan',
        pathMatch: 'full'
      },
      {
        path: 'settings/competencies',
        redirectTo: 'settings/study-plan',
        pathMatch: 'full'
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
      },
      {
        path: 'settings/website/page-covers',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director'] },
        loadComponent: () => import('./features/admin/website/page-covers/page-covers.component').then(m => m.PageCoversComponent),
        title: 'CERMAT - Portadas del Sitio Público'
      },

      // ── Módulos unificados del Docente (shell con pestañas) ─────────
      {
        path: 'teacher/asistencia-horario',
        data: {
          moduleTitle: 'Asistencia y Horario',
          tabs: [
            { path: 'asistencia', label: 'Asistencia', icon: ICONS.calendarCheck },
            { path: 'horario', label: 'Horario', icon: ICONS.clock }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Asistencia y Horario',
        children: [
          { path: '', redirectTo: 'asistencia', pathMatch: 'full' },
          {
            path: 'asistencia',
            loadComponent: () => import('./features/teacher/attendance/teacher-attendance-menu/teacher-attendance-menu.component').then(m => m.TeacherAttendanceMenuComponent),
            title: 'CERMAT - Asistencia'
          },
          {
            path: 'horario',
            loadComponent: () => import('./features/teacher/schedule/teacher-schedule/teacher-schedule.component').then(m => m.TeacherScheduleComponent),
            title: 'CERMAT - Horario'
          }
        ]
      },
      {
        path: 'teacher/academico',
        data: {
          moduleTitle: 'Académico',
          tabs: [
            { path: 'tareas', label: 'Tareas', icon: ICONS.bookOpen },
            { path: 'calificar', label: 'Calificar', icon: ICONS.checkCircle2 },
            { path: 'evaluacion', label: 'Evaluación', icon: ICONS.graduationCap },
            { path: 'resumen', label: 'Resumen', icon: ICONS.activity }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Académico',
        children: [
          { path: '', redirectTo: 'tareas', pathMatch: 'full' },
          {
            path: 'tareas',
            loadComponent: () => import('./features/teacher/tasks/teacher-tasks/teacher-tasks.component').then(m => m.TeacherTasksComponent),
            title: 'CERMAT - Tareas'
          },
          {
            path: 'calificar',
            loadComponent: () => import('./features/teacher/tasks/teacher-grading/teacher-grading.component').then(m => m.TeacherGradingComponent),
            title: 'CERMAT - Calificar'
          },
          {
            path: 'evaluacion',
            loadComponent: () => import('./features/teacher/evaluation/teacher-evaluation/teacher-evaluation.component').then(m => m.TeacherEvaluationComponent),
            title: 'CERMAT - Evaluación'
          },
          {
            path: 'resumen',
            loadComponent: () => import('./features/teacher/metrics/teacher-metrics/teacher-metrics.component').then(m => m.TeacherMetricsComponent),
            title: 'CERMAT - Resumen'
          }
        ]
      },
      {
        path: 'teacher/comunicacion',
        data: {
          moduleTitle: 'Comunicados y Mensajería',
          tabs: [
            { path: 'comunicados', label: 'Comunicados', icon: ICONS.megaphone },
            { path: 'mensajeria', label: 'Mensajería', icon: ICONS.mail }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Comunicados y Mensajería',
        children: [
          { path: '', redirectTo: 'comunicados', pathMatch: 'full' },
          {
            path: 'comunicados',
            loadComponent: () => import('./features/teacher/communications/teacher-communications/teacher-communications.component').then(m => m.TeacherCommunicationsComponent),
            title: 'CERMAT - Comunicados'
          },
          {
            path: 'mensajeria',
            loadComponent: () => import('./features/teacher/messages/teacher-messages/teacher-messages.component').then(m => m.TeacherMessagesComponent),
            title: 'CERMAT - Mensajería'
          }
        ]
      },
      {
        path: 'teacher/reportes-historial',
        data: {
          moduleTitle: 'Reportes e Historial',
          tabs: [
            { path: 'reportes', label: 'Reportes', icon: ICONS.barChart3 },
            { path: 'historial', label: 'Historial', icon: ICONS.fileText }
          ]
        },
        loadComponent: () => import('./shared/components/module-tabs-shell/module-tabs-shell.component').then(m => m.ModuleTabsShellComponent),
        title: 'CERMAT - Reportes e Historial',
        children: [
          { path: '', redirectTo: 'reportes', pathMatch: 'full' },
          {
            path: 'reportes',
            loadComponent: () => import('./features/teacher/metrics/teacher-metrics/teacher-metrics.component').then(m => m.TeacherMetricsComponent),
            title: 'CERMAT - Reportes'
          },
          {
            path: 'historial',
            loadComponent: () => import('./features/teacher/history/teacher-history.component').then(m => m.TeacherHistoryComponent),
            title: 'CERMAT - Historial'
          }
        ]
      },
    ]
  }
];
