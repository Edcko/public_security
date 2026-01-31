/**
 * SNSP Integration Controller
 *
 * Endpoints para importación y consulta de datos del SNSP
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import {
  getCrimeStatistics,
  getCrimeTrends,
  scheduledSNSPImport,
} from './snsp.service';

/**
 * POST /api/integrations/snsp/import
 * Importa datos del SNSP a la base de datos
 */
export async function POST_IMPORT(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { corporationId } = body;

      if (!corporationId) {
        return NextResponse.json(
          { success: false, error: 'corporationId is required' },
          { status: 400 }
        );
      }

      // Ejecutar importación programada
      const result = await scheduledSNSPImport(corporationId);

      return NextResponse.json({
        success: result.success,
        imported: result.imported,
        errors: result.errors,
        error: result.error,
      });
    } catch (error: any) {
      console.error('SNSP import error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/snsp/statistics
 * Consulta estadísticas delictivas con filtros
 */
export async function POST_STATISTICS(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { year, month, stateCode, crimeType, corporationId } = body;

      if (!corporationId) {
        return NextResponse.json(
          { success: false, error: 'corporationId is required' },
          { status: 400 }
        );
      }

      const statistics = await getCrimeStatistics({
        year,
        month,
        stateCode,
        crimeType,
        corporationId,
      });

      return NextResponse.json({
        success: true,
        data: statistics,
        count: statistics.length,
      });
    } catch (error: any) {
      console.error('SNSP statistics error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/snsp/trends
 * Calcula tendencias delictivas
 */
export async function POST_TRENDS(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { stateCode, crimeType, months, corporationId } = body;

      if (!corporationId) {
        return NextResponse.json(
          { success: false, error: 'corporationId is required' },
          { status: 400 }
        );
      }

      if (!months || months < 1) {
        return NextResponse.json(
          { success: false, error: 'months must be a positive integer' },
          { status: 400 }
        );
      }

      const trends = await getCrimeTrends({
        stateCode,
        crimeType,
        months,
        corporationId,
      });

      return NextResponse.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      console.error('SNSP trends error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/integrations/snsp/states
 * Retorna la lista de estados de México con códigos
 */
export async function GET(_req: NextRequest) {
  const states = [
    { code: 'AS', name: 'Aguascalientes' },
    { code: 'BC', name: 'Baja California' },
    { code: 'BS', name: 'Baja California Sur' },
    { code: 'CC', name: 'Campeche' },
    { code: 'CL', name: 'Coahuila' },
    { code: 'CM', name: 'Colima' },
    { code: 'CS', name: 'Chiapas' },
    { code: 'CH', name: 'Chihuahua' },
    { code: 'DF', name: 'Ciudad de México' },
    { code: 'DG', name: 'Durango' },
    { code: 'GT', name: 'Guanajuato' },
    { code: 'GR', name: 'Guerrero' },
    { code: 'HG', name: 'Jalisco' },
    { code: 'MC', name: 'México' },
    { code: 'MN', name: 'Michoacán' },
    { code: 'MS', name: 'Morelos' },
    { code: 'NT', name: 'Nayarit' },
    { code: 'NL', name: 'Nuevo León' },
    { code: 'OC', name: 'Oaxaca' },
    { code: 'PL', name: 'Puebla' },
    { code: 'QT', name: 'Querétaro' },
    { code: 'QR', name: 'Quintana Roo' },
    { code: 'SP', name: 'San Luis Potosí' },
    { code: 'SL', name: 'Sinaloa' },
    { code: 'TJ', name: 'Tlaxcala' },
    { code: 'TM', name: 'Tamaulipas' },
    { code: 'TL', name: 'Tlaxcala' },
    { code: 'VZ', name: 'Veracruz' },
    { code: 'YN', name: 'Yucatán' },
    { code: 'ZS', name: 'Zacatecas' },
  ];

  return NextResponse.json({
    success: true,
    data: states,
  });
}
