/**
 * Weapons by ID Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { weaponsRepository } from '../repositories/weapons.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  return withAuth(async (_req) => {
    try {
      const { id } = await context.params;
      const weapon = await weaponsRepository.findById(id);

      if (!weapon) {
        return NextResponse.json(
          { success: false, error: 'Weapon not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: weapon });
    } catch (error) {
      console.error('Error fetching weapon:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;
      const body = await req.json();

      const updated = await weaponsRepository.update(id, body);

      await auditLogger.logSuccess(user.userId, user.corporationId, 'UPDATE', 'weapons', id);

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Weapon updated successfully',
      });
    } catch (error) {
      console.error('Error updating weapon:', error);
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

      await weaponsRepository.delete(id);

      await auditLogger.logSuccess(user.userId, user.corporationId, 'DELETE', 'weapons', id);

      return NextResponse.json({
        success: true,
        message: 'Weapon deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting weapon:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
