/**
 * Corporations Controller
 *
 * HTTP handlers para gestión de corporaciones policiales.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { corporationsRepository } from '../repositories/corporations.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { createCorporationSchema } from '@/shared/validation/validators';

/**
 * GET /api/corporations
 * Obtiene todas las corporaciones (según RLS y rol del usuario)
 */
export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;

      // National admins ven todo, otros ven solo su corporación
      // RLS ya filtra, pero podemos agregar lógica adicional si es necesario
      const corporations = await corporationsRepository.findAll();

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'corporations',
        undefined,
        {
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json({
        success: true,
        data: corporations,
        count: corporations.length,
      });
    } catch (error) {
      console.error('Error fetching corporations:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/corporations
 * Crea nueva corporación (solo national_admin)
 */
export async function POST(req: NextRequest) {
  return withRoles(['national_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      // Validar
      const validatedData = createCorporationSchema.parse(body);

      // Crear corporación
      const newCorporation = await corporationsRepository.create(validatedData);

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'CREATE',
        'corporations',
        newCorporation.id,
        {
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json(
        {
          success: true,
          data: newCorporation,
          message: 'Corporation created successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      console.error('Error creating corporation:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'CREATE',
        'corporations',
        error.message
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
