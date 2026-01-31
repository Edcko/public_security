/**
 * Health Check API Endpoint
 * Used by load balancers and monitoring systems
 */

import { NextResponse } from 'next/server';
import { db } from '@/shared/database/connection';

export async function GET() {
  try {
    // Check database connection
    await db.execute('SELECT 1');

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        redis: process.env.REDIS_URL ? 'configured' : 'not configured',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
