import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

/**
 * Utilidades para exportación de reportes a CSV y PDF
 * con datos reales de la base de datos
 */

// Logo base64 simplificado (puede reemplazarse con el logo real)
const LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjMEUzQThBIi8+CiAgPHBhdGggZD0iTTMyIDEyTDQyIDI0SDIyTDMyIDEyWiIgZmlsbD0id2hpdGUiLz4KICA8cmVjdCB4PSIyMiIgeT0iMjYiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyNiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';

interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Exportar datos a CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): void {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Si se proporcionan headers personalizados, mapear los datos
  let csvData = data;
  if (headers) {
    csvData = data.map(row => {
      const mappedRow: any = {};
      Object.keys(headers).forEach(key => {
        mappedRow[headers[key as keyof T]] = row[key];
      });
      return mappedRow;
    });
  }

  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ',',
  });

  // Crear blob y descargar
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exportar datos a PDF con formato de tabla
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ header: string; dataKey: keyof T }>,
  options: ExportOptions
): void {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header con logo y título
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Logo (placeholder - en producción cargar imagen real)
  try {
    doc.addImage(LOGO_BASE64, 'SVG', 14, 10, 20, 20);
  } catch (e) {
    console.warn('No se pudo cargar el logo');
  }

  // Título
  doc.setFontSize(18);
  doc.setTextColor(14, 58, 138); // #0E3A8A
  doc.text('CERMAT SCHOOL', 40, 18);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Azángaro, Puno - Perú', 40, 24);

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 32, pageWidth - 14, 32);

  // Título del reporte
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(options.title, 14, 40);

  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(options.subtitle, 14, 46);
  }

  // Fecha de generación
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  const fechaGeneracion = new Date().toLocaleString('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  doc.text(`Generado: ${fechaGeneracion}`, pageWidth - 14, 40, { align: 'right' });

  // Tabla de datos
  autoTable(doc, {
    startY: options.subtitle ? 52 : 46,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
      const value = row[col.dataKey];
      // Formatear valores nulos o undefined
      if (value === null || value === undefined) return '-';
      // Formatear booleanos
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      // Retornar valor como string
      return String(value);
    })),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [14, 58, 138], // #0E3A8A
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 10, right: 14, bottom: 20, left: 14 },
    didDrawPage: (data) => {
      // Footer con número de página
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // Descargar PDF
  doc.save(`${options.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Exportar reporte de asistencia
 */
export function exportAttendanceReport(
  data: Array<{
    student_code: string;
    student_name: string;
    attendance_percentage: number;
    total_absences: number;
    total_tardies: number;
    total_justifications: number;
  }>,
  filters: {
    period?: string;
    section?: string;
    course?: string;
  },
  format: 'csv' | 'pdf'
): void {
  const title = 'Reporte de Asistencia';
  const subtitle = [
    filters.period && `Periodo: ${filters.period}`,
    filters.section && `Sección: ${filters.section}`,
    filters.course && `Curso: ${filters.course}`,
  ].filter(Boolean).join(' | ');

  if (format === 'csv') {
    exportToCSV(data, 'reporte_asistencia', {
      student_code: 'Código',
      student_name: 'Estudiante',
      attendance_percentage: 'Asistencia (%)',
      total_absences: 'Faltas',
      total_tardies: 'Tardanzas',
      total_justifications: 'Justificaciones',
    });
  } else {
    exportToPDF(data, [
      { header: 'Código', dataKey: 'student_code' },
      { header: 'Estudiante', dataKey: 'student_name' },
      { header: 'Asistencia (%)', dataKey: 'attendance_percentage' },
      { header: 'Faltas', dataKey: 'total_absences' },
      { header: 'Tardanzas', dataKey: 'total_tardies' },
      { header: 'Justificaciones', dataKey: 'total_justifications' },
    ], {
      title,
      subtitle,
      filename: 'reporte_asistencia',
      orientation: 'landscape',
    });
  }
}

/**
 * Exportar reporte de evaluación
 */
export function exportEvaluationReport(
  data: Array<{
    student_code: string;
    student_name: string;
    [competency: string]: string | number;
  }>,
  competencies: string[],
  filters: {
    period?: string;
    section?: string;
    course?: string;
  },
  format: 'csv' | 'pdf'
): void {
  const title = 'Reporte de Evaluación';
  const subtitle = [
    filters.period && `Periodo: ${filters.period}`,
    filters.section && `Sección: ${filters.section}`,
    filters.course && `Curso: ${filters.course}`,
  ].filter(Boolean).join(' | ');

  if (format === 'csv') {
    const headers: Record<string, string> = {
      student_code: 'Código',
      student_name: 'Estudiante',
    };
    competencies.forEach(comp => {
      headers[comp] = comp;
    });
    exportToCSV(data, 'reporte_evaluacion', headers);
  } else {
    const columns = [
      { header: 'Código', dataKey: 'student_code' as keyof typeof data[0] },
      { header: 'Estudiante', dataKey: 'student_name' as keyof typeof data[0] },
      ...competencies.map(comp => ({ 
        header: comp, 
        dataKey: comp as keyof typeof data[0]
      })),
    ];
    
    exportToPDF(data, columns, {
      title,
      subtitle,
      filename: 'reporte_evaluacion',
      orientation: 'landscape',
    });
  }
}

/**
 * Exportar datos para SIAGIE
 */
export function exportSIAGIEFormat(
  data: Array<{
    dni: string;
    apellido_paterno: string;
    apellido_materno: string;
    nombres: string;
    grado: string;
    seccion: string;
    [competency: string]: string;
  }>
): void {
  // Formato específico SIAGIE (CSV con estructura predefinida)
  exportToCSV(data, 'exportacion_siagie');
  
  alert('Archivo exportado en formato compatible con SIAGIE. Revisa la estructura antes de importar.');
}
