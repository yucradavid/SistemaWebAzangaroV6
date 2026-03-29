import { useState } from 'react';
import { CheckCircle2, X, Download, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    id: string;
    student_name: string;
    student_code: string;
    content: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
    attachment_size: number | null;
    submission_date: string;
    grade: number | null;
    grade_letter: string | null;
    feedback: string | null;
    status: string;
  };
  maxScore: number;
  useLiteralGrade: boolean; // true para primaria (AD/A/B/C), false para secundaria (0-20)
  onSuccess: () => void;
}

export function GradeSubmissionModal({
  isOpen,
  onClose,
  submission,
  maxScore,
  useLiteralGrade,
  onSuccess,
}: GradeSubmissionModalProps) {
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [gradeLetter, setGradeLetter] = useState(submission.grade_letter || 'A');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (useLiteralGrade) {
      if (!gradeLetter) {
        setError('Debes seleccionar una calificación literal');
        return;
      }
    } else {
      if (!grade.trim()) {
        setError('Debes ingresar una calificación');
        return;
      }
      const numericGrade = parseFloat(grade);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > maxScore) {
        setError(`La calificación debe estar entre 0 y ${maxScore}`);
        return;
      }
    }

    try {
      setGrading(true);

      // Calcular nota numérica desde literal si es primaria
      let finalGrade = 0;
      let finalGradeLetter = null;

      if (useLiteralGrade) {
        finalGradeLetter = gradeLetter;
        // Conversión literal a numérico (para estadísticas)
        switch (gradeLetter) {
          case 'AD': finalGrade = 18; break;
          case 'A': finalGrade = 15; break;
          case 'B': finalGrade = 12; break;
          case 'C': finalGrade = 10; break;
          default: finalGrade = 0;
        }
      } else {
        finalGrade = parseFloat(grade);
        // Conversión numérico a literal (opcional para secundaria)
        if (finalGrade >= 18) finalGradeLetter = 'AD';
        else if (finalGrade >= 14) finalGradeLetter = 'A';
        else if (finalGrade >= 11) finalGradeLetter = 'B';
        else finalGradeLetter = 'C';
      }

      // Actualizar entrega
      const { error: updateError } = await supabase
        .from('task_submissions')
        .update({
          grade: finalGrade,
          grade_letter: finalGradeLetter,
          feedback: feedback.trim() || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: (await supabase.auth.getUser()).data.user?.id,
        } as any)
        .eq('id', submission.id);

      if (updateError) throw updateError;

      alert('Calificación guardada exitosamente');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error grading submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la calificación';
      setError(errorMessage);
    } finally {
      setGrading(false);
    }
  };

  const handleReturn = async () => {
    if (!confirm('¿Devolver esta entrega al estudiante para corrección?')) {
      return;
    }

    try {
      setGrading(true);

      const { error: updateError } = await supabase
        .from('task_submissions')
        .update({
          status: 'returned',
          feedback: feedback.trim() || 'Revisar y volver a entregar',
        } as any)
        .eq('id', submission.id);

      if (updateError) throw updateError;

      alert('Entrega devuelta al estudiante');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error returning submission:', err);
      alert('Error al devolver la entrega');
    } finally {
      setGrading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calificar Entrega" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información del estudiante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{submission.student_name}</h3>
            <span className="text-sm text-gray-600">Código: {submission.student_code}</span>
          </div>
          <p className="text-sm text-gray-600">
            Entregado: {new Date(submission.submission_date).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Contenido de la entrega */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Contenido entregado:</h4>
          
          {submission.content && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Texto:</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{submission.content}</p>
              </div>
            </div>
          )}

          {submission.attachment_url && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Archivo adjunto:</p>
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {submission.attachment_name || 'Archivo adjunto'}
                  </p>
                  {submission.attachment_size && (
                    <p className="text-xs text-gray-500">
                      {(submission.attachment_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <a
                  href={submission.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Descargar</span>
                </a>
              </div>
            </div>
          )}

          {!submission.content && !submission.attachment_url && (
            <p className="text-sm text-gray-500 italic">Sin contenido entregado</p>
          )}
        </div>

        {/* Formulario de calificación */}
        <div className="border-t-2 border-gray-200 pt-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Calificación:</h4>

          {useLiteralGrade ? (
            // Calificación literal para primaria
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación Literal <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['AD', 'A', 'B', 'C'].map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setGradeLetter(letter)}
                    className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                      gradeLetter === letter
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                AD: Logro destacado | A: Logro esperado | B: En proceso | C: En inicio
              </p>
            </div>
          ) : (
            // Calificación numérica para secundaria
            <Input
              type="number"
              label={`Nota (0-${maxScore})`}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Ej: 15"
              min="0"
              max={maxScore}
              step="0.5"
              required
            />
          )}

          {/* Retroalimentación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retroalimentación / Comentarios
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Escribe aquí tus comentarios sobre el trabajo del estudiante..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleReturn}
            disabled={grading}
          >
            <X className="w-4 h-4" />
            Devolver
          </Button>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={grading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={grading}>
              <CheckCircle2 className="w-4 h-4" />
              {grading ? 'Guardando...' : 'Guardar Calificación'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
