import { useState, useEffect } from 'react';
import { FileText, Filter, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';

interface AcademicYear {
  id: string;
  year: number;
}

interface FinancialPlan {
  id: string;
  name: string;
  concept_id: string;
  number_of_installments: number;
  fee_concept: {
    id: string;
    name: string;
    type: string;
    base_amount: number;
  };
  plan_installments: Array<{
    installment_number: number;
    due_date: string;
    amount: number;
  }>;
}

interface GradeLevel {
  id: string;
  name: string;
}

interface Section {
  id: string;
  section_letter: string;
  grade_level_id: string;
  grade_level: {
    name: string;
  };
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  section_id: string;
  section: {
    section_letter: string;
    grade_level: {
      name: string;
    };
  };
}

interface StudentDiscount {
  student_id: string;
  discount: {
    id: string;
    name: string;
    type: 'porcentaje' | 'monto_fijo';
    value: number;
    scope: string;
    specific_concept_id: string | null;
  };
}

interface ChargePreview {
  student: Student;
  concept_name: string;
  concept_id: string;
  amount_original: number;
  discount_name?: string;
  discount_amount: number;
  amount_final: number;
  installment_number?: number;
  due_date: string;
}

export function ChargeEmissionPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    academic_year_id: '',
    plan_id: '',
    grade_id: '',
    section_id: '',
    installment_number: '',
    due_date: '',
  });

  const [preview, setPreview] = useState<ChargePreview[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filters.academic_year_id) {
      loadPlans(filters.academic_year_id);
    }
  }, [filters.academic_year_id]);

  useEffect(() => {
    if (filters.grade_id) {
      loadSections(filters.grade_id);
    } else {
      setSections([]);
    }
  }, [filters.grade_id]);

  async function loadInitialData() {
    try {
      setLoading(true);

      const [yearsRes, gradesRes] = await Promise.all([
        supabase
          .from('academic_years')
          .select('id, year')
          .order('year', { ascending: false }),
        supabase
          .from('grade_levels')
          .select('id, name')
          .order('level'),
      ]);

      if (yearsRes.error) throw yearsRes.error;
      if (gradesRes.error) throw gradesRes.error;

      setAcademicYears(yearsRes.data || []);
      setGrades(gradesRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function loadPlans(academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('financial_plans')
        .select(`
          id,
          name,
          concept_id,
          number_of_installments,
          fee_concept:fee_concepts(id, name, type, base_amount),
          plan_installments(installment_number, due_date, amount)
        `)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true);

      if (error) throw error;

      setPlans(data || []);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      setError('Error al cargar los planes');
    }
  }

  async function loadSections(gradeId: string) {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select(`
          id,
          section_letter,
          grade_level_id,
          grade_level:grade_levels(name)
        `)
        .eq('grade_level_id', gradeId)
        .eq('academic_year_id', filters.academic_year_id)
        .order('section_letter');

      if (error) throw error;

      setSections(data || []);
    } catch (error: any) {
      console.error('Error loading sections:', error);
      setError('Error al cargar las secciones');
    }
  }

  async function generatePreview() {
    setError('');
    setSuccess('');

    if (!filters.academic_year_id || !filters.plan_id) {
      setError('Debes seleccionar año académico y plan financiero');
      return;
    }

    const selectedPlan = plans.find((p) => p.id === filters.plan_id);
    if (!selectedPlan) {
      setError('Plan no encontrado');
      return;
    }

    if (!filters.installment_number) {
      setError('Debes seleccionar el número de cuota');
      return;
    }

    const installmentNum = parseInt(filters.installment_number);
    const installment = selectedPlan.plan_installments.find(
      (i) => i.installment_number === installmentNum
    );

    if (!installment) {
      setError('Cuota no encontrada en el plan');
      return;
    }

    try {
      setGenerating(true);

      // Query para obtener estudiantes
      let studentsQuery = supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          section_id,
          section:sections(
            section_letter,
            grade_level:grade_levels(name)
          )
        `)
        .eq('status', 'active');

      if (filters.section_id) {
        studentsQuery = studentsQuery.eq('section_id', filters.section_id);
      } else if (filters.grade_id) {
        studentsQuery = studentsQuery.in(
          'section_id',
          sections.map((s) => s.id)
        );
      }

      const { data: students, error: studentsError } = await studentsQuery;

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        setError('No se encontraron estudiantes con los filtros seleccionados');
        return;
      }

      // Obtener descuentos asignados a estos estudiantes
      const { data: studentDiscounts, error: discountsError } = await supabase
        .from('student_discounts')
        .select(`
          student_id,
          discount:discounts(
            id,
            name,
            type,
            value,
            scope,
            specific_concept_id
          )
        `)
        .in(
          'student_id',
          students.map((s) => s.id)
        )
        .eq('academic_year_id', filters.academic_year_id);

      if (discountsError) throw discountsError;

      // Verificar cargos existentes para evitar duplicados
      const { data: existingCharges, error: chargesError } = await supabase
        .from('charges')
        .select('student_id')
        .in(
          'student_id',
          students.map((s) => s.id)
        )
        .eq('concept_id', selectedPlan.concept_id)
        .eq('period_month', installmentNum)
        .eq('period_year', new Date().getFullYear());

      if (chargesError) throw chargesError;

      const existingChargeStudentIds = new Set(
        (existingCharges || []).map((c) => c.student_id)
      );

      // Generar preview
      const chargesPreview: ChargePreview[] = students
        .filter((student) => !existingChargeStudentIds.has(student.id))
        .map((student) => {
          const amountOriginal = installment.amount;
          let discountAmount = 0;
          let discountName = '';

          // Buscar descuento aplicable
          const studentDiscount = (studentDiscounts || []).find(
            (sd: StudentDiscount) => sd.student_id === student.id
          );

          if (studentDiscount) {
            const discount = studentDiscount.discount;
            const conceptType = selectedPlan.fee_concept.type;

            // Verificar si el descuento aplica a este concepto
            const applies =
              discount.scope === 'todos' ||
              discount.scope === conceptType ||
              (discount.scope === 'especifico' &&
                discount.specific_concept_id === selectedPlan.concept_id);

            if (applies) {
              discountName = discount.name;
              if (discount.type === 'porcentaje') {
                discountAmount = (amountOriginal * discount.value) / 100;
              } else {
                discountAmount = Math.min(discount.value, amountOriginal);
              }
            }
          }

          return {
            student,
            concept_name: selectedPlan.fee_concept.name,
            concept_id: selectedPlan.concept_id,
            amount_original: amountOriginal,
            discount_name: discountName,
            discount_amount: discountAmount,
            amount_final: amountOriginal - discountAmount,
            installment_number: installmentNum,
            due_date: filters.due_date || installment.due_date,
          };
        });

      if (chargesPreview.length === 0) {
        setError(
          'No hay estudiantes elegibles. Es posible que ya se hayan emitido estos cargos.'
        );
        return;
      }

      setPreview(chargesPreview);
      setSuccess(`Se generó preview para ${chargesPreview.length} estudiantes`);
    } catch (error: any) {
      console.error('Error generating preview:', error);
      setError(error.message || 'Error al generar el preview');
    } finally {
      setGenerating(false);
    }
  }

  async function emitCharges() {
    if (preview.length === 0) {
      setError('No hay cargos para emitir');
      return;
    }

    try {
      setEmitting(true);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const chargesToInsert = preview.map((charge) => ({
        student_id: charge.student.id,
        academic_year_id: filters.academic_year_id,
        concept_id: charge.concept_id,
        type: 'pension', // TODO: derivar del tipo de concepto
        description: `${charge.concept_name} - Cuota ${charge.installment_number}`,
        amount: charge.amount_original,
        discount: charge.discount_amount,
        final_amount: charge.amount_final,
        due_date: charge.due_date,
        status: 'pendiente',
        period_month: charge.installment_number,
        period_year: new Date().getFullYear(),
        created_by: userId,
      }));

      const { error: insertError } = await supabase
        .from('charges')
        .insert(chargesToInsert);

      if (insertError) throw insertError;

      const totalAmount = preview.reduce((sum, c) => sum + c.amount_final, 0);

      setSuccess(
        `✅ Se emitieron ${preview.length} cargos por un total de S/ ${totalAmount.toFixed(2)}`
      );
      setPreview([]);
      setConfirmModalOpen(false);

      // Reset filters
      setFilters({
        academic_year_id: filters.academic_year_id,
        plan_id: '',
        grade_id: '',
        section_id: '',
        installment_number: '',
        due_date: '',
      });
    } catch (error: any) {
      console.error('Error emitting charges:', error);
      setError(error.message || 'Error al emitir los cargos');
      setConfirmModalOpen(false);
    } finally {
      setEmitting(false);
    }
  }

  const selectedPlan = plans.find((p) => p.id === filters.plan_id);

  const totalOriginal = preview.reduce((sum, c) => sum + c.amount_original, 0);
  const totalDiscount = preview.reduce((sum, c) => sum + c.discount_amount, 0);
  const totalFinal = preview.reduce((sum, c) => sum + c.amount_final, 0);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Emisión Masiva de Cargos</h1>
          <p className="text-[#334155] mt-1">
            Emite cargos a múltiples estudiantes de forma masiva
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Filtros de Emisión</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Año Académico"
                value={filters.academic_year_id}
                onChange={(e) =>
                  setFilters({ ...filters, academic_year_id: e.target.value, plan_id: '' })
                }
                required
              >
                <option value="">Selecciona un año</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year}
                  </option>
                ))}
              </Select>

              <Select
                label="Plan Financiero"
                value={filters.plan_id}
                onChange={(e) => setFilters({ ...filters, plan_id: e.target.value })}
                required
                disabled={!filters.academic_year_id}
              >
                <option value="">Selecciona un plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.fee_concept.name}
                  </option>
                ))}
              </Select>
            </div>

            {selectedPlan && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Número de Cuota"
                  value={filters.installment_number}
                  onChange={(e) => {
                    const installmentNum = parseInt(e.target.value);
                    const installment = selectedPlan.plan_installments.find(
                      (i) => i.installment_number === installmentNum
                    );
                    setFilters({
                      ...filters,
                      installment_number: e.target.value,
                      due_date: installment?.due_date || '',
                    });
                  }}
                  required
                >
                  <option value="">Selecciona una cuota</option>
                  {selectedPlan.plan_installments.map((inst) => (
                    <option key={inst.installment_number} value={inst.installment_number}>
                      Cuota {inst.installment_number} - S/ {inst.amount.toFixed(2)} (
                      {new Date(inst.due_date + 'T00:00:00').toLocaleDateString('es-PE')})
                    </option>
                  ))}
                </Select>

                <Input
                  label="Fecha de Vencimiento"
                  type="date"
                  value={filters.due_date}
                  onChange={(e) => setFilters({ ...filters, due_date: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Grado (opcional)"
                value={filters.grade_id}
                onChange={(e) => setFilters({ ...filters, grade_id: e.target.value, section_id: '' })}
              >
                <option value="">Todos los grados</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Sección (opcional)"
                value={filters.section_id}
                onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
                disabled={!filters.grade_id}
              >
                <option value="">Todas las secciones</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.section_letter}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={generatePreview} disabled={generating || !filters.plan_id}>
                {generating ? 'Generando...' : 'Generar Preview'}
              </Button>
              {preview.length > 0 && (
                <Button onClick={() => setConfirmModalOpen(true)} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Emitir Cargos ({preview.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview de cargos */}
      {preview.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#0F172A]">
                Resumen de Emisión ({preview.length} cargos)
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#F8FAFC] p-4 rounded-lg">
                  <p className="text-sm text-[#64748B]">Monto Original Total</p>
                  <p className="text-2xl font-bold text-[#0F172A]">S/ {totalOriginal.toFixed(2)}</p>
                </div>
                <div className="bg-[#FEF3C7] p-4 rounded-lg">
                  <p className="text-sm text-[#92400E]">Descuentos Aplicados</p>
                  <p className="text-2xl font-bold text-[#92400E]">-S/ {totalDiscount.toFixed(2)}</p>
                </div>
                <div className="bg-[#DBEAFE] p-4 rounded-lg">
                  <p className="text-sm text-[#1E3A8A]">Monto Final Total</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">S/ {totalFinal.toFixed(2)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                        Alumno
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                        Grado/Sección
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                        Concepto
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                        Monto Original
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                        Descuento
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                        Monto Final
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((charge, idx) => (
                      <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#0F172A]">
                            {charge.student.first_name} {charge.student.last_name}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#64748B]">
                          {charge.student.section.grade_level.name} - {charge.student.section.section_letter}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#64748B]">{charge.concept_name}</td>
                        <td className="py-3 px-4 text-right font-medium text-[#0F172A]">
                          S/ {charge.amount_original.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          {charge.discount_amount > 0 ? (
                            <div>
                              <Badge variant="warning">{charge.discount_name}</Badge>
                              <p className="text-xs text-[#64748B] mt-1">
                                -S/ {charge.discount_amount.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-[#94A3B8]">Sin descuento</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#0F172A]">
                          S/ {charge.amount_final.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de confirmación */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirmar Emisión de Cargos"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#0F172A] mb-2">
                ¿Estás seguro de que deseas emitir {preview.length} cargos?
              </p>
              <div className="bg-[#F8FAFC] p-3 rounded-lg space-y-1 text-sm">
                <p>
                  <span className="text-[#64748B]">Monto Total:</span>{' '}
                  <span className="font-semibold text-[#0F172A]">S/ {totalFinal.toFixed(2)}</span>
                </p>
                <p>
                  <span className="text-[#64748B]">Descuentos:</span>{' '}
                  <span className="font-semibold text-[#F59E0B]">
                    -S/ {totalDiscount.toFixed(2)}
                  </span>
                </p>
                <p>
                  <span className="text-[#64748B]">Concepto:</span>{' '}
                  <span className="font-medium text-[#0F172A]">
                    {preview[0]?.concept_name} - Cuota {preview[0]?.installment_number}
                  </span>
                </p>
              </div>
              <p className="text-sm text-[#64748B] mt-3">
                Esta acción creará los cargos en el sistema con estado "Pendiente". Los apoderados
                podrán verlos en su portal.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              className="flex-1"
              disabled={emitting}
            >
              Cancelar
            </Button>
            <Button onClick={emitCharges} className="flex-1" disabled={emitting}>
              {emitting ? 'Emitiendo...' : 'Confirmar Emisión'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
