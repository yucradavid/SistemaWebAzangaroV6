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

export function numberToEBR(score: number | null | undefined): GradeEBR | null {
  if (score === null || score === undefined || isNaN(score)) return null;
  if (score < 0 || score > 20) return null;
  const found = EBR_SCALE.find(g => score >= g.min && score <= g.max);
  return found?.letter ?? null;
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
