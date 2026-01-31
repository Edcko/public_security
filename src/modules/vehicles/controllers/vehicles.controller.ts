import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { vehiclesRepository } from '../repositories/vehicles.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { createVehicleSchema } from '@/shared/validation/validators';

export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    const user = (req as any).user;
    const vehicles = await vehiclesRepository.findAll();

    await auditLogger.logSuccess(user.userId, user.corporationId, 'READ', 'vehicles');

    return NextResponse.json({ success: true, data: vehicles });
  })(req);
}

export async function POST(req: NextRequest) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    const user = (req as any).user;
    const body = await req.json();

    const validatedData = createVehicleSchema.parse(body);
    const newVehicle = await vehiclesRepository.create(validatedData);

    await auditLogger.logSuccess(user.userId, user.corporationId, 'CREATE', 'vehicles', newVehicle.id);

    return NextResponse.json({ success: true, data: newVehicle }, { status: 201 });
  })(req);
}
