/**
 * Liveness Probe API Route
 *
 * GET /api/health/live
 * Indica si la aplicación está viva
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Si el servidor responde, está vivo
  return NextResponse.json(
    { status: 'alive', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
