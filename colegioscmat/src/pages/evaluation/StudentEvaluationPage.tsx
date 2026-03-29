import { useState, useEffect } from 'react';
import { BookOpen, FileText, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { EvaluationGrade } from '../../lib/database.types';

interface Period {
  id: string;
  name: string;
  period_number: number;
}

interface EvaluationRecord {
  id: string;
  grade: EvaluationGrade;
  observations: string | null;
  course: {
    code: string;
    name: string;
  };
  competency: {
    code: string;
    description: string;
  };
  period: {
    name: string;
  };
}

export function StudentEvaluationPage() {
  const { profile } = useAuth();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [profile, selectedPeriod]);

  async function loadData() {
    try {
      setLoading(true);

      // Obtener student_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, section:sections(academic_year_id)')
        .eq('user_id', profile?.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        console.log('No student record found for this user');
        setLoading(false);
        return;
      }

      // Cargar periodos del año académico
      const { data: periodsData, error: periodsError } = await supabase
        .from('periods')
        .select('id, name, period_number')
        .eq('academic_year_id', studentData.section.academic_year_id)
        .order('period_number', { ascending: true });

      if (periodsError) throw periodsError;
      setPeriods(periodsData || []);

      // Cargar evaluaciones publicadas
      let query = supabase
        .from('evaluations')
        .select(`
          id,
          grade,
          observations,
          course:courses(code, name),
          competency:competencies(code, description),
          period:periods(name)
        `)
        .eq('student_id', studentData.id)
        .eq('status', 'publicada');

      if (selectedPeriod !== 'all') {
        query = query.eq('period_id', selectedPeriod);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  }

  function getGradeColor(grade: EvaluationGrade) {
    switch (grade) {
      case 'AD':
        return 'bg-green-500 text-white';
      case 'A':
        return 'bg-blue-500 text-white';
      case 'B':
        return 'bg-yellow-500 text-white';
      case 'C':
        return 'bg-red-500 text-white';
    }
  }

  function getGradeLabel(grade: EvaluationGrade) {
    switch (grade) {
      case 'AD':
        return 'Logro Destacado';
      case 'A':
        return 'Logro Esperado';
      case 'B':
        return 'En Proceso';
      case 'C':
        return 'En Inicio';
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando calificaciones..." />;
  }

  // Agrupar por curso
  const evaluationsByCourse = evaluations.reduce((acc, evaluation) => {
    const courseKey = `${evaluation.course.code} - ${evaluation.course.name}`;
    if (!acc[courseKey]) {
      acc[courseKey] = [];
    }
    acc[courseKey].push(evaluation);
    return acc;
  }, {} as Record<string, EvaluationRecord[]>);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Mis Calificaciones</h1>
          <p className="text-[#334155]">Revisa tu rendimiento académico</p>
        </div>
        <Button icon={<Download />} variant="outline" disabled>
          Descargar Boleta (Próximamente)
        </Button>
      </div>

      {/* Selector de periodo */}
      <Card>
        <CardContent className="pt-6">
          <Select
            label="Filtrar por periodo"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="all">Todos los periodos</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Calificaciones por curso */}
      {Object.keys(evaluationsByCourse).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(evaluationsByCourse).map(([courseName, courseEvaluations]) => (
            <Card key={courseName} variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">{courseName}</h2>
                    <p className="text-sm text-[#334155]">
                      {courseEvaluations.length} competencias evaluadas
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseEvaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="p-4 border-2 border-[#E2E8F0] rounded-xl hover:border-[#0E3A8A] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{evaluation.competency.code}</Badge>
                            <Badge variant="primary">{evaluation.period.name}</Badge>
                          </div>
                          <p className="text-sm text-[#0F172A] font-medium mb-1">
                            {evaluation.competency.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div
                            className={`w-16 h-16 rounded-xl flex items-center justify-center ${getGradeColor(
                              evaluation.grade
                            )}`}
                          >
                            <span className="text-2xl font-bold">{evaluation.grade}</span>
                          </div>
                          <span className="text-xs text-[#334155] font-medium">
                            {getGradeLabel(evaluation.grade)}
                          </span>
                        </div>
                      </div>

                      {evaluation.observations && (
                        <div className="mt-3 p-3 bg-[#F8FAFC] rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-[#334155] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-[#0F172A] mb-1">
                                Observaciones del docente:
                              </p>
                              <p className="text-sm text-[#334155]">{evaluation.observations}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay calificaciones publicadas
              </h3>
              <p className="text-[#334155]">
                Tus docentes aún no han publicado calificaciones para el periodo seleccionado
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leyenda de calificaciones */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-[#0F172A]">Escala de Calificación</h3>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AD</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Logro Destacado</p>
                <p className="text-xs text-[#334155]">Desempeño sobresaliente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Logro Esperado</p>
                <p className="text-xs text-[#334155]">Cumple con lo esperado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">En Proceso</p>
                <p className="text-xs text-[#334155]">Está cerca del logro</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">En Inicio</p>
                <p className="text-xs text-[#334155]">Requiere apoyo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
