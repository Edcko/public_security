/**
 * Health Check API Routes
 *
 * Endpoints para monitoreo de salud del sistema
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/database/connection';

/**
 * GET /api/health
 * Health check básico
 */
export async function GET(req: NextRequest) {
  try {
    // Chequear conexión a BD
    let dbStatus = 'disconnected';
    let dbLatency: number | null = null;

    try {
      const start = Date.now();
      await db.execute('SELECT 1');
      dbLatency = Date.now() - start;
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Chequear memoria
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Determinar status general
    const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'unhealthy';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
        memory: {
          status: memoryPercent < 90 ? 'healthy' : 'warning',
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          percent: memoryPercent.toFixed(2),
        },
      },
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
