/**
 * Personnel by ID Controller
 *
 * HTTP handlers para operaciones individuales sobre personal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { personnelRepository } from '../repositories/personnel.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { updateOfficerSchema } from '@/shared/validation/validators';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/personnel/:id
 * Obtiene un oficial por ID
 */
export async function GET(req: NextRequest, context: RouteContext) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;

      const officer = await personnelRepository.findById(id);

      if (!officer) {
        return NextResponse.json(
          { success: false, error: 'Officer not found' },
          { status: 404 }
        );
      }

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'personnel',
        officer.id
      );

      return NextResponse.json({
        success: true,
        data: officer,
      });
    } catch (error) {
      console.error('Error fetching officer:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PATCH /api/personnel/:id
 * Actualiza un oficial (solo admin)
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;
      const body = await req.json();

      // Validar con Zod
      const validatedData = updateOfficerSchema.parse(body);

      // Actualizar oficial
      const updated = await personnelRepository.update(id, validatedData);

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Officer not found' },
          { status: 404 }
        );
      }

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'UPDATE',
        'personnel',
        updated.id
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Officer updated successfully',
      });
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

      console.error('Error updating officer:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'UPDATE',
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

/**
 * DELETE /api/personnel/:id
 * Elimina un oficial (solo admin nacional)
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;

      const officer = await personnelRepository.findById(id);

      if (!officer) {
        return NextResponse.json(
          { success: false, error: 'Officer not found' },
          { status: 404 }
        );
      }

      await personnelRepository.delete(id);

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'DELETE',
        'personnel',
        id
      );

      return NextResponse.json({
        success: true,
        message: 'Officer deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting officer:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'DELETE',
        'personnel',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
