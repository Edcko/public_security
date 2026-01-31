/**
 * Personnel Statistics API Route
 *
 * Proporciona estadísticas y métricas del personal
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { db } from '@/shared/database/connection';
import { personnel, corporations } from '@/shared/database/schema';
import { sql, eq, and, gte, lte, count, between } from 'drizzle-orm';

/**
 * GET /api/personnel/statistics
 * Retorna estadísticas del personal
 */
export async function GET(req: NextRequest) {
  return withAuth(async () => {
    try {
      const { searchParams } = new URL(req.url);
      const corporationId = searchParams.get('corporationId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Construir condiciones WHERE
      let whereConditions = [];

      if (corporationId) {
        whereConditions.push(eq(personnel.corporationId, corporationId));
      }

      if (startDate && endDate) {
        whereConditions.push(
          between(personnel.createdAt, new Date(startDate), new Date(endDate))
        );
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // 1. Distribución por rango
      const rankDistribution = await db
        .select({
          rank: personnel.rank,
          count: count(),
        })
        .from(personnel)
        .where(whereClause)
        .groupBy(personnel.rank)
        .orderBy(desc(count()));

      // 2. Distribución por estado
      const statusDistribution = await db
        .select({
          status: personnel.status,
          count: count(),
        })
        .from(personnel)
        .where(whereClause)
        .groupBy(personnel.status);

      // 3. Personal por corporación
      const personnelByCorporation = await db
       select({
          corporationId: personnel.corporationId,
          corporationName: corporations.name,
          count: count(),
        })
        .from(personnel)
        .innerJoin(corporations, eq(personnel.corporationId, corporations.id))
        .where(whereClause)
        .groupBy(personnel.corporationId, corporations.name)
        .orderBy(desc(count()));

      // 4. Total de personal
      const totalCountResult = await db
        .select({ count: count() })
        .from(personnel)
        .where(whereClause);

      const total = totalCountResult[0].count;

      // 5. Crecimiento mensual (nuevos altas en el último mes)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const newLastMonth = await db
        .select({ count: count() })
        .from(personnel)
        .where(
          and(
            gte(personnel.createdAt, oneMonthAgo),
            whereClause || sql`${personnel.corporationId} IS NOT NULL`
          )
        );

      // 6. Personal disponible (estado = active)
      const availableResult = await db
        .select({ count: count() })
        .from(personnel)
        .where(
          and(
            eq(personnel.status, 'active'),
            whereClause || sql`${personnel.corporationId} IS NOT NULL`
          )
        );

      return NextResponse.json({
        success: true,
        data: {
          total,
          available: availableResult[0].count,
          newLastMonth: newLastMonth[0].count,
          rankDistribution: rankDistribution.map((r: any) => ({
            rank: r.rank,
            count: Number(r.count),
            percentage: total > 0 ? ((Number(r.count) / total) * 100).toFixed(1) : '0',
          })),
          statusDistribution: statusDistribution.map((s: any) => ({
            status: s.status,
            count: Number(s.count),
            percentage: total > 0 ? ((Number(s.count) / total) * 100).toFixed(1) : '0',
          })),
          personnelByCorporation: personnelByCorporation.map((p: any) => ({
            corporationId: p.corporationId,
            corporationName: p.corporationName,
            count: Number(p.count),
            percentage: total > 0 ? ((Number(p.count) / total) * 100).toFixed(1) : '0',
          })),
        },
      });
    } catch (error: any) {
      console.error('Error fetching personnel statistics:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener estadísticas' },
        { status: 500 }
      );
    }
  })(req);
}
