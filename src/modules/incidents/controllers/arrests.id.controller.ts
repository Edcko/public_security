/**
 * Arrest by ID Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { arrestsRepository } from '../repositories/arrests.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { updateArrestSchema } from '@/shared/validation/validators';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  return withAuth(async (_req) => {
    try {
      const { id } = await context.params;
      const arrest = await arrestsRepository.findById(id);

      if (!arrest) {
        return NextResponse.json(
          { success: false, error: 'Arrest not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: arrest,
      });
    } catch (error) {
      console.error('Error fetching arrest:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(_req);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;
      const body = await req.json();

      const validatedData = updateArrestSchema.parse(body);
      const updated = await arrestsRepository.update(id, validatedData);

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Arrest not found' },
          { status: 404 }
        );
      }

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'UPDATE',
        'arrests',
        id
      );

      return NextResponse.json({
        success: true,
        data: updated,
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

      console.error('Error updating arrest:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'UPDATE',
        'arrests',
        error.message
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;

      await arrestsRepository.delete(id);

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'DELETE',
        'arrests',
        id
      );

      return NextResponse.json({
        success: true,
        message: 'Arrest deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting arrest:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'DELETE',
        'arrests',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
