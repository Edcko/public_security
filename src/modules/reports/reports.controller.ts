/**
 * Reports Controller
 *
 * Endpoints para generación de reportes y analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import {
  generateReport,
  scheduleReport,
  getAvailableReports,
  ReportType,
  ReportFormat,
} from './reports.service';

/**
 * POST /api/reports/generate
 * Genera un reporte
 */
export async function POST_GENERATE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const {
        type,
        format,
        filters,
        includeCharts,
        includeSummary,
        groupBy,
        sortBy,
        sortOrder,
      } = body;

      if (!type || !format) {
        return NextResponse.json(
          { success: false, error: 'type and format are required' },
          { status: 400 }
        );
      }

      if (!filters || !filters.startDate || !filters.endDate) {
        return NextResponse.json(
          { success: false, error: 'filters with startDate and endDate are required' },
          { status: 400 }
        );
      }

      const result = await generateReport({
        type: type as ReportType,
        format: format as ReportFormat,
        filters: {
          ...filters,
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate),
        },
        includeCharts,
        includeSummary,
        groupBy,
        sortBy,
        sortOrder,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        format: result.format,
        filename: result.filename,
        mimeType: result.mimeType,
      });
    } catch (error: any) {
      console.error('Report generation error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/reports/schedule
 * Agenda un reporte recurrente
 */
export async function POST_SCHEDULE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { type, format, schedule, filters, recipients } = body;

      if (!type || !format || !schedule) {
        return NextResponse.json(
          { success: false, error: 'type, format, and schedule are required' },
          { status: 400 }
        );
      }

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json(
          { success: false, error: 'recipients array is required' },
          { status: 400 }
        );
      }

      const success = await scheduleReport({
        type: type as ReportType,
        format: format as ReportFormat,
        schedule,
        filters: {
          ...filters,
          startDate: filters.startDate ? new Date(filters.startDate) : new Date(),
          endDate: filters.endDate ? new Date(filters.endDate) : new Date(),
        },
        recipients,
      });

      return NextResponse.json({
        success,
      });
    } catch (error: any) {
      console.error('Report scheduling error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/reports/available
 * Retorna la lista de reportes disponibles
 */
export async function GET_AVAILABLE(_req: NextRequest) {
  const reports = getAvailableReports();

  return NextResponse.json({
    success: true,
    data: reports,
  });
}
