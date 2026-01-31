/**
 * Email Reports API Route
 *
 * Endpoint para enviar reportes por email
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { emailService } from '@/shared/email/email.service';

/**
 * POST /api/reports/email
 * Envía un reporte por email
 */
export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await req.json();
      const {
        reportType,
        reportUrl,
        reportName,
        startDate,
        endDate,
        recipientEmail,
      } = body;

      if (!reportType || !reportUrl || !recipientEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'reportType, reportUrl, and recipientEmail are required',
          },
          { status: 400 }
        );
      }

      // Enviar email con el reporte
      const sent = await emailService.sendReport(
        recipientEmail,
        reportName || `Reporte_${reportType}`,
        reportUrl,
        reportType,
        startDate,
        endDate,
        user.firstName || 'Usuario'
      );

      if (!sent) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to send email. Check SMTP configuration.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Report sent successfully',
        data: {
          recipient: recipientEmail,
          reportType,
          sentAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error sending report by email:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
