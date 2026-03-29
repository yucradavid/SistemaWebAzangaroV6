import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { X, CheckCircle, XCircle, Eye, Calendar, Mail, Phone, User, GraduationCap } from 'lucide-react';
import { Loading } from '../ui/Loading';

interface EnrollmentApplication {
  id: string;
  student_first_name: string;
  student_last_name: string;
  student_document_type: string;
  student_document_number: string;
  student_birth_date: string;
  student_gender: string;
  student_address: string;
  guardian_first_name: string;
  guardian_last_name: string;
  guardian_document_type: string;
  guardian_document_number: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_address: string;
  guardian_relationship: string;
  grade_level_id: string;
  previous_school: string;
  has_special_needs: boolean;
  special_needs_description: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  application_date: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  grade_levels: { name: string; level: string };
}

interface Section {
  id: string;
  section_letter: string;
  grade_level_id: string;
  capacity: number;
  current_enrollment: number;
  grade_levels: {
    name: string;
    grade: number;
  };
}

interface ApplicationDetailModalProps {
  application: EnrollmentApplication | null;
  onClose: () => void;
  onApprove: (applicationId: string, sectionId: string) => void;
  onReject: (applicationId: string, reason: string) => void;
}

function ApplicationDetailModal({ application, onClose, onApprove, onReject }: ApplicationDetailModalProps) {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (application) {
      loadSections(application.grade_level_id);
    }
  }, [application]);

  async function loadSections(gradeLevelId: string) {
    try {
      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (yearError) throw yearError;

      const { data, error } = await supabase
        .from('sections')
        .select(`
          id, 
          section_letter, 
          grade_level_id, 
          capacity,
          grade_levels!inner(name, grade)
        `)
        .eq('grade_level_id', gradeLevelId)
        .eq('academic_year_id', activeYear.id)
        .order('section_letter');

      if (error) throw error;

      // Contar estudiantes actuales por sección
      const sectionsWithCount = await Promise.all(
        (data || []).map(async (section) => {
          const { count } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('section_id', section.id)
            .eq('status', 'active');

          return {
            ...section,
            current_enrollment: count || 0,
          };
        })
      );

      setSections(sectionsWithCount as any);
    } catch (err) {
      console.error('Error loading sections:', err);
    }
  }

  const handleApprove = async () => {
    if (!selectedSection) {
      alert('Selecciona una sección para la matrícula');
      return;
    }

    if (!user) {
      alert('Usuario no autenticado');
      return;
    }

    setProcessing(true);
    try {
      // Llamar a la función de aprobación
      const { data, error } = await supabase.rpc('approve_enrollment_application', {
        p_application_id: application!.id,
        p_section_id: selectedSection,
        p_approved_by: user.id,
      });

      if (error) throw error;

      const result = data?.[0];
      if (result && result.success && result.student_id) {
        // Función para limpiar caracteres especiales de emails
        const sanitize = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n").replace(/[^a-z0-9]/g, "");
        const studentEmail = `${sanitize(application!.student_first_name.split(' ')[0])}.${sanitize(application!.student_last_name.split(' ')[0])}@cermatschool.edu.pe`;
        const studentPassword = `Cermat${application!.student_document_number}`;

        let studentCreated = false;
        let guardianCreated = false;
        const guardianEmail = application!.guardian_email;
        const guardianPassword = `Cermat${application!.guardian_document_number}`;

        // --- CREAR ESTUDIANTE ---
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: studentEmail,
            password: studentPassword,
            options: {
              data: {
                full_name: `${application!.student_first_name} ${application!.student_last_name}`,
                role: 'student',
              },
            },
          });

          if (authError) {
            console.error('Error creating student user:', authError);
          } else if (authData.user) {
            // Actualizar students.user_id - CRÍTICO para que vea su horario
            const { error: updateError } = await supabase
              .from('students')
              .update({ user_id: authData.user.id })
              .eq('id', result.student_id);

            if (updateError) {
              console.error('ERROR CRÍTICO: No se pudo vincular user_id al estudiante:', updateError);
            } else {
              console.log('✓ user_id vinculado exitosamente al estudiante:', result.student_id);
            }

            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                email: studentEmail,
                full_name: `${application!.student_first_name} ${application!.student_last_name}`,
                role: 'student',
                is_active: true,
              });

            if (profileError) {
              console.error('Error creando profile de estudiante:', profileError);
            }

            studentCreated = !updateError;
          }
        } catch (e) {
          console.error('Exception creating student:', e);
        }

        // --- CREAR APODERADO (independiente del estudiante) ---
        try {
          const { data: guardianAuthData, error: guardianAuthError } = await supabase.auth.signUp({
            email: guardianEmail,
            password: guardianPassword,
            options: {
              data: {
                full_name: `${application!.guardian_first_name} ${application!.guardian_last_name}`,
                role: 'guardian',
              },
            },
          });

          if (!guardianAuthError && guardianAuthData.user) {
            await supabase
              .from('profiles')
              .insert({
                id: guardianAuthData.user.id,
                email: guardianEmail,
                full_name: `${application!.guardian_first_name} ${application!.guardian_last_name}`,
                role: 'guardian',
                is_active: true,
              });

            const { data: guardianData, error: guardianInsertError } = await supabase
              .from('guardians')
              .insert({
                user_id: guardianAuthData.user.id,
                first_name: application!.guardian_first_name,
                last_name: application!.guardian_last_name,
                phone: application!.guardian_phone,
                email: guardianEmail,
                relationship: application!.guardian_relationship,
              })
              .select()
              .single();

            if (!guardianInsertError && guardianData) {
              await supabase
                .from('student_guardians')
                .insert({
                  student_id: result.student_id,
                  guardian_id: guardianData.id,
                  is_primary: true,
                });
              guardianCreated = true;
            }
          } else if (guardianAuthError) {
            console.error('Error creating guardian user:', guardianAuthError);
          }
        } catch (e) {
          console.error('Exception creating guardian:', e);
        }

        // --- MENSAJE FINAL ---
        let msg = 'Resultado:\n\n';
        if (studentCreated) {
          msg += `✅ Estudiante creado:\nEmail: ${studentEmail}\nContraseña: ${studentPassword}\n\n`;
        } else {
          msg += `⚠️ No se pudo crear cuenta de estudiante (${studentEmail})\n\n`;
        }
        if (guardianCreated) {
          msg += `✅ Apoderado creado:\nEmail: ${guardianEmail}\nContraseña: ${guardianPassword}\n\n`;
        } else {
          msg += `⚠️ No se pudo crear cuenta de apoderado (${guardianEmail})\n\n`;
        }
        alert(msg);
      }

      onApprove(application!.id, selectedSection);
      onClose();
    } catch (err) {
      console.error('Error approving application:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al aprobar la solicitud';
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Debes proporcionar un motivo de rechazo');
      return;
    }

    onReject(application!.id, rejectionReason);
    onClose();
  };

  if (!application) return null;

  const age = Math.floor(
    (new Date().getTime() - new Date(application.student_birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalle de Solicitud</h2>
            <p className="text-sm text-gray-600">
              Fecha de solicitud: {new Date(application.application_date).toLocaleDateString('es-PE')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Estudiante */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-900" />
              <h3 className="text-lg font-bold text-blue-900">Datos del Estudiante</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Nombre completo:</span>
                <p className="font-semibold text-gray-900">
                  {application.student_first_name} {application.student_last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Documento:</span>
                <p className="font-semibold text-gray-900">
                  {application.student_document_type} {application.student_document_number}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Fecha de nacimiento:</span>
                <p className="font-semibold text-gray-900">
                  {new Date(application.student_birth_date).toLocaleDateString('es-PE')} ({age} años)
                </p>
              </div>
              <div>
                <span className="text-gray-600">Género:</span>
                <p className="font-semibold text-gray-900">
                  {application.student_gender === 'M' ? 'Masculino' : 'Femenino'}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-600">Dirección:</span>
                <p className="font-semibold text-gray-900">{application.student_address}</p>
              </div>
            </div>
          </div>

          {/* Información del Apoderado */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-green-900" />
              <h3 className="text-lg font-bold text-green-900">Datos del Apoderado</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Nombre completo:</span>
                <p className="font-semibold text-gray-900">
                  {application.guardian_first_name} {application.guardian_last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Documento:</span>
                <p className="font-semibold text-gray-900">
                  {application.guardian_document_type} {application.guardian_document_number}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <p className="font-semibold text-gray-900">{application.guardian_email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600" />
                <p className="font-semibold text-gray-900">{application.guardian_phone}</p>
              </div>
              <div>
                <span className="text-gray-600">Relación:</span>
                <p className="font-semibold text-gray-900">{application.guardian_relationship}</p>
              </div>
              <div>
                <span className="text-gray-600">Dirección:</span>
                <p className="font-semibold text-gray-900">{application.guardian_address}</p>
              </div>
            </div>
          </div>

          {/* Información Académica */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-purple-900" />
              <h3 className="text-lg font-bold text-purple-900">Información Académica</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Grado solicitado:</span>
                <p className="font-semibold text-gray-900">
                  {application.grade_levels.name} ({application.grade_levels.level})
                </p>
              </div>
              <div>
                <span className="text-gray-600">Colegio anterior:</span>
                <p className="font-semibold text-gray-900">{application.previous_school || 'No especificado'}</p>
              </div>
              {application.has_special_needs && (
                <div className="md:col-span-2">
                  <span className="text-gray-600">Necesidades especiales:</span>
                  <p className="font-semibold text-gray-900">{application.special_needs_description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contacto de Emergencia */}
          {application.emergency_contact_name && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-orange-900 mb-3">Contacto de Emergencia</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <p className="font-semibold text-gray-900">{application.emergency_contact_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <p className="font-semibold text-gray-900">{application.emergency_contact_phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notas Adicionales */}
          {application.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Notas Adicionales</h3>
              <p className="text-sm text-gray-700">{application.notes}</p>
            </div>
          )}

          {/* Acciones */}
          {application.status === 'pending' && (
            <div className="border-t pt-6">
              {!showRejectForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Sección para Matrícula
                    </label>
                    <Select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      options={[
                        { value: '', label: 'Selecciona una sección' },
                        ...sections.map((s) => ({
                          value: s.id,
                          label: `${s.grade_levels.grade}° ${s.section_letter} - ${s.grade_levels.name} (${s.current_enrollment}/${s.capacity} estudiantes)`,
                        })),
                      ]}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={!selectedSection || processing}
                      className="flex-1"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {processing ? 'Aprobando...' : 'Aprobar Matrícula'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowRejectForm(true)} disabled={processing}>
                      <XCircle className="w-5 h-5 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de Rechazo
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      placeholder="Explica por qué se rechaza la solicitud..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowRejectForm(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleReject} disabled={!rejectionReason.trim()} className="flex-1 bg-red-600 hover:bg-red-700">
                      Confirmar Rechazo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {application.status === 'approved' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-900">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Solicitud Aprobada</p>
                  <p className="text-sm">
                    Revisado el {new Date(application.reviewed_at!).toLocaleDateString('es-PE')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {application.status === 'rejected' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-900 mb-2">
                <XCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Solicitud Rechazada</p>
                  <p className="text-sm">
                    Revisado el {new Date(application.reviewed_at!).toLocaleDateString('es-PE')}
                  </p>
                </div>
              </div>
              {application.rejection_reason && (
                <p className="text-sm text-red-800 mt-2">
                  <strong>Motivo:</strong> {application.rejection_reason}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function EnrollmentApplicationsList() {
  const [applications, setApplications] = useState<EnrollmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedApplication, setSelectedApplication] = useState<EnrollmentApplication | null>(null);

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  async function loadApplications() {
    try {
      setLoading(true);
      let query = supabase
        .from('enrollment_applications')
        .select(`
          *,
          grade_levels (name, level)
        `)
        .order('application_date', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleReject = async (applicationId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('enrollment_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      alert('Solicitud rechazada');
      loadApplications();
    } catch (err) {
      console.error('Error rejecting application:', err);
      alert('Error al rechazar la solicitud');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'approved':
        return <Badge variant="success">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="error">Rechazada</Badge>;
      case 'cancelled':
        return <Badge>Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex items-center gap-4">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las solicitudes' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'approved', label: 'Aprobadas' },
              { value: 'rejected', label: 'Rechazadas' },
            ]}
          />
          <Button onClick={loadApplications} variant="outline" size="sm">
            Actualizar
          </Button>
        </div>

        {/* Lista de solicitudes con Diseño Moderno */}
        {loading ? (
          <Card className="p-12 text-center border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <Loading text="Cargando solicitudes..." />
          </Card>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No hay solicitudes</h3>
            <p className="text-slate-500">
              No hay solicitudes {filterStatus !== 'all' ? (filterStatus === 'pending' ? 'pendientes' : 'en este estado') : ''} por el momento.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-cermat-blue-light overflow-hidden"
              >
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-lg text-cermat-blue-dark group-hover:bg-cermat-blue-dark group-hover:text-white transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-cermat-blue-dark transition-colors">
                          {app.student_first_name} {app.student_last_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getStatusBadge(app.status)}
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 font-medium">{new Date(app.application_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <GraduationCap className="w-4 h-4 text-cermat-blue-light" />
                        <span className="font-medium">{app.grade_levels.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="truncate max-w-[150px]" title={`${app.guardian_first_name} ${app.guardian_last_name}`}>
                          Apod: {app.guardian_first_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{app.guardian_phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center self-end md:self-center">
                    <Button
                      variant="ghost"
                      className="text-cermat-blue-dark hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => setSelectedApplication(app)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Revisar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onApprove={loadApplications}
          onReject={handleReject}
        />
      )}
    </>
  );
}
