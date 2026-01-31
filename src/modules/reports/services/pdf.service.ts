/**
 * Report Generation Service
 *
 * Generación de reportes en PDF y CSV para exportación
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  metadata?: Record<string, any>;
}

/**
 * Genera reporte en PDF
 */
export async function generatePDFReport(reportData: ReportData): Promise<Buffer> {
  try {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.text(reportData.title, 14, 20);

    // Subtítulo
    if (reportData.subtitle) {
      doc.setFontSize(12);
      doc.text(reportData.subtitle, 14, 30);
    }

    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 40);

    // Metadata
    if (reportData.metadata) {
      let yPosition = 50;
      Object.entries(reportData.metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yPosition);
        yPosition += 7;
      });
      yPosition += 10;
    }

    // Tabla de datos
    autoTable(doc, {
      head: reportData.headers as any[],
      body: reportData.data as any[],
      startY: 60,
      theme: 'grid',
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    // Convertir a buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Genera reporte en CSV
 */
export function generateCSVReport(reportData: ReportData): string {
  const headerRow = reportData.headers.join(',');
  const dataRows = reportData.data.map((row) =>
    row.map((cell) => {
      // Escapar comillas y comas
      const cellString = String(cell);
      if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
        return `"${cellString.replace(/"/g, '""')}"`;
      }
      return cellString;
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Genera reporte de personal en PDF
 */
export async function generatePersonnelReport(data: any[]): Promise<Buffer> {
  return await generatePDFReport({
    title: 'Reporte de Personal Policial',
    subtitle: 'Sistema Nacional de Seguridad Pública',
    headers: ['Badge', 'Nombre', 'Apellido', 'Rango', 'Status'],
    data: data.map((p) => [
      p.badgeNumber,
      p.firstName,
      p.lastName,
      p.rank,
      p.status,
    ]),
    metadata: {
      'Total de Registros': data.length,
      'Corporación': data[0]?.corporationId || 'N/A',
    },
  });
}

/**
 * Genera reporte de armamento en PDF
 */
export async function generateWeaponsReport(data: any[]): Promise<Buffer> {
  return await generatePDFReport({
    title: 'Reporte de Armamento',
    subtitle: 'Control de Armas y Municiones',
    headers: ['Serial', 'Tipo', 'Marca', 'Modelo', 'Calibre', 'Estado', 'Asignado a'],
    data: data.map((w) => [
      w.serialNumber,
      w.weaponType,
      w.make || 'N/A',
      w.model || 'N/A',
      w.caliber || 'N/A',
      w.status,
      w.assignedTo || 'N/A',
    ]),
    metadata: {
      'Total de Armas': data.length,
      'Asignadas': data.filter((w) => w.status === 'assigned').length,
      'Disponibles': data.filter((w) => w.status === 'available').length,
    },
  });
}

/**
 * Genera reporte de arrestos en PDF
 */
export async function generateArrestsReport(data: any[]): Promise<Buffer> {
  return await generatePDFReport({
    title: 'Reporte de Arrestos',
    subtitle: 'Vitácora de Detenciones',
    headers: ['Fecha', 'Oficial', 'Detenido', 'Cargos', 'Ubicación'],
    data: data.map((a) => [
      new Date(a.arrestDate).toLocaleDateString('es-MX'),
      a.officerId,
      a.detaineeName,
      a.charges,
      a.location || 'N/A',
    ]),
    metadata: {
      'Total de Arrestos': data.length,
      'Período': `${data[0]?.arrestDate} - ${data[data.length - 1]?.arrestDate}`,
    },
  });
}

/**
 * Genera reporte de nómina en PDF
 */
export async function generatePayrollReport(data: any): Promise<Buffer> {
  return await generatePDFReport({
    title: 'Reporte de Nómina',
    subtitle: 'Pago de Sueldos y Horas Extra',
    headers: ['Oficial', 'Horas Regulares', 'Horas Extra', 'Sueldo Base', 'Pago Extra', 'Total'],
    data: [
      [
        data.officerName || 'N/A',
        `${data.regularHours} hrs`,
        `${data.overtimeHours} hrs`,
        `$${data.regularPay}`,
        `$${data.overtimePay}`,
        `$${data.totalPay}`,
      ],
    ],
    metadata: {
      'Sueldo Base': `$${data.regularPay}`,
      'Pago Extra': `$${data.overtimePay}`,
      'Total a Pagar': `$${data.totalPay}`,
    },
  });
}

/**
 * Servicio completo de reportes
 */
export const reportService = {
  generatePDFReport,
  generateCSVReport,
  generatePersonnelReport,
  generateWeaponsReport,
  generateArrestsReport,
  generatePayrollReport,
};
