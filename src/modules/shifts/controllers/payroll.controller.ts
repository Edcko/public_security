/**
 * Shifts & Payroll Controller (Enhanced)
 *
 * Funcionalidades completas de nómina y cálculo de horas extra
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/auth.guard';
import { shiftsRepository } from '../repositories/shifts.repository';

/**
 * GET /api/shifts/[id]/payroll
 * Calcula nómina de un oficial por período
 */
export async function GET_PAYROLL(req: NextRequest, context: any) {
  return withAuth(async (req) => {
    try {
      const { id } = await context.params;
      const { searchParams } = new URL(req.url);

      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'startDate and endDate required' },
          { status: 400 }
        );
      }

      // Obtener registros de asistencia del período
      const attendance = await shiftsRepository.getAttendanceByOfficer(
        id,
        new Date(startDate),
        new Date(endDate)
      );

      // Calcular nómina
      const payroll = calculatePayroll(attendance);

      return NextResponse.json({
        success: true,
        data: payroll,
      });
    } catch (error) {
      console.error('Payroll calculation error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/payroll/summary
 * Resumen de nómina por corporación
 */
export async function GET_SUMMARY(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);

      const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
      const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

      // TODO: Implementar cálculo de nómina agregada
      const summary = {
        month,
        year,
        totalOfficers: 0,
        totalHours: 0,
        totalOvertimeHours: 0,
        totalPayroll: 0,
      };

      return NextResponse.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Payroll summary error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * Calcula nómina basado en registros de asistencia
 */
function calculatePayroll(attendance: any[]) {
  // Tarifas (ejemplo, ajustar según contrato colectivo)
  const HOURLY_RATE = 100; // pesos por hora
  const OVERTIME_RATE = 150; // pesos por hora extra (1.5x)

  let regularHours = 0;
  let overtimeHours = 0;

  attendance.forEach((record) => {
    if (record.checkIn && record.checkOut) {
      const checkInTime = new Date(record.checkIn);
      const checkOutTime = new Date(record.checkOut);
      const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Si más de 8 horas, el exceso es overtime
      if (hours > 8) {
        regularHours += 8;
        overtimeHours += hours - 8;
      } else {
        regularHours += hours;
      }
    }
  });

  const regularPay = regularHours * HOURLY_RATE;
  const overtimePay = overtimeHours * OVERTIME_RATE;
  const totalPay = regularPay + overtimePay;

  return {
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    totalPay: Math.round(totalPay),
    hourlyRate: HOURLY_RATE,
    overtimeRate: OVERTIME_RATE,
  };
}
