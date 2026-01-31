/**
 * Corporation Context Middleware
 *
 * This middleware sets the Row-Level Security (RLS) context for each request.
 * It ensures that all database queries are automatically filtered by corporation_id.
 *
 * CRITICAL: This must run AFTER authentication middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { setCorporationContext, clearCorporationContext } from '@/shared/database/connection';

/**
 * Middleware que setea el contexto de RLS basado en el JWT token
 */
export async function corporationContextMiddleware(req: NextRequest) {
  // El token ya fue validado por auth middleware
  const authorization = req.headers.get('authorization');

  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Extraer corporation_id del token (previamente validado)
    // const token = authorization.replace('Bearer ', '');

    // TODO: Decodificar y validar el JWT
    // Por ahora, simulamos extracción de corporationId
    // const decoded = await verifyJWT(token);
    // const corporationId = decoded.corporationId;

    // TEMPORAL: Remover cuando JWT esté implementado
    const corporationId = req.headers.get('X-Corporation-ID');

    if (!corporationId) {
      return NextResponse.json({ error: 'Corporation ID missing' }, { status: 400 });
    }

    // Setear contexto de RLS para esta request
    await setCorporationContext(corporationId);

    // Crear response y limpiar contexto después
    const response = NextResponse.next();
    response.headers.set('X-Corporation-ID', corporationId);

    // Asegurar que limpiamos el contexto
    response.headers.set('X-Cleanup-Context', 'true');

    return response;
  } catch (error) {
    console.error('Error in corporation context middleware:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Middleware wrapper que limpia el contexto después de la response
 */
export async function withCorporationCleanup(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const response = await handler(req);

  // Limpiar contexto de RLS
  await clearCorporationContext();

  return response;
}
