/**
 * Corporations Hierarchy Controller
 *
 * Endpoints para obtener jerarquía de corporaciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/auth.guard';
import { corporationsRepository } from '../repositories/corporations.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';

/**
 * GET /api/corporations/hierarchy
 * Obtiene árbol jerárquico de corporaciones
 */
export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;

      const hierarchy = await corporationsRepository.getHierarchy();

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'corporations-hierarchy',
        undefined,
        {
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/corporations/stats
 * Obtiene estadísticas de corporaciones
 */
export async function STATS(_req: NextRequest) {
  return withAuth(async () => {
    try {
      const stats = await corporationsRepository.getStats();

      return NextResponse.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(_req);
}
