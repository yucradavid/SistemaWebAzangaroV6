# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a multi-project monorepo for **CERMAT School** (Azángaro, Puno, Perú) — a school management platform.

- **`bakendcermat/`** — Laravel 12 REST API (PHP 8.2, Sanctum auth, PostgreSQL). This is the active backend.
- **`sistema-educativo-frontend/`** — Angular 18 SPA (standalone components, Tailwind, signals). The active frontend.
- **`colegioscmat/`** — Companion/legacy project holding the Supabase schema (`supabase/migrations/`), deployment docs, and many ad-hoc SQL fix scripts. Not the active app, but the source of the database schema the Laravel backend runs against.

Almost all feature work happens in `bakendcermat` + `sistema-educativo-frontend`.

## Commands

### Backend (`bakendcermat/`)
```bash
php artisan serve                 # run API at http://localhost:8000
composer dev                      # serve + queue + pail logs + vite, all at once
php artisan test                  # run full test suite (PHPUnit 11)
php artisan test --filter NAME    # run a single test by name/class
vendor/bin/pint                   # format/lint PHP (Laravel Pint)
php artisan migrate               # run migrations (requires Postgres, see below)
```

### Frontend (`sistema-educativo-frontend/`)
```bash
ng serve                          # dev server (expects API at http://localhost:8000/api)
ng build                          # production build — must pass with no errors before committing FE changes
ng test                           # Karma/Jasmine unit tests
```

## Database — critical setup

The backend **must run on PostgreSQL, not SQLite.** It depends on the Supabase-derived schema, specifically the `auth.users` table (a separate schema from `public.*`). See `bakendcermat/LOCAL_POSTGRES.md`.

- Connection target is chosen by the `DB_TARGET` env var (`local` or `supabase`). `config/database.php` then reads `DB_LOCAL_*` or `DB_SUPABASE_*` prefixed vars. Switch with `scripts/set-db-target.ps1 -Target local|supabase`.
- Restore a local DB from the dump with `scripts/restore-local-postgres.ps1` (imports `backup_utf8.sql`). Errors about `supabase_admin`, `pg_graphql`, `supabase_vault` during restore are expected and harmless.
- Note: `phpunit.xml` configures tests for `sqlite :memory:`. Because the app assumes the Postgres/`auth.users` schema, feature tests that touch that schema will not run cleanly against in-memory SQLite — be aware when writing/running tests.

### Running one-off data scripts via tinker
`php artisan tinker --execute="..."` is awkward for non-trivial PHP on Windows/PowerShell (quoting) and the REPL rejects a leading `<?php` tag. For data fixes, write a temporary bootstrapped script and run it with `php`:
```php
<?php
use Illuminate\Support\Facades\DB;
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
// ... DB queries here ...
```
Delete the temp script afterward.

## Backend architecture

- **All API routes live in `bakendcermat/routes/api.php`** — a single, module-organized file. Public routes (`/login`, `/public/*`) sit outside the `auth:sanctum` group; everything else is inside it.
- **Auth is token-based (Sanctum Bearer tokens).** The frontend stores the token and attaches `Authorization: Bearer <token>` via `core/interceptors/auth.interceptor.ts`.
- **Authorization is role-based via the `role:` middleware** (`App\Http\Middleware\RoleMiddleware`, aliased in `bootstrap/app.php`). Usage: `->middleware('role:admin,director,teacher')`. The user's role is read from `user->profile->role` (a `Profile` hasOne), falling back to `user->role`. Known roles: `admin, director, coordinator, secretary, administrative, finance, cashier, teacher, student, guardian, web_editor`.
- **`student.guardian.access` middleware** scopes student-specific endpoints (report cards, summaries) so guardians only see their own children.
- **Models use UUID primary keys** (`HasUuids`, `$incrementing = false`, `$keyType = 'string'`) — never assume auto-increment integer ids.
- **Scheduler:** `php artisan periods:auto-close` runs daily at 00:01 (registered in `bootstrap/app.php`) to close expired academic periods and snapshot history. The OS must invoke `php artisan schedule:run` every minute for this to fire (see `SCHEDULER_SETUP.md`).

### Dual user-id spaces (important gotcha)
There are two user tables: legacy Supabase `auth.users` and application `public.users`. The Sanctum-authenticated user **is** the `public.users` row. FK columns like `charges.created_by` / `voided_by` reference `public.users.id`, so resolve the actor against `public.users` (by id, then by email) — using an `auth.users` id causes FK violations. See `EvaluationController::resolveRecorderId` and `ChargeController::resolveActorUserId` for the established patterns (they differ: evaluations resolve `recorded_by` against `auth.users`, charges resolve against `public.users` — match the column's FK target).

## Core academic data model

The academic structure is **year-scoped**: each `academic_year` has its own `sections`, `periods`, `teacher_course_assignments`, and `student_course_enrollments`. When the active year changes, data does not auto-carry-forward — sections are recreated per year (and may use different `section_letter`s), so equivalence must be matched by `grade_level_id` + letter, not by section id.

Key relationships for grades/evaluation:
- `teacher_course_assignments` — links teacher ↔ course ↔ section ↔ academic_year.
- `student_course_enrollments` — links student ↔ course ↔ section ↔ academic_year, with `status` in (`active`, `dropped`, `completed`). UNIQUE on `(student_id, course_id, academic_year_id)`.
- **The teacher-evaluation roster and authorization are built by joining `student_course_enrollments` (status `active`) to `teacher_course_assignments` on `(course_id, section_id, academic_year_id)`** — not on `students.section_id`. Moving a student between sections for evaluation purposes requires updating their enrollments, not just `students.section_id`.
- `EvaluationController::myContext` returns the teacher's assignments + periods filtered by the **active** academic year (`academic_years.is_active = true`).

### Charges / finance notes
- A charge being "anulado" (voided) is represented by setting `voided_at` (+ `voided_by`, `void_reason`), **not** by a `status` value — `charge_status` enum is only `pendiente, pagado_parcial, pagado, vencido`. The `Charge` model derives `'anulado'` from `voided_at` via an accessor.
- Discounts: `discount_scope` enum is `todos, pension, matricula, especifico` (there is no "hermanos" scope — sibling discounts are modeled as `pension`/`todos`). `discount_type` is `porcentaje | monto_fijo`. Mass charge generation (`ChargeController::batchStore`) does **not** auto-apply discounts; discounts are applied to pending charges when assigned via `StudentDiscountController::store`.

## Frontend architecture

- **Routing is split by auth state.** `app.routes.ts` → `/` loads `public.routes.ts` (landing, admisión, etc.), `/login`, and `/app` (guarded by `authGuard`) loads `private.routes.ts`.
- **`private.routes.ts` is a flat route table with role-suffixed paths** (e.g. `dashboard/teacher`, `evaluation/teacher`, `attendance/student`, `dashboard/apoderado`), each lazy-loaded and protected by `roleGuard`. Components live under `src/app/features/<role>/...` (`admin`, `teacher`, `student`, `apoderado`, `auth`, `public`).
- **API base URL** comes from `src/environments/environment.ts` (`apiUrl: 'http://localhost:8000/api'`). Cross-cutting services live in `src/app/core/services/`.
- UI/UX: Tailwind CSS, `lucide-angular` icons, `sweetalert2` for dialogs, `@zxing/ngx-scanner` + `qrcode` for the QR-based attendance flow.

## Conventions

- Code comments, route grouping, user-facing strings, and commit messages are in **Spanish** — match the surrounding language.
- When making backend changes, run `php -l` on edited files; when making frontend changes, ensure `ng build` passes before committing.
