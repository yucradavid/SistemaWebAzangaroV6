<?php
$ay = App\Models\AcademicYear::where('year', 2026)->first();
if($ay) {
  App\Models\Period::where('academic_year_id', $ay->id)->delete();
  echo "Periods deleted successfully.\n";
} else {
  echo "Academic Year 2026 not found.\n";
}
