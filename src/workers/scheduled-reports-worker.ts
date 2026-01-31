/**
 * Scheduled Reports Worker
 *
 * Worker que ejecuta reportes programados
 * Se puede ejecutar con cron o node-cron
 *
 * Ejemplo de configuración de crontab:
 * # Ejecutar cada hora para verificar reportes pendientes
 * 0 * * * * /path/to/node /path/to/worker.js
 *
 * O usando node-cron en package.json:
 * "scheduled-reports": "node workers/scheduled-reports-worker.js"
 */

import { scheduledReportsService } from '../modules/reports/services/scheduled-reports.service';
import { db } from '../shared/database/connection';

/**
 * Ejecuta un reporte programado
 */
async function executeScheduledReport(report: any): Promise<void> {
  console.log(`[Scheduled Reports] Executing report: ${report.name} (${report.id})`);

  try {
    // Generar fechas para el reporte
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (report.frequency) {
      case 'daily':
        // Ayer
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'weekly':
        // Semana pasada (Lunes a Domingo)
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (now.getDay() || 7)); // Domingo anterior
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6); // 6 días antes
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'monthly':
        // Mes anterior
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Último día del mes actual
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        throw new Error(`Invalid frequency: ${report.frequency}`);
    }

    // Generar URL del reporte
    const reportUrl = scheduledReportsService.generateReportUrl(
      report.reportType,
      report.id,
      startDate.toISOString(),
      endDate.toISOString()
    );

    console.log(`[Scheduled Reports] Report URL: ${reportUrl}`);

    // Enviar email a cada destinatario
    const { emailService } = await import('../shared/email/email.service');
    const recipientEmails = report.recipientEmails;

    for (const email of recipientEmails) {
      const sent = await emailService.sendReport(
        email,
        `${report.name} - ${new Date().toLocaleDateString()}`,
        reportUrl,
        report.reportType,
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (sent) {
        console.log(`[Scheduled Reports] Email sent to: ${email}`);
      } else {
        console.error(`[Scheduled Reports] Failed to send email to: ${email}`);
      }
    }

    // Marcar reporte como ejecutado
    await scheduledReportsService.markReportAsRun(report.id);

    console.log(`[Scheduled Reports] Report executed successfully: ${report.name}`);
  } catch (error: any) {
    console.error(`[Scheduled Reports] Error executing report ${report.id}:`, error);
  }
}

/**
 * Ejecuta todos los reportes pendientes
 */
export async function runScheduledReportsWorker(): Promise<void> {
  try {
    console.log('[Scheduled Reports] Worker started');

    // Conectar a BD
    await db.connect();

    // Obtener reportes que deben ejecutarse
    const dueReports = await scheduledReportsService.getDueReports();

    console.log(`[Scheduled Reports] Found ${dueReports.length} due reports`);

    if (dueReports.length === 0) {
      console.log('[Scheduled Reports] No due reports found');
      return;
    }

    // Ejecutar cada reporte
    for (const report of dueReports) {
      await executeScheduledReport(report);
    }

    console.log('[Scheduled Reports] Worker completed');
  } catch (error: any) {
    console.error('[Scheduled Reports] Worker error:', error);
  } finally {
    await db.disconnect();
  }
}

/**
 * Ejecutar worker si este archivo es ejecutado directamente
 */
if (require.main === module) {
  runScheduledReportsWorker()
    .then(() => {
      console.log('[Scheduled Reports] Worker finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Scheduled Reports] Worker failed:', error);
      process.exit(1);
    });
}
