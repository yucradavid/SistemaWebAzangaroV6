<?php

use Illuminate\Support\Facades\Route;

// Auth
use App\Http\Controllers\Api\AuthController;

// Académico
use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\GradeLevelController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\PeriodController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CourseAssignmentController;
use App\Http\Controllers\Api\CourseScheduleController;
use App\Http\Controllers\Api\CompetencyController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AcademicEvaluationController;
use App\Http\Controllers\Api\DescriptiveConclusionController;
use App\Http\Controllers\Api\FinalCompetencyResultController;
use App\Http\Controllers\Api\PromotionRuleController;
use App\Http\Controllers\Api\RecoveryProcessController;
use App\Http\Controllers\Api\RecoveryResultController;
use App\Http\Controllers\Api\StudentFinalStatusController;
use App\Http\Controllers\Api\PeriodHistoryController;
use App\Http\Controllers\Api\BulkImportController;

// Personas
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\StudentGuardianController;

// Matrículas
use App\Http\Controllers\Api\EnrollmentApplicationController;
use App\Http\Controllers\Api\TeacherCourseAssignmentController;
use App\Http\Controllers\Api\StudentCourseEnrollmentController;

// Tareas / Entregas
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\TaskSubmissionController;
use App\Http\Controllers\Api\AssignmentSubmissionController;

// Asistencia
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AttendanceJustificationController;

// Comunicación
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PublicNewsController;

// Finanzas
use App\Http\Controllers\Api\FeeConceptController;
use App\Http\Controllers\Api\ChargeController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\DiscountController;
use App\Http\Controllers\Api\StudentDiscountController;
use App\Http\Controllers\Api\FinancialPlanController;
use App\Http\Controllers\Api\PlanInstallmentController;
use App\Http\Controllers\Api\CashClosureController;

// Auditoría
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;

Route::pattern('announcement', '[0-9a-fA-F-]{36}');

