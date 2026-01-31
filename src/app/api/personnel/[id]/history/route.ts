/**
 * Personnel History API Route
 *
 * Obtiene el historial de cambios de un oficial
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { personnelHistoryService } from '@/modules/personnel/services/personnel-history.service';

/**
 * GET /api/personnel/[id]/history
 * Obtiene historial de cambios de un oficial
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async () => {
    try {
      const history = await personnelHistoryService.getPersonnelHistory(params.id);

      return NextResponse.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error('Error fetching personnel history:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
