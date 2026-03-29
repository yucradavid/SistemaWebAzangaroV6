<?php
$ay = App\Models\AcademicYear::where('year', 2026)->first();
if($ay) {
  // Clear existing to prevent duplicates if any ran
  App\Models\Period::where('academic_year_id', $ay->id)->delete();

  App\Models\Period::create(['academic_year_id' => $ay->id, 'name' => 'BIMESTRE 1', 'period_number' => 1, 'start_date' => '2026-03-16', 'end_date' => '2026-05-15', 'is_closed' => false]);
  App\Models\Period::create(['academic_year_id' => $ay->id, 'name' => 'BIMESTRE 2', 'period_number' => 2, 'start_date' => '2026-05-16', 'end_date' => '2026-07-25', 'is_closed' => false]);
  App\Models\Period::create(['academic_year_id' => $ay->id, 'name' => 'BIMESTRE 3', 'period_number' => 3, 'start_date' => '2026-08-10', 'end_date' => '2026-10-15', 'is_closed' => false]);
  App\Models\Period::create(['academic_year_id' => $ay->id, 'name' => 'BIMESTRE 4', 'period_number' => 4, 'start_date' => '2026-10-16', 'end_date' => '2026-12-14', 'is_closed' => false]);
  echo "Periods created successfully.\n";
} else {
  echo "Academic Year 2026 not found.\n";
}
