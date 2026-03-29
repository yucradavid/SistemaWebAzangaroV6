import { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

interface AbsenceRecord {
  id: string;
  date: string;
  status: 'tarde' | 'falta';
  justification: string | null;
  course: {
    name: string;
    code: string;
  };
  justification_data?: {
    id: string;
    status: 'pendiente' | 'aprobada' | 'rechazada';
    reason: string;
    attachment_url: string | null;
    review_notes: string | null;
    reviewed_at: string | null;
  };
}

export function GuardianAttendancePage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceRecord | null>(null);
  const [formData, setFormData] = useState({
    reason: '',
    attachment: null as File | null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardianId, setGuardianId] = useState<string>('');

  useEffect(() => {
    loadStudents();
  }, [profile]);

  useEffect(() => {
    if (selectedStudent) {
      loadAbsences();
    }
  }, [selectedStudent]);

  async function loadStudents() {
    try {
      setLoading(true);

      // Obtener el guardian_id del usuario actual
      const { data: guardianList, error: guardianError } = await supabase
        .from('guardians')
        .select('id')
        .eq('user_id', profile?.id);

      if (guardianError) throw guardianError;

      if (!guardianList || guardianList.length === 0) {
        console.log('No guardian record found for this user');
        setLoading(false);
        return;
      }

      const guardianData = guardianList[0];
      setGuardianId(guardianData.id);

      // Obtener estudiantes del apoderado
      const { data, error } = await supabase
        .from('student_guardians')
        .select(`
          student:students(
            id,
            student_code,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('guardian_id', guardianData.id);

      if (error) throw error;

      const studentsList = (data || []).map((sg: any) => sg.student);
      setStudents(studentsList);

      if (studentsList.length > 0) {
        setSelectedStudent(studentsList[0].id);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Error al cargar los estudiantes');
    } finally {
      setLoading(false);
    }
  }

  async function loadAbsences() {
    try {
      setLoading(true);
      setError('');

      // Cargar faltas y tardanzas del último mes
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          justification,
          course:courses(name, code)
        `)
        .eq('student_id', selectedStudent)
        .in('status', ['tarde', 'falta'])
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      // Cargar justificaciones existentes
      const attendanceIds = (data || []).map((a) => a.id);
      let justifications: any[] = [];

      if (attendanceIds.length > 0) {
        const { data: justData, error: justError } = await supabase
          .from('attendance_justifications')
          .select('*')
          .in('attendance_id', attendanceIds);

        if (!justError) {
          justifications = justData || [];
        }
      }

      // Combinar datos
      const combinedData = (data || []).map((record) => {
        const justification = justifications.find((j) => j.attendance_id === record.id);
        return {
          ...record,
          justification_data: justification,
        };
      });

      setAbsences(combinedData);
    } catch (error) {
      console.error('Error loading absences:', error);
      setError('Error al cargar las inasistencias');
    } finally {
      setLoading(false);
    }
  }

  function openJustificationModal(absence: AbsenceRecord) {
    setSelectedAbsence(absence);
    setFormData({
      reason: absence.justification_data?.reason || '',
      attachment: null,
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  async function handleSubmitJustification(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.reason.trim()) {
      setError('El motivo es obligatorio');
      return;
    }

    try {
      setSaving(true);

      let attachmentUrl = null;

      // TODO: Subir archivo a Supabase Storage cuando se implemente
      // if (formData.attachment) {
      //   const { data: uploadData, error: uploadError } = await supabase.storage
      //     .from('justifications')
      //     .upload(`${guardianId}/${Date.now()}_${formData.attachment.name}`, formData.attachment);
      //   if (uploadError) throw uploadError;
      //   attachmentUrl = uploadData.path;
      // }

      // Verificar si ya existe una justificación
      if (selectedAbsence?.justification_data?.id) {
        // Actualizar justificación existente (solo si está pendiente)
        if (selectedAbsence.justification_data.status === 'pendiente') {
          const { error: updateError } = await supabase
            .from('attendance_justifications')
            .update({
              reason: formData.reason,
              attachment_url: attachmentUrl,
              updated_at: new Date().toISOString(),
            } as never)
            .eq('id', selectedAbsence.justification_data.id);

          if (updateError) throw updateError;
          setSuccess('Justificación actualizada correctamente');
        } else {
          setError('No puedes modificar una justificación ya revisada');
          return;
        }
      } else {
        // Crear nueva justificación
        const { error: insertError } = await supabase
          .from('attendance_justifications')
          .insert({
            attendance_id: selectedAbsence!.id,
            student_id: selectedStudent,
            guardian_id: guardianId,
            reason: formData.reason,
            attachment_url: attachmentUrl,
            status: 'pendiente',
          } as never);

        if (insertError) throw insertError;
        setSuccess('Justificación enviada correctamente');
      }

      setTimeout(() => {
        setModalOpen(false);
        loadAbsences();
      }, 1500);
    } catch (err) {
      const error = err as { message?: string };
      console.error('Error submitting justification:', error);
      setError('Error al enviar la justificación');
    } finally {
      setSaving(false);
    }
  }

  if (loading && students.length === 0) {
    return <Loading fullScreen text="Cargando información..." />;
  }

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
          Justificación de Inasistencias
        </h1>
        <p className="text-[#334155]">Justifica las faltas y tardanzas de tus hijos</p>
      </div>

      {error && !modalOpen && (
        <Card variant="elevated" className="border-2 border-[#C81E1E]">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-[#C81E1E]">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector de hijo */}
      {students.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <Select
              label="Seleccionar hijo/a"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.student_code}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Información del estudiante */}
      {selectedStudentData && (
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {selectedStudentData.photo_url ? (
                <img
                  src={selectedStudentData.photo_url}
                  alt={selectedStudentData.first_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] flex items-center justify-center">
                  <span className="text-2xl text-white font-semibold">
                    {selectedStudentData.first_name[0]}
                    {selectedStudentData.last_name[0]}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {selectedStudentData.first_name} {selectedStudentData.last_name}
                </h2>
                <Badge variant="outline">{selectedStudentData.student_code}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de inasistencias */}
      {loading ? (
        <Loading text="Cargando inasistencias..." />
      ) : absences.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Faltas y Tardanzas (últimos 30 días)
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {absences.map((absence) => (
                <div
                  key={absence.id}
                  className={`p-4 rounded-xl border-2 ${absence.status === 'falta'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {absence.status === 'falta' ? (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-[#0F172A]">
                            {new Date(absence.date).toLocaleDateString('es-PE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {absence.course.code}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#334155] mb-2">{absence.course.name}</p>

                        {absence.justification && (
                          <p className="text-sm text-[#334155] italic mb-2">
                            Nota del docente: {absence.justification}
                          </p>
                        )}

                        {absence.justification_data && (
                          <div className="mt-3 p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">Mi justificación:</span>
                              <Badge
                                variant={
                                  absence.justification_data.status === 'aprobada'
                                    ? 'success'
                                    : absence.justification_data.status === 'rechazada'
                                      ? 'danger'
                                      : 'primary'
                                }
                              >
                                {absence.justification_data.status === 'pendiente'
                                  ? 'Pendiente de revisión'
                                  : absence.justification_data.status === 'aprobada'
                                    ? 'Aprobada'
                                    : 'Rechazada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#334155] mb-2">
                              {absence.justification_data.reason}
                            </p>
                            {absence.justification_data.review_notes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded">
                                <p className="text-xs font-medium text-blue-900 mb-1">
                                  Respuesta de la institución:
                                </p>
                                <p className="text-sm text-blue-800">
                                  {absence.justification_data.review_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={absence.status === 'falta' ? 'danger' : 'primary'}
                        className="font-bold"
                      >
                        {absence.status === 'falta' ? 'FALTA' : 'TARDANZA'}
                      </Badge>
                      {!absence.justification_data ||
                        absence.justification_data.status === 'pendiente' ? (
                        <Button
                          size="sm"
                          icon={<FileText />}
                          onClick={() => openJustificationModal(absence)}
                        >
                          {absence.justification_data ? 'Editar' : 'Justificar'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                ¡Excelente asistencia!
              </h3>
              <p className="text-[#334155]">
                No hay faltas ni tardanzas en los últimos 30 días
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de justificación */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedAbsence?.justification_data ? 'Editar justificación' : 'Justificar inasistencia'}
      >
        <form onSubmit={handleSubmitJustification} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {selectedAbsence && (
            <div className="p-4 bg-[#F8FAFC] rounded-xl">
              <p className="text-sm text-[#334155] mb-1">
                <span className="font-semibold">Fecha:</span>{' '}
                {new Date(selectedAbsence.date).toLocaleDateString('es-PE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-[#334155]">
                <span className="font-semibold">Curso:</span> {selectedAbsence.course.name}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Motivo de la inasistencia <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:border-[#0E3A8A] focus:outline-none"
              rows={4}
              placeholder="Explica el motivo de la falta o tardanza..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Adjuntar documento (opcional)
            </label>
            <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 text-[#334155] mx-auto mb-2" />
              <p className="text-sm text-[#334155] mb-2">
                PDF, JPG o PNG - Máximo 5MB
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  setFormData({ ...formData, attachment: e.target.files?.[0] || null })
                }
                className="text-sm"
              />
              {formData.attachment && (
                <p className="text-sm text-[#0E3A8A] mt-2 font-medium">
                  Archivo seleccionado: {formData.attachment.name}
                </p>
              )}
            </div>
            <p className="text-xs text-[#334155] mt-2">
              💡 Ejemplo: certificado médico, carta de justificación, etc.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? <Loading size="sm" /> : 'Enviar justificación'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
