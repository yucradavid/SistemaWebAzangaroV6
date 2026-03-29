import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MinimalLayout } from '../components/layout/MinimalLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';

// Páginas públicas
import { HomePage } from '../pages/public/HomePage';
import { AdmissionsPage } from '../pages/public/AdmissionsPage';
import { LevelsPage } from '../pages/public/LevelsPage';
import { TeachersPage } from '../pages/public/TeachersPage';
import { NewsListPage } from '../pages/public/NewsListPage';
import { NewsDetailPage } from '../pages/public/NewsDetailPage';
import { ContactPage } from '../pages/public/ContactPage';

// Páginas legales
import { PrivacyPolicyPage } from '../pages/legal/PrivacyPolicyPage';
import { TermsConditionsPage } from '../pages/legal/TermsConditionsPage';
import { CookiesPolicyPage } from '../pages/legal/CookiesPolicyPage';

// Páginas de autenticación
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

import { TeacherDashboard } from '../pages/dashboards/TeacherDashboard';
import { GuardianDashboard } from '../pages/dashboards/GuardianDashboard';
import { StudentDashboard } from '../pages/dashboards/StudentDashboard';
import { FinanceDashboard } from '../pages/dashboards/FinanceDashboard';
import { AdminDashboard } from '../pages/dashboards/AdminDashboard';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminMetricsPage } from '../pages/metrics/AdminMetricsPage';
import { TeacherMetricsPage } from '../pages/metrics/TeacherMetricsPage';
import { StudentMetricsPage } from '../pages/metrics/StudentMetricsPage';
import { GuardianMetricsPage } from '../pages/metrics/GuardianMetricsPage';
import type { UserRole } from '../lib/database.types';

// Páginas de configuración académica
import { AcademicYearsPage } from '../pages/settings/AcademicYearsPage';
import { PeriodsPage } from '../pages/settings/PeriodsPage';
import { GradesPage } from '../pages/settings/GradesPage';
import { SectionsPage } from '../pages/settings/SectionsPage';
import { CoursesPage } from '../pages/settings/CoursesPage';
import { CompetenciesPage } from '../pages/settings/CompetenciesPage';
import AdminUsersPage from '../pages/settings/AdminUsersPage';

// Páginas de asistencia
import { TeacherAttendancePage } from '../pages/attendance/TeacherAttendancePage';
import { StudentAttendancePage } from '../pages/attendance/StudentAttendancePage';
import { GuardianAttendancePage } from '../pages/attendance/GuardianAttendancePage';
import { AttendanceApprovalsPage } from '../pages/attendance/AttendanceApprovalsPage';

// Páginas de evaluación
import { TeacherEvaluationPage } from '../pages/evaluation/TeacherEvaluationPage';
import { StudentEvaluationPage } from '../pages/evaluation/StudentEvaluationPage';
import { GuardianEvaluationPage } from '../pages/evaluation/GuardianEvaluationPage';
import { EvaluationReviewPage } from '../pages/evaluation/EvaluationReviewPage';

// Páginas de tareas
import { TeacherTasksPage } from '../pages/tasks/TeacherTasksPage';
import { TeacherGradingPage } from '../pages/tasks/TeacherGradingPage';
import { StudentTasksPage } from '../pages/tasks/StudentTasksPage';
import { GuardianTasksPage } from '../pages/tasks/GuardianTasksPage';

// Páginas de matrículas
import { EnrollmentApprovalsPage } from '../pages/admissions/EnrollmentApprovalsPage';

// Páginas de configuración adicional
import { TeacherAssignmentsPage } from '../pages/settings/TeacherAssignmentsPage';
import { StudentsPage } from '../pages/settings/StudentsPage';
import { EnrollmentsPage } from '../pages/settings/EnrollmentsPage';

// Páginas de comunicados
import { TeacherCommunicationsPage } from '../pages/communications/TeacherCommunicationsPage';
import { StudentCommunicationsPage } from '../pages/communications/StudentCommunicationsPage';
import { GuardianCommunicationsPage } from '../pages/communications/GuardianCommunicationsPage';
import { CommunicationsReviewPage } from '../pages/communications/CommunicationsReviewPage';

// Páginas de mensajería
import { TeacherMessagesPage } from '../pages/messages/TeacherMessagesPage';
import { GuardianMessagesPage } from '../pages/messages/GuardianMessagesPage';

