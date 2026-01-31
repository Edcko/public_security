/**
 * Readiness Probe API Route
 *
 * GET /api/health/ready
 * Indica si la aplicación está lista para recibir tráfico
 */

import { NextResponse } from 'next/server';
import { db } from '@/shared/database/connection';

export async function GET() {
  try {
    // Verificar conexión a BD
    await db.execute('SELECT 1');

    return NextResponse.json(
      { status: 'ready' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Readiness check failed:', error);
    return NextResponse.json(
      { status: 'not_ready', error: error.message },
      { status: 503 }
    );
  }
}
