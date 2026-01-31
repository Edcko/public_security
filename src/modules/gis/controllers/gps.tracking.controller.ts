/**
 * GPS Tracking Controller
 *
 * Endpoints para tracking en tiempo real de vehículos
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import {
  recordGPSUpdate,
  getVehicleLocation,
  getVehicleTrail,
  findNearbyVehicles,
  getAllActiveLocations,
  checkGeofence,
  getVehicleStats,
  cleanupOldGPSData,
} from '../services/gps.tracking.service';

/**
 * POST /api/gps/tracking/update
 * Registra una actualización de ubicación GPS
 */
export async function POST_UPDATE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const {
        vehicleId,
        latitude,
        longitude,
        speed,
        heading,
        altitude,
        accuracy,
        timestamp,
        officerId,
        status,
      } = body;

      if (!vehicleId || !latitude || !longitude) {
        return NextResponse.json(
          { success: false, error: 'vehicleId, latitude, and longitude are required' },
          { status: 400 }
        );
      }

      const success = await recordGPSUpdate({
        vehicleId,
        latitude,
        longitude,
        speed,
        heading,
        altitude,
        accuracy,
        timestamp: timestamp ? new Date(timestamp) : undefined,
        officerId,
        status,
      });

      return NextResponse.json({
        success,
      });
    } catch (error: any) {
      console.error('GPS update error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/gps/tracking/location/:vehicleId
 * Obtiene la ubicación más reciente de un vehículo
 */
export async function GET_LOCATION(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(async (_req) => {
    try {
      const { id: vehicleId } = await context.params;

      if (!vehicleId) {
        return NextResponse.json(
          { success: false, error: 'vehicleId is required' },
          { status: 400 }
        );
      }

      const location = await getVehicleLocation(vehicleId);

      if (!location) {
        return NextResponse.json(
          { success: false, error: 'Vehicle not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: location,
      });
    } catch (error: any) {
      console.error('Get GPS location error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/gps/tracking/trail
 * Obtiene el trail histórico de un vehículo
 */
export async function POST_TRAIL(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { vehicleId, startDate, endDate } = body;

      if (!vehicleId || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'vehicleId, startDate, and endDate are required' },
          { status: 400 }
        );
      }

      const trail = await getVehicleTrail(
        vehicleId,
        new Date(startDate),
        new Date(endDate)
      );

      return NextResponse.json({
        success: true,
        data: trail,
        count: trail.length,
      });
    } catch (error: any) {
      console.error('Get GPS trail error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/gps/tracking/nearby
 * Busca vehículos cercanos a una ubicación
 */
export async function POST_NEARBY(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { latitude, longitude, radius, corporationId } = body;

      if (!latitude || !longitude) {
        return NextResponse.json(
          { success: false, error: 'latitude and longitude are required' },
          { status: 400 }
        );
      }

      const result = await findNearbyVehicles(
        latitude,
        longitude,
        radius || 1, // 1km por defecto
        corporationId
      );

      return NextResponse.json({
        success: true,
        data: result.vehicles,
        total: result.total,
      });
    } catch (error: any) {
      console.error('Find nearby vehicles error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/gps/tracking/active
 * Obtiene todas las ubicaciones activas
 */
export async function GET_ACTIVE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const corporationId = searchParams.get('corporationId') || undefined;

      const locations = await getAllActiveLocations(corporationId);

      return NextResponse.json({
        success: true,
        data: locations,
        count: locations.length,
      });
    } catch (error: any) {
      console.error('Get active locations error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/gps/tracking/geofence/check
 * Verifica si un vehículo está dentro de un geofence
 */
export async function POST_GEOFENCE_CHECK(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { vehicleId, center, radius } = body;

      if (!vehicleId || !center || !radius) {
        return NextResponse.json(
          { success: false, error: 'vehicleId, center, and radius are required' },
          { status: 400 }
        );
      }

      const result = await checkGeofence(vehicleId, { center, radius });

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Check geofence error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/gps/tracking/stats
 * Obtiene estadísticas de actividad de un vehículo
 */
export async function POST_STATS(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { vehicleId, startDate, endDate } = body;

      if (!vehicleId || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'vehicleId, startDate, and endDate are required' },
          { status: 400 }
        );
      }

      const stats = await getVehicleStats(
        vehicleId,
        new Date(startDate),
        new Date(endDate)
      );

      return NextResponse.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get vehicle stats error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/gps/tracking/cleanup
 * Limpia datos antiguos de GPS (solo admin)
 */
export async function POST_CLEANUP(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { daysToKeep } = body;

      const deletedCount = await cleanupOldGPSData(daysToKeep || 90);

      return NextResponse.json({
        success: true,
        deleted: deletedCount,
      });
    } catch (error: any) {
      console.error('GPS cleanup error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
