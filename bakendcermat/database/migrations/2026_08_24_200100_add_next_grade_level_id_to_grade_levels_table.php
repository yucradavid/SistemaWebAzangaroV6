<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Grado siguiente para el rollover de promocion de año. Se infiere de forma
 * dinamica (no hardcodeada por UUID, que varia por entorno) recorriendo
 * grade_levels ordenado por (nivel, grado):
 *  - Dentro del mismo nivel: grade -> grade+1.
 *  - En el ultimo grado de un nivel: cruza al grado 1 del SIGUIENTE nivel
 *    en el orden inicial -> primaria -> secundaria (ej. 6to Primaria ->
 *    1 secundaria).
 *  - En el ultimo grado de secundaria: queda NULL (egreso, sin siguiente
 *    grado — ver StudentFinalStatus::is_graduating).
 */
return new class extends Migration
{
    private const LEVEL_ORDER = ['inicial', 'primaria', 'secundaria'];

    public function up(): void
    {
        Schema::table('grade_levels', function (Blueprint $table) {
            $table->uuid('next_grade_level_id')->nullable();
        });

        DB::statement(
            'ALTER TABLE grade_levels ADD CONSTRAINT grade_levels_next_grade_level_id_fkey '
            .'FOREIGN KEY (next_grade_level_id) REFERENCES grade_levels(id) ON DELETE SET NULL'
        );

        $this->seedNextGradeLevels();
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE grade_levels DROP CONSTRAINT IF EXISTS grade_levels_next_grade_level_id_fkey');

        Schema::table('grade_levels', function (Blueprint $table) {
            $table->dropColumn('next_grade_level_id');
        });
    }

    private function seedNextGradeLevels(): void
    {
        $rows = DB::table('grade_levels')->select('id', 'level', 'grade')->get();

        $byLevel = [];
        foreach ($rows as $row) {
            $byLevel[$row->level][(int) $row->grade] = $row->id;
        }

        foreach ($byLevel as $level => $gradesToIds) {
            ksort($gradesToIds);
            $grades = array_keys($gradesToIds);
            $maxGrade = end($grades);

            foreach ($gradesToIds as $grade => $id) {
                $nextId = null;

                if ($grade < $maxGrade && isset($gradesToIds[$grade + 1])) {
                    $nextId = $gradesToIds[$grade + 1];
                } elseif ($grade === $maxGrade) {
                    $nextId = $this->firstGradeOfNextLevel($level, $byLevel);
                }

                if ($nextId !== null) {
                    DB::table('grade_levels')->where('id', $id)->update(['next_grade_level_id' => $nextId]);
                }
            }
        }
    }

    private function firstGradeOfNextLevel(string $currentLevel, array $byLevel): ?string
    {
        $currentIndex = array_search($currentLevel, self::LEVEL_ORDER, true);

        if ($currentIndex === false || !isset(self::LEVEL_ORDER[$currentIndex + 1])) {
            return null;
        }

        $nextLevel = self::LEVEL_ORDER[$currentIndex + 1];

        if (!isset($byLevel[$nextLevel])) {
            return null;
        }

        $nextLevelGrades = $byLevel[$nextLevel];
        ksort($nextLevelGrades);

        return reset($nextLevelGrades) ?: null;
    }
};
