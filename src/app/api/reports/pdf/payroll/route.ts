/**
 * Payroll PDF Report API Route
 *
 * Genera reporte PDF de nómina
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { db } from '@/shared/database/connection';
import { payrollRecords, personnel } from '@/shared/database/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * POST /api/reports/pdf/payroll
 * Genera PDF de nómina
 */
export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await req.json();
      const { start, end } = body;

      if (!start || !end) {
        return NextResponse.json(
          { success: false, error: 'Se requieren fechas de inicio y fin' },
          { status: 400 }
        );
      }

      // Obtener registros de nómina
      let whereConditions = [];

      if (!user.role.includes('admin')) {
        whereConditions.push(eq(payrollRecords.corporationId, user.corporationId));
      }

      whereConditions.push(
        and(
          gte(payrollRecords.periodStart, new Date(start)),
          lte(payrollRecords.periodEnd, new Date(end))
        )
      );

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const records = await db
        .select({
          personnelFirstName: personnel.firstName,
          personnelLastName: personnel.lastName,
          rank: personnel.rank,
          badgeNumber: personnel.badgeNumber,
          periodStart: payrollRecords.periodStart,
          periodEnd: payrollRecords.periodEnd,
          baseSalary: payrollRecords.baseSalary,
          benefits: payrollRecords.benefits,
          bonuses: payrollRecords.bonuses,
          deductions: payrollRecords.deductions,
          totalPay: payrollRecords.totalPay,
          paymentStatus: payrollRecords.paymentStatus,
        })
        .from(payrollRecords)
        .innerJoin(personnel, eq(payrollRecords.personnelId, personnel.id))
        .where(whereClause);

      // Generar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Título
      doc.setFontSize(18);
      doc.text('Reporte de Nómina', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text(
        `Periodo: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`,
        pageWidth / 2,
        30,
        { align: 'center' }
      );

      // Calcular totales
      const totalBaseSalary = records.reduce((sum, r) => sum + parseFloat(r.baseSalary), 0);
      const totalBenefits = records.reduce((sum, r) => sum + parseFloat(r.benefits), 0);
      const totalBonuses = records.reduce((sum, r) => sum + parseFloat(r.bonuses), 0);
      const totalDeductions = records.reduce((sum, r) => sum + parseFloat(r.deductions), 0);
      const totalPay = records.reduce((sum, r) => sum + parseFloat(r.totalPay), 0);

      // Tabla de registros
      autoTable(doc, {
        startY: 40,
        head: [
          ['Nombre', 'Rango', 'Placa', 'Sueldo Base', 'Beneficios', 'Bonos', 'Deducciones', 'Neto', 'Estado'],
        ],
        body: records.map((r) => [
          `${r.personnelFirstName} ${r.personnelLastName || ''}`.trim(),
          r.rank,
          r.badgeNumber,
          `$${parseFloat(r.baseSalary).toFixed(2)}`,
          `$${parseFloat(r.benefits).toFixed(2)}`,
          `$${parseFloat(r.bonuses).toFixed(2)}`,
          `$${parseFloat(r.deductions).toFixed(2)}`,
          `$${parseFloat(r.totalPay).toFixed(2)}`,
          r.paymentStatus === 'paid' ? 'Pagado' : r.paymentStatus === 'cancelled' ? 'Cancelado' : 'Pendiente',
        ]),
        foot: [
          [
            '',
            '',
            'TOTALES:',
            `$${totalBaseSalary.toFixed(2)}`,
            `$${totalBenefits.toFixed(2)}`,
            `$${totalBonuses.toFixed(2)}`,
            `$${totalDeductions.toFixed(2)}`,
            `$${totalPay.toFixed(2)}`,
            '',
          ],
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      // Agregar fecha de generación
      doc.setFontSize(8);
      doc.text(
        `Generado: ${new Date().toLocaleString()}`,
        pageWidth - 10,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );

      // Retornar PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="nomina-${start}-${end}.pdf"`,
        },
      });
    } catch (error: any) {
      console.error('Error generating payroll PDF:', error);
      return NextResponse.json(
        { success: false, error: 'Error al generar PDF' },
        { status: 500 }
      );
    }
  })(req);
}
