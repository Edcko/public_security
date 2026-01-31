/**
 * Scheduled Reports Service
 *
 * Gestiona reportes programados recurrentes
 */

import { db } from '@/shared/database/connection';
import { scheduledReports } from '@/shared/database/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';

/**
 * Reporte programado
 */
export interface ScheduledReport {
  id: string;
  corporationId: string;
  name: string;
  reportType: 'personnel' | 'vehicles' | 'weapons' | 'arrests' | 'payroll';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipientEmails: string[];
  parameters?: Record<string, any>;
  lastRunAt?: Date;
  nextRunAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parámetros para crear reporte programado
 */
export interface CreateScheduledReportParams {
  corporationId: string;
  name: string;
  reportType: 'personnel' | 'vehicles' | 'weapons' | 'arrests' | 'payroll';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipientEmails: string | string[];
  parameters?: Record<string, any>;
}

/**
 * Calcula la próxima fecha de ejecución
 */
function calculateNextRun(
  frequency: 'daily' | 'weekly' | 'monthly',
  lastRun?: Date
): Date {
  const now = new Date();
  let nextRun: Date;

  switch (frequency) {
    case 'daily':
      // Siguiente día a las 6:00 AM
      nextRun = new Date(now);
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(6, 0, 0, 0);
      break;

    case 'weekly':
      // Siguiente lunes a las 6:00 AM
      nextRun = new Date(now);
      const daysUntilMonday = (1 + 7 - nextRun.getDay()) % 7 || 7;
      nextRun.setDate(nextRun.getDate() + daysUntilMonday);
      nextRun.setHours(6, 0, 0, 0);
      break;

    case 'monthly':
      // Primer día del próximo mes a las 6:00 AM
      nextRun = new Date(now);
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(1);
      nextRun.setHours(6, 0, 0, 0);
      break;

    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  return nextRun;
}

/**
 * Crea un reporte programado
 */
export async function createScheduledReport(
  params: CreateScheduledReportParams
): Promise<ScheduledReport> {
  const nextRunAt = calculateNextRun(params.frequency);

  const recipientEmailsArray = Array.isArray(params.recipientEmails)
    ? params.recipientEmails
    : [params.recipientEmails];

  const [newReport] = await db
    .insert(scheduledReports)
    .values({
      corporationId: params.corporationId,
      name: params.name,
      reportType: params.reportType,
      frequency: params.frequency,
      recipientEmails: JSON.stringify(recipientEmailsArray),
      parameters: params.parameters ? JSON.stringify(params.parameters) : null,
      nextRunAt,
      isActive: true,
    })
    .returning();

  return newReport as ScheduledReport;
}

/**
 * Obtiene reportes programados de una corporación
 */
export async function getScheduledReports(
  corporationId: string,
  includeInactive: boolean = false
): Promise<ScheduledReport[]> {
  const conditions = includeInactive
    ? undefined
    : eq(scheduledReports.isActive, true);

  const reports = await db
    .select()
    .from(scheduledReports)
    .where(conditions ? and(conditions, eq(scheduledReports.corporationId, corporationId)) : eq(scheduledReports.corporationId, corporationId))
    .orderBy(scheduledReports.nextRunAt);

  return reports.map((r) => ({
    ...r,
    recipientEmails: JSON.parse(r.recipientEmails),
    parameters: r.parameters ? JSON.parse(r.parameters) : undefined,
  })) as ScheduledReport[];
}

/**
 * Actualiza un reporte programado
 */
export async function updateScheduledReport(
  id: string,
  updates: Partial<Omit<ScheduledReport, 'id' | 'corporationId' | 'createdAt'>>
): Promise<ScheduledReport | null> {
  // Si cambió la frecuencia o lastRunAt, recalcular nextRunAt
  let nextRunAt = updates.nextRunAt;

  if (updates.frequency && (!updates.lastRunAt || !nextRunAt)) {
    nextRunAt = calculateNextRun(updates.frequency, updates.lastRunAt);
  }

  const updateData: any = {
    ...updates,
    ...(updates.recipientEmails && { recipientEmails: JSON.stringify(Array.isArray(updates.recipientEmails) ? updates.recipientEmails : [updates.recipientEmails]) }),
    ...(updates.parameters && { parameters: JSON.stringify(updates.parameters) }),
    ...(nextRunAt && { nextRunAt }),
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(scheduledReports)
    .set(updateData)
    .where(eq(scheduledReports.id, id))
    .returning();

  if (!updated) return null;

  return {
    ...updated,
    recipientEmails: JSON.parse(updated.recipientEmails),
    parameters: updated.parameters ? JSON.parse(updated.parameters) : undefined,
  } as ScheduledReport;
}

/**
 * Elimina un reporte programado
 */
export async function deleteScheduledReport(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(scheduledReports)
    .where(eq(scheduledReports.id, id))
    .returning();

  return !!deleted;
}

/**
 * Activa/desactiva un reporte programado
 */
export async function toggleScheduledReport(
  id: string,
  isActive: boolean
): Promise<ScheduledReport | null> {
  return updateScheduledReport(id, { isActive });
}

/**
 * Marca un reporte como ejecutado y programa la siguiente ejecución
 */
export async function markReportAsRun(id: string): Promise<ScheduledReport | null> {
  const report = await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.id, id))
    .limit(1);

  if (!report[0]) return null;

  const nextRunAt = calculateNextRun(report[0].frequency as any);

  return updateScheduledReport(id, {
    lastRunAt: new Date(),
    nextRunAt,
  });
}

/**
 * Obtiene reportes que deben ejecutarse
 */
export async function getDueReports(): Promise<ScheduledReport[]> {
  const now = new Date();

  const reports = await db
    .select()
    .from(scheduledReports)
    .where(
      and(
        eq(scheduledReports.isActive, true),
        gt(scheduledReports.nextRunAt, now)
      )
    )
    .orderBy(scheduledReports.nextRunAt);

  return reports.map((r) => ({
    ...r,
    recipientEmails: JSON.parse(r.recipientEmails),
    parameters: r.parameters ? JSON.parse(r.parameters) : undefined,
  })) as ScheduledReport[];
}

/**
 * Genera URL de descarga para un reporte
 */
function generateReportUrl(
  reportType: string,
  reportId: string,
  startDate: string,
  endDate: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/reports/pdf/${reportType}?id=${reportId}&start=${startDate}&end=${endDate}`;
}

/**
 * Servicio de reportes programados
 */
export const scheduledReportsService = {
  createScheduledReport,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  toggleScheduledReport,
  markReportAsRun,
  getDueReports,
  generateReportUrl,
};
