/**
 * Audit Logger (LFPDPPP Compliance)
 *
 * Registro obligatorio de todas las operaciones con datos personales
 * según la Ley Federal de Protección de Datos Personales en Posesión de
 * Particulares (LFPDPPP).
 */

import { db } from '@/shared/database/connection';
import { auditLogs } from '@/shared/database/schema';

export interface AuditLogEntry {
  userId: string;
  corporationId: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

/**
 * Logger de auditoría para cumplimiento LFPDPPP
 *
 * Registra TODAS las operaciones que involucran datos personales.
 */
export const auditLogger = {
  /**
   * Registra una operación en el log de auditoría
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: entry.userId,
        corporationId: entry.corporationId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        success: entry.success,
        failureReason: entry.failureReason,
      });
    } catch (error) {
      // No fallar la request si el audit log falla,
      // pero loggear el error para debugging
      console.error('Failed to write audit log:', error);
    }
  },

  /**
   * Wrapper que automáticamente loggea operaciones exitosas
   */
  async logSuccess(
    userId: string,
    corporationId: string,
    action: AuditLogEntry['action'],
    resource: string,
    resourceId?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      corporationId,
      action,
      resource,
      resourceId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      success: true,
    });
  },

  /**
   * Wrapper que automáticamente loggea operaciones fallidas
   */
  async logFailure(
    userId: string,
    corporationId: string,
    action: AuditLogEntry['action'],
    resource: string,
    failureReason: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      corporationId,
      action,
      resource,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      success: false,
      failureReason,
    });
  },

  /**
   * Consulta logs de auditoría de una corporación
   * (RLS filtra automáticamente por corporation_id)
   */
  async getAuditLogs(_filters?: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    // TODO: Implementar filtros con Drizzle queries
    // Por ahora, retornamos todos los logs de la corporación
    return await db.select().from(auditLogs);
  },
};

/**
 * Decorador para automáticamente loggear operaciones de repositorios
 */
export function Audited(
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  resource: string
) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Extraer metadata de los argumentos
      const userId = args[0]?.userId; // Primer arg suele tener userId
      const corporationId = args[0]?.corporationId;

      try {
        const result = await originalMethod.apply(this, args);

        // Log success
        await auditLogger.logSuccess(
          userId,
          corporationId,
          action,
          resource,
          result?.id
        );

        return result;
      } catch (error) {
        // Log failure
        await auditLogger.logFailure(
          userId,
          corporationId,
          action,
          resource,
          error instanceof Error ? error.message : 'Unknown error'
        );

        throw error;
      }
    };

    return descriptor;
  };
}
