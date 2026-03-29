import { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { DayOfWeek } from '../../lib/database.types';

interface Section {
  id: string;
  section_letter: string;
  grade_level: {
    name: string;
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

interface Schedule {
  id: string;
  course_id: string;
  teacher_id: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number: string | null;
  course: Course;
  teacher: Teacher | null;
}

interface ScheduleForm {
  course_id: string;
  teacher_id: string;
  day_of_week: DayOfWeek | '';
  start_time: string;
  end_time: string;
  room_number: string;
  color?: string; // Drafted color change
  original_schedule_id?: string; // ID of the schedule being edited (if any)
}

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

const TIME_SLOTS = [
  '07:00', '07:45', '08:30', '09:15', '10:00', '10:45',
  '11:30', '12:15', '13:00', '13:45', '14:30', '15:15', '16:00'
];

export function AdminSchedulePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);

  const [formData, setFormData] = useState<ScheduleForm>({
    course_id: '',
    teacher_id: '',
    day_of_week: '',
    start_time: '07:00',
    end_time: '08:00',
    room_number: '',
  });

  // Draft System State
  const [drafts, setDrafts] = useState<Record<string, ScheduleForm>>({});
  // const [hasDraft, setHasDraft] = useState(false); // Removed per user request

  // --- PRINT SYSTEM LOGIC ---
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState<{
    mode: 'all' | 'select';
    selectedSectionIds: Set<string>;
    isPreparing: boolean;
    printData: Record<string, Schedule[]>; // sectionId -> schedules
    shouldPrint?: boolean;
  }>({
    mode: 'all',
    selectedSectionIds: new Set(),
    isPreparing: false,
    printData: {},
    shouldPrint: false
  });

  const handlePrintClick = () => {
    // Initialize with all sections selected by default? Or just open modal
    setPrintConfig(prev => ({ ...prev, selectedSectionIds: new Set(sections.map(s => s.id)) }));
    setShowPrintModal(true);
  };

  const toggleSectionPrint = (sectionId: string) => {
    setPrintConfig(prev => {
      const newSet = new Set(prev.selectedSectionIds);
      if (newSet.has(sectionId)) newSet.delete(sectionId);
      else newSet.add(sectionId);
      return { ...prev, selectedSectionIds: newSet };
    });
  };

  const handleSelectAllPrint = (checked: boolean) => {
    if (checked) {
      setPrintConfig(prev => ({ ...prev, selectedSectionIds: new Set(sections.map(s => s.id)) }));
    } else {
      setPrintConfig(prev => ({ ...prev, selectedSectionIds: new Set() }));
    }
  };

  // Altura total del calendario en píxeles (basado en duración)
  // De 7:00 (0 min) a 17:00 (600 min)
  const TOTAL_MINUTES = 600;
  const PIXELS_PER_MINUTE = 1.8;

  // Función auxiliar para convertir hora (HH:mm) a minutos desde las 7:00 AM
  function getMinutesFromStart(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours - 7) * 60 + minutes;
  }

  const executePrint = async () => {
    try {
      setPrintConfig(prev => ({ ...prev, isPreparing: true }));

      // 1. Fetch ALL schedules for the active year
      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeYear) throw new Error('No hay año activo');

      // Fetch all schedules joined with course info
      const { data: allSchedules, error } = await supabase
        .from('course_schedules')
        .select(`
          id,
          course_id,
          teacher_id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          section_id,
          course:courses(id, code, name, color),
          teacher:teachers(id, first_name, last_name)
        `)
        .eq('academic_year_id', activeYear.id);

      if (error) throw error;

      // 2. Group by Section ID
      const groupedData: Record<string, Schedule[]> = {};
      allSchedules?.forEach((s: any) => {
        if (!groupedData[s.section_id]) groupedData[s.section_id] = [];
        groupedData[s.section_id].push(s);
      });

      // Update state with data. The useEffect below will trigger the actual print
      // once the component re-renders with this data.
      setPrintConfig(prev => ({ ...prev, printData: groupedData, isPreparing: false, shouldPrint: true }));

    } catch (err) {
      console.error('Error preparing print:', err);
      // Show explicit error to user if print fails
      alert('Error al preparar impresión: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      setError('Error al preparar impresión');
      setPrintConfig(prev => ({ ...prev, isPreparing: false, shouldPrint: false }));
    }
  };

  // Effect to trigger print only when data is ready and rendered
  useEffect(() => {
    // Check if we should print and preparation is done. 
    // We REMOVED the check for data length to allow printing empty schedule templates.
    if (printConfig.shouldPrint && !printConfig.isPreparing) {
      console.log('Starting print sequence...');

      // Small delay to ensure DOM paint (increased to 800ms to avoid whitespace)
      const timer = setTimeout(() => {
        console.log('Executing window.print()');
        window.print();
        // Reset trigger AFTER print command
        setPrintConfig(prev => ({ ...prev, shouldPrint: false }));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [printConfig.shouldPrint, printConfig.isPreparing]);

  // --- PRINT RENDERER (Hidden on screen, visible on print) ---
  const renderPrintLayout = () => {
    if (!printConfig.printData) return null;

    // Filter sections to print based on selection (We rely on selectedSectionIds since it's initialized with all)
    const sectionsToPrint = sections.filter(s =>
      printConfig.selectedSectionIds.has(s.id)
    );

    return (
      <div
        id="print-area"
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '297mm' }}
        className="bg-white text-black"
      >
        {/* OFF-SCREEN RENDER STRATEGY: Always render but hide off-screen to ensure hydration/painting */}
        <style>{`
            @media print {
              @page { size: landscape; margin: 5mm; }
              body * {
                visibility: hidden;
              }
              #print-area, #print-area * {
                visibility: visible;
              }
              #print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
                z-index: 9999 !important;
                background-color: white !important;
              }
              .no-print { display: none !important; }
              /* Force background colors */
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .print-page-item {
                break-inside: avoid;
                page-break-inside: avoid;
                page-break-after: always;
                height: 190mm;
                max-height: 190mm;
                overflow: hidden;
                margin-bottom: 0;
              }
              .print-page-item:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-bottom: 0 !important;
              }
              /* Hide everything else just in case */
              .print-page-item:last-of-type {
                page-break-after: auto !important;
              }
            }
         `}</style>

        {
          sectionsToPrint.map((section, idx) => {
            const sectionSchedules = printConfig.printData[section.id] || [];

            return (
              <div
                key={section.id}
                className="w-full relative flex flex-col print-page-item"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b-2 border-slate-800 pb-2">
                  <div className="flex items-center gap-3">
                    {/* Logo Placeholder - Using Text if Image not available */}
                    <div className="font-bold text-2xl text-[#0E3A8A]">COLEGIO CERMAT</div>
                  </div>
                  <div className="text-xl font-bold uppercase tracking-wider">
                    HORARIO DE {section.grade_level.name} - "{section.section_letter}"
                  </div>
                </div>

                {/* Grid */}
                <div className="flex-1 border border-slate-300 rounded-lg relative overflow-hidden">
                  {/* Grid Header */}
                  <div className="grid grid-cols-[60px_repeat(6,1fr)] bg-slate-100 border-b border-slate-300 font-bold text-center text-xs">
                    <div className="p-2 border-r border-slate-300">HORA</div>
                    {DAYS.map((day, i) => (
                      <div key={day.value} className={`p-2 border-r border-slate-300 ${i === DAYS.length - 1 ? 'border-r-0' : ''}`}>
                        {day.label.toUpperCase()}
                      </div>
                    ))}
                  </div>

                  {/* Grid Body */}
                  <div className="relative h-full bg-white">
                    {/* Vertical Lines */}
                    <div className="absolute inset-0 grid grid-cols-[60px_repeat(6,1fr)] pointer-events-none">
                      <div className="border-r border-slate-200"></div>
                      {DAYS.map((_, i) => (
                        <div key={i} className={`border-r border-slate-200 ${i === DAYS.length - 1 ? 'border-r-0' : ''}`} />
                      ))}
                    </div>

                    {/* Time Slots (Horizontal Lines) */}
                    {TIME_SLOTS.map((time, i) => {
                      const mins = getMinutesFromStart(time);
                      return (
                        <div key={time} className="absolute w-full border-t border-slate-100 flex items-center" style={{ top: `${mins * PIXELS_PER_MINUTE}px` }}>
                          <div className="w-[60px] text-[10px] text-slate-500 font-medium text-right pr-2 -mt-2 bg-white/80 z-10">{time}</div>
                        </div>
                      );
                    })}

                    {/* Blocks */}
                    {sectionSchedules.map((schedule: any) => {
                      const startMin = getMinutesFromStart(schedule.start_time);
                      const duration = getMinutesFromStart(schedule.end_time) - startMin;
                      const dayIndex = DAYS.findIndex(d => d.value === schedule.day_of_week);
                      if (dayIndex === -1) return null;

                      // Calculate horizontal position: 60px offset + (100% - 60px)/6 * index

                      const leftPercent = `calc(60px + ((100% - 60px) / 6 * ${dayIndex}))`;
                      const widthPercent = `calc((100% - 60px) / 6)`;

                      return (
                        <div
                          key={schedule.id}
                          className="absolute rounded p-1 border border-black/10 overflow-hidden flex flex-col justify-center text-center shadow-sm"
                          style={{
                            top: `${startMin * PIXELS_PER_MINUTE}px`,
                            height: `${duration * PIXELS_PER_MINUTE}px`,
                            left: leftPercent,
                            width: widthPercent,
                            backgroundColor: schedule.course.color,
                            color: 'white' // Assuming dark colors mostly
                          }}
                        >
                          <div className="font-bold text-[10px] leading-tight uppercase">{schedule.course.name}</div>
                          <div className="text-[9px] opacity-90 mt-0.5">{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</div>
                          {schedule.teacher && (
                            <div className="text-[8px] italic mt-0.5 opacity-80">{schedule.teacher.first_name} {schedule.teacher.last_name}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer / Branding */}
                <div className="mt-2 text-[10px] text-slate-400 text-center flex justify-between">
                  <span>Generado el {new Date().toLocaleDateString()}</span>
                  <span>Sistema de Gestión Académica - Cermat</span>
                </div>
              </div>
            );
          })
        }
      </div >
    );
  };

  // Load drafts on mount
  // Removed persisted drafts loading on mount at user request
  // useEffect(() => { ... }, []);

  // Save drafts when formData changes
  // Save drafts when formData changes (In-Memory Only)
  useEffect(() => {
    if (showModal && formData.course_id) {
      setDrafts(prev => {
        // Optimization: Only update if changed
        const currentHash = JSON.stringify(prev[formData.course_id]);
        const newHash = JSON.stringify(formData);
        if (currentHash === newHash) return prev;

        const next = { ...prev, [formData.course_id]: formData };
        // localStorage.setItem('schedule_drafts', JSON.stringify(next)); // Disabled persistence
        return next;
      });
    }
  }, [formData, showModal]);

  const handleCourseChange = (newCourseId: string) => {
    // 1. Save CURRENT form state to drafts before switching (if valid course selected)
    if (formData.course_id) {
      setDrafts(prev => ({
        ...prev,
        [formData.course_id]: formData
      }));
    }

    if (!newCourseId) {
      setFormData({ ...formData, course_id: '' });
      return;
    }

    // 2. Load Draft or New State for target course
    if (drafts[newCourseId]) {
      // Load draft
      const draft = drafts[newCourseId];
      setFormData(draft);

      if (draft.original_schedule_id) {
        const existingMatch = schedules.find(s => s.id === draft.original_schedule_id);
        setEditingSchedule(existingMatch || null);
      } else if (draft.day_of_week && draft.start_time) {
        const match = schedules.find(s =>
          s.course_id === newCourseId &&
          s.day_of_week === draft.day_of_week &&
          s.start_time === draft.start_time
        );
        setEditingSchedule(match || null);
      } else {
        setEditingSchedule(null);
      }
    } else {
      // No draft, starting fresh for this course
      const existingMatch = schedules.find(s =>
        s.course_id === newCourseId &&
        s.day_of_week === formData.day_of_week &&
        s.start_time === formData.start_time
      );

      setFormData({
        ...formData,
        course_id: newCourseId,
        original_schedule_id: existingMatch?.id // Capture ID if we found a match
      });
      setEditingSchedule(existingMatch || null);
    }
  };

  // Removed restoreDraft and clearDraft functions logic


  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      loadSchedules();
    }
  }, [selectedSection]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeYear) {
        setError('No hay año académico activo');
        return;
      }

      const [sectionsRes, coursesRes, teachersRes] = await Promise.all([
        supabase
          .from('sections')
          .select(`id, section_letter, grade_level:grade_levels(name)`)
          .eq('academic_year_id', activeYear.id)
          .order('grade_level_id'),
        supabase
          .from('courses')
          .select('id, code, name, color')
          .order('name'),
        supabase
          .from('teachers')
          .select('id, first_name, last_name')
          .eq('status', 'active')
          .order('last_name'),
      ]);

      if (sectionsRes.data) setSections(sectionsRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (teachersRes.data) setTeachers(teachersRes.data);

      if (sectionsRes.data && sectionsRes.data.length > 0) {
        setSelectedSection((sectionsRes.data[0] as any).id);
      }
    } catch (err: any) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedules() {
    try {
      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeYear) return;

      const { data, error: scheduleError } = await supabase
        .from('course_schedules')
        .select(`
          id,
          course_id,
          teacher_id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          course:courses(id, code, name, color),
          teacher:teachers(id, first_name, last_name)
        `)
        .eq('section_id', selectedSection)
        .eq('academic_year_id', activeYear.id)
        .order('day_of_week')
        .order('start_time');

      if (scheduleError) throw scheduleError;
      setSchedules(data || []);
    } catch (err: any) {
      console.error('Error loading schedules:', err);
    }
  }

  // Real-time validation effect
  useEffect(() => {
    if (formData.day_of_week && formData.start_time && formData.end_time) {
      const timer = setTimeout(() => {
        validateOverlap();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setFormError('');
    }
  }, [formData.day_of_week, formData.start_time, formData.end_time, selectedSection, editingSchedule]); // added deps

  async function validateOverlap() {
    // 1. Basic validations
    if (formData.end_time <= formData.start_time) {
      setFormError('La hora de fin debe ser mayor que la hora de inicio');
      return false;
    }

    // 2. Client-Side Batch Validation against FUTURE state
    // We construct the grid as it WOULD look if we saved everything
    try {
      setIsCheckingOverlap(true);

      // A. Identify all IDs being modified (from drafts + current edit)
      const modifiedIds = new Set<string>();
      Object.values(drafts).forEach(d => {
        if (d.original_schedule_id) modifiedIds.add(d.original_schedule_id);
      });
      if (editingSchedule) modifiedIds.add(editingSchedule.id);

      // B. Start with DB schedules, remove modified ones
      const futureSchedules: any[] = schedules.filter(s => !modifiedIds.has(s.id));

      // C. Add all drafts as "Virtual Schedules"
      Object.values(drafts).forEach(d => {
        if (d.course_id === formData.course_id) return; // Skip current form (added below)
        if (d.day_of_week && d.start_time && d.end_time) {
          futureSchedules.push({ ...d, id: 'draft-check' }); // Dummy ID
        }
      });

      // D. Add CURRENT form data
      futureSchedules.push({ ...formData, id: 'current-check' });

      // E. Check for collisions in this Future List
      // We only need to check if 'current-check' collides with others? 
      // OR if any draft collides with any other?
      // Since we assume previous drafts were valid when created, we mostly check the CURRENT one against others.
      // BUT, let's do a rigorous check for the CURRENT item against the rest.

      const currentStart = getMinutesFromStart(formData.start_time);
      const currentEnd = getMinutesFromStart(formData.end_time);

      const collision = futureSchedules.find(s => {
        if (s.id === 'current-check') return false; // Don't check self
        if (s.day_of_week !== formData.day_of_week) return false;

        const sStart = getMinutesFromStart(s.start_time);
        const sEnd = getMinutesFromStart(s.end_time);

        // Overlap: (StartA < EndB) && (StartB < EndA)
        return (currentStart < sEnd && sStart < currentEnd);
      });

      if (collision) {
        setFormError('Conflicto detectado (en borrador o existente): Horario ocupado.');
        return false;
      }

      setFormError('');
      return true;

    } catch (err) {
      console.error('Validation error:', err);
      return false;
    } finally {
      setIsCheckingOverlap(false);
    }
  }

  async function handleSave() {
    setFormError('');

    if (!formData.course_id || !formData.day_of_week || !formData.start_time || !formData.end_time) {
      setFormError('Todos los campos son obligatorios excepto el aula');
      return;
    }

    // Validate against the batch
    const isValid = await validateOverlap();
    if (!isValid) return;

    try {
      setSaving(true);
      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();
      if (!activeYear) throw new Error('No hay año académico activo');

      // PREPARE BATCH
      // Combine existing drafts with current form data
      const allDrafts = { ...drafts, [formData.course_id]: formData };
      const promises = [];

      for (const finalForm of Object.values(allDrafts)) {
        // Construct payload
        const scheduleData = {
          academic_year_id: activeYear.id,
          section_id: selectedSection,
          course_id: finalForm.course_id,
          teacher_id: finalForm.teacher_id || null,
          day_of_week: finalForm.day_of_week as DayOfWeek,
          start_time: finalForm.start_time,
          end_time: finalForm.end_time,
          room_number: finalForm.room_number || null,
        };

        // 1. Update Color if changed
        if (finalForm.color) {
          promises.push(
            supabase.from('courses').update({ color: finalForm.color } as any).eq('id', finalForm.course_id)
          );
        }

        // 2. Upsert Schedule
        // If it has an original_schedule_id, use it to UPDATE. Else INSERT.
        if (finalForm.original_schedule_id) {
          promises.push(
            supabase.from('course_schedules').update(scheduleData as any).eq('id', finalForm.original_schedule_id)
          );
        } else {
          promises.push(
            supabase.from('course_schedules').insert(scheduleData as any)
          );
        }
      }

      // Execute all
      await Promise.all(promises);

      setSuccess('Todos los cambios se han guardado correctamente');

      // Cleanup
      setDrafts({});
      setShowModal(false);
      setEditingSchedule(null);
      resetForm();
      loadSchedules();

    } catch (err: any) {
      setFormError(err.message || 'Error al guardar lote');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este bloque horario?')) return;

    try {
      const { error } = await supabase
        .from('course_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Horario eliminado correctamente');
      loadSchedules();
    } catch (err: any) {
      setError('Error al eliminar horario');
    }
  }

  function openEditModal(schedule: Schedule) {
    setFormError(''); // Limpiar errores al abrir
    setEditingSchedule(schedule);
    setFormData({
      course_id: schedule.course_id,
      teacher_id: schedule.teacher_id || '',
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.substring(0, 5),
      end_time: schedule.end_time.substring(0, 5),
      room_number: schedule.room_number || '',
      color: schedule.course.color, // Pre-fill color
      original_schedule_id: schedule.id // Store ID to track this specific block
    });
    setShowModal(true);
  }

  function openAddModal() {
    setEditingSchedule(null);
    setFormError('');
    setFormData({
      course_id: '',
      teacher_id: '',
      day_of_week: 1 as DayOfWeek, // Default to Monday (1)
      start_time: '07:00',
      end_time: '08:00',
      room_number: '',
      original_schedule_id: undefined
    });
    setSuccess('');
    setError('');
    setShowModal(true);
  }

  function resetForm() {
    setFormError(''); // Limpiar errores al resetear
    setFormData({
      course_id: '',
      teacher_id: '',
      day_of_week: 1 as DayOfWeek,
      start_time: '07:00',
      end_time: '08:00',
      room_number: '',
      original_schedule_id: undefined
    });
  }

  // Función auxiliar para convertir hora (HH:mm) a minutos desde las 7:00 AM
  // (Moved to top level)

  // Helper to generate 15-minute intervals
  const TIME_OPTIONS = useMemo(() => {
    const times = [];
    let h = 7;
    let m = 0;
    while (h < 18) {
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      times.push(timeStr);
      m += 15;
      if (m === 60) {
        m = 0;
        h++;
      }
    }
    // Add 18:00 as the last possible end time
    times.push('18:00');
    return times;
  }, []);

  // Helper to check if a specific time is within an occupied range for the selected day
  const isTimeBlocked = (time: string, type: 'start' | 'end') => {
    if (!formData.day_of_week) return false;

    // 1. Identify which Original DB Schedules should be IGNORED because they are being moved (in drafts or active edit)
    const ignoredScheduleIds = new Set<string>();

    // Add IDs from all drafts
    Object.values(drafts).forEach(d => {
      if (d.original_schedule_id) ignoredScheduleIds.add(d.original_schedule_id);
    });

    // Add ID of currently editing schedule
    if (editingSchedule) {
      ignoredScheduleIds.add(editingSchedule.id);
    }

    // 2. Build the "Effective" Schedule List (Hypothetical State)
    // Start with DB schedules, minus the ones being moved
    let effectiveSchedules: any[] = schedules.filter(s => !ignoredScheduleIds.has(s.id));

    // Add the new positions from Drafts (as "virtual" schedules)
    Object.entries(drafts).forEach(([courseId, draftForm]) => {
      // Don't add the draft for the course we are CURRENTLY editing in the form (avoids self-collision)
      if (courseId === formData.course_id) return;

      if (draftForm.day_of_week && draftForm.start_time && draftForm.end_time) {
        effectiveSchedules.push({
          id: `draft-${courseId}`, // Virtual ID
          start_time: draftForm.start_time,
          end_time: draftForm.end_time,
          day_of_week: draftForm.day_of_week
        });
      }
    });

    // 3. Perform collision check against this Hypothetical State
    // Filter for the specific day we are looking at
    const daySchedules = effectiveSchedules.filter(s => s.day_of_week === formData.day_of_week);
    const timeMin = getMinutesFromStart(time);

    return daySchedules.some(s => {
      const sStart = getMinutesFromStart(s.start_time);
      const sEnd = getMinutesFromStart(s.end_time);

      // For Start Time: Block if strictly inside an existing interval OR matches start of an existing interval
      if (type === 'start') {
        return timeMin >= sStart && timeMin < sEnd;
      }

      // For End Time: Block if strictly inside an existing interval OR matches end of an existing interval
      if (type === 'end') {
        return timeMin > sStart && timeMin <= sEnd;
      }

      return false;
    });
  };

  // Altura total del calendario en píxeles (basado en duración)
  // (Moved to top level)

  // Updated renderScheduleGrid to support Preview
  function renderScheduleGrid(isParamsPreview = false) {
    // 1. Filter out schedules that are being modified in ANY draft (Ghosting fix)
    // If a schedule ID exists in any draft's 'original_schedule_id', it means it's being moved/edited.
    const modifiedScheduleIds = new Set<string>();
    Object.values(drafts).forEach(d => {
      if (d.original_schedule_id) modifiedScheduleIds.add(d.original_schedule_id);
    });

    // Also add the one currently being edited in the form, if linked
    if (editingSchedule) {
      modifiedScheduleIds.add(editingSchedule.id);
    }

    // Original DB schedules, MINUS the ones being edited
    let displaySchedules = schedules.filter(s => !modifiedScheduleIds.has(s.id));

    // 2. Add "Ghost" blocks for ALL drafts (including the one in form if not strictly previewing yet)
    // We iterate over all drafts to show them as "Pending" details
    Object.entries(drafts).forEach(([courseId, draftForm]) => {
      // If this draft is the one actively being edited in the form, skip here (handled by active preview below)
      // UNLESS we want to show the draft state when the form momentarily doesn't have valid time? 
      // Simplified: If it's the active course, let active preview handle it.
      if (courseId === formData.course_id) return;

      if (draftForm.day_of_week && draftForm.start_time && draftForm.end_time) {
        const course = courses.find(c => c.id === courseId);
        const ghostBlock: any = {
          id: `draft-${courseId}`,
          course_id: courseId,
          teacher_id: draftForm.teacher_id || null,
          day_of_week: draftForm.day_of_week,
          start_time: draftForm.start_time,
          end_time: draftForm.end_time,
          room_number: draftForm.room_number,
          course: {
            ...(course || { name: '...', code: '...' }),
            color: draftForm.color || course?.color || '#94a3b8'
          },
          teacher: null,
          isPreview: true,
          isGhost: true // Style distinctively as "Pending"
        };
        displaySchedules.push(ghostBlock);
      }
    });

    // 3. Construct active preview block from current form state
    if (isParamsPreview && formData.course_id && formData.day_of_week && formData.start_time && formData.end_time) {
      const course = courses.find(c => c.id === formData.course_id);
      const previewBlock: any = {
        id: 'preview-temp-id',
        course_id: formData.course_id,
        teacher_id: formData.teacher_id || null, // Optional
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room_number: formData.room_number,
        course: {
          ...(course || { name: 'Agregando...', color: '#94a3b8' }),
          color: formData.color || course?.color || '#94a3b8'
        },
        teacher: null,
        isPreview: true,
        isGhost: false // Active focus
      };
      displaySchedules.push(previewBlock);
    }

    return (
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm h-full">
        <div className="min-w-[700px] relative bg-white" style={{ height: `${TOTAL_MINUTES * PIXELS_PER_MINUTE}px` }}>

          {/* Grid Background */}
          <div className="absolute inset-0 grid grid-cols-[60px_repeat(6,1fr)]">
            <div className="bg-slate-50 border-r border-slate-200"></div>
            {DAYS.map((day, index) => (
              <div key={day.value} className={`border-r border-slate-100 ${index === DAYS.length - 1 ? 'border-r-0' : ''}`} />
            ))}
          </div>

          {/* Time Labels */}
          {TIME_SLOTS.map((time) => {
            const minutes = getMinutesFromStart(time);
            return (
              <div key={time} className="absolute w-full flex items-center group pointer-events-none" style={{ top: `${minutes * PIXELS_PER_MINUTE}px` }}>
                <div className="w-[60px] text-xs text-slate-400 font-medium text-right pr-2 -mt-2">{time}</div>
                <div className="flex-1 border-t border-slate-100 group-hover:border-blue-100 transition-colors" />
              </div>
            );
          })}

          {/* Header (Days) */}
          <div className="sticky top-0 z-20 grid grid-cols-[60px_repeat(6,1fr)] bg-[#0E3A8A] text-white shadow-md">
            <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center bg-[#0B2C67]">Hora</div>
            {DAYS.map(day => (
              <div key={day.value} className="p-2 text-xs font-semibold text-center border-l border-white/10">{day.label}</div>
            ))}
          </div>

          {/* Schedule Blocks */}
          <div className="absolute inset-x-0 w-full grid grid-cols-[60px_repeat(6,1fr)] pointer-events-none">
            <div></div>
            {DAYS.map(day => {
              const daySchedules = displaySchedules.filter(s => s.day_of_week === day.value);
              return (
                <div key={day.value} className="relative h-full pointer-events-auto">
                  {daySchedules.map((schedule: any) => {
                    const startMin = getMinutesFromStart(schedule.start_time);
                    const endMin = getMinutesFromStart(schedule.end_time);
                    const durationBtn = endMin - startMin;
                    const isPreview = schedule.isPreview;
                    // Only show conflict for the ACTIVE preview (not ghosts)
                    const hasConflict = isPreview && !schedule.isGhost && formError;

                    // Style logic for Preview vs Normal
                    const baseClasses = "absolute inset-x-1 rounded-md p-1.5 text-xs text-white shadow-sm overflow-hidden transition-all group";
                    const normalClasses = "hover:shadow-md hover:ring-2 hover:ring-white/50 cursor-pointer z-10";
                    // Conflicted Preview: Top Z-index, Red Striped or Solid Red, Opaque
                    const conflictClasses = "z-50 ring-2 ring-red-500 bg-red-50 text-red-700 font-bold border-2 border-red-500 opacity-100";
                    // Normal Preview: Top Z-index, Pulse, Opaque (No transparency to avoid criss-cross)
                    const previewClasses = "z-50 ring-2 ring-blue-500 ring-offset-1 opacity-100 animate-pulse";

                    // Dynamic Style
                    let finalClasses = baseClasses + " ";
                    let bgStyle = { top: `${startMin * PIXELS_PER_MINUTE}px`, height: `${durationBtn * PIXELS_PER_MINUTE}px`, backgroundColor: schedule.course.color };

                    if (isPreview) {
                      if (hasConflict) {
                        finalClasses += conflictClasses;
                        // Override color for conflict
                        bgStyle.backgroundColor = '#FEF2F2'; // red-50
                        // Maybe add a striped background image via style if desired, or just solid red-50
                      } else {
                        finalClasses += previewClasses;
                      }
                    } else {
                      finalClasses += normalClasses;
                    }

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => {
                          if (!isPreview) {
                            openEditModal(schedule);
                          } else if (schedule.isGhost) {
                            // Allow switching to this draft by clicking the ghost block
                            handleCourseChange(schedule.course_id);
                          }
                        }}
                        className={finalClasses}
                        style={bgStyle}
                      >
                        <div className="font-bold truncate leading-tight">
                          {hasConflict ? '⚠️ CONFLICTO' : schedule.course.name}
                        </div>
                        {durationBtn > 30 && (
                          <div className={`text-[10px] truncate mt-0.5 ${hasConflict ? 'text-red-600' : 'opacity-90'}`}>
                            {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                          </div>
                        )}
                        {!isPreview && (
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-1 bg-black/20 rounded p-0.5 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(schedule); }}
                              className="p-1 hover:bg-white/20 rounded text-white transition-colors"
                              title="Editar bloque"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('¿Estás seguro de quitar este bloque del horario?')) {
                                  handleDelete(schedule.id);
                                }
                              }}
                              className="p-1 hover:bg-red-500/80 rounded text-white transition-colors"
                              title="Quitar bloque"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- CANCELLATION & RESTORE LOGIC ---

  // Safety check for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(drafts).length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires this
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [drafts]);

  // Cancel current edit: Discard ALL drafts (Session Revert)
  const handleCancel = () => {
    // We assume 'Cancel' means 'Discard all unsaved changes in this session'
    setDrafts({});
    setShowModal(false);
    setEditingSchedule(null);
    resetForm();
  };

  // Global Restore: Discard ALL drafts
  const handleGlobalRestore = () => {
    if (confirm('¿Estás seguro de restablecer TODO el horario? Se perderán todos los cambios no guardados.')) {
      setDrafts({});
      setEditingSchedule(null);
      resetForm();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6" id="schedule-page">
      <style>
        {`
          @media print {
            /* HIDE EVERYTHING by default using display: none, capturing layout space */
            .no-print {
              display: none !important;
            }

            /* Ensure Print Area is visible and reset styles */
            #print-area {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              background-color: white !important;
              z-index: 9999 !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Reset Body/Root to allow full print access */
            body, html, #root {
              width: 100%;
              height: 100%;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Force background colors */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-page-item {
                break-inside: avoid;
                page-break-inside: avoid;
                page-break-after: always;
                height: 190mm;
                max-height: 190mm;
                overflow: hidden;
                margin-bottom: 0;
            }
            .print-page-item:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-bottom: 0 !important;
            }
          }
        `}
      </style>

      {/* --- RENDER HIDDEN PRINT AREA --- */}
      {renderPrintLayout()}

      {/* --- MAIN PAGE CONTENT (Hidden during print) --- */}
      <div className="space-y-6 no-print">

        {/* --- PRINT CONFIG MODAL --- */}
        <Modal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="Configuración de Impresión"
          size="2xl"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded border">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={printConfig.selectedSectionIds.size === sections.length}
                  onChange={(e) => handleSelectAllPrint(e.target.checked)}
                />
                Seleccionar Todo ({sections.length} secciones)
              </label>
              <div className="text-sm text-slate-500">
                {printConfig.selectedSectionIds.size} seleccionados
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded">
              {sections.map(section => (
                <label key={section.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={printConfig.selectedSectionIds.has(section.id)}
                    onChange={() => toggleSectionPrint(section.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    <span className="font-semibold">{section.grade_level.name}</span> - {section.section_letter}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPrintModal(false)}>Cancelar</Button>
              <Button
                onClick={executePrint}
                disabled={printConfig.selectedSectionIds.size === 0 || printConfig.isPreparing}
                className="min-w-[150px]"
                icon={printConfig.isPreparing ? undefined : <Printer className="w-4 h-4" />}
              >
                {printConfig.isPreparing ? 'Preparando...' : 'Imprimir / Vista Previa'}
              </Button>
            </div>
          </div>
        </Modal>

        <div className="flex items-center justify-between">
          <div>
            <GoBackButton />
            <h1 className="text-3xl font-bold text-[#0E3A8A] mt-2">Gestión de Horarios</h1>
            <p className="text-slate-600">Administra los horarios de clases por sección</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrintClick}
              icon={<Printer className="w-5 h-5" />}
            >
              Imprimir
            </Button>
            <Button
              onClick={openAddModal}
              icon={<Plus className="w-5 h-5" />}
            >
              Agregar Bloque
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-r-lg">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        <Card className="id-schedule-content">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-[#0E3A8A]" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#0E3A8A]">Horario Semanal</h2>
              </div>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-64"
              >
                <option value="">Seleccionar sección</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.grade_level.name} - Sección {section.section_letter}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedSection ? (
              <>
                {/* Header for Print only */}
                <div className="hidden print:block mb-6 text-center">
                  <h1 className="text-2xl font-bold text-[#0E3A8A]">Horario de Clases</h1>
                  <p className="text-lg text-slate-600 mt-1">
                    {sections.find(s => s.id === selectedSection)?.grade_level.name} -
                    Sección "{sections.find(s => s.id === selectedSection)?.section_letter}"
                  </p>
                </div>
                {renderScheduleGrid()}
              </>
            ) : (
              <p className="text-center text-slate-500 py-8">Selecciona una sección para ver el horario</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingSchedule ? 'Editar Bloque Horario' : 'Agregar Bloque Horario'}
        size="2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">

          {/* Left Column: Form */}
          <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2">

            {/* Draft Restore Alert */}
            {/* Draft Restore Alert REMOVED */}

            {/* Form Error Alert - Styled */}
            {formError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-medium animate-shake shadow-sm flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <span>{formError}</span>
              </div>
            )}

            <Select
              label="Curso"
              value={formData.course_id}
              onChange={(e) => handleCourseChange(e.target.value)}
              required
            >
              <option value="">Seleccionar curso</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </Select>

            {/* Quick Course Color Editor */}
            {formData.course_id && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Color del Curso (Global - Borrador)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4',
                    '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#64748B'
                  ].map((color) => {
                    // Find current course color from DRAFT or DB
                    const dbColor = courses.find(c => c.id === formData.course_id)?.color;
                    const isSelected = (formData.color || dbColor) === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`
                            w-6 h-6 rounded-full transition-all flex items-center justify-center
                            ${isSelected ? 'ring-2 ring-offset-1 ring-slate-900 scale-110 shadow-sm' : 'hover:scale-110'}
                          `}
                        style={{ backgroundColor: color }}
                        title="Seleccionar color para este curso"
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Select
              label="Docente"
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
            >
              <option value="">Sin docente asignado</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </option>
              ))}
            </Select>

            <Select
              label="Día de la semana"
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) as DayOfWeek })}
              required
            >
              <option value="">Seleccionar día</option>
              {DAYS.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Hora de inicio"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              >
                <option value="">Inicio</option>
                {TIME_OPTIONS.map((time: string) => {
                  const disabled = isTimeBlocked(time, 'start');
                  return (
                    <option
                      key={`start-${time}`}
                      value={time}
                      disabled={disabled}
                      className={disabled ? "text-slate-300 bg-slate-50 italic" : "text-slate-900 font-medium"}
                    >
                      {time} {disabled ? '(Ocupado)' : ''}
                    </option>
                  );
                })}
              </Select>

              <Select
                label="Hora de fin"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              >
                <option value="">Fin</option>
                {TIME_OPTIONS.map((time: string) => {
                  const disabled = isTimeBlocked(time, 'end');
                  // Should also block times <= start_time logically, but strictly strictly requested feature is "occupied"
                  const isInvalid = disabled || (formData.start_time && time <= formData.start_time);

                  return (
                    <option
                      key={`end-${time}`}
                      value={time}
                      disabled={!!isInvalid}
                      className={isInvalid ? "text-slate-300 bg-slate-50 italic" : "text-slate-900 font-medium"}
                    >
                      {time} {disabled ? '(Ocupado)' : ''}
                    </option>
                  );
                })}
              </Select>
            </div>

            <Input
              label="Número de aula (opcional)"
              placeholder="Ej: A-101, Lab-02"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            />

            <div className="flex gap-3 pt-4 mt-auto">
              <Button
                onClick={handleSave}
                disabled={saving || !!formError} // Disable if error exists
                icon={<Save className="w-5 h-5" />}
                fullWidth
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
          </div>

          {/* Right Column: Preview Grid */}
          <div className="lg:col-span-8 border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-slate-50 h-full">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
              <span>Vista Previa del Horario</span>
              {isCheckingOverlap && <span className="text-blue-600 animate-pulse">Verificando disponibilidad...</span>}
            </div>
            <div className="flex-1 overflow-auto relative">
              {/* Render the grid IN THIS CONTAINER */}
              {renderScheduleGrid(true)}
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}
