import { useState, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  Download,
  FileText,
  AlertCircle,
  TrendingUp,
  Users,
  Award,
  FileDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';
import {
  exportAttendanceReport,
  exportEvaluationReport,
  exportSIAGIEFormat
} from '../../lib/exportUtils';

type TabType = 'attendance' | 'evaluation' | 'siagie';

interface AcademicYear {
  id: string;
  year: string;
}

interface Period {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface GradeLevel {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  grade_level_id: string;
}

interface Course {
  id: string;
  name: string;
}

interface AttendanceReport {
  student_id: string;
  student_code: string;
  student_name: string;
  attendance_percentage: number;
  total_absences: number;
  total_tardies: number;
  total_justifications: number;
}

interface EvaluationReport {
  student_id: string;
  student_code: string;
  student_name: string;
  competencies: {
    [key: string]: string; // competency_id: grade (AD/A/B/C)
  };
  final_grade: string;
}

export function AcademicReportsPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Datos
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([]);
  const [evaluationData, setEvaluationData] = useState<EvaluationReport[]>([]);
  const [competenciesList, setCompetenciesList] = useState<any[]>([]);

  // KPIs Asistencia
  const [avgAttendance, setAvgAttendance] = useState(0);
  const [topAbsentees, setTopAbsentees] = useState<string[]>([]);
  const [totalAbsences, setTotalAbsences] = useState(0);

  // KPIs Evaluación
  const [gradeDistribution, setGradeDistribution] = useState({
    AD: 0,
    A: 0,
    B: 0,
    C: 0,
  });
  const [studentsAtRisk, setStudentsAtRisk] = useState(0);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadPeriods(selectedYear);
    } else {
      setPeriods([]);
      setSelectedPeriod('');
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedGrade) {
      loadSections(selectedGrade);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedGrade]);

  useEffect(() => {
    if (selectedSection && selectedYear) {
      loadCourses(selectedSection, selectedYear);
    } else {
      setCourses([]);
      setSelectedCourse('');
    }
  }, [selectedSection, selectedYear]);

  useEffect(() => {
    if (selectedSection && selectedYear && selectedPeriod) {
      if (activeTab === 'attendance') {
        loadAttendanceReport();
      } else if (activeTab === 'evaluation' && selectedCourse) {
        loadEvaluationReport();
      }
    }
  }, [activeTab, selectedYear, selectedPeriod, selectedGrade, selectedSection, selectedCourse]);

  async function loadFilters() {
    try {
      // Cargar años académicos
      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year')
        .eq('is_active', true)
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);
      if (yearsData && yearsData.length > 0) {
        setSelectedYear(yearsData[0].id);
      }

      // Cargar grados
      const { data: gradesData, error: gradesError } = await supabase
        .from('grade_levels')
        .select('id, name, level')
        .order('level');

      if (gradesError) throw gradesError;
      setGrades(gradesData || []);
    } catch (error: any) {
      console.error('Error loading filters:', error);
      setError('Error al cargar los filtros');
    }
  }

  async function loadPeriods(yearId: string) {
    try {
      const { data, error } = await supabase
        .from('periods')
        .select('id, name, start_date, end_date')
        .eq('academic_year_id', yearId)
        .order('start_date');

      if (error) throw error;
      setPeriods(data || []);
      if (data && data.length > 0) {
        setSelectedPeriod(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading periods:', error);
    }
  }

  async function loadSections(gradeId: string) {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('id, name, grade_level_id')
        .eq('grade_level_id', gradeId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      console.error('Error loading sections:', error);
    }
  }

  async function loadCourses(sectionId: string, yearId: string) {
    try {
      const { data, error } = await supabase
        .from('section_courses')
        .select(`
          course:courses(id, name)
        `)
        .eq('section_id', sectionId)
        .eq('academic_year_id', yearId);

      if (error) throw error;
      const coursesList = (data || []).map((sc: any) => sc.course).filter(Boolean);
      setCourses(coursesList);
    } catch (error: any) {
      console.error('Error loading courses:', error);
    }
  }

  async function loadAttendanceReport() {
    try {
      setLoading(true);
      setError('');

      // Obtener periodo
      const period = periods.find((p) => p.id === selectedPeriod);
      if (!period) return;

      // Cargar estudiantes de la sección
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, code, first_name, last_name')
        .eq('section_id', selectedSection)
        .eq('is_active', true)
        .order('last_name');

      if (studentsError) throw studentsError;

      // Cargar asistencias del periodo
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status, date, attendance_justifications(id, status)')
        .eq('section_id', selectedSection)
        .gte('date', period.start_date)
        .lte('date', period.end_date);

      if (attendanceError) throw attendanceError;

      // Procesar datos por estudiante
      const reportData: AttendanceReport[] = [];
      let totalAbsencesSum = 0;

      (studentsData || []).forEach((student: any) => {
        const studentAttendances = (attendanceData || []).filter(
          (a: any) => a.student_id === student.id
        );

        const totalRecords = studentAttendances.length;
        const absences = studentAttendances.filter((a: any) => a.status === 'ausente').length;
        const tardies = studentAttendances.filter((a: any) => a.status === 'tarde').length;
        const presents = studentAttendances.filter((a: any) => a.status === 'presente').length;
        const justifications = studentAttendances.filter(
          (a: any) =>
            a.status === 'ausente' &&
            a.attendance_justifications &&
            a.attendance_justifications.length > 0 &&
            a.attendance_justifications[0].status === 'aprobada'
        ).length;

        const attendancePercentage =
          totalRecords > 0 ? ((presents + justifications) / totalRecords) * 100 : 0;

        totalAbsencesSum += absences;

        reportData.push({
          student_id: student.id,
          student_code: student.code,
          student_name: `${student.last_name}, ${student.first_name}`,
          attendance_percentage: attendancePercentage,
          total_absences: absences,
          total_tardies: tardies,
          total_justifications: justifications,
        });
      });

      // Calcular KPIs
      const avgAtt =
        reportData.length > 0
          ? reportData.reduce((sum, s) => sum + s.attendance_percentage, 0) / reportData.length
          : 0;
      setAvgAttendance(avgAtt);

      const sortedByAbsences = [...reportData].sort((a, b) => b.total_absences - a.total_absences);
      setTopAbsentees(sortedByAbsences.slice(0, 3).map((s) => s.student_name));

      setTotalAbsences(totalAbsencesSum);
      setAttendanceData(reportData);
    } catch (error: any) {
      console.error('Error loading attendance report:', error);
      setError('Error al cargar el reporte de asistencia');
    } finally {
      setLoading(false);
    }
  }

  async function loadEvaluationReport() {
    try {
      setLoading(true);
      setError('');

      // Cargar competencias del curso
      const { data: competenciesData, error: competenciesError } = await supabase
        .from('course_competencies')
        .select('id, description')
        .eq('course_id', selectedCourse)
        .order('created_at');

      if (competenciesError) throw competenciesError;
      setCompetenciesList(competenciesData || []);

      // Cargar estudiantes de la sección
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, code, first_name, last_name')
        .eq('section_id', selectedSection)
        .eq('is_active', true)
        .order('last_name');

      if (studentsError) throw studentsError;

      // Cargar evaluaciones del periodo
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select('student_id, competency_id, grade')
        .eq('course_id', selectedCourse)
        .eq('period_id', selectedPeriod)
        .in(
          'competency_id',
          (competenciesData || []).map((c: any) => c.id)
        );

      if (evaluationsError) throw evaluationsError;

      // Procesar datos por estudiante
      const reportData: EvaluationReport[] = [];
      const gradeCount = { AD: 0, A: 0, B: 0, C: 0 };
      let atRiskCount = 0;

      (studentsData || []).forEach((student: any) => {
        const studentEvals = (evaluationsData || []).filter(
          (e: any) => e.student_id === student.id
        );

        const competencies: any = {};
        let lowGradesCount = 0;

        (competenciesData || []).forEach((comp: any) => {
          const evalForComp = studentEvals.find((e: any) => e.competency_id === comp.id);
          const grade = evalForComp?.grade || '-';
          competencies[comp.id] = grade;

          if (grade === 'B' || grade === 'C') {
            lowGradesCount++;
          }

          if (grade !== '-') {
            gradeCount[grade as keyof typeof gradeCount]++;
          }
        });

        // Calcular nota final (promedio ponderado simple)
        const grades = Object.values(competencies).filter((g) => g !== '-');
        let finalGrade = '-';
        if (grades.length > 0) {
          const gradeValues: any = { AD: 4, A: 3, B: 2, C: 1 };
          const avgValue =
            grades.reduce((sum, g) => sum + (gradeValues[g as string] || 0), 0) / grades.length;
          if (avgValue >= 3.5) finalGrade = 'AD';
          else if (avgValue >= 2.5) finalGrade = 'A';
          else if (avgValue >= 1.5) finalGrade = 'B';
          else finalGrade = 'C';
        }

        // Estudiante en riesgo si tiene 2 o más competencias en B/C
        if (lowGradesCount >= 2) {
          atRiskCount++;
        }

        reportData.push({
          student_id: student.id,
          student_code: student.code,
          student_name: `${student.last_name}, ${student.first_name}`,
          competencies,
          final_grade: finalGrade,
        });
      });

      // Calcular distribución porcentual
      const totalGrades = gradeCount.AD + gradeCount.A + gradeCount.B + gradeCount.C;
      if (totalGrades > 0) {
        setGradeDistribution({
          AD: Math.round((gradeCount.AD / totalGrades) * 100),
          A: Math.round((gradeCount.A / totalGrades) * 100),
          B: Math.round((gradeCount.B / totalGrades) * 100),
          C: Math.round((gradeCount.C / totalGrades) * 100),
        });
      }

      setStudentsAtRisk(atRiskCount);
      setEvaluationData(reportData);
    } catch (error: any) {
      console.error('Error loading evaluation report:', error);
      setError('Error al cargar el reporte de evaluación');
    } finally {
      setLoading(false);
    }
  }

  function exportAttendanceCSV() {
    const periodName = periods.find(p => p.id === selectedPeriod)?.name;
    const sectionName = sections.find(s => s.id === selectedSection)?.name;
    const courseName = courses.find(c => c.id === selectedCourse)?.name;

    exportAttendanceReport(attendanceData, {
      period: periodName,
      section: sectionName,
      course: courseName,
    }, 'csv');
  }

  function exportAttendancePDF() {
    const periodName = periods.find(p => p.id === selectedPeriod)?.name;
    const sectionName = sections.find(s => s.id === selectedSection)?.name;
    const courseName = courses.find(c => c.id === selectedCourse)?.name;

    exportAttendanceReport(attendanceData, {
      period: periodName,
      section: sectionName,
      course: courseName,
    }, 'pdf');
  }

  function exportEvaluationCSV() {
    const periodName = periods.find(p => p.id === selectedPeriod)?.name;
    const sectionName = sections.find(s => s.id === selectedSection)?.name;
    const courseName = courses.find(c => c.id === selectedCourse)?.name;

    const competencyNames = competenciesList.map(c => c.description);

    exportEvaluationReport(
      evaluationData as any,
      competencyNames,
      {
        period: periodName,
        section: sectionName,
        course: courseName,
      },
      'csv'
    );
  }

  function exportEvaluationPDF() {
    const periodName = periods.find(p => p.id === selectedPeriod)?.name;
    const sectionName = sections.find(s => s.id === selectedSection)?.name;
    const courseName = courses.find(c => c.id === selectedCourse)?.name;

    const competencyNames = competenciesList.map(c => c.description);

    exportEvaluationReport(
      evaluationData as any,
      competencyNames,
      {
        period: periodName,
        section: sectionName,
        course: courseName,
      },
      'pdf'
    );
  }

  function exportSIAGIEMatricula() {
    if (!selectedYear || !selectedGrade || !selectedSection) {
      setError('Selecciona año, grado y sección para exportar');
      return;
    }

    // Cargar estudiantes de la sección
    supabase
      .from('students')
      .select(
        `
        id,
        code,
        dni,
        first_name,
        last_name,
        section:sections!inner(
          name,
          grade_level:grade_levels(name)
        )
      `
      )
      .eq('section_id', selectedSection)
      .eq('is_active', true)
      .order('last_name')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading students:', error);
          setError('Error al cargar estudiantes');
          return;
        }

        let csvContent =
          'Código Modular IE,Código Estudiante,DNI,Apellidos y Nombres,Grado,Sección,Fecha Nacimiento,Sexo\n';

        (data || []).forEach((student: any) => {
          csvContent += `"220000","${student.code}","${student.dni || ''}","${student.last_name}, ${student.first_name}","${student.section.grade_level.name}","${student.section.name}","",""\n`;
        });

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'siagie_matricula.csv';
        link.click();
      });
  }

  function exportSIAGIEAttendance() {
    if (!selectedPeriod || !selectedSection) {
      setError('Selecciona periodo y sección para exportar');
      return;
    }

    const period = periods.find((p) => p.id === selectedPeriod);
    if (!period) return;

    // Cargar datos de asistencia
    supabase
      .from('students')
      .select(
        `
        id,
        code,
        attendance!inner(
          status,
          date
        )
      `
      )
      .eq('section_id', selectedSection)
      .eq('is_active', true)
      .gte('attendance.date', period.start_date)
      .lte('attendance.date', period.end_date)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading attendance:', error);
          setError('Error al cargar asistencias');
          return;
        }

        let csvContent = 'Código Estudiante,Periodo,N° Días Asistidos,N° Faltas,N° Tardanzas\n';

        const studentMap = new Map();

        (data || []).forEach((student: any) => {
          if (!studentMap.has(student.code)) {
            studentMap.set(student.code, {
              code: student.code,
              present: 0,
              absent: 0,
              tardy: 0,
            });
          }

          const stats = studentMap.get(student.code);
          if (student.attendance.status === 'presente') stats.present++;
          else if (student.attendance.status === 'ausente') stats.absent++;
          else if (student.attendance.status === 'tarde') stats.tardy++;
        });

        studentMap.forEach((stats) => {
          csvContent += `"${stats.code}","${period.name}",${stats.present},${stats.absent},${stats.tardy}\n`;
        });

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'siagie_asistencia.csv';
        link.click();
      });
  }

  function exportSIAGIEEvaluation() {
    if (!selectedCourse || !selectedPeriod || !selectedSection) {
      setError('Selecciona curso, periodo y sección para exportar');
      return;
    }

    const period = periods.find((p) => p.id === selectedPeriod);
    const course = courses.find((c) => c.id === selectedCourse);
    if (!period || !course) return;

    // Cargar evaluaciones
    supabase
      .from('evaluations')
      .select(
        `
        student:students!inner(code),
        course_competencies!inner(description),
        grade
      `
      )
      .eq('course_id', selectedCourse)
      .eq('period_id', selectedPeriod)
      .eq('students.section_id', selectedSection)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading evaluations:', error);
          setError('Error al cargar evaluaciones');
          return;
        }

        let csvContent = 'Código Estudiante,Curso,Periodo,Competencia,Nota,Estado\n';

        (data || []).forEach((evaluation: any) => {
          csvContent += `"${evaluation.student.code}","${course.name}","${period.name}","${evaluation.course_competencies.description}","${evaluation.grade}","Publicada"\n`;
        });

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'siagie_evaluacion.csv';
        link.click();
      });
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Reportes Académicos</h1>
          <p className="text-[#334155] mt-1">Consolidados de asistencia, evaluación y exportes SIAGIE</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'attendance'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Asistencia
            </div>
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'evaluation'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Evaluación
            </div>
          </button>
          <button
            onClick={() => setActiveTab('siagie')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'siagie'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Exportes SIAGIE
            </div>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select
              label="Año Académico"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Seleccionar año</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
            </Select>

            <Select
              label="Periodo"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              disabled={!selectedYear}
            >
              <option value="">Seleccionar periodo</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </Select>

            <Select
              label="Grado"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="">Seleccionar grado</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </Select>

            <Select
              label="Sección"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedGrade}
            >
              <option value="">Seleccionar sección</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </Select>

            {activeTab === 'evaluation' && (
              <Select
                label="Curso"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={!selectedSection}
              >
                <option value="">Seleccionar curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* TAB 1: Asistencia */}
          {activeTab === 'attendance' && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                <Card variant="elevated" className="border-t-4 border-[#10B981]">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#0F172A]">
                        {avgAttendance.toFixed(1)}%
                      </span>
                      <TrendingUp className="w-8 h-8 text-[#10B981]" />
                    </div>
                    <p className="text-sm text-[#334155]">Asistencia Promedio</p>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#EF4444]">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#0F172A]">{totalAbsences}</span>
                      <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                    </div>
                    <p className="text-sm text-[#334155]">Total Faltas en Periodo</p>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#F59E0B]">
                  <CardContent className="pt-6">
                    <div className="mb-2">
                      <Users className="w-8 h-8 text-[#F59E0B] mb-2" />
                      <p className="text-sm font-semibold text-[#0F172A] mb-1">
                        Mayor Inasistencia (Top 3)
                      </p>
                    </div>
                    {topAbsentees.length > 0 ? (
                      <ul className="text-xs text-[#64748B] space-y-1">
                        {topAbsentees.map((name, index) => (
                          <li key={index}>
                            {index + 1}. {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#94A3B8]">Sin datos</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                      Consolidado de Asistencia ({attendanceData.length} estudiantes)
                    </h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportAttendanceCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportAttendancePDF}>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {attendanceData.length === 0 ? (
                    <div className="text-center py-12 text-[#94A3B8]">
                      <p>Selecciona los filtros para generar el reporte</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E2E8F0]">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Código
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Alumno
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              % Asistencia
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              N° Faltas
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              N° Tardanzas
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              N° Justificaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.map((student) => (
                            <tr
                              key={student.student_id}
                              className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]"
                            >
                              <td className="py-3 px-4 text-sm text-[#64748B]">
                                {student.student_code}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium text-[#0F172A]">
                                {student.student_name}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  variant={
                                    student.attendance_percentage >= 90
                                      ? 'success'
                                      : student.attendance_percentage >= 75
                                        ? 'warning'
                                        : 'error'
                                  }
                                >
                                  {student.attendance_percentage.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center text-sm text-[#EF4444]">
                                {student.total_absences}
                              </td>
                              <td className="py-3 px-4 text-center text-sm text-[#F59E0B]">
                                {student.total_tardies}
                              </td>
                              <td className="py-3 px-4 text-center text-sm text-[#10B981]">
                                {student.total_justifications}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 2: Evaluación */}
          {activeTab === 'evaluation' && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold text-[#0F172A]">
                      Distribución de Calificaciones
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#64748B]">
                          AD (Logro Destacado)
                        </span>
                        <Badge variant="success">{gradeDistribution.AD}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#64748B]">A (Logro Esperado)</span>
                        <Badge variant="info">{gradeDistribution.A}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#64748B]">B (En Proceso)</span>
                        <Badge variant="warning">{gradeDistribution.B}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#64748B]">C (En Inicio)</span>
                        <Badge variant="error">{gradeDistribution.C}%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#EF4444]">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#0F172A]">{studentsAtRisk}</span>
                      <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                    </div>
                    <p className="text-sm text-[#334155]">Estudiantes en Riesgo</p>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      (2 o más competencias en B/C)
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                      Consolidado de Evaluación ({evaluationData.length} estudiantes)
                    </h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportEvaluationCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportEvaluationPDF}>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {evaluationData.length === 0 ? (
                    <div className="text-center py-12 text-[#94A3B8]">
                      <p>Selecciona los filtros y un curso para generar el reporte</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E2E8F0]">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Código
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Alumno
                            </th>
                            {competenciesList.map((comp) => (
                              <th
                                key={comp.id}
                                className="text-center py-3 px-2 text-xs font-semibold text-[#0F172A]"
                              >
                                {comp.description.length > 20
                                  ? comp.description.substring(0, 20) + '...'
                                  : comp.description}
                              </th>
                            ))}
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Nota Final
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {evaluationData.map((student) => (
                            <tr
                              key={student.student_id}
                              className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]"
                            >
                              <td className="py-3 px-4 text-sm text-[#64748B]">
                                {student.student_code}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium text-[#0F172A]">
                                {student.student_name}
                              </td>
                              {competenciesList.map((comp) => (
                                <td key={comp.id} className="py-3 px-2 text-center">
                                  <Badge
                                    variant={
                                      student.competencies[comp.id] === 'AD'
                                        ? 'success'
                                        : student.competencies[comp.id] === 'A'
                                          ? 'info'
                                          : student.competencies[comp.id] === 'B'
                                            ? 'warning'
                                            : student.competencies[comp.id] === 'C'
                                              ? 'error'
                                              : 'secondary'
                                    }
                                  >
                                    {student.competencies[comp.id] || '-'}
                                  </Badge>
                                </td>
                              ))}
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  variant={
                                    student.final_grade === 'AD'
                                      ? 'success'
                                      : student.final_grade === 'A'
                                        ? 'info'
                                        : student.final_grade === 'B'
                                          ? 'warning'
                                          : student.final_grade === 'C'
                                            ? 'error'
                                            : 'secondary'
                                  }
                                >
                                  {student.final_grade}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 3: SIAGIE */}
          {activeTab === 'siagie' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#3B82F6]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                      Exportes para SIAGIE
                    </h3>
                  </div>
                  <p className="text-sm text-[#64748B] mt-1">
                    Genera archivos CSV compatibles con el sistema SIAGIE del MINEDU
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Exporte de Matrícula */}
                    <div className="border border-[#E2E8F0] rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#0F172A] mb-1">
                            Exporte de Matrícula
                          </h4>
                          <p className="text-sm text-[#64748B] mb-3">
                            Lista de estudiantes matriculados por grado y sección
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            Columnas: Código Modular IE, Código Estudiante, DNI, Apellidos y
                            Nombres, Grado, Sección
                          </p>
                        </div>
                        <Button onClick={exportSIAGIEMatricula}>
                          <Download className="w-4 h-4 mr-2" />
                          Generar CSV
                        </Button>
                      </div>
                    </div>

                    {/* Exporte de Asistencia */}
                    <div className="border border-[#E2E8F0] rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#0F172A] mb-1">
                            Exporte de Asistencia
                          </h4>
                          <p className="text-sm text-[#64748B] mb-3">
                            Consolidado de asistencia por periodo académico
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            Columnas: Código Estudiante, Periodo, N° Días Asistidos, N° Faltas,
                            N° Tardanzas
                          </p>
                        </div>
                        <Button onClick={exportSIAGIEAttendance}>
                          <Download className="w-4 h-4 mr-2" />
                          Generar CSV
                        </Button>
                      </div>
                    </div>

                    {/* Exporte de Evaluación */}
                    <div className="border border-[#E2E8F0] rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#0F172A] mb-1">
                            Exporte de Evaluación
                          </h4>
                          <p className="text-sm text-[#64748B] mb-3">
                            Calificaciones por competencia y curso
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            Columnas: Código Estudiante, Curso, Periodo, Competencia, Nota,
                            Estado
                          </p>
                        </div>
                        <Button onClick={exportSIAGIEEvaluation}>
                          <Download className="w-4 h-4 mr-2" />
                          Generar CSV
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Nota sobre exportes SIAGIE
                        </p>
                        <p className="text-xs text-blue-700">
                          Los archivos generados están en formato CSV con encoding UTF-8 BOM para
                          compatibilidad con Excel. Asegúrate de verificar el formato exacto
                          requerido por SIAGIE antes de subir los archivos al sistema del MINEDU.
                          El Código Modular IE está configurado como "220000" (placeholder) y debe
                          ser actualizado con el código real de tu institución.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
