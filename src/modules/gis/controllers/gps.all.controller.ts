/**
 * All Vehicles GPS Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/auth.guard';
import { gpsService } from '../services/gps.service';

/**
 * GET /api/gps/vehicles
 * Todos los vehículos activos
 */
export async function GET(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const vehicles = await gpsService.getAllActiveVehicles();

      return NextResponse.json({ success: true, data: vehicles });
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
