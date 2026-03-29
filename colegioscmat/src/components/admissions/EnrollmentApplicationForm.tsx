import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface EnrollmentFormData {
  // Estudiante
  student_first_name: string;
  student_last_name: string;
  student_document_type: string;
  student_document_number: string;
  student_birth_date: string;
  student_gender: string;
  student_address: string;
  
  // Apoderado
  guardian_first_name: string;
  guardian_last_name: string;
  guardian_document_type: string;
  guardian_document_number: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_address: string;
  guardian_relationship: string;
  
  // Académico
  grade_level_id: string;
  previous_school: string;
  has_special_needs: boolean;
  special_needs_description: string;
  
  // Contacto emergencia
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
}

interface GradeLevel {
  id: string;
  name: string;
  level: string;
}

export function EnrollmentApplicationForm() {
  const [formData, setFormData] = useState<EnrollmentFormData>({
    student_first_name: '',
    student_last_name: '',
    student_document_type: 'DNI',
    student_document_number: '',
    student_birth_date: '',
    student_gender: 'M',
    student_address: '',
    guardian_first_name: '',
    guardian_last_name: '',
    guardian_document_type: 'DNI',
    guardian_document_number: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_address: '',
    guardian_relationship: 'Padre',
    grade_level_id: '',
    previous_school: '',
    has_special_needs: false,
    special_needs_description: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });

  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadGradeLevels();
    loadActiveAcademicYear();
  }, []);

  async function loadGradeLevels() {
    try {
      const { data, error } = await supabase
        .from('grade_levels')
        .select('id, name, level')
        .order('id');

      if (error) throw error;
      setGradeLevels(data || []);
    } catch (err) {
      console.error('Error loading grade levels:', err);
    }
  }

  async function loadActiveAcademicYear() {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setAcademicYearId(data?.id || '');
    } catch (err) {
      console.error('Error loading academic year:', err);
    }
  }

  const handleChange = (field: keyof EnrollmentFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.student_first_name || !formData.student_last_name) {
      setError('El nombre del estudiante es obligatorio');
      return;
    }

    if (!formData.student_document_number) {
      setError('El documento del estudiante es obligatorio');
      return;
    }

    if (!formData.student_birth_date) {
      setError('La fecha de nacimiento es obligatoria');
      return;
    }

    if (!formData.guardian_first_name || !formData.guardian_last_name) {
      setError('El nombre del apoderado es obligatorio');
      return;
    }

    if (!formData.guardian_email) {
      setError('El email del apoderado es obligatorio');
      return;
    }

    if (!formData.guardian_phone) {
      setError('El teléfono del apoderado es obligatorio');
      return;
    }

    if (!formData.grade_level_id) {
      setError('Debes seleccionar el grado al que postula');
      return;
    }

    if (!academicYearId) {
      setError('No hay un año académico activo. Contacta con la institución.');
      return;
    }

    try {
      setSubmitting(true);

      const { error: insertError } = await supabase
        .from('enrollment_applications')
        .insert({
          ...formData,
          academic_year_id: academicYearId,
          has_special_needs: formData.has_special_needs,
        } as any);

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        student_first_name: '',
        student_last_name: '',
        student_document_type: 'DNI',
        student_document_number: '',
        student_birth_date: '',
        student_gender: 'M',
        student_address: '',
        guardian_first_name: '',
        guardian_last_name: '',
        guardian_document_type: 'DNI',
        guardian_document_number: '',
        guardian_phone: '',
        guardian_email: '',
        guardian_address: '',
        guardian_relationship: 'Padre',
        grade_level_id: '',
        previous_school: '',
        has_special_needs: false,
        special_needs_description: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
      });

      // Scroll to top para ver mensaje de éxito
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting application:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar la solicitud';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-900 mb-3">
            ¡Solicitud Enviada Exitosamente!
          </h3>
          <p className="text-green-800 mb-6">
            Hemos recibido tu solicitud de matrícula. Nuestro equipo la revisará en breve y
            nos comunicaremos contigo al correo proporcionado: <strong>{formData.guardian_email}</strong>
          </p>
          <div className="space-y-2 text-sm text-green-700 mb-6">
            <p>📧 Revisa tu bandeja de entrada y spam</p>
            <p>📞 Puedes comunicarte al (01) 234-5678 para consultas</p>
            <p>⏰ Tiempo de respuesta: 24-48 horas hábiles</p>
          </div>
          <Button onClick={() => setSuccess(false)} variant="outline">
            Enviar otra solicitud
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Información del Estudiante */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#0E3A8A]">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-[#0E3A8A] text-white rounded-full flex items-center justify-center text-sm">
            1
          </span>
          Datos del Estudiante
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Nombres"
            value={formData.student_first_name}
            onChange={(e) => handleChange('student_first_name', e.target.value)}
            required
          />
          <Input
            label="Apellidos"
            value={formData.student_last_name}
            onChange={(e) => handleChange('student_last_name', e.target.value)}
            required
          />
          <Select
            label="Tipo de Documento"
            value={formData.student_document_type}
            onChange={(e) => handleChange('student_document_type', e.target.value)}
            options={[
              { value: 'DNI', label: 'DNI' },
              { value: 'CE', label: 'Carné de Extranjería' },
              { value: 'Pasaporte', label: 'Pasaporte' },
            ]}
            required
          />
          <Input
            label="Número de Documento"
            value={formData.student_document_number}
            onChange={(e) => handleChange('student_document_number', e.target.value)}
            required
          />
          <Input
            type="date"
            label="Fecha de Nacimiento"
            value={formData.student_birth_date}
            onChange={(e) => handleChange('student_birth_date', e.target.value)}
            required
          />
          <Select
            label="Género"
            value={formData.student_gender}
            onChange={(e) => handleChange('student_gender', e.target.value)}
            options={[
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
            ]}
            required
          />
          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={formData.student_address}
              onChange={(e) => handleChange('student_address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Información del Apoderado */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#0E3A8A]">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-[#0E3A8A] text-white rounded-full flex items-center justify-center text-sm">
            2
          </span>
          Datos del Apoderado
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Nombres"
            value={formData.guardian_first_name}
            onChange={(e) => handleChange('guardian_first_name', e.target.value)}
            required
          />
          <Input
            label="Apellidos"
            value={formData.guardian_last_name}
            onChange={(e) => handleChange('guardian_last_name', e.target.value)}
            required
          />
          <Select
            label="Tipo de Documento"
            value={formData.guardian_document_type}
            onChange={(e) => handleChange('guardian_document_type', e.target.value)}
            options={[
              { value: 'DNI', label: 'DNI' },
              { value: 'CE', label: 'Carné de Extranjería' },
              { value: 'Pasaporte', label: 'Pasaporte' },
            ]}
            required
          />
          <Input
            label="Número de Documento"
            value={formData.guardian_document_number}
            onChange={(e) => handleChange('guardian_document_number', e.target.value)}
            required
          />
          <Input
            type="email"
            label="Correo Electrónico"
            value={formData.guardian_email}
            onChange={(e) => handleChange('guardian_email', e.target.value)}
            required
            helperText="Recibirás la respuesta a esta dirección"
          />
          <Input
            type="tel"
            label="Teléfono"
            value={formData.guardian_phone}
            onChange={(e) => handleChange('guardian_phone', e.target.value)}
            required
          />
          <Select
            label="Relación con el Estudiante"
            value={formData.guardian_relationship}
            onChange={(e) => handleChange('guardian_relationship', e.target.value)}
            options={[
              { value: 'Padre', label: 'Padre' },
              { value: 'Madre', label: 'Madre' },
              { value: 'Tutor', label: 'Tutor' },
              { value: 'Otro', label: 'Otro' },
            ]}
            required
          />
          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={formData.guardian_address}
              onChange={(e) => handleChange('guardian_address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Información Académica */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#0E3A8A]">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-[#0E3A8A] text-white rounded-full flex items-center justify-center text-sm">
            3
          </span>
          Información Académica
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Select
            label="Grado al que Postula"
            value={formData.grade_level_id}
            onChange={(e) => handleChange('grade_level_id', e.target.value)}
            options={[
              { value: '', label: 'Seleccione un grado' },
              ...gradeLevels.map((gl) => ({
                value: gl.id,
                label: `${gl.name} (${gl.level})`,
              })),
            ]}
            required
          />
          <Input
            label="Colegio de Procedencia"
            value={formData.previous_school}
            onChange={(e) => handleChange('previous_school', e.target.value)}
            placeholder="Ej: I.E. San Martín"
          />
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={formData.has_special_needs}
                onChange={(e) => handleChange('has_special_needs', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              El estudiante tiene necesidades educativas especiales
            </label>
            {formData.has_special_needs && (
              <textarea
                value={formData.special_needs_description}
                onChange={(e) => handleChange('special_needs_description', e.target.value)}
                placeholder="Describe las necesidades especiales..."
                rows={3}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#0E3A8A]">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-[#0E3A8A] text-white rounded-full flex items-center justify-center text-sm">
            4
          </span>
          Contacto de Emergencia
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Nombre Completo"
            value={formData.emergency_contact_name}
            onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
            placeholder="Nombre del contacto de emergencia"
          />
          <Input
            type="tel"
            label="Teléfono"
            value={formData.emergency_contact_phone}
            onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
            placeholder="Teléfono de contacto"
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Información adicional que desees compartir..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Botón de envío */}
      <div className="flex justify-center">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="px-12"
        >
          {submitting ? 'Enviando...' : 'Enviar Solicitud de Matrícula'}
        </Button>
      </div>

      <p className="text-sm text-gray-600 text-center">
        Al enviar este formulario, aceptas nuestros{' '}
        <a href="/legal/terms" className="text-blue-600 hover:underline">
          Términos y Condiciones
        </a>{' '}
        y nuestra{' '}
        <a href="/legal/privacy" className="text-blue-600 hover:underline">
          Política de Privacidad
        </a>
        .
      </p>
    </form>
  );
}
