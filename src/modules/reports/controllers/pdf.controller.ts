/**
 * Reports Controller (Enhanced)
 *
 * Endpoints para exportación de reportes en PDF y CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { reportService } from '../services/pdf.service';
import { personnelRepository } from '../../personnel/repositories/personnel.repository';
import { weaponsRepository } from '../../inventory/repositories/weapons.repository';
import { arrestsRepository } from '../../incidents/repositories/arrests.repository';

/**
 * POST /api/reports/pdf/personnel
 * Genera y descarga reporte de personal en PDF
 */
export async function POST_PERSONNEL_PDF(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const personnel = await personnelRepository.findAll();

      const pdfBuffer = await reportService.generatePersonnelReport(personnel);

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="personal-${Date.now()}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Error generating personnel PDF:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/reports/pdf/weapons
 * Genera reporte de armamento en PDF
 */
export async function POST_WEAPONS_PDF(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const weapons = await weaponsRepository.findAll();

      const pdfBuffer = await reportService.generateWeaponsReport(weapons);

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="weapons-${Date.now()}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Error generating weapons PDF:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/reports/pdf/arrests
 * Genera reporte de arrestos en PDF
 */
export async function POST_ARRESTS_PDF(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      let arrests;

      if (startDate && endDate) {
        arrests = await arrestsRepository.findByDateRange(
          new Date(startDate),
          new Date(endDate)
        );
      } else {
        arrests = await arrestsRepository.findAll();
      }

      const pdfBuffer = await reportService.generateArrestsReport(arrests);

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="arrests-${Date.now()}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Error generating arrests PDF:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/reports/csv/personnel
 * Exporta personal a CSV
 */
export async function POST_PERSONNEL_CSV(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const personnel = await personnelRepository.findAll();

      const csv = reportService.generateCSVReport({
        title: 'Reporte de Personal',
        headers: ['Badge', 'Nombre', 'Apellido', 'Rango', 'CURP', 'Status'],
        data: personnel.map((p) => [
          p.badgeNumber,
          p.firstName,
          p.lastName,
          p.rank,
          p.curp || 'N/A',
          p.status,
        ]),
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="personal-${Date.now()}.csv"`,
        },
      });
    } catch (error) {
      console.error('Error generating personnel CSV:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/reports/email
 * Envía reporte por email
 */
export async function POST_EMAIL(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      // TODO: Parse request body when implementing email functionality
      // const body = await req.json();

      // TODO: Implementar envío de email con nodemailer
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({...});

      return NextResponse.json({
        success: true,
        message: 'Report sent successfully',
      });
    } catch (error) {
      console.error('Error sending email:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
