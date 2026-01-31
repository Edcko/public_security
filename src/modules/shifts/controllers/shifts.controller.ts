import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRoles } from '@/shared/middleware/auth.guard';
import { shiftsRepository } from '../repositories/shifts.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';

export async function GET(req: NextRequest) {
  return withAuth(async (_req) => {
    const shifts = await shiftsRepository.findAll();

    return NextResponse.json({ success: true, data: shifts });
  })(req);
}

export async function POST(req: NextRequest) {
  return withRoles(['national_admin', 'state_admin', 'municipal_admin'], async (req) => {
    const user = (req as any).user;
    const body = await req.json();

    const newShift = await shiftsRepository.create(body);

    await auditLogger.logSuccess(user.userId, user.corporationId, 'CREATE', 'shifts', newShift.id);

    return NextResponse.json({ success: true, data: newShift }, { status: 201 });
  })(req);
}
