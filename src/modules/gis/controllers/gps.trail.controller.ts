/**
 * GPS Trail Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/auth.guard';
import { gpsService } from '../services/gps.service';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/gps/vehicles/:id/trail
 * Trail histórico de un vehículo
 */
export async function GET(req: NextRequest, context: RouteContext) {
  return withAuth(async (req) => {
    try {
      const { id } = await context.params;
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'startDate and endDate required' },
          { status: 400 }
        );
      }

      const trail = await gpsService.getVehicleTrail(
        id,
        new Date(startDate),
        new Date(endDate)
      );

      return NextResponse.json({ success: true, data: trail });
    } catch (error) {
      console.error('Error fetching trail:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
