<?php

namespace Tests\Feature;

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Str;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Tests\TestCase;

class FinanceVoidActionsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            Authenticate::class,
            EnsureFrontendRequestsAreStateful::class,
            RoleMiddleware::class,
        ]);
        $this->createFinanceSchema();
    }

    public function test_payment_can_be_voided_and_charge_is_recalculated(): void
    {
        $studentId = (string) Str::uuid();
        $conceptId = (string) Str::uuid();
        $chargeId = (string) Str::uuid();
        $paymentId = (string) Str::uuid();
        $receiptId = (string) Str::uuid();

        \DB::table('students')->insert([
            'id' => $studentId,
            'section_id' => null,
            'first_name' => 'Ana',
            'last_name' => 'Perez',
        ]);

        \DB::table('fee_concepts')->insert([
            'id' => $conceptId,
            'name' => 'Pension marzo',
            'type' => 'pension',
        ]);

        \DB::table('charges')->insert([
            'id' => $chargeId,
            'student_id' => $studentId,
            'academic_year_id' => null,
            'concept_id' => $conceptId,
            'type' => 'pension',
            'status' => 'pagado_parcial',
            'amount' => 100,
            'discount_amount' => 0,
            'paid_amount' => 60,
            'notes' => 'Cargo marzo',
        ]);

        \DB::table('payments')->insert([
            'id' => $paymentId,
            'charge_id' => $chargeId,
            'student_id' => $studentId,
            'amount' => 60,
            'method' => 'efectivo',
            'paid_at' => now(),
            'notes' => 'Pago parcial',
        ]);

        \DB::table('receipts')->insert([
            'id' => $receiptId,
            'payment_id' => $paymentId,
            'student_id' => $studentId,
            'number' => 'R-00000001',
            'issued_at' => now(),
            'total' => 60,
        ]);

        $response = $this->postJson("/api/payments/{$paymentId}/void", [
            'reason' => 'Pago duplicado',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.void_reason', 'Pago duplicado');

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'void_reason' => 'Pago duplicado',
        ]);

        $this->assertDatabaseHas('charges', [
            'id' => $chargeId,
            'status' => 'pendiente',
            'paid_amount' => 0,
        ]);
    }

    public function test_charge_cannot_be_voided_with_active_payments(): void
    {
        $studentId = (string) Str::uuid();
        $conceptId = (string) Str::uuid();
        $chargeId = (string) Str::uuid();
        $paymentId = (string) Str::uuid();

        \DB::table('students')->insert([
            'id' => $studentId,
            'section_id' => null,
            'first_name' => 'Luis',
            'last_name' => 'Diaz',
        ]);

        \DB::table('fee_concepts')->insert([
            'id' => $conceptId,
            'name' => 'Matricula',
            'type' => 'matricula',
        ]);

        \DB::table('charges')->insert([
            'id' => $chargeId,
            'student_id' => $studentId,
            'academic_year_id' => null,
            'concept_id' => $conceptId,
            'type' => 'matricula',
            'status' => 'pagado_parcial',
            'amount' => 200,
            'discount_amount' => 0,
            'paid_amount' => 50,
            'notes' => 'Cargo de matricula',
        ]);

        \DB::table('payments')->insert([
            'id' => $paymentId,
            'charge_id' => $chargeId,
            'student_id' => $studentId,
            'amount' => 50,
            'method' => 'efectivo',
            'paid_at' => now(),
        ]);

        $response = $this->postJson("/api/charges/{$chargeId}/void", [
            'reason' => 'Se emitio por error',
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseHas('charges', [
            'id' => $chargeId,
            'status' => 'pagado_parcial',
        ]);
    }

    public function test_charge_can_be_voided_without_active_payments(): void
    {
        $studentId = (string) Str::uuid();
        $conceptId = (string) Str::uuid();
        $chargeId = (string) Str::uuid();

        \DB::table('students')->insert([
            'id' => $studentId,
            'section_id' => null,
            'first_name' => 'Marta',
            'last_name' => 'Rios',
        ]);

        \DB::table('fee_concepts')->insert([
            'id' => $conceptId,
            'name' => 'Taller',
            'type' => 'otro',
        ]);

        \DB::table('charges')->insert([
            'id' => $chargeId,
            'student_id' => $studentId,
            'academic_year_id' => null,
            'concept_id' => $conceptId,
            'type' => 'otro',
            'status' => 'pendiente',
            'amount' => 80,
            'discount_amount' => 0,
            'paid_amount' => 0,
            'notes' => 'Taller opcional',
        ]);

        $response = $this->postJson("/api/charges/{$chargeId}/void", [
            'reason' => 'Concepto no corresponde',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'anulado');

        $this->assertDatabaseHas('charges', [
            'id' => $chargeId,
            'void_reason' => 'Concepto no corresponde',
        ]);

        $this->assertDatabaseMissing('charges', [
            'id' => $chargeId,
            'voided_at' => null,
        ]);
    }

    private function createFinanceSchema(): void
    {
        Schema::dropAllTables();

        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->timestamps();
        });

        Schema::create('grade_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->nullable();
        });

        Schema::create('sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('grade_level_id')->nullable();
            $table->string('section_letter')->nullable();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('section_id')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
        });

        Schema::create('fee_concepts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('type')->nullable();
        });

        Schema::create('charges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('academic_year_id')->nullable();
            $table->uuid('concept_id')->nullable();
            $table->string('type')->nullable();
            $table->string('status')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('voided_at')->nullable();
            $table->uuid('voided_by')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('charge_id')->nullable();
            $table->uuid('student_id')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('method')->nullable();
            $table->string('reference')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('voided_at')->nullable();
            $table->uuid('voided_by')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id');
            $table->uuid('student_id')->nullable();
            $table->string('number')->nullable();
            $table->dateTime('issued_at')->nullable();
            $table->decimal('total', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
}
