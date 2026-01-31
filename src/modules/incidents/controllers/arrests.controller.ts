import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { arrestsRepository } from '../repositories/arrests.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { createArrestSchema } from '@/shared/validation/validators';

export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    const user = (req as any).user;
    const arrests = await arrestsRepository.findAll();

    await auditLogger.logSuccess(user.userId, user.corporationId, 'READ', 'arrests');

    return NextResponse.json({ success: true, data: arrests, count: arrests.length });
  })(req);
}

export async function POST(req: NextRequest) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin', 'officer'], async (req) => {
    const user = (req as any).user;
    const body = await req.json();

    const validatedData = createArrestSchema.parse(body);
    const newArrest = await arrestsRepository.create(validatedData);

    await auditLogger.logSuccess(user.userId, user.corporationId, 'CREATE', 'arrests', newArrest.id);

    return NextResponse.json({ success: true, data: newArrest }, { status: 201 });
  })(req);
}
