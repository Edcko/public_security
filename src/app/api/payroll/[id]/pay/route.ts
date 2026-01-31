/**
 * Payroll Pay API Route
 *
 * Marca un registro de nómina como pagado
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { payrollService } from '@/shared/payroll/payroll.service';

/**
 * POST /api/payroll/[id]/pay
 * Marca como pagado
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async () => {
    try {
      await payrollService.markAsPaid(params.id);

      return NextResponse.json({
        success: true,
        message: 'Registro marcado como pagado',
      });
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Error al marcar como pagado' },
        { status: 500 }
      );
    }
  })(req);
}
