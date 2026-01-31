/**
 * GPS Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/auth.guard';
import { gpsService } from '../services/gps.service';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/gps/vehicles/:id/location
 * Ubicación actual de un vehículo
 */
export async function GET(req: NextRequest, context: RouteContext) {
  return withAuth(async (_req) => {
    try {
      const { id } = await context.params;

      const location = await gpsService.getVehicleLocation(id);

      if (!location) {
        return NextResponse.json(
          { success: false, error: 'No location data found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: location });
    } catch (error) {
      console.error('Error fetching location:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
