/**
 * ReceiptPrintService  v2
 *
 * Genera e imprime boletas de pago en dos formatos:
 *
 *  • A4  — boleta con 2 copias (institución / apoderado) en una sola hoja,
 *          diseño corporativo similar a comprobantes de instituciones bancarias.
 *
 *  • Ticket 80 mm — para impresoras térmicas (ticketeras).
 *    La preferencia se guarda en localStorage; el cajero la configura una
 *    sola vez y se mantiene entre sesiones.
 *
 * ── CONFIGURACIÓN DEL COLEGIO ──────────────────────────────────────────────
 *  Editar las constantes marcadas con ◄ en la sección "CONFIG" (líneas ~55).
 * ──────────────────────────────────────────────────────────────────────────
 *
 * USO
 *   this.receiptPrint.print(payment, student)          // auto-detecta formato
 *   this.receiptPrint.printA4(payment, student)        // forzar A4
 *   this.receiptPrint.printTicket(payment, student)    // forzar ticket
 */
import { Injectable } from '@angular/core';
import { Payment } from './finance.service';

// ═══════════════════════════════════════════════════════════════════════════
//  CONFIG — editar aquí los datos de la institución
// ═══════════════════════════════════════════════════════════════════════════
const SCHOOL_NAME    = 'INSTITUCIÓN EDUCATIVA CERMAT';  // ◄ nombre del colegio
const SCHOOL_LEVELS  = 'Inicial · Primaria · Secundaria'; // ◄ niveles
const SCHOOL_RUC     = '';           // ◄ RUC  (dejar vacío si no aplica)
const SCHOOL_ADDRESS = 'Azángaro, Puno — Perú';          // ◄ dirección
const SCHOOL_PHONE   = '';           // ◄ teléfono (dejar vacío si no aplica)
const SCHOOL_EMAIL   = '';           // ◄ correo  (dejar vacío si no aplica)
// ═══════════════════════════════════════════════════════════════════════════

const LS_TICKET_KEY = 'cermat_receipt_format'; // 'ticket' | 'a4'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export interface PrintOptions {
  forceA4?:     boolean;
  forceTicket?: boolean;
}

export interface ReceiptStudent {
  first_name?:   string;
  last_name?:    string;
  dni?:          string;
  student_code?: string;
  section?: {
    grade_level?:    { name?: string };
    section_letter?: string;
  };
}

