import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { AttendanceStatus } from '../../lib/database.types';

interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  justification: string | null;
  course: {
    name: string;
    code: string;
  };
  justification_data?: {
    id: string;
    status: 'pendiente' | 'aprobada' | 'rechazada';
    reason: string;
    review_notes: string | null;
  };
}

export function StudentAttendancePage() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [stats, setStats] = useState({
    presente: 0,
    tarde: 0,
    falta: 0,
    justificado: 0,
  });

  useEffect(() => {
    loadAttendance();
  }, [profile, selectedMonth]);

  async function loadAttendance() {
    try {
      setLoading(true);

      // Obtener el student_id del usuario actual
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, section_id')
        .eq('user_id', profile?.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        console.log('No student record found for this user');
        setLoading(false);
        return;
      }

      // Calcular rango de fechas del mes seleccionado
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(selectedMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      const endDateStr = endDate.toISOString().split('T')[0];

      // Cargar asistencia del mes (la asistencia ya está filtrada por student_id)
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          justification,
          course:courses(name, code)
        `)
        .eq('student_id', studentData.id)
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (error) throw error;

      // Cargar justificaciones para las faltas/tardanzas
      const attendanceIds = (data || []).map((a) => a.id);
      let justifications: any[] = [];

      if (attendanceIds.length > 0) {
        const { data: justData, error: justError } = await supabase
          .from('attendance_justifications')
          .select('id, attendance_id, status, reason, review_notes')
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

      setAttendance(combinedData);

      // Calcular estadísticas
      const newStats = { presente: 0, tarde: 0, falta: 0, justificado: 0 };
      combinedData.forEach((record) => {
        newStats[record.status]++;
      });
      setStats(newStats);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: AttendanceStatus) {
    switch (status) {
      case 'presente':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'tarde':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'falta':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'justificado':
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  }

  function getStatusLabel(status: AttendanceStatus) {
    switch (status) {
      case 'presente':
        return 'Presente';
      case 'tarde':
        return 'Tardanza';
      case 'falta':
        return 'Falta';
      case 'justificado':
        return 'Justificado';
    }
  }

  function getStatusColor(status: AttendanceStatus) {
    switch (status) {
      case 'presente':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'tarde':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'falta':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'justificado':
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando asistencia..." />;
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Mi Asistencia</h1>
        <p className="text-[#334155]">Revisa tu historial de asistencia</p>
      </div>

      {/* Selector de mes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-5 h-5 text-[#334155]" />
            <Select
              label=""
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                const label = date.toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                });
                return (
                  <option key={value} value={value}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </option>
                );
              })}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{stats.presente}</p>
                <p className="text-sm text-[#334155]">Presentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{stats.tarde}</p>
                <p className="text-sm text-[#334155]">Tardanzas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{stats.falta}</p>
                <p className="text-sm text-[#334155]">Faltas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{stats.justificado}</p>
                <p className="text-sm text-[#334155]">Justificadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de asistencia */}
      {attendance.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-[#0F172A]">Historial de Asistencia</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className={`p-4 rounded-xl border-2 ${getStatusColor(record.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(record.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold text-[#0F172A]">
                            {new Date(record.date).toLocaleDateString('es-PE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {record.course.code}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#334155] mb-2">{record.course.name}</p>

                        {record.justification && (
                          <p className="text-sm text-[#334155] italic">
                            Nota: {record.justification}
                          </p>
                        )}

                        {record.justification_data && (
                          <div className="mt-3 p-3 bg-white/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">Justificación:</span>
                              <Badge
                                variant={
                                  record.justification_data.status === 'aprobada'
                                    ? 'success'
                                    : record.justification_data.status === 'rechazada'
                                      ? 'danger'
                                      : 'primary'
                                }
                              >
                                {record.justification_data.status === 'pendiente'
                                  ? 'Pendiente'
                                  : record.justification_data.status === 'aprobada'
                                    ? 'Aprobada'
                                    : 'Rechazada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#334155]">
                              {record.justification_data.reason}
                            </p>
                            {record.justification_data.review_notes && (
                              <p className="text-sm text-[#334155] mt-2 italic">
                                Respuesta: {record.justification_data.review_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-bold">
                      {getStatusLabel(record.status)}
                    </Badge>
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
                <CalendarIcon className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay registros de asistencia
              </h3>
              <p className="text-[#334155]">
                No se encontraron registros para el mes seleccionado
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
