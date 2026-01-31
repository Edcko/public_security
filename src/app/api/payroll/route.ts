/**
 * Payroll API Route
 *
 * Endpoint para obtener registros de nómina
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { db } from '@/shared/database/connection';
import { payrollRecords, personnel } from '@/shared/database/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * GET /api/payroll
 * Obtiene registros de nómina filtrados por periodo
 */
export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'Se requieren fechas de inicio y fin' },
          { status: 400 }
        );
      }

      // Construir condiciones WHERE
      let whereConditions = [];

      // Si no es admin, filtrar por su corporación
      if (!user.role.includes('admin')) {
        whereConditions.push(eq(payrollRecords.corporationId, user.corporationId));
      }

      // Agregar filtro de periodo
      whereConditions.push(
        and(
          gte(payrollRecords.periodStart, new Date(startDate)),
          lte(payrollRecords.periodEnd, new Date(endDate))
        )
      );

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Obtener registros con información del personal
      const records = await db
        .select({
          id: payrollRecords.id,
          personnelId: payrollRecords.personnelId,
          periodStart: payrollRecords.periodStart,
          periodEnd: payrollRecords.periodEnd,
          baseSalary: payrollRecords.baseSalary,
          benefits: payrollRecords.benefits,
          bonuses: payrollRecords.bonuses,
          deductions: payrollRecords.deductions,
          totalPay: payrollRecords.totalPay,
          paymentStatus: payrollRecords.paymentStatus,
          paymentDate: payrollRecords.paymentDate,
          personnelName: personnel.firstName,
          personnelLastName: personnel.lastName,
        })
        .from(payrollRecords)
        .innerJoin(personnel, eq(payrollRecords.personnelId, personnel.id))
        .where(whereClause)
        .orderBy(payrollRecords.periodStart);

      // Transformar datos
      const data = records.map((r: any) => ({
        id: r.id,
        personnelId: r.personnelId,
        personnelName: `${r.personnelName} ${r.personnelLastName || ''}`.trim(),
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        baseSalary: parseFloat(r.baseSalary),
        benefits: parseFloat(r.benefits),
        bonuses: parseFloat(r.bonuses),
        deductions: parseFloat(r.deductions),
        totalPay: parseFloat(r.totalPay),
        paymentStatus: r.paymentStatus,
        paymentDate: r.paymentDate,
      }));

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Error fetching payroll records:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener registros de nómina' },
        { status: 500 }
      );
    }
  })(req);
}
