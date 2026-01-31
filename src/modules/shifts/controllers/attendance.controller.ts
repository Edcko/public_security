import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/auth.guard';
import { shiftsRepository } from '../repositories/shifts.repository';

export async function POST(req: NextRequest) {
  return withAuth(async (req) => {
    const body = await req.json();
    const user = (req as any).user;

    const { type, shiftId } = body;

    if (type === 'check-in') {
      const attendance = await shiftsRepository.checkIn(user.userId, shiftId, user.corporationId);
      return NextResponse.json({ success: true, data: attendance });
    }

    if (type === 'check-out') {
      const attendance = await shiftsRepository.checkOut(body.attendanceId);
      return NextResponse.json({ success: true, data: attendance });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  })(req);
}
