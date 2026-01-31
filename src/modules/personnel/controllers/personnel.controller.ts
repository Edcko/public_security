/**
 * Personnel Controller
 *
 * HTTP handlers para el módulo de personal policial.
 * Todas las rutas requieren autenticación y tienen RLS activado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { personnelRepository } from '../repositories/personnel.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { createOfficerSchema } from '@/shared/validation/validators';

/**
 * GET /api/personnel
 * Obtiene todo el personal de la corporación
 */
export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;

      // Verificar permisos (todos los roles autenticados pueden leer)
      const personnel = await personnelRepository.findAll();

      // Log de auditoría (LFPDPPP)
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'personnel',
        undefined,
        {
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json({
        success: true,
        data: personnel,
        count: personnel.length,
      });
    } catch (error) {
      console.error('Error fetching personnel:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/personnel
 * Crea un nuevo oficial (solo admin)
 */
export async function POST(req: NextRequest) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      // Validar con Zod
      const validatedData = createOfficerSchema.parse(body);

      // Verificar que la corporación coincide
      if (validatedData.corporationId !== user.corporationId && user.role !== 'national_admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Cannot create officer for different corporation' },
          { status: 403 }
        );
      }

      // Crear oficial
      const newOfficer = await personnelRepository.create(validatedData);

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'CREATE',
        'personnel',
        newOfficer.id,
        {
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json(
        {
          success: true,
          data: newOfficer,
          message: 'Officer created successfully',
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

      console.error('Error creating officer:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'CREATE',
        'personnel',
        error.message
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
