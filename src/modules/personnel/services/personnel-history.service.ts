/**
 * Personnel History Service
 *
 * Registra automáticamente cambios en el personal
 */

import { db } from '@/shared/database/connection';
import { personnelHistory } from '@/shared/database/schema';
import { NextRequest } from 'next/server';

/**
 * Registra un cambio en el personal
 */
export async function logPersonnelChange(params: {
  personnelId: string;
  corporationId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  changes: Record<string, { before?: any; after?: any }>;
  changedBy?: string;
  req?: NextRequest;
}): Promise<void> {
  try {
    // Obtener user ID desde el request si se proporciona
    let changedBy = params.changedBy;
    if (!changedBy && params.req) {
      // Extraer del token JWT
      const token = params.req.headers.get('authorization')?.replace('Bearer ', '');
      if (token) {
        // Decodificar token (simple, sin verificar firma por ahora)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString();
        const payload = JSON.parse(jsonPayload);
        changedBy = payload.userId;
      }
    }

    await db.insert(personnelHistory).values({
      personnelId: params.personnelId,
      corporationId: params.corporationId,
      action: params.action,
      changes: JSON.stringify(params.changes),
      changedBy,
      metadata: JSON.stringify({
        ipAddress: params.req?.headers.get('x-forwarded-for') || params.req?.headers.get('x-real-ip'),
        userAgent: params.req?.headers.get('user-agent'),
      }),
    });

    console.log(`[Personnel History] Logged ${params.action} for personnel ${params.personnelId}`);
  } catch (error) {
    console.error('[Personnel History] Error logging change:', error);
    // No throw para no bloquear operaciones principales
  }
}

/**
 * Obtiene historial de un oficial
 */
export async function getPersonnelHistory(personnelId: string): Promise<any[]> {
  try {
    const history = await db
      .select()
      .from(personnelHistory)
      .where(eq(personnelHistory.personnelId, personnelId))
      .orderBy(personnelHistory.changedAt);

    return history.map((h) => ({
      ...h,
      changes: JSON.parse(h.changes || '{}'),
      metadata: h.metadata ? JSON.parse(h.metadata) : null,
    }));
  } catch (error) {
    console.error('[Personnel History] Error fetching history:', error);
    return [];
  }
}

import { eq } from 'drizzle-orm';

/**
 * Servicio de historial de personal
 */
export const personnelHistoryService = {
  logPersonnelChange,
  getPersonnelHistory,
};
