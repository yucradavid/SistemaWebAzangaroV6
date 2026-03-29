<?php

namespace Tests\Unit;

use App\Support\EnrollmentApplicationValueNormalizer;
use PHPUnit\Framework\TestCase;

class EnrollmentApplicationValueNormalizerTest extends TestCase
{
    public function test_it_normalizes_public_form_values_to_database_values(): void
    {
        $payload = EnrollmentApplicationValueNormalizer::normalizePayload([
            'student_document_type' => 'dni',
            'guardian_document_type' => 'ce',
            'student_gender' => 'masculino',
            'guardian_relationship' => 'tio',
        ]);

        $this->assertSame('DNI', $payload['student_document_type']);
        $this->assertSame('CE', $payload['guardian_document_type']);
        $this->assertSame('M', $payload['student_gender']);
        $this->assertSame('Otro', $payload['guardian_relationship']);
    }

    public function test_it_keeps_unknown_values_so_validation_can_reject_them(): void
    {
        $payload = EnrollmentApplicationValueNormalizer::normalizePayload([
            'student_document_type' => 'licencia',
            'student_gender' => 'x',
        ]);

        $this->assertSame('licencia', $payload['student_document_type']);
        $this->assertSame('x', $payload['student_gender']);
    }
}