// ─── Servicio ──────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ReceiptPrintService {

  // ── Preferencia de formato ───────────────────────────────────────────────

  hasTicketPrinter(): boolean {
    return localStorage.getItem(LS_TICKET_KEY) === 'ticket';
  }

  setTicketPrinterPreference(ticket: boolean): void {
    localStorage.setItem(LS_TICKET_KEY, ticket ? 'ticket' : 'a4');
  }

  // ── API pública ──────────────────────────────────────────────────────────

  print(payment: Payment, student: ReceiptStudent | null, opts: PrintOptions = {}): void {
    if (opts.forceTicket || (!opts.forceA4 && this.hasTicketPrinter())) {
      this.printTicket(payment, student);
    } else {
      this.printA4(payment, student);
    }
  }

  printA4(payment: Payment, student: ReceiptStudent | null): void {
    this.openAndPrint(this.buildA4Html(payment, student), 'width=900,height=750');
  }

  printTicket(payment: Payment, student: ReceiptStudent | null): void {
    this.openAndPrint(this.buildTicketHtml(payment, student), 'width=380,height=680');
  }

  // ── Core: abrir ventana e imprimir ───────────────────────────────────────

  /**
   * Escribe el HTML en una ventana popup y llama a window.print().
   *
   * Estrategia de temporización robusta:
   *   1. Escribe el HTML.
   *   2. Cierra el stream del documento (document.close()).
   *   3. Espera readyState === 'complete' con polling + fallback de 800 ms.
   *   Esto cubre Chrome, Firefox y Edge que difieren en cuándo disparan 'load'.
   */
  private openAndPrint(html: string, features = 'width=900,height=750'): void {
    const popup = window.open('', '_blank', features + ',scrollbars=yes');
    if (!popup) {
      alert(
        'El navegador bloqueó la ventana emergente.\n' +
        'Permite ventanas emergentes para este sitio e intenta de nuevo.'
      );
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();

    // Esperar hasta que el documento esté listo antes de imprimir
    const tryPrint = () => {
      if (popup.document.readyState === 'complete') {
        popup.focus();
        popup.print();
      } else {
        setTimeout(tryPrint, 80);
      }
    };

    // Primer intento en 100 ms — suficiente para documentos inline sin imágenes
    setTimeout(tryPrint, 100);
  }

  // ── Helpers de datos ─────────────────────────────────────────────────────

  private studentName(s: ReceiptStudent | null, p: Payment): string {
    if (s) return `${s.last_name || ''} ${s.first_name || ''}`.trim() || 'No identificado';
    const st = (p as any).student || (p as any).charge?.student;
    if (st) return (`${st.last_name || ''} ${st.first_name || ''}`.trim()) || st.name || 'No identificado';
    return 'No identificado';
  }

  private studentDni(s: ReceiptStudent | null, p: Payment): string {
    if (s?.dni) return s.dni;
    return (p as any).student?.dni || (p as any).charge?.student?.dni || '—';
  }

  private studentCode(s: ReceiptStudent | null, p: Payment): string {
    if (s?.student_code) return s.student_code;
    return (p as any).student?.student_code || (p as any).charge?.student?.student_code || '—';
  }

  private studentGrade(s: ReceiptStudent | null): string {
    if (!s?.section) return '—';
    return `${s.section.grade_level?.name || ''} ${s.section.section_letter || ''}`.trim() || '—';
  }

  /** Nombre del concepto — evita duplicar si coincide con las notas */
  private conceptName(p: Payment): string {
    const fromConcept = p.charge?.concept?.name || '';
    const fromNotes   = (p.charge as any)?.notes || p.notes || '';
    // Si ambos existen y son distintos, devuelve el concepto (más limpio)
    return fromConcept || fromNotes || 'Pago';
  }

  /** Observación adicional — solo si es distinta al concepto */
  private extraNotes(p: Payment): string {
    const concept     = this.conceptName(p);
    const chargeNotes = (p.charge as any)?.notes || '';
    const payNotes    = p.notes || '';
    // Mostrar solo si aporta información nueva respecto al concepto
    const candidate   = payNotes || chargeNotes;
    return candidate && candidate !== concept ? candidate : '';
  }

  private methodLabel(m: string): string {
    const v = (m || '').toLowerCase();
    if (v.includes('efectivo'))  return 'Efectivo';
    if (v.includes('tarjeta'))   return 'Tarjeta';
    if (v.includes('transfer'))  return 'Transferencia bancaria';
    if (v.includes('yape'))      return 'Yape';
    if (v.includes('plin'))      return 'Plin';
    if (v.includes('pasarela'))  return 'Pasarela en línea';
    return m || 'Otro';
  }

  private currency(n: number): string {
    return 'S/ ' + Number(n || 0).toFixed(2);
  }

  private fmtDate(raw: string | null | undefined, time = false): string {
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    const p  = (x: number) => String(x).padStart(2, '0');
    const dt = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
    return time ? `${dt}  ${p(d.getHours())}:${p(d.getMinutes())}` : dt;
  }

  // ── Boleta A4 ─────────────────────────────────────────────────────────────
  //
  // Diseño: una página A4 con dos cortes horizontales (Copia Institución /
  // Copia Apoderado). Cada corte replica exactamente los mismos datos.
  // Inspirado en el diseño de recibos bancarios peruanos (BCP, Interbank).

  private buildA4Html(payment: Payment, student: ReceiptStudent | null): string {
    const receipt  = payment.receipt;
    const rn       = receipt?.number || 'SIN NÚMERO';
    const now      = this.fmtDate((payment as any).paid_at || receipt?.issued_at, true);
    const issued   = this.fmtDate(receipt?.issued_at, true) || now;

    const sName    = this.studentName(student, payment);
    const sDni     = this.studentDni(student, payment);
    const sCode    = this.studentCode(student, payment);
    const sGrade   = this.studentGrade(student);
    const concept  = this.conceptName(payment);
    const method   = this.methodLabel(payment.method || '');
    const ref      = payment.reference || null;
    const obs      = this.extraNotes(payment);
    const total    = this.currency(Number(payment.amount || 0));

    const charge   = payment.charge;
    const netAmt   = charge
      ? this.currency(Math.max(0, Number(charge.amount || 0) - Number(charge.discount_amount || 0)))
      : null;
    const dueDate  = charge?.due_date ? this.fmtDate(String(charge.due_date)) : null;
    const discount = (charge && Number(charge.discount_amount || 0) > 0)
      ? this.currency(Number(charge.discount_amount))
      : null;

    // Líneas opcionales del encabezado institucional
    const rucLine   = SCHOOL_RUC   ? `<span class="hd-meta">RUC ${SCHOOL_RUC}</span>` : '';
    const phoneLine = SCHOOL_PHONE ? `<span class="hd-meta">Tel. ${SCHOOL_PHONE}</span>` : '';
    const emailLine = SCHOOL_EMAIL ? `<span class="hd-meta">${SCHOOL_EMAIL}</span>` : '';

    // Genera el bloque de una copia
    const copy = (tag: string) => /* html */`
<div class="slip">

  <!-- ░░ ENCABEZADO ░░ -->
  <div class="slip-head">
    <div class="slip-head-left">
      <div class="inst-name">${SCHOOL_NAME}</div>
      <div class="inst-sub">${SCHOOL_LEVELS}</div>
      <div class="inst-meta">
        ${SCHOOL_ADDRESS}
        ${rucLine}${phoneLine}${emailLine}
      </div>
    </div>
    <div class="slip-head-right">
      <div class="badge-num">
        <div class="badge-label">RECIBO DE PAGO</div>
        <div class="badge-value">${rn}</div>
      </div>
      <div class="badge-date">${issued}</div>
      <div class="copy-tag">${tag}</div>
    </div>
  </div>

  <!-- ░░ CUERPO ░░ -->
  <div class="slip-body">

    <!-- Bloque estudiante -->
    <div class="section-row">
      <div class="section-title">DATOS DEL ESTUDIANTE</div>
      <div class="data-grid">
        <div class="data-cell wide">
          <span class="dc-label">Apellidos y nombres</span>
          <span class="dc-value bold">${sName}</span>
        </div>
        <div class="data-cell">
          <span class="dc-label">Grado / Sección</span>
          <span class="dc-value">${sGrade}</span>
        </div>
        <div class="data-cell">
          <span class="dc-label">DNI / Doc. Identidad</span>
          <span class="dc-value">${sDni}</span>
        </div>
        <div class="data-cell">
          <span class="dc-label">Código de matrícula</span>
          <span class="dc-value">${sCode}</span>
        </div>
      </div>
    </div>

    <!-- Bloque concepto -->
    <div class="section-row">
      <div class="section-title">DETALLE DEL COBRO</div>
      <div class="data-grid">
        <div class="data-cell wide">
          <span class="dc-label">Concepto</span>
          <span class="dc-value bold">${concept}</span>
        </div>
        ${dueDate ? `
        <div class="data-cell">
          <span class="dc-label">Fecha de vencimiento</span>
          <span class="dc-value">${dueDate}</span>
        </div>` : '<div class="data-cell"></div>'}
        <div class="data-cell">
          <span class="dc-label">Método de pago</span>
          <span class="dc-value">${method}</span>
        </div>
        <div class="data-cell">
          <span class="dc-label">Fecha de pago</span>
          <span class="dc-value">${now}</span>
        </div>
        ${netAmt ? `
        <div class="data-cell">
          <span class="dc-label">Monto del cargo</span>
          <span class="dc-value">${netAmt}</span>
        </div>` : ''}
        ${discount ? `
        <div class="data-cell">
          <span class="dc-label">Descuento aplicado</span>
          <span class="dc-value green">− ${discount}</span>
        </div>` : ''}
        ${ref ? `
        <div class="data-cell">
          <span class="dc-label">N.° operación / referencia</span>
          <span class="dc-value">${ref}</span>
        </div>` : ''}
        ${obs ? `
        <div class="data-cell wide">
          <span class="dc-label">Observación</span>
          <span class="dc-value italic">${obs}</span>
        </div>` : ''}
      </div>
    </div>

  </div><!-- /slip-body -->

  <!-- ░░ TOTAL ░░ -->
  <div class="slip-total">
    <div class="total-label">MONTO TOTAL PAGADO</div>
    <div class="total-value">${total}</div>
  </div>

  <!-- ░░ PIE ░░ -->
  <div class="slip-foot">
    <div class="sign-block">
      <div class="sign-line"></div>
      <div class="sign-label">Cajero / Tesorero</div>
    </div>
    <div class="foot-text">
      <p>Documento válido como constancia de pago. Consérvelo.</p>
      <p>Emitido por el Sistema de Gestión Educativa · ${SCHOOL_NAME}</p>
    </div>
    <div class="sign-block">
      <div class="sign-line"></div>
      <div class="sign-label">Firma del apoderado / receptor</div>
    </div>
  </div>

</div><!-- /slip -->`;

    return /* html */`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo ${rn}</title>
<style>
/* ─── Reset ─── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/* ─── Página ─── */
@page{size:A4 portrait;margin:8mm 10mm}
body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ─── Dos copias separadas por línea punteada ─── */
.slip{
  width:100%;
  padding:10px 0 10px;
  page-break-inside:avoid;
}
.slip + .slip{
  border-top:1.5px dashed #94a3b8;
  margin-top:6px;
  padding-top:8px;
}

/* ─── Cabecera ─── */
.slip-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  padding-bottom:8px;
  border-bottom:2px solid #193375;
  margin-bottom:8px;
}
.inst-name{
  font-size:13pt;
  font-weight:900;
  color:#193375;
  letter-spacing:-.3px;
  line-height:1.15;
  text-transform:uppercase;
}
.inst-sub{
  font-size:8pt;
  font-weight:600;
  color:#2563eb;
  margin-top:2px;
}
.inst-meta{
  margin-top:4px;
  font-size:7.5pt;
  color:#475569;
  line-height:1.7;
}
.hd-meta{
  display:inline-block;
  margin-right:12px;
}
.slip-head-right{
  text-align:right;
  flex-shrink:0;
}
.badge-num{
  background:#193375;
  color:#fff;
  padding:5px 12px 6px;
  border-radius:6px;
  display:inline-block;
  min-width:130px;
}
.badge-label{
  font-size:6.5pt;
  letter-spacing:.18em;
  text-transform:uppercase;
  opacity:.85;
  font-weight:700;
}
.badge-value{
  font-size:14pt;
  font-weight:900;
  letter-spacing:.03em;
  line-height:1.2;
}
.badge-date{
  font-size:7.5pt;
  color:#475569;
  margin-top:4px;
  font-weight:600;
}
.copy-tag{
  display:inline-block;
  margin-top:5px;
  padding:2px 8px;
  border:1px solid #cbd5e1;
  border-radius:20px;
  font-size:6.5pt;
  color:#64748b;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
}

/* ─── Cuerpo ─── */
.slip-body{
  margin-bottom:6px;
}
.section-row{
  margin-bottom:6px;
}
.section-title{
  font-size:6.5pt;
  font-weight:800;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:#193375;
  background:#eff6ff;
  border-left:3px solid #193375;
  padding:2px 6px;
  margin-bottom:5px;
}
.data-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:3px 8px;
}
.data-cell{
  min-width:0;
}
.data-cell.wide{
  grid-column:span 2;
}
.dc-label{
  display:block;
  font-size:6.5pt;
  color:#64748b;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.08em;
  margin-bottom:1px;
}
.dc-value{
  display:block;
  font-size:9pt;
  color:#0f172a;
  word-break:break-word;
}
.dc-value.bold{font-weight:700}
.dc-value.green{color:#15803d}
.dc-value.italic{font-style:italic;color:#475569}

/* ─── Total ─── */
.slip-total{
  display:flex;
  align-items:center;
  justify-content:space-between;
  background:#f0fdf4;
  border:1.5px solid #86efac;
  border-radius:6px;
  padding:6px 12px;
  margin-bottom:6px;
}
.total-label{
  font-size:7.5pt;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.16em;
  color:#166534;
}
.total-value{
  font-size:20pt;
  font-weight:900;
  color:#15803d;
  letter-spacing:-.5px;
}

/* ─── Pie ─── */
.slip-foot{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:16px;
  padding-top:5px;
  border-top:1px solid #e2e8f0;
}
.sign-block{
  flex:1;
  text-align:center;
}
.sign-line{
  height:1px;
  background:#94a3b8;
  margin-bottom:3px;
  margin-top:20px;
}
.sign-label{
  font-size:6.5pt;
  color:#94a3b8;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.08em;
}
.foot-text{
  flex:2;
  text-align:center;
  font-size:7pt;
  color:#94a3b8;
  line-height:1.6;
}

@media print{
  body{background:#fff}
  .slip{page-break-inside:avoid}
}
</style>
</head>
<body>
  ${copy('COPIA — INSTITUCIÓN')}
  ${copy('COPIA — APODERADO / TITULAR')}
</body>
</html>`;
  }

  // ── Ticket 80 mm ──────────────────────────────────────────────────────────
  //
  // Diseño monoespacio compacto para papel térmico 80 mm.
  // Compatible con cualquier impresora que el SO exponga como impresora de
  // tickets (Epson TM, Star, Bixolon, etc.) usando el diálogo estándar del
  // navegador (window.print).

  private buildTicketHtml(payment: Payment, student: ReceiptStudent | null): string {
    const receipt  = payment.receipt;
    const rn       = receipt?.number || 'SIN NÚMERO';
    const now      = this.fmtDate((payment as any).paid_at || receipt?.issued_at, true);
    const issued   = this.fmtDate(receipt?.issued_at, true) || now;

    const sName    = this.studentName(student, payment);
    const sDni     = this.studentDni(student, payment);
    const sCode    = this.studentCode(student, payment);
    const sGrade   = this.studentGrade(student);
    const concept  = this.conceptName(payment);
    const method   = this.methodLabel(payment.method || '');
    const ref      = payment.reference || null;
    const obs      = this.extraNotes(payment);
    const total    = this.currency(Number(payment.amount || 0));

    const charge   = payment.charge;
    const netAmt   = charge
      ? this.currency(Math.max(0, Number(charge.amount || 0) - Number(charge.discount_amount || 0)))
      : null;
    const dueDate  = charge?.due_date ? this.fmtDate(String(charge.due_date)) : null;
    const discount = (charge && Number(charge.discount_amount || 0) > 0)
      ? this.currency(Number(charge.discount_amount))
      : null;

    // Helpers para el layout de 2 columnas en monoespaciado
    const W    = 32; // ancho útil en caracteres (80mm ≈ 32 chars Courier 9pt)
    const row  = (l: string, r: string) => {
      const sp = Math.max(1, W - l.length - r.length);
      return `<div class="row"><span>${l}</span><span>${' '.repeat(sp) + r}</span></div>`;
    };
    const line = (char = '─') => `<div class="sep">${char.repeat(W)}</div>`;

    const rucLine   = SCHOOL_RUC   ? row('RUC', SCHOOL_RUC)                     : '';
    const phoneLine = SCHOOL_PHONE ? row('Tel.', SCHOOL_PHONE)                   : '';
    const emailLine = SCHOOL_EMAIL ? `<div class="center small">${SCHOOL_EMAIL}</div>` : '';
    const refLine   = ref          ? row('N° Operacion', ref)                    : '';
    const dueLine   = dueDate      ? row('Vencimiento', dueDate)                 : '';
    const netLine   = netAmt       ? row('Cargo neto', netAmt)                   : '';
    const discLine  = discount     ? row('Descuento', `- ${discount}`)           : '';
    const obsLine   = obs          ? `<div class="obs">Obs: ${obs}</div>`        : '';

    return /* html */`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Ticket ${rn}</title>
<style>
/* ─── Ticket 80 mm ─── */
@page{size:80mm auto;margin:3mm 2mm}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Courier New',Courier,monospace;
  font-size:8.5pt;
  color:#000;
  background:#fff;
  width:76mm;
  margin:0 auto;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
.center{text-align:center}
.small{font-size:7pt}
.bold{font-weight:bold}
.big{font-size:12pt;font-weight:bold}
.huge{font-size:18pt;font-weight:900;letter-spacing:-.5px;line-height:1.1}

/* Separadores */
.sep{
  font-size:8pt;
  letter-spacing:-.5px;
  overflow:hidden;
  white-space:nowrap;
  margin:3px 0;
}
.sep-dash{border-top:1px dashed #555;margin:4px 0}

/* Fila label + valor */
.row{
  display:flex;
  justify-content:space-between;
  line-height:1.5;
  white-space:pre;
}
.row span:first-child{flex-shrink:0;color:#444}
.row span:last-child{font-weight:bold;text-align:right}

/* Bloque concepto (texto largo) */
.concept{
  font-weight:bold;
  word-break:break-word;
  white-space:normal;
  margin:2px 0 3px;
}

/* Observación */
.obs{
  font-size:7.5pt;
  color:#333;
  margin:2px 0;
  word-break:break-word;
  white-space:normal;
}

/* Total */
.total-box{
  text-align:center;
  margin:4px 0 3px;
}
.total-lbl{
  font-size:7pt;
  text-transform:uppercase;
  letter-spacing:.12em;
}

/* Pie */
.foot{
  font-size:7pt;
  text-align:center;
  color:#555;
  line-height:1.6;
  margin-top:5px;
}

/* Espacio de corte */
.cut{height:14mm}

@media print{body{margin:0}}
</style>
</head>
<body>

<!-- ENCABEZADO -->
<div class="center">
  <div class="big">${SCHOOL_NAME}</div>
  <div class="small">${SCHOOL_LEVELS}</div>
  <div class="small">${SCHOOL_ADDRESS}</div>
  ${rucLine}${phoneLine}${emailLine}
</div>

${line('═')}

<!-- NÚMERO DE RECIBO -->
<div class="center">
  <div class="small" style="letter-spacing:.14em;text-transform:uppercase;margin-top:2px">RECIBO DE PAGO</div>
  <div class="huge">${rn}</div>
  <div class="small">Emitido: ${issued}</div>
</div>

${line()}

<!-- ESTUDIANTE -->
<div class="small bold" style="margin-bottom:2px">ESTUDIANTE</div>
<div class="concept">${sName}</div>
${row('DNI / Doc.',    sDni)}
${row('Codigo',        sCode)}
${row('Grado',         sGrade)}

${line()}

<!-- DETALLE DE PAGO -->
<div class="small bold" style="margin-bottom:2px">CONCEPTO</div>
<div class="concept">${concept}</div>
${dueLine}
${netLine}
${discLine}
${row('Metodo', method)}
${refLine}
${obsLine}

${line('═')}

<!-- TOTAL -->
<div class="total-box">
  <div class="total-lbl">MONTO PAGADO</div>
  <div class="huge" style="font-size:22pt">${total}</div>
</div>

<div class="sep-dash"></div>

<!-- PIE -->
<div class="foot">
  <div>Documento valido como constancia de pago.</div>
  <div>Conserve este comprobante.</div>
  <div style="margin-top:3px;font-size:6.5pt;color:#888">Sistema de Gestion Educativa · Cermat</div>
</div>

<!-- ESPACIO DE CORTE -->
<div class="cut"></div>

</body>
</html>`;
  }
}
