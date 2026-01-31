/**
 * Scheduled Reports API Routes
 *
 * Gestión de reportes programados recurrentes
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { scheduledReportsService } from '@/modules/reports/services/scheduled-reports.service';

/**
 * GET /api/reports/schedule
 * Obtiene reportes programados del usuario
 */
export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const includeInactive = searchParams.get('includeInactive') === 'true';

      const reports = await scheduledReportsService.getScheduledReports(
        user.corporationId,
        includeInactive
      );

      return NextResponse.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      console.error('Error fetching scheduled reports:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/reports/schedule
 * Crea un nuevo reporte programado
 */
export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await req.json();
      const {
        name,
        reportType,
        frequency,
        recipientEmails,
        parameters,
      } = body;

      if (!name || !reportType || !frequency || !recipientEmails) {
        return NextResponse.json(
          {
            success: false,
            error: 'name, reportType, frequency, and recipientEmails are required',
          },
          { status: 400 }
        );
      }

      const report = await scheduledReportsService.createScheduledReport({
        corporationId: user.corporationId,
        name,
        reportType,
        frequency,
        recipientEmails,
        parameters,
      });

      return NextResponse.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error creating scheduled report:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PATCH /api/reports/schedule
 * Actualiza un reporte programado
 */
export async function PATCH(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'id is required' },
          { status: 400 }
        );
      }

      const updated = await scheduledReportsService.updateScheduledReport(id, updates);

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Scheduled report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating scheduled report:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/reports/schedule
 * Elimina un reporte programado
 */
export async function DELETE(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'id is required' },
          { status: 400 }
        );
      }

      const deleted = await scheduledReportsService.deleteScheduledReport(id);

      if (!deleted) {
        return NextResponse.json(
          { success: false, error: 'Scheduled report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Scheduled report deleted',
      });
    } catch (error: any) {
      console.error('Error deleting scheduled report:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
