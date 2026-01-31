/**
 * Reports Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/auth.guard';
import { reportsRepository } from '../repositories/reports.repository';

/**
 * GET /api/reports/dashboard
 * Dashboard general
 */
export async function DASHBOARD(req: NextRequest) {
  return withAuth(async (_req) => {
    const stats = await reportsRepository.getDashboardStats();

    return NextResponse.json({ success: true, data: stats });
  })(req);
}

/**
 * GET /api/reports/personnel
 * Reporte de personal
 */
export async function PERSONNEL(req: NextRequest) {
  return withAuth(async (_req) => {
    const stats = await reportsRepository.getPersonnelStats();

    return NextResponse.json({ success: true, data: stats });
  })(req);
}

/**
 * GET /api/reports/weapons
 * Reporte de armamento
 */
export async function WEAPONS(req: NextRequest) {
  return withAuth(async (_req) => {
    const stats = await reportsRepository.getWeaponsStats();

    return NextResponse.json({ success: true, data: stats });
  })(req);
}

/**
 * GET /api/reports/vehicles
 * Reporte de vehículos
 */
export async function VEHICLES(req: NextRequest) {
  return withAuth(async (_req) => {
    const stats = await reportsRepository.getVehiclesStats();

    return NextResponse.json({ success: true, data: stats });
  })(req);
}

/**
 * GET /api/reports/arrests
 * Reporte de arrestos por rango de fechas
 */
export async function ARRESTS(req: NextRequest) {
  return withAuth(async (_req) => {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate required' },
        { status: 400 }
      );
    }

    const stats = await reportsRepository.getArrestsStats(
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ success: true, data: stats });
  })(req);
}
