/**
 * Corporations by ID Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { corporationsRepository } from '../repositories/corporations.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { updateCorporationSchema } from '@/shared/validation/validators';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/corporations/:id
 */
export async function GET(req: NextRequest, context: RouteContext) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;

      const corporation = await corporationsRepository.findById(id);

      if (!corporation) {
        return NextResponse.json(
          { success: false, error: 'Corporation not found' },
          { status: 404 }
        );
      }

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'corporations',
        corporation.id
      );

      return NextResponse.json({
        success: true,
        data: corporation,
      });
    } catch (error) {
      console.error('Error fetching corporation:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PATCH /api/corporations/:id
 * Actualiza corporación (solo admins)
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin', 'state_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;
      const body = await req.json();

      // Validar
      const validatedData = updateCorporationSchema.parse(body);

      // Actualizar
      const updated = await corporationsRepository.update(id, validatedData);

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Corporation not found' },
          { status: 404 }
        );
      }

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'UPDATE',
        'corporations',
        updated.id
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Corporation updated successfully',
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

      console.error('Error updating corporation:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'UPDATE',
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

/**
 * DELETE /api/corporations/:id
 * Elimina corporación (solo national_admin)
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;

      const corporation = await corporationsRepository.findById(id);

      if (!corporation) {
        return NextResponse.json(
          { success: false, error: 'Corporation not found' },
          { status: 404 }
        );
      }

      await corporationsRepository.delete(id);

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'DELETE',
        'corporations',
        id
      );

      return NextResponse.json({
        success: true,
        message: 'Corporation deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting corporation:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'DELETE',
        'corporations',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
