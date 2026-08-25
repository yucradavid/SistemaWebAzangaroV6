export type GradeEBR = 'AD' | 'A' | 'B' | 'C';

export interface GradeConversion {
  letter: GradeEBR;
  label: string;
  color: string;      // clase Tailwind para badge
  min: number;
  max: number;
}

export const EBR_SCALE: GradeConversion[] = [
  { letter: 'AD', label: 'Logro destacado',  min: 18, max: 20,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { letter: 'A',  label: 'Logro esperado',   min: 14, max: 17,
    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { letter: 'B',  label: 'En proceso',       min: 11, max: 13,
    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { letter: 'C',  label: 'En inicio',        min: 0,  max: 10,
    color: 'bg-red-100 text-red-700 border-red-200' },
];

export const GRADE_MAX: Record<GradeEBR, number> = {
  'AD': 20,
  'A': 17,
  'B': 13,
  'C': 10,
};

export function numberToEBR(score: number | null | undefined): GradeEBR | null {
  if (score === null || score === undefined || isNaN(score)) return null;
  if (score < 0 || score > 20) return null;
  const found = EBR_SCALE.find(g => score >= g.min && score <= g.max);
  return found?.letter ?? null;
}

export function ebrToMaxNumber(letter: GradeEBR): number {
  return GRADE_MAX[letter];
}

export function ebrToRange(letter: GradeEBR): string {
  const found = EBR_SCALE.find(g => g.letter === letter);
  return found ? `${found.min} - ${found.max}` : '';
}

export function getEBRColor(letter: GradeEBR | null): string {
  if (!letter) return 'bg-slate-100 text-slate-400 border-slate-200';
  return EBR_SCALE.find(g => g.letter === letter)?.color
    ?? 'bg-slate-100 text-slate-400 border-slate-200';
}

// Punto medio del rango real de cada letra EBR — mismo criterio que el
// backend (AcademicEvaluationService::EBR_MIDPOINTS). Se usa SOLO para
// promediar competencias y obtener la nota de curso, no se muestra al
// usuario como nota individual.
export const EBR_MIDPOINTS: Record<GradeEBR, number> = {
  AD: 19.0,
  A: 15.5,
  B: 12.0,
  C: 5.0,
};

export interface CourseResultLike {
  course_id?: string | null;
  final_level?: GradeEBR | null;
  course?: { name?: string | null } | null;
}

// Nota final de un curso = promedio de sus competencias convertidas con
// EBR_MIDPOINTS, redondeado a 2 decimales y devuelto a letra. Replica
// EXACTAMENTE AcademicEvaluationService::persistFinalCourseGrades porque
// no hay endpoint publico de final_course_grades: quien decide Escuela
// Vacacional en el backend es esta misma formula sobre estos mismos datos.
export function calculateCourseLetter(levels: GradeEBR[]): GradeEBR | null {
  if (levels.length === 0) return null;
  const avg = Math.round(
    (levels.reduce((sum, level) => sum + EBR_MIDPOINTS[level], 0) / levels.length) * 100
  ) / 100;
  return numberToEBR(avg);
}

// Cursos con nota final en C (desaprobados) a partir de
// final-competency-results agrupados por curso. Usado por el aviso de
// Escuela Vacacional (evaluation-review y detalle de estudiantes).
export function getFailedCourseNamesFromResults(results: CourseResultLike[]): string[] {
  const byCourse = new Map<string, { name: string; levels: GradeEBR[] }>();

  results.forEach((result) => {
    if (!result.course_id) return;

    const entry = byCourse.get(result.course_id) || {
      name: result.course?.name || 'Curso',
      levels: [],
    };
    if (result.final_level) {
      entry.levels.push(result.final_level);
    }
    byCourse.set(result.course_id, entry);
  });

  const failed: string[] = [];
  byCourse.forEach((entry) => {
    if (calculateCourseLetter(entry.levels) === 'C') {
      failed.push(entry.name);
    }
  });

  return failed.sort((a, b) => a.localeCompare(b));
}
