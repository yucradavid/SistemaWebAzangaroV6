import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface SubmitTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  existingSubmission?: {
    id: string;
    content: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
  } | null;
  onSuccess: () => void;
}

export function SubmitTaskModal({
  isOpen,
  onClose,
  assignmentId,
  assignmentTitle,
  studentId,
  existingSubmission,
  onSuccess,
}: SubmitTaskModalProps) {
  const [content, setContent] = useState(existingSubmission?.content || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tamaño (máx 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('El archivo no debe superar los 10 MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim() && !file && !existingSubmission?.attachment_url) {
      setError('Debes escribir un texto o adjuntar un archivo');
      return;
    }

    try {
      setUploading(true);

      let attachmentUrl = existingSubmission?.attachment_url || null;
      let attachmentName = existingSubmission?.attachment_name || null;
      let attachmentSize = 0;

      // 1. Subir archivo si hay uno nuevo
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${studentId}/${assignmentId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('task-submissions')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('task-submissions')
          .getPublicUrl(fileName);

        attachmentUrl = urlData.publicUrl;
        attachmentName = file.name;
        attachmentSize = file.size;
      }

      // 2. Crear o actualizar entrega
      const submissionData = {
        assignment_id: assignmentId,
        student_id: studentId,
        content: content.trim() || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_size: attachmentSize,
        status: 'submitted',
        submission_date: new Date().toISOString(),
      };

      if (existingSubmission?.id) {
        // Actualizar entrega existente
        const { error: updateError } = await supabase
          .from('task_submissions')
          .update(submissionData as any)
          .eq('id', existingSubmission.id);

        if (updateError) throw updateError;
      } else {
        // Crear nueva entrega
        const { error: insertError } = await supabase
          .from('task_submissions')
          .insert(submissionData as any);

        if (insertError) throw insertError;
      }

      alert(existingSubmission ? 'Entrega actualizada exitosamente' : 'Tarea entregada exitosamente');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar la tarea';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingSubmission ? 'Actualizar Entrega' : 'Entregar Tarea'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tarea: {assignmentTitle}</h3>
        </div>

        {/* Texto de entrega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Respuesta / Comentarios
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Escribe tu respuesta aquí..."
          />
        </div>

        {/* Archivo adjunto existente */}
        {existingSubmission?.attachment_url && !file && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">
                  {existingSubmission.attachment_name || 'Archivo adjunto'}
                </span>
              </div>
              <a
                href={existingSubmission.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Ver archivo
              </a>
            </div>
          </div>
        )}

        {/* Upload de archivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {existingSubmission?.attachment_url && !file ? 'Reemplazar archivo' : 'Adjuntar archivo'}
          </label>

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click para adjuntar archivo</p>
              <p className="text-xs text-gray-500 mt-1">Máximo 10 MB</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading
              ? 'Enviando...'
              : existingSubmission
              ? 'Actualizar Entrega'
              : 'Entregar Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
