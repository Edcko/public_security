/**
 * Weapons Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { weaponsRepository } from '../repositories/weapons.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { createWeaponSchema } from '@/shared/validation/validators';

export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const weapons = await weaponsRepository.findAll();

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'weapons',
        undefined,
        {
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json({
        success: true,
        data: weapons,
        count: weapons.length,
      });
    } catch (error) {
      console.error('Error fetching weapons:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

export async function POST(req: NextRequest) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      const validatedData = createWeaponSchema.parse(body);
      const newWeapon = await weaponsRepository.create(validatedData);

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'CREATE',
        'weapons',
        newWeapon.id
      );

      return NextResponse.json(
        {
          success: true,
          data: newWeapon,
          message: 'Weapon created successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { success: false, error: 'Validation Error', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error creating weapon:', error);
      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'CREATE',
        'weapons',
        error.message
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