/*
|--------------------------------------------------------------------------
| API PÚBLICA
|--------------------------------------------------------------------------
| Rutas sin autenticación.
| Usadas principalmente para login o recursos públicos.
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::get('/public/enrollment-options', [EnrollmentApplicationController::class, 'publicOptions']);
Route::post('/public/enrollment-applications', [EnrollmentApplicationController::class, 'store']);

/*
|--------------------------------------------------------------------------
| API PROTEGIDA
|--------------------------------------------------------------------------
| Todas las rutas dentro de este grupo requieren token Sanctum.
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | AUTENTICACIÓN / SESIÓN
    |--------------------------------------------------------------------------
    | Endpoints para usuario autenticado.
    | El frontend suele consumir /me al iniciar la app.
    |--------------------------------------------------------------------------
    */
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/me/academic-context', [AuthController::class, 'academicContext']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    | Resumen general del sistema para roles administrativos.
    |--------------------------------------------------------------------------
    */
    Route::get('/dashboard', [ReportController::class, 'dashboard'])
        ->middleware('role:admin,director,coordinator,secretary');

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: ACADÉMICO - Catálogos base
    |--------------------------------------------------------------------------
    | Catálogos usados por el sistema académico:
    | - años académicos
    | - grados
    | - secciones
    | - periodos
    | - cursos
    |--------------------------------------------------------------------------
    */
    Route::get('periods', [PeriodController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');
    Route::get('periods/{id}', [PeriodController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');
    Route::get('periods/{period}/history', [PeriodHistoryController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');

    Route::middleware('role:admin,director,coordinator,secretary')->group(function () {
        Route::apiResource('academic-years', AcademicYearController::class);
        Route::apiResource('grade-levels', GradeLevelController::class);
        Route::apiResource('sections', SectionController::class);
        Route::post('periods', [PeriodController::class, 'store']);
        Route::put('periods/{id}', [PeriodController::class, 'update']);
        Route::patch('periods/{id}', [PeriodController::class, 'update']);
        Route::delete('periods/{id}', [PeriodController::class, 'destroy']);
        Route::post('periods/{period}/history/regenerate', [PeriodHistoryController::class, 'regenerate']);
        Route::apiResource('courses', CourseController::class);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: PERSONAS
    |--------------------------------------------------------------------------
    | Gestión de perfiles y personas del sistema:
    | - perfiles
    | - estudiantes
    | - docentes
    | - apoderados
    | - relación estudiante/apoderado
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary')->group(function () {
        Route::get('profiles/stats', [ProfileController::class, 'stats']);
        Route::apiResource('profiles', ProfileController::class);
        Route::apiResource('students', StudentController::class);
        Route::apiResource('guardians', GuardianController::class);
        Route::apiResource('student-guardians', StudentGuardianController::class);
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::delete('users/{id}', [UserController::class, 'destroy']);
        Route::post('bulk-import/{type}/preview', [BulkImportController::class, 'preview']);
        Route::post('bulk-import/{type}', [BulkImportController::class, 'store']);
    });

    Route::get('teachers', [TeacherController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::get('teachers/{id}', [TeacherController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::middleware('role:admin,director,coordinator,secretary')->group(function () {
        Route::post('teachers', [TeacherController::class, 'store']);
        Route::put('teachers/{id}', [TeacherController::class, 'update']);
        Route::patch('teachers/{id}', [TeacherController::class, 'update']);
        Route::delete('teachers/{id}', [TeacherController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: HORARIOS Y ASIGNACIONES
    |--------------------------------------------------------------------------
    | Gestión de horarios y asignación de cursos.
    |--------------------------------------------------------------------------
    */

    // Horarios de cursos - lectura para la mayoría de roles autenticados
    Route::get('course-schedules', [CourseScheduleController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');
    Route::get('course-schedules/{courseSchedule}', [CourseScheduleController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');

    // Horarios de cursos - escritura para administración y docentes
    Route::middleware('role:admin,director,coordinator,secretary,teacher')->group(function () {
        Route::post('course-schedules', [CourseScheduleController::class, 'store']);
        Route::put('course-schedules/{courseSchedule}', [CourseScheduleController::class, 'update']);
        Route::delete('course-schedules/{courseSchedule}', [CourseScheduleController::class, 'destroy']);
    });

    // Asignaciones de cursos - lectura
    Route::get('course-assignments', [CourseAssignmentController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::get('course-assignments/{courseAssignment}', [CourseAssignmentController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');

    // Asignaciones de cursos - escritura
    Route::middleware('role:admin,director,coordinator,secretary')->group(function () {
        Route::post('course-assignments', [CourseAssignmentController::class, 'store']);
        Route::put('course-assignments/{courseAssignment}', [CourseAssignmentController::class, 'update']);
        Route::delete('course-assignments/{courseAssignment}', [CourseAssignmentController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: MATRÍCULAS
    |--------------------------------------------------------------------------
    | Gestión de:
    | - postulaciones
    | - asignación docente-curso
    | - matrículas del estudiante en cursos
    |--------------------------------------------------------------------------
    */
    Route::get('teacher-course-assignments', [TeacherCourseAssignmentController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::get('teacher-course-assignments/{id}', [TeacherCourseAssignmentController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::get('student-course-enrollments', [StudentCourseEnrollmentController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::get('student-course-enrollments/{id}', [StudentCourseEnrollmentController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');

    Route::middleware('role:admin,director,coordinator,secretary')->group(function () {
        Route::apiResource('enrollment-applications', EnrollmentApplicationController::class);
        Route::post('enrollment-applications/{id}/approve', [EnrollmentApplicationController::class, 'approve']);
        Route::post('enrollment-applications/{id}/provision-accounts', [EnrollmentApplicationController::class, 'provisionAccounts']);
        Route::post('enrollment-applications/{id}/reject', [EnrollmentApplicationController::class, 'reject']);

        Route::post('teacher-course-assignments', [TeacherCourseAssignmentController::class, 'store']);
        Route::put('teacher-course-assignments/{id}', [TeacherCourseAssignmentController::class, 'update']);
        Route::patch('teacher-course-assignments/{id}', [TeacherCourseAssignmentController::class, 'update']);
        Route::delete('teacher-course-assignments/{id}', [TeacherCourseAssignmentController::class, 'destroy']);

        Route::post('student-course-enrollments', [StudentCourseEnrollmentController::class, 'store']);
        Route::put('student-course-enrollments/{id}', [StudentCourseEnrollmentController::class, 'update']);
        Route::patch('student-course-enrollments/{id}', [StudentCourseEnrollmentController::class, 'update']);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: TAREAS
    |--------------------------------------------------------------------------
    | Gestión de tareas publicadas por docentes/administración.
    |--------------------------------------------------------------------------
    */

    // Lectura de tareas
    Route::get('assignments', [AssignmentController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');
    Route::get('assignments/{assignment}', [AssignmentController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');
    Route::get('assignments/{assignment}/submissions-summary', [AssignmentController::class, 'submissionsSummary'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');

    // Escritura de tareas
    Route::post('assignments', [AssignmentController::class, 'store'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::put('assignments/{assignment}', [AssignmentController::class, 'update'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::delete('assignments/{assignment}', [AssignmentController::class, 'destroy'])
        ->middleware('role:admin,director,coordinator,secretary');

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: ENTREGA DE TAREAS (task-submissions)
    |--------------------------------------------------------------------------
    | Entregas de tareas realizadas por alumnos.
    |--------------------------------------------------------------------------
    */
    Route::get('task-submissions', [TaskSubmissionController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');
    Route::get('task-submissions/{taskSubmission}', [TaskSubmissionController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian');

    Route::post('task-submissions', [TaskSubmissionController::class, 'store'])
        ->middleware('role:admin,student');
    Route::put('task-submissions/{taskSubmission}', [TaskSubmissionController::class, 'update'])
        ->middleware('role:admin,student');
    Route::post('task-submissions/{taskSubmission}/grade', [TaskSubmissionController::class, 'grade'])
        ->middleware('role:admin,teacher');
    Route::delete('task-submissions/{taskSubmission}', [TaskSubmissionController::class, 'destroy'])
        ->middleware('role:admin');

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: ASSIGNMENT SUBMISSIONS
    |--------------------------------------------------------------------------
    | Otro módulo de entregas/revisión asociado a assignments.
    |--------------------------------------------------------------------------
    */
    Route::get('assignment-submissions', [AssignmentSubmissionController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student');
    Route::get('assignment-submissions/{assignmentSubmission}', [AssignmentSubmissionController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,student');
    Route::post('assignment-submissions', [AssignmentSubmissionController::class, 'store'])
        ->middleware('role:admin,student');
    Route::put('assignment-submissions/{assignmentSubmission}', [AssignmentSubmissionController::class, 'update'])
        ->middleware('role:admin,student');
    Route::delete('assignment-submissions/{assignmentSubmission}', [AssignmentSubmissionController::class, 'destroy'])
        ->middleware('role:admin');
    Route::post('assignment-submissions/{assignmentSubmission}/review', [AssignmentSubmissionController::class, 'review'])
        ->middleware('role:admin,teacher');

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: ASISTENCIA
    |--------------------------------------------------------------------------
    | Registro y mantenimiento de asistencia.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary,teacher')->group(function () {
        Route::get('attendance/admin-overview', [AttendanceController::class, 'adminOverview'])
            ->middleware('role:admin,director,coordinator,secretary');
        Route::get('attendance/my-context', [AttendanceController::class, 'myContext']);
        Route::post('attendance/batch', [AttendanceController::class, 'batchStore']);
        Route::apiResource('attendance', AttendanceController::class);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: JUSTIFICACIONES DE ASISTENCIA
    |--------------------------------------------------------------------------
    | Solicitudes y revisión de justificaciones.
    |--------------------------------------------------------------------------
    */
    Route::get('attendance-justifications', [AttendanceJustificationController::class, 'index'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,guardian');
    Route::post('attendance-justifications', [AttendanceJustificationController::class, 'store'])
        ->middleware('role:admin,guardian');
    Route::get('attendance-justifications/{attendanceJustification}', [AttendanceJustificationController::class, 'show'])
        ->middleware('role:admin,director,coordinator,secretary,teacher,guardian');
    Route::post('attendance-justifications/{attendanceJustification}/approve', [AttendanceJustificationController::class, 'approve'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::post('attendance-justifications/{attendanceJustification}/reject', [AttendanceJustificationController::class, 'reject'])
        ->middleware('role:admin,director,coordinator,secretary,teacher');
    Route::delete('attendance-justifications/{attendanceJustification}', [AttendanceJustificationController::class, 'destroy'])
        ->middleware('role:admin');

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: COMPETENCIAS
    |--------------------------------------------------------------------------
    | Catálogo de competencias académicas.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary,teacher')->group(function () {
        Route::apiResource('competencies', CompetencyController::class);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: EVALUACIONES / NOTAS
    |--------------------------------------------------------------------------
    | Registro, actualización y publicación de evaluaciones.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary,teacher')->group(function () {
        Route::get('evaluations/my-context', [EvaluationController::class, 'myContext']);
        Route::get('evaluations', [EvaluationController::class, 'index']);
        Route::post('evaluations', [EvaluationController::class, 'store']);
        Route::get('evaluations/{evaluation}', [EvaluationController::class, 'show']);
        Route::put('evaluations/{evaluation}', [EvaluationController::class, 'update']);
        Route::delete('evaluations/{evaluation}', [EvaluationController::class, 'destroy']);

        Route::post('evaluations/{evaluation}/publish', [EvaluationController::class, 'publish']);
        Route::post('evaluations/{evaluation}/close', [EvaluationController::class, 'close']);

        Route::apiResource('descriptive-conclusions', DescriptiveConclusionController::class);
        Route::get('final-competency-results', [FinalCompetencyResultController::class, 'index']);
        Route::get('final-competency-results/{finalCompetencyResult}', [FinalCompetencyResultController::class, 'show']);
        Route::get('student-final-statuses', [StudentFinalStatusController::class, 'index']);
        Route::get('student-final-statuses/{studentFinalStatus}', [StudentFinalStatusController::class, 'show']);
        Route::apiResource('recovery-processes', RecoveryProcessController::class);
        Route::apiResource('recovery-results', RecoveryResultController::class);
        Route::post(
            'academic-years/{academicYear}/students/{student}/evaluation-summary/recalculate',
            [AcademicEvaluationController::class, 'recalculate']
        );
        Route::post(
            'academic-years/{academicYear}/sections/{section}/evaluation-summary/recalculate',
            [AcademicEvaluationController::class, 'recalculateSection']
        );
    });

    Route::middleware('role:admin,director,coordinator,secretary')->group(function () {
        Route::apiResource('promotion-rules', PromotionRuleController::class);
    });

    Route::get(
        'academic-years/{academicYear}/students/{student}/evaluation-summary',
        [AcademicEvaluationController::class, 'summary']
    )
        ->middleware('role:admin,director,coordinator,secretary,teacher,student,guardian')
        ->middleware('student.guardian.access');
    Route::get(
        'academic-years/{academicYear}/sections/{section}/evaluation-dashboard',
        [AcademicEvaluationController::class, 'sectionDashboard']
    )
        ->middleware('role:admin,director,coordinator,secretary,teacher');

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: REPORTES
    |--------------------------------------------------------------------------
    | Reportes por estudiante:
    | - boleta de notas
    | - asistencia
    | - resumen financiero
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary')->group(function () {
        Route::get('reports/sections/{section}/attendance-summary', [ReportController::class, 'sectionAttendanceSummary']);
        Route::get('reports/sections/{section}/evaluation-summary', [ReportController::class, 'sectionEvaluationSummary']);
    });

    Route::middleware('role:admin,director,coordinator,secretary,teacher,student,guardian')->group(function () {
        Route::get('reports/students/{student}/report-card', [ReportController::class, 'reportCard'])
            ->middleware('student.guardian.access');

        Route::get('reports/students/{student}/attendance', [ReportController::class, 'attendanceSummary'])
            ->middleware('student.guardian.access');

        Route::get('reports/students/{student}/financial', [ReportController::class, 'financialSummary'])
            ->middleware('student.guardian.access');
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: ANUNCIOS
    |--------------------------------------------------------------------------
    | Publicación y flujo de aprobación de anuncios internos.
    |--------------------------------------------------------------------------
    */
    Route::apiResource('announcements', AnnouncementController::class);

    Route::post('announcements/{announcement}/request-approval', [AnnouncementController::class, 'requestApproval']);
    Route::post('announcements/{announcement}/approve', [AnnouncementController::class, 'approve']);
    Route::post('announcements/{announcement}/archive', [AnnouncementController::class, 'archive']);

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: MENSAJES
    |--------------------------------------------------------------------------
    | Mensajería interna entre usuarios autorizados.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary,teacher,guardian')->group(function () {
        Route::get('messages/threads', [MessageController::class, 'threads']);
        Route::apiResource('messages', MessageController::class)
            ->only(['index', 'store', 'show', 'update', 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: NOTIFICACIONES
    |--------------------------------------------------------------------------
    | Listado, detalle, borrado y marcado de notificaciones.
    |--------------------------------------------------------------------------
    */
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/{notification}', [NotificationController::class, 'show']);
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::put('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    Route::post('notifications', [NotificationController::class, 'store'])
        ->middleware('role:admin,director,coordinator,secretary');

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: NOTICIAS PÚBLICAS
    |--------------------------------------------------------------------------
    | Gestión de noticias visibles públicamente.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary,web_editor')->group(function () {
        Route::apiResource('public-news', PublicNewsController::class);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: FINANZAS
    |--------------------------------------------------------------------------
    | Conceptos, cobros, pagos y recibos.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary,finance')->group(function () {
        Route::apiResource('fee-concepts', FeeConceptController::class);
        Route::post('charges/batch', [ChargeController::class, 'batchStore']);
        Route::post('charges/{charge}/void', [ChargeController::class, 'void']);
        Route::apiResource('charges', ChargeController::class);
    });

    Route::middleware('role:admin,director,secretary,finance,cashier')->group(function () {
        Route::post('payments/{payment}/void', [PaymentController::class, 'void']);
        Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show', 'destroy']);
        Route::apiResource('receipts', ReceiptController::class)->only(['index', 'store', 'show', 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: DESCUENTOS / PLANES / CAJA
    |--------------------------------------------------------------------------
    | Descuentos, planes financieros, cuotas y cierres de caja.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,coordinator,secretary,finance')->group(function () {
        Route::apiResource('discounts', DiscountController::class);
        Route::apiResource('student-discounts', StudentDiscountController::class);
        Route::apiResource('financial-plans', FinancialPlanController::class);
        Route::apiResource('plan-installments', PlanInstallmentController::class);
    });

    Route::middleware('role:admin,director,secretary,finance,cashier')->group(function () {
        Route::apiResource('cash-closures', CashClosureController::class);
    });

    /*
    |--------------------------------------------------------------------------
    | MÓDULO: AUDITORÍA
    |--------------------------------------------------------------------------
    | Consulta de logs del sistema.
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director')->group(function () {
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });
});
