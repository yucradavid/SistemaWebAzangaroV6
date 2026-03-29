<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Guardian;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentGuardian;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BulkImportService
{
    public function __construct(
        private readonly UserProvisioningService $userProvisioningService
    ) {
    }

    public function preview(string $type, UploadedFile $file, array $context = []): array
    {
        $parsed = $this->parseCsv($file);
        $rows = $this->validateRows($type, $parsed['rows'], $context);

        return [
            'type' => $type,
            'headers' => $parsed['headers'],
            'summary' => $this->buildSummary($rows),
            'rows' => $rows,
        ];
    }

    public function import(string $type, UploadedFile $file, array $context = [], ?string $actorUserId = null): array
    {
        $preview = $this->preview($type, $file, $context);
        $hasErrors = collect($preview['rows'])->contains(fn (array $row) => $row['action'] === 'error');

        if ($hasErrors) {
            return [
                ...$preview,
                'message' => 'Corrige los errores antes de ejecutar la importacion.',
            ];
        }

        $created = 0;
        $skipped = 0;

        DB::transaction(function () use ($type, $preview, $actorUserId, &$created, &$skipped) {
            foreach ($preview['rows'] as $row) {
                if ($row['action'] === 'skip') {
                    $skipped++;
                    continue;
                }

                $this->importRow($type, $row['normalized'], $actorUserId);
                $created++;
            }
        });

        return [
            ...$preview,
            'message' => 'Importacion ejecutada correctamente.',
            'created_rows' => $created,
            'skipped_rows' => $skipped,
        ];
    }

    private function importRow(string $type, array $row, ?string $actorUserId): void
    {
        match ($type) {
            'teachers', 'guardians', 'students' => $this->importProvisionedUser($type, $row, $actorUserId),
            'student_guardians' => $this->importStudentGuardianLink($row),
            'teacher_assignments' => $this->importTeacherAssignment($row, $actorUserId),
            default => throw new \InvalidArgumentException('Tipo de importacion no soportado.'),
        };
    }

    private function importProvisionedUser(string $type, array $row, ?string $actorUserId): void
    {
        $payload = match ($type) {
            'teachers' => [
                'name' => $row['full_name'],
                'email' => $row['email'],
                'password' => $row['password_temp'],
                'role' => 'teacher',
                'dni' => $row['dni'] ?? null,
                'phone' => $row['phone'] ?? null,
                'specialization' => $row['specialization'] ?? null,
                'hire_date' => $row['hire_date'] ?? null,
                'status' => $row['status'] ?? 'active',
            ],
            'guardians' => [
                'name' => $row['full_name'],
                'email' => $row['email'],
                'password' => $row['password_temp'],
                'role' => 'guardian',
                'dni' => $row['dni'] ?? null,
                'phone' => $row['phone'] ?? null,
                'address' => $row['address'] ?? null,
                'relationship' => $row['relationship'] ?? null,
                'is_primary' => $row['is_primary'] ?? false,
                'related_student_id' => $row['related_student_id'] ?? null,
                'relationship_is_primary' => $row['relationship_is_primary'] ?? false,
            ],
            'students' => [
                'name' => $row['full_name'],
                'email' => $row['email'],
                'password' => $row['password_temp'],
                'role' => 'student',
                'dni' => $row['dni'] ?? null,
                'birth_date' => $row['birth_date'] ?? null,
                'gender' => $row['gender'] ?? null,
                'address' => $row['address'] ?? null,
                'section_id' => $row['section_id'] ?? null,
                'enrollment_date' => $row['enrollment_date'] ?? null,
                'status' => $row['status'] ?? 'active',
            ],
        };

        $result = $this->userProvisioningService->create($payload, $actorUserId);

        if ($type === 'students' && !empty($row['auto_enroll_by_section']) && !empty($result['created_entity']['data'])) {
            $student = $result['created_entity']['data'];
            $section = Section::query()->find($row['section_id']);

            if ($student && $section) {
                $this->autoEnrollStudent($student, $section, $row['enrollment_date'] ?? null);
            }
        }
    }

    private function importStudentGuardianLink(array $row): void
    {
        StudentGuardian::query()->firstOrCreate(
            [
                'student_id' => $row['student_id'],
                'guardian_id' => $row['guardian_id'],
            ],
            [
                'id' => Str::uuid(),
                'is_primary' => $row['is_primary'] ?? false,
                'created_at' => now(),
            ]
        );
    }

    private function importTeacherAssignment(array $row, ?string $actorUserId): void
    {
        TeacherCourseAssignment::query()->firstOrCreate(
            [
                'teacher_id' => $row['teacher_id'],
                'course_id' => $row['course_id'],
                'section_id' => $row['section_id'],
                'academic_year_id' => $row['academic_year_id'],
            ],
            [
                'id' => Str::uuid(),
                'assigned_at' => $row['assigned_at'] ?? now(),
                'is_active' => $row['is_active'] ?? true,
                'notes' => $row['notes'] ?? null,
                'assigned_by' => DB::table('profiles')->where('user_id', (string) ($actorUserId ?? ''))->value('id'),
            ]
        );
    }

    private function autoEnrollStudent(Student $student, Section $section, ?string $enrollmentDate): void
    {
        $courses = Course::query()
            ->where('grade_level_id', $section->grade_level_id)
            ->get(['id']);

        foreach ($courses as $course) {
            StudentCourseEnrollment::query()->firstOrCreate(
                [
                    'student_id' => $student->id,
                    'course_id' => $course->id,
                    'academic_year_id' => $section->academic_year_id,
                ],
                [
                    'id' => Str::uuid(),
                    'section_id' => $section->id,
                    'status' => 'active',
                    'enrollment_date' => $enrollmentDate ?: now()->toDateString(),
                ]
            );
        }
    }

    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            throw new \RuntimeException('No se pudo abrir el archivo CSV.');
        }

        $firstLine = fgets($handle);
        rewind($handle);
        $delimiter = $this->detectDelimiter($firstLine ?: '');

        $headers = [];
        $rows = [];
        $rowNumber = 1;

        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowNumber++;

            if (empty($headers)) {
                $headers = collect($data)
                    ->map(fn ($value) => $this->normalizeHeader((string) $value))
                    ->values()
                    ->all();
                continue;
            }

            if ($this->isEmptyRow($data)) {
                continue;
            }

            $assoc = [];
            foreach ($headers as $index => $header) {
                $assoc[$header] = isset($data[$index]) ? trim((string) $data[$index]) : '';
            }

            $rows[] = [
                'row_number' => $rowNumber,
                'raw' => $assoc,
            ];
        }

        fclose($handle);

        return ['headers' => $headers, 'rows' => $rows];
    }

    private function validateRows(string $type, array $rows, array $context = []): array
    {
        return collect($rows)->map(function (array $row) use ($type, $context) {
            $normalized = [];
            $messages = [];
            $action = 'create';

            try {
                $normalized = $this->normalizeRow($type, $row['raw'], $messages, $context);
                if (($normalized['_skip'] ?? false) === true) {
                    $action = 'skip';
                }
            } catch (\Throwable $exception) {
                $messages[] = $exception->getMessage();
                $action = 'error';
            }

            if (!empty($messages) && $action !== 'skip') {
                $action = 'error';
            }

            return [
                'row_number' => $row['row_number'],
                'action' => $action,
                'messages' => $messages,
                'normalized' => $normalized,
                'raw' => $row['raw'],
            ];
        })->values()->all();
    }

    private function normalizeRow(string $type, array $row, array &$messages, array $context = []): array
    {
        return match ($type) {
            'teachers' => $this->normalizeProvisionedRow('teacher', $row, $context),
            'guardians' => $this->normalizeProvisionedRow('guardian', $row, $context),
            'students' => $this->normalizeStudentRow($row, $context),
            'student_guardians' => $this->normalizeStudentGuardianRow($row),
            'teacher_assignments' => $this->normalizeTeacherAssignmentRow($row, $context),
            default => throw new \InvalidArgumentException('Tipo de importacion no soportado.'),
        };
    }

    private function normalizeProvisionedRow(string $role, array $row, array $context = []): array
    {
        $fullName = $this->requiredValue($row, 'full_name');
        $email = strtolower($this->requiredValue($row, 'email'));
        $password = $this->nullableValue($row, 'password_temp') ?: $this->contextValue($context, 'default_password');

        if (!$password) {
            throw new \RuntimeException('Debes indicar password_temp en el CSV o una contrasena temporal general en el formulario.');
        }

        if (mb_strlen($password) < 8) {
            throw new \RuntimeException('La contrasena temporal debe tener al menos 8 caracteres.');
        }

        if (DB::table('users')->whereRaw('lower(email) = ?', [$email])->exists()) {
            throw new \RuntimeException("El correo {$email} ya existe.");
        }

        $dni = $this->nullableValue($row, 'dni');
        if ($dni) {
            $table = match ($role) {
                'teacher' => 'teachers',
                'guardian' => 'guardians',
                default => null,
            };

            if ($table && DB::table($table)->where('dni', $dni)->exists()) {
                throw new \RuntimeException("El DNI {$dni} ya existe.");
            }
        }

        $normalized = [
            'full_name' => $fullName,
            'email' => $email,
            'password_temp' => $password,
            'dni' => $dni,
            'phone' => $this->nullableValue($row, 'phone'),
            'address' => $this->nullableValue($row, 'address'),
            'specialization' => $this->nullableValue($row, 'specialization'),
            'hire_date' => $this->normalizeDate($this->nullableValue($row, 'hire_date')),
            'relationship' => $this->nullableValue($row, 'relationship'),
            'is_primary' => $this->normalizeBoolean($row['is_primary'] ?? null, false),
            'status' => $this->nullableValue($row, 'status') ?: 'active',
        ];

        if ($role === 'guardian') {
            $relatedStudent = $this->resolveOptionalStudentByReference($row);
            if ($relatedStudent) {
                $normalized['related_student_id'] = $relatedStudent->id;
                $normalized['relationship_is_primary'] = $this->normalizeBoolean(
                    $row['relationship_is_primary'] ?? $row['is_primary'] ?? null,
                    false
                );
            }
        }

        return $normalized;
    }

    private function normalizeStudentRow(array $row, array $context = []): array
    {
        $fullName = $this->requiredValue($row, 'full_name');
        $email = strtolower($this->requiredValue($row, 'email'));
        $password = $this->nullableValue($row, 'password_temp') ?: $this->contextValue($context, 'default_password');

        if (!$password) {
            throw new \RuntimeException('Debes indicar password_temp en el CSV o una contrasena temporal general en el formulario.');
        }

        if (mb_strlen($password) < 8) {
            throw new \RuntimeException('La contrasena temporal debe tener al menos 8 caracteres.');
        }

        if (DB::table('users')->whereRaw('lower(email) = ?', [$email])->exists()) {
            throw new \RuntimeException("El correo {$email} ya existe.");
        }

        $dni = $this->nullableValue($row, 'dni');
        if ($dni && DB::table('students')->where('dni', $dni)->exists()) {
            throw new \RuntimeException("El DNI {$dni} ya existe.");
        }

        $section = $this->resolveStudentSection($row, $context);

        return [
            'full_name' => $fullName,
            'email' => $email,
            'password_temp' => $password,
            'dni' => $dni,
            'birth_date' => $this->normalizeDate($this->nullableValue($row, 'birth_date')),
            'gender' => $this->nullableValue($row, 'gender'),
            'address' => $this->nullableValue($row, 'address'),
            'status' => $this->nullableValue($row, 'status') ?: 'active',
            'enrollment_date' => $this->normalizeDate($this->nullableValue($row, 'enrollment_date')) ?: now()->toDateString(),
            'section_id' => $section->id,
            'auto_enroll_by_section' => $this->normalizeBoolean(
                $row['auto_enroll_by_section'] ?? ($context['auto_enroll_by_section'] ?? null),
                true
            ),
        ];
    }

    private function normalizeStudentGuardianRow(array $row): array
    {
        $student = $this->resolveStudentByReference($row);
        $guardian = $this->resolveGuardianByReference($row);

        $exists = StudentGuardian::query()
            ->where('student_id', $student->id)
            ->where('guardian_id', $guardian->id)
            ->exists();

        return [
            'student_id' => $student->id,
            'guardian_id' => $guardian->id,
            'is_primary' => $this->normalizeBoolean($row['is_primary'] ?? null, false),
            '_skip' => $exists,
        ];
    }

    private function normalizeTeacherAssignmentRow(array $row, array $context = []): array
    {
        $section = $this->resolveAssignmentSection($row, $context);
        $teacher = $this->resolveTeacherByReference($row);
        $course = $this->resolveAssignmentCourse($row, $context, $section);

        $exists = TeacherCourseAssignment::query()
            ->where('teacher_id', $teacher->id)
            ->where('course_id', $course->id)
            ->where('section_id', $section->id)
            ->where('academic_year_id', $section->academic_year_id)
            ->exists();

        return [
            'teacher_id' => $teacher->id,
            'course_id' => $course->id,
            'section_id' => $section->id,
            'academic_year_id' => $section->academic_year_id,
            'assigned_at' => $this->normalizeDateTime($this->nullableValue($row, 'assigned_at')),
            'is_active' => $this->normalizeBoolean($row['is_active'] ?? null, true),
            'notes' => $this->nullableValue($row, 'notes'),
            '_skip' => $exists,
        ];
    }

    private function resolveAcademicYear(string $year): AcademicYear
    {
        $row = AcademicYear::query()->where('year', (int) $year)->first();
        if (!$row) {
            throw new \RuntimeException("No existe el ano academico {$year}.");
        }

        return $row;
    }

    private function resolveGradeLevel(string $grade, string $level): GradeLevel
    {
        $row = GradeLevel::query()
            ->where('grade', (int) $grade)
            ->whereRaw('lower(level) = ?', [Str::lower(trim($level))])
            ->first();

        if (!$row) {
            throw new \RuntimeException("No existe el grado/nivel {$grade} {$level}.");
        }

        return $row;
    }

    private function resolveSection(string $academicYearId, string $gradeLevelId, string $sectionLetter): Section
    {
        $row = Section::query()
            ->where('academic_year_id', $academicYearId)
            ->where('grade_level_id', $gradeLevelId)
            ->whereRaw('lower(section_letter) = ?', [Str::lower(trim($sectionLetter))])
            ->first();

        if (!$row) {
            throw new \RuntimeException("No existe la seccion {$sectionLetter} para el grado y ano indicados.");
        }

        return $row;
    }

    private function resolveStudentSection(array $row, array $context = []): Section
    {
        $selectedSectionId = $this->contextValue($context, 'section_id');
        if ($selectedSectionId) {
            $section = Section::query()->find($selectedSectionId);
            if (!$section) {
                throw new \RuntimeException('La seccion seleccionada en el formulario no existe.');
            }

            return $section;
        }

        $academicYear = $this->resolveAcademicYear($this->requiredValue($row, 'academic_year'));
        $gradeLevel = $this->resolveGradeLevel($this->requiredValue($row, 'grade'), $this->requiredValue($row, 'level'));

        return $this->resolveSection($academicYear->id, $gradeLevel->id, $this->requiredValue($row, 'section_letter'));
    }

    private function resolveAssignmentSection(array $row, array $context = []): Section
    {
        $selectedSectionId = $this->contextValue($context, 'section_id');
        if ($selectedSectionId) {
            $section = Section::query()->find($selectedSectionId);
            if (!$section) {
                throw new \RuntimeException('La seccion seleccionada en el formulario no existe.');
            }

            return $section;
        }

        $academicYear = $this->resolveAcademicYear($this->requiredValue($row, 'academic_year'));
        $gradeLevel = $this->resolveGradeLevel($this->requiredValue($row, 'grade'), $this->requiredValue($row, 'level'));

        return $this->resolveSection($academicYear->id, $gradeLevel->id, $this->requiredValue($row, 'section_letter'));
    }

    private function resolveAssignmentCourse(array $row, array $context, Section $section): Course
    {
        $selectedCourseId = $this->contextValue($context, 'course_id');
        if ($selectedCourseId) {
            $course = Course::query()->find($selectedCourseId);
            if (!$course) {
                throw new \RuntimeException('El curso seleccionado en el formulario no existe.');
            }

            if ($course->grade_level_id !== $section->grade_level_id) {
                throw new \RuntimeException('El curso seleccionado no pertenece al mismo grado de la seccion elegida.');
            }

            return $course;
        }

        return $this->resolveCourse($this->requiredValue($row, 'course_code'), $section->grade_level_id);
    }

    private function resolveCourse(string $courseCode, string $gradeLevelId): Course
    {
        $row = Course::query()
            ->whereRaw('lower(code) = ?', [Str::lower(trim($courseCode))])
            ->where('grade_level_id', $gradeLevelId)
            ->first();

        if (!$row) {
            throw new \RuntimeException("No existe el curso {$courseCode} para el grado indicado.");
        }

        return $row;
    }

    private function resolveStudentByReference(array $row): Student
    {
        $dni = $this->nullableValue($row, 'student_dni');
        $code = $this->nullableValue($row, 'student_code');
        $email = strtolower($this->nullableValue($row, 'student_email') ?? '');

        $query = Student::query();
        if ($dni) {
            $query->where('dni', $dni);
        } elseif ($code) {
            $query->where('student_code', $code);
        } elseif ($email !== '') {
            $query->whereIn('user_id', DB::table('users')->whereRaw('lower(email) = ?', [$email])->pluck('id'));
        } else {
            throw new \RuntimeException('Debes indicar student_dni, student_code o student_email.');
        }

        $student = $query->first();
        if (!$student) {
            throw new \RuntimeException('No se encontro el estudiante referenciado.');
        }

        return $student;
    }

    private function resolveOptionalStudentByReference(array $row): ?Student
    {
        $hasReference = collect(['student_dni', 'student_code', 'student_email'])
            ->contains(fn (string $key) => $this->nullableValue($row, $key) !== null);

        return $hasReference ? $this->resolveStudentByReference($row) : null;
    }

    private function resolveGuardianByReference(array $row): Guardian
    {
        $dni = $this->nullableValue($row, 'guardian_dni');
        $email = strtolower($this->nullableValue($row, 'guardian_email') ?? '');

        $query = Guardian::query();
        if ($dni) {
            $query->where('dni', $dni);
        } elseif ($email !== '') {
            $query->whereIn('user_id', DB::table('users')->whereRaw('lower(email) = ?', [$email])->pluck('id'));
        } else {
            throw new \RuntimeException('Debes indicar guardian_dni o guardian_email.');
        }

        $guardian = $query->first();
        if (!$guardian) {
            throw new \RuntimeException('No se encontro el apoderado referenciado.');
        }

        return $guardian;
    }

    private function resolveTeacherByReference(array $row): Teacher
    {
        $dni = $this->nullableValue($row, 'teacher_dni');
        $code = $this->nullableValue($row, 'teacher_code');
        $email = strtolower($this->nullableValue($row, 'teacher_email') ?? '');

        $query = Teacher::query();
        if ($dni) {
            $query->where('dni', $dni);
        } elseif ($code) {
            $query->where('teacher_code', $code);
        } elseif ($email !== '') {
            $query->whereRaw('lower(email) = ?', [$email]);
        } else {
            throw new \RuntimeException('Debes indicar teacher_dni, teacher_code o teacher_email.');
        }

        $teacher = $query->first();
        if (!$teacher) {
            throw new \RuntimeException('No se encontro el docente referenciado.');
        }

        return $teacher;
    }

    private function buildSummary(array $rows): array
    {
        return [
            'total_rows' => count($rows),
            'valid_rows' => collect($rows)->where('action', 'create')->count(),
            'skipped_rows' => collect($rows)->where('action', 'skip')->count(),
            'error_rows' => collect($rows)->where('action', 'error')->count(),
        ];
    }

    private function detectDelimiter(string $line): string
    {
        $candidates = [',', ';', "\t"];
        $best = ',';
        $max = -1;

        foreach ($candidates as $candidate) {
            $count = count(str_getcsv($line, $candidate));
            if ($count > $max) {
                $max = $count;
                $best = $candidate;
            }
        }

        return $best;
    }

    private function normalizeHeader(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?: $header;
        return Str::snake(trim($header));
    }

    private function isEmptyRow(array $data): bool
    {
        return collect($data)->every(fn ($value) => trim((string) $value) === '');
    }

    private function requiredValue(array $row, string $key): string
    {
        $value = trim((string) ($row[$key] ?? ''));
        if ($value === '') {
            throw new \RuntimeException("La columna {$key} es obligatoria.");
        }

        return $value;
    }

    private function nullableValue(array $row, string $key): ?string
    {
        $value = trim((string) ($row[$key] ?? ''));
        return $value === '' ? null : $value;
    }

    private function contextValue(array $context, string $key): ?string
    {
        $value = $context[$key] ?? null;

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function normalizeDate(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        return Carbon::parse($value)->toDateString();
    }

    private function normalizeDateTime(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        return Carbon::parse($value)->toDateTimeString();
    }

    private function normalizeBoolean(mixed $value, bool $default): bool
    {
        if ($value === null || $value === '') {
            return $default;
        }

        return in_array(Str::lower(trim((string) $value)), ['1', 'true', 'si', 'yes', 'x'], true);
    }
}
