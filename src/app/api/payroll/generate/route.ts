/**
 * Payroll Generate API Route
 *
 * Genera registros de nómina para un periodo
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { payrollService } from '@/shared/payroll/payroll.service';

/**
 * POST /api/payroll/generate
 * Genera registros de nómina
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

      const periodStart = new Date(start);
      const periodEnd = new Date(end);

      // Generar nómina para la corporación del usuario
      const result = await payrollService.generatePayrollRecords(
        user.corporationId,
        periodStart,
        periodEnd
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error generating payroll:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Error al generar nómina' },
        { status: 500 }
      );
    }
  })(req);
}
