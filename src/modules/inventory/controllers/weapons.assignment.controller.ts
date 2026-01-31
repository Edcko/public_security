/**
 * Weapons Assignment Controller
 *
 * Asignación/desasignación de armas a oficiales
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/shared/middleware/auth.guard';
import { weaponsRepository } from '../repositories/weapons.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { assignWeaponSchema } from '@/shared/validation/validators';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/weapons/:id/assign
 * Asigna arma a oficial
 */
export async function POST(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;
      const body = await req.json();

      const { officerId } = assignWeaponSchema.parse(body);

      const updated = await weaponsRepository.assignToOfficer(id, officerId);

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'UPDATE',
        'weapons-assignment',
        id
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Weapon assigned successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { success: false, error: 'Validation Error', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error assigning weapon:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/weapons/:id/assign
 * Desasigna arma
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;

      const updated = await weaponsRepository.unassign(id);

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'UPDATE',
        'weapons-assignment',
        id
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Weapon unassigned successfully',
      });
    } catch (error) {
      console.error('Error unassigning weapon:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