// Páginas de finanzas - Dashboard principal
import { FinanceModulePage } from '../pages/finance/FinanceModulePage';

// Páginas de configuración principal
import { SettingsModulePage } from '../pages/settings/SettingsModulePage';
import { NewsManagementPage } from '../pages/settings/NewsManagementPage';

// Páginas de mensajería principal
import { MessagesModulePage } from '../pages/messages/MessagesModulePage';

// Páginas de tareas (Dashboard)
import { TasksModulePage } from '../pages/tasks/TasksModulePage';

// Páginas de evaluación (Dashboard)
import { EvaluationModulePage } from '../pages/evaluation/EvaluationModulePage';

// Páginas de finanzas - catálogo
import { FeeConceptsPage } from '../pages/finance/catalog/FeeConceptsPage';
import { FinancialPlansPage } from '../pages/finance/catalog/FinancialPlansPage';
import { DiscountsPage } from '../pages/finance/catalog/DiscountsPage';

// Páginas de finanzas - cargos
import { ChargeEmissionPage } from '../pages/finance/charges/ChargeEmissionPage';
import { StudentAccountPage } from '../pages/finance/charges/StudentAccountPage';

// Páginas de finanzas - portal apoderado
import { GuardianFinancePage } from '../pages/finance/GuardianFinancePage';

// Páginas de finanzas - caja
import { CashRegisterPage } from '../pages/finance/cash/CashRegisterPage';
import { CashClosuresPage } from '../pages/finance/cash/CashClosuresPage';

// Páginas de finanzas - reportes
import { FinancialReportsPage } from '../pages/finance/reports/FinancialReportsPage';

// Páginas de reportes académicos
import { AcademicReportsPage } from '../pages/reports/AcademicReportsPage';

// Páginas de horarios
import { AdminSchedulePage } from '../pages/schedule/AdminSchedulePage';
import { MySchedulePage } from '../pages/schedule/MySchedulePage';

