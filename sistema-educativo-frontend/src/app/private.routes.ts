import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { ICONS } from './core/constants/icons';

// ── Grupos de roles reutilizables ─────────────────────────
const ADMIN       = ['admin', 'director', 'coordinator', 'secretary'] as const;
const CONFIG      = ['admin', 'director', 'coordinator'] as const;
const FINANCE     = ['admin', 'director', 'secretary', 'finance'] as const;
const CASH        = ['admin', 'director', 'secretary', 'finance', 'cashier'] as const;
const EVAL_TASKS  = ['admin', 'director', 'coordinator', 'teacher'] as const;

// ── Guard data objects (evita repetir canActivate + data) ─
const guardAdmin       = { canActivate: [roleGuard], data: { roles: [...ADMIN] } };
const guardConfig      = { canActivate: [roleGuard], data: { roles: [...CONFIG] } };
const guardFinance     = { canActivate: [roleGuard], data: { roles: [...FINANCE] } };
const guardCash        = { canActivate: [roleGuard], data: { roles: [...CASH] } };
const guardEvalTasks   = { canActivate: [roleGuard], data: { roles: [...EVAL_TASKS] } };

export const PRIVATE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/components/private-layout/private-layout.component').then(m => m.PrivateLayoutComponent),
    children: [

      // ════════════════════════════════════════════════════════
      //  DASHBOARDS (uno por rol)
      // ════════════════════════════════════════════════════════
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        ...guardAdmin,
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'CERMAT - Panel de Administración'
      },
      {
        path: 'dashboard/student',
        loadComponent: () => import('./features/student/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
        title: 'CERMAT - Portal del Estudiante'
      },
      {
        path: 'dashboard/teacher',
        loadComponent: () => import('./features/teacher/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'CERMAT - Portal del Docente'
      },
      {
        path: 'dashboard/apoderado',
        loadComponent: () => import('./features/apoderado/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'CERMAT - Portal de Apoderado'
      },

      // ════════════════════════════════════════════════════════
      //  MÓDULOS DEL ESTUDIANTE
      // ════════════════════════════════════════════════════════
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

      // ════════════════════════════════════════════════════════
      //  MÓDULOS DEL APODERADO (rutas directas + shells con pestañas)
      // ════════════════════════════════════════════════════════

      // Rutas directas
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

      // Shells con pestañas (agrupan módulos relacionados)
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

      // ════════════════════════════════════════════════════════
      //  MÓDULOS DEL DOCENTE (rutas directas + shells con pestañas)
      // ════════════════════════════════════════════════════════

      // Rutas directas
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

      // Shells con pestañas
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

      // ════════════════════════════════════════════════════════
      //  MÓDULOS COMPARTIDOS (admin + otros roles)
      // ════════════════════════════════════════════════════════

      // Matrículas
      {
        path: 'admissions/applications',
        ...guardAdmin,
        loadComponent: () => import('./features/admin/admissions/enrollment-approvals/enrollment-approvals.component').then(m => m.EnrollmentApprovalsComponent),
        title: 'CERMAT - Solicitudes de Matrícula'
      },

      // Asistencia (aprobación + historial)
      {
        path: 'attendance/approvals',
        ...guardAdmin,
        data: { roles: [...ADMIN, 'administrative'] },
        loadComponent: () => import('./features/admin/attendance/attendance-approvals/attendance-approvals.component').then(m => m.AttendanceApprovalsComponent),
        title: 'CERMAT - Aprobación de Justificaciones'
      },
      {
        path: 'attendance/history',
        ...guardAdmin,
        data: { roles: [...ADMIN, 'teacher'] },
        loadComponent: () => import('./shared/components/section-attendance-history/section-attendance-history.component').then(m => m.SectionAttendanceHistoryComponent),
        title: 'CERMAT - Historial de Asistencia'
      },

      // Evaluación
      {
        path: 'evaluation/grade-entry',
        ...guardEvalTasks,
        loadComponent: () => import('./features/admin/evaluation/grade-entry/grade-entry.component').then(m => m.GradeEntryComponent),
        title: 'CERMAT - Registro de Notas'
      },
      {
        path: 'evaluation/review',
        ...guardConfig,
        loadComponent: () => import('./features/admin/evaluation/evaluation-review/evaluation-review.component').then(m => m.EvaluationReviewComponent),
        title: 'CERMAT - Gestión de Evaluaciones'
      },

      // Tareas
      {
        path: 'tasks/management',
        ...guardEvalTasks,
        loadComponent: () => import('./features/admin/tasks/task-management/task-management.component').then(m => m.TaskManagementComponent),
        title: 'CERMAT - Gestión de Tareas'
      },
      {
        path: 'tasks/grading',
        ...guardEvalTasks,
        loadComponent: () => import('./features/admin/tasks/task-grading/task-grading.component').then(m => m.TaskGradingComponent),
        title: 'CERMAT - Calificar Entregas'
      },

      // Comunicados
      {
        path: 'communications/review',
        data: { roles: ['admin', 'director', 'secretary'] },
        canActivate: [roleGuard],
        loadComponent: () => import('./features/admin/communications/communications-approval.component').then(m => m.CommunicationsApprovalComponent),
        title: 'CERMAT - Aprobar Comunicados'
      },

      // ════════════════════════════════════════════════════════
      //  FINANZAS
      // ════════════════════════════════════════════════════════
      {
        path: 'finance/catalog',
        ...guardFinance,
        loadComponent: () => import('./features/admin/finance/finance-catalog/finance-catalog.component').then(m => m.FinanceCatalogComponent),
        title: 'CERMAT - Catálogo Financiero'
      },
      {
        path: 'finance/charges/emission',
        ...guardFinance,
        loadComponent: () => import('./features/admin/finance/charges/finance-emission.component').then(m => m.FinanceEmissionComponent),
        title: 'CERMAT - Emisión de Cargos'
      },
      {
        path: 'finance/charges/student',
        ...guardFinance,
        loadComponent: () => import('./features/admin/finance/charges/finance-student.component').then(m => m.FinanceStudentComponent),
        title: 'CERMAT - Cuenta Estudiante'
      },
      {
        path: 'finance/cash',
        ...guardCash,
        loadComponent: () => import('./features/admin/finance/cash/finance-cash.component').then(m => m.FinanceCashComponent),
        title: 'CERMAT - Caja Diaria'
      },
      {
        path: 'finance/cash/closures',
        ...guardCash,
        loadComponent: () => import('./features/admin/finance/cash/finance-closures.component').then(m => m.FinanceClosuresComponent),
        title: 'CERMAT - Historial de Cierres'
      },
      {
        path: 'finance/reports',
        ...guardFinance,
        loadComponent: () => import('./features/admin/finance/reports/finance-reports.component').then(m => m.FinanceReportsComponent),
        title: 'CERMAT - Reportes Financieros'
      },

      // ════════════════════════════════════════════════════════
      //  REPORTES Y MÉTRICAS
      // ════════════════════════════════════════════════════════
      {
        path: 'reports/academic',
        ...guardAdmin,
        loadComponent: () => import('./features/admin/reports/academic-reports/academic-reports.component').then(m => m.AcademicReportsComponent),
        title: 'CERMAT - Reportes Académicos'
      },
      {
        path: 'dashboard/metrics/admin',
        ...guardConfig,
        loadComponent: () => import('./features/admin/metrics/admin-metrics/admin-metrics.component').then(m => m.AdminMetricsComponent),
        title: 'CERMAT - Métricas del Sistema'
      },

      // ════════════════════════════════════════════════════════
      //  HORARIOS
      // ════════════════════════════════════════════════════════
      {
        path: 'schedule/admin',
        ...guardConfig,
        loadComponent: () => import('./features/admin/schedule/admin-schedule/admin-schedule.component').then(m => m.AdminScheduleComponent),
        title: 'CERMAT - Gestión de Horarios'
      },

      // ════════════════════════════════════════════════════════
      //  CONFIGURACIÓN / AJUSTES
      // ════════════════════════════════════════════════════════
      {
        path: 'settings/academic-calendar',
        ...guardConfig,
        loadComponent: () => import('./features/admin/settings/academic-calendar/academic-calendar.component').then(m => m.AcademicCalendarComponent),
        title: 'CERMAT - Calendario Académico'
      },
      {
        path: 'settings/academic-structure',
        ...guardConfig,
        loadComponent: () => import('./features/admin/settings/academic-structure/academic-structure.component').then(m => m.AcademicStructureComponent),
        title: 'CERMAT - Estructura Académica'
      },
      {
        path: 'settings/study-plan',
        ...guardConfig,
        loadComponent: () => import('./features/admin/settings/study-plan/study-plan.component').then(m => m.StudyPlanComponent),
        title: 'CERMAT - Plan de Estudios'
      },
      {
        path: 'settings/teacher-assignments',
        ...guardConfig,
        loadComponent: () => import('./features/admin/settings/teacher-assignments.component').then(m => m.TeacherAssignmentsComponent),
        title: 'CERMAT - Asignación Docente'
      },
      {
        path: 'settings/users',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director'] },
        loadComponent: () => import('./features/admin/settings/admin-users.component').then(m => m.AdminUsersComponent),
        title: 'CERMAT - Usuarios'
      },
      {
        path: 'settings/imports',
        ...guardAdmin,
        loadComponent: () => import('./features/admin/settings/bulk-import.component').then(m => m.BulkImportComponent),
        title: 'CERMAT - Importacion Masiva'
      },
      {
        path: 'settings/students',
        ...guardAdmin,
        loadComponent: () => import('./features/admin/settings/students.component').then(m => m.StudentsComponent),
        title: 'CERMAT - Estudiantes'
      },
      {
        path: 'settings/enrollments',
        ...guardAdmin,
        loadComponent: () => import('./features/admin/settings/enrollment-config.component').then(m => m.EnrollmentConfigComponent),
        title: 'CERMAT - Configuración Matrículas'
      },
      {
        path: 'settings/news',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'director', 'secretary', 'web_editor'] },
        loadComponent: () => import('./features/admin/website/news-management.component').then(m => m.NewsManagementComponent),
        title: 'CERMAT - Gestión de Noticias y Eventos'
      },

      // ════════════════════════════════════════════════════════
      //  RUTAS LEGACY → redirigen a sus reemplazos modernos
      // ════════════════════════════════════════════════════════

      // Settings antiguos → calendario unificado
      { path: 'settings/academic-years', redirectTo: 'settings/academic-calendar', pathMatch: 'full' },
      { path: 'settings/periods',        redirectTo: 'settings/academic-calendar', pathMatch: 'full' },

      // Settings antiguos → estructura unificada
      { path: 'settings/grades',   redirectTo: 'settings/academic-structure', pathMatch: 'full' },
      { path: 'settings/sections', redirectTo: 'settings/academic-structure', pathMatch: 'full' },

      // Settings antiguos → plan de estudios unificado
      { path: 'settings/courses',     redirectTo: 'settings/study-plan', pathMatch: 'full' },
      { path: 'settings/competencies', redirectTo: 'settings/study-plan', pathMatch: 'full' },

      // Finanzas antiguas → catálogo unificado
      { path: 'finance/catalog/concepts',  redirectTo: () => '/app/finance/catalog?tab=concepts',  pathMatch: 'full' },
      { path: 'finance/catalog/plans',     redirectTo: () => '/app/finance/catalog?tab=plans',     pathMatch: 'full' },
      { path: 'finance/catalog/discounts', redirectTo: () => '/app/finance/catalog?tab=discounts', pathMatch: 'full' },
    ]
  }
];
