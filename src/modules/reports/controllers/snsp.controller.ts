/**
 * SNSP Data Controller
 *
 * Endpoints para importación y consulta de datos del SNSP
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin } from '@/shared/middleware/enhanced-auth.middleware';
import { snspService } from '../services/snsp.service';

/**
 * POST /api/snsp/import
 * Importa datos del SNSP (manual o programado)
 */
export async function POST(req: NextRequest) {
  return withAdmin(async (_req) => {
    try {
      await snspService.scheduledSNSPImport();

      return NextResponse.json({
        success: true,
        message: 'SNSP data import completed',
      });
    } catch (error) {
      console.error('SNSP import error:', error);

      return NextResponse.json(
        { success: false, error: 'Import failed' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/snsp/stats
 * Obtiene estadísticas de delitos por estado
 */
export async function GET(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const { searchParams } = new URL(req.url);
      const state = searchParams.get('state');

      const stats = await snspService.getCrimeStatsByState(state || undefined);

      return NextResponse.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching SNSP stats:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/snsp/trends
 * Obtiene tendencias de delitos
 */
export async function GET_TRENDS(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'startDate and endDate required' },
          { status: 400 }
        );
      }

      const trends = await snspService.getCrimeTrends(
        new Date(startDate),
        new Date(endDate)
      );

      return NextResponse.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      console.error('Error fetching trends:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