function DashboardRouter() {
  const { profile } = useAuth();
  const role = profile?.role as UserRole;

  switch (role) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'guardian':
      return <GuardianDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'finance':
    case 'cashier':
      return <FinanceDashboard />;
    case 'admin':
    case 'director':
    case 'coordinator':
      return <AdminDashboard />;
    default:
      return <AdminDashboard />;
  }
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas - Website */}
      <Route path="/" element={<HomePage />} />
      <Route path="/admisiones" element={<AdmissionsPage />} />
      <Route path="/niveles" element={<LevelsPage />} />
      <Route path="/docentes" element={<TeachersPage />} />
      <Route path="/noticias" element={<NewsListPage />} />
      <Route path="/noticias/:id" element={<NewsDetailPage />} />
      <Route path="/contacto" element={<ContactPage />} />

      {/* Rutas legales */}
      <Route path="/privacidad" element={<PrivacyPolicyPage />} />
      <Route path="/terminos" element={<TermsConditionsPage />} />
      <Route path="/cookies" element={<CookiesPolicyPage />} />

      {/* Rutas de autenticación */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Rutas protegidas con layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MinimalLayout>
              <DashboardRouter />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Métricas */}
      <Route
        path="/dashboard/metrics/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <AdminMetricsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/metrics/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MinimalLayout>
              <TeacherMetricsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/metrics/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MinimalLayout>
              <StudentMetricsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/metrics/guardian"
        element={
          <ProtectedRoute allowedRoles={['guardian']}>
            <MinimalLayout>
              <GuardianMetricsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Configuración - Módulo Principal */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <SettingsModulePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Configuración Académica - Solo Admin/Director */}
      <Route
        path="/settings/academic-years"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <AcademicYearsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/periods"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <PeriodsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/grades"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <GradesPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/sections"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <SectionsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/courses"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <CoursesPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/competencies"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <CompetenciesPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/users"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director']}>
            <MinimalLayout>
              <AdminUsersPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/teacher-assignments"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <TeacherAssignmentsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/students"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator', 'secretary']}>
            <MinimalLayout>
              <StudentsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/enrollments"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator', 'secretary']}>
            <MinimalLayout>
              <EnrollmentsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/news"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'web_editor']}>
            <MinimalLayout>
              <NewsManagementPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Módulo de Matrículas */}
      <Route
        path="/admissions/applications"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'secretary', 'coordinator']}>
            <MinimalLayout>
              <EnrollmentApprovalsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Módulo de Asistencia */}
      <Route
        path="/attendance/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <TeacherAttendancePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'director']}>
            <MinimalLayout>
              <StudentAttendancePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/guardian"
        element={
          <ProtectedRoute allowedRoles={['guardian', 'admin', 'director']}>
            <MinimalLayout>
              <GuardianAttendancePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/approvals"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'secretary', 'coordinator']}>
            <MinimalLayout>
              <AttendanceApprovalsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Módulo de Evaluación */}
      <Route
        path="/evaluation"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator', 'teacher']}>
            <MinimalLayout>
              <EvaluationModulePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluation/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <TeacherEvaluationPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluation/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'director']}>
            <MinimalLayout>
              <StudentEvaluationPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluation/guardian"
        element={
          <ProtectedRoute allowedRoles={['guardian', 'admin', 'director']}>
            <MinimalLayout>
              <GuardianEvaluationPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluation/review"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <EvaluationReviewPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Tareas */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator', 'teacher']}>
            <MinimalLayout>
              <TasksModulePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <TeacherTasksPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/grading"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <TeacherGradingPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'director']}>
            <MinimalLayout>
              <StudentTasksPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/guardian"
        element={
          <ProtectedRoute allowedRoles={['guardian', 'admin', 'director']}>
            <MinimalLayout>
              <GuardianTasksPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Comunicados */}
      <Route
        path="/communications/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <TeacherCommunicationsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/communications/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'director']}>
            <MinimalLayout>
              <StudentCommunicationsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/communications/guardian"
        element={
          <ProtectedRoute allowedRoles={['guardian', 'admin', 'director']}>
            <MinimalLayout>
              <GuardianCommunicationsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/communications/review"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <CommunicationsReviewPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Mensajería */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <MessagesModulePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <TeacherMessagesPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/guardian"
        element={
          <ProtectedRoute allowedRoles={['guardian', 'admin', 'director']}>
            <MinimalLayout>
              <GuardianMessagesPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Módulo Académico - Placeholder */}
      <Route
        path="/academic/*"
        element={
          <ProtectedRoute>
            <MinimalLayout>
              <div className="p-8">
                <h1 className="text-2xl font-bold">Módulo Académico</h1>
                <p className="text-gray-600">En construcción</p>
              </div>
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Finanzas - Catálogo */}
      <Route
        path="/finance/catalog/concepts"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'finance']}>
            <MinimalLayout>
              <FeeConceptsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/catalog/plans"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'finance']}>
            <MinimalLayout>
              <FinancialPlansPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/catalog/discounts"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'finance']}>
            <MinimalLayout>
              <DiscountsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Finanzas - Cargos */}
      <Route
        path="/finance/charges/emission"
        element={
          <ProtectedRoute allowedRoles={['admin', 'finance']}>
            <MinimalLayout>
              <ChargeEmissionPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/charges/student"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'finance']}>
            <MinimalLayout>
              <StudentAccountPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Finanzas - Portal Apoderado */}
      <Route
        path="/finance/guardian"
        element={
          <ProtectedRoute allowedRoles={['guardian', 'admin', 'director']}>
            <MinimalLayout>
              <GuardianFinancePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Finanzas - Caja */}
      <Route
        path="/finance/cash"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'finance', 'admin']}>
            <MinimalLayout>
              <CashRegisterPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/cash/closures"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'finance', 'admin', 'director']}>
            <MinimalLayout>
              <CashClosuresPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Módulo Principal de Finanzas */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'finance']}>
            <MinimalLayout>
              <FinanceModulePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Finanzas - Reportes */}
      <Route
        path="/finance/reports"
        element={
          <ProtectedRoute allowedRoles={['admin', 'finance', 'director']}>
            <MinimalLayout>
              <FinancialReportsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Reportes Académicos */}
      <Route
        path="/reports/academic"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator', 'teacher']}>
            <MinimalLayout>
              <AcademicReportsPage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas protegidas - Horarios */}
      <Route
        path="/schedule/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator']}>
            <MinimalLayout>
              <AdminSchedulePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/schedule/my"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'student', 'guardian']}>
            <MinimalLayout>
              <MySchedulePage />
            </MinimalLayout>
          </ProtectedRoute>
        }
      />

      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
