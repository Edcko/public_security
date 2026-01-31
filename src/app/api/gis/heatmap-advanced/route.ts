/**
 * Advanced Heatmap API Route
 *
 * Genera heatmap con clustering DBSCAN/K-Means
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { heatmapService } from '@/modules/gis/services/heatmap.service';
import { GeoPoint } from '@/modules/gis/services/clustering.service';

/**
 * POST /api/gis/heatmap-advanced
 * Genera heatmap avanzado con clustering
 */
export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await req.json();
      const {
        points,
        algorithm = 'dbscan',
        epsilon = 0.5,
        minPts = 5,
        k = 5,
        gridSize = 0.5,
        threshold = 10,
      } = body;

      if (!points || !Array.isArray(points) || points.length === 0) {
        return NextResponse.json(
          { success: false, error: 'points array is required' },
          { status: 400 }
        );
      }

      // Validar formato de puntos
      const validPoints: GeoPoint[] = points
        .filter((p: any) => p.latitude !== undefined && p.longitude !== undefined)
        .map((p: any) => ({
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          weight: p.weight ? parseFloat(p.weight) : 1,
          incidentId: p.incidentId,
          crimeType: p.crimeType,
          timestamp: p.timestamp,
        }));

      if (validPoints.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid points provided' },
          { status: 400 }
        );
      }

      // Generar heatmap
      const heatmapData = heatmapService.generateHeatmap(validPoints, {
        algorithm,
        epsilon,
        minPts,
        k,
        gridSize,
        threshold,
      });

      return NextResponse.json({
        success: true,
        data: heatmapData,
      });
    } catch (error: any) {
      console.error('Advanced heatmap generation error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
