/**
 * Shifts Repository
 */

import { db } from '@/shared/database/connection';
import { shifts, attendance } from '@/shared/database/schema-extended';
import { eq, and, gte, lte } from 'drizzle-orm';

export const shiftsRepository = {
  async findAll() {
    return await db.select().from(shifts).where(eq(shifts.isActive, true));
  },

  async findById(id: string) {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  },

  async create(data: any) {
    const [newShift] = await db.insert(shifts).values(data).returning();
    return newShift;
  },

  // Attendance
  async checkIn(officerId: string, shiftId: string, corporationId: string) {
    const [newAttendance] = await db
      .insert(attendance)
      .values({
        corporationId,
        officerId,
        shiftId,
        checkIn: new Date(),
        date: new Date(),
      })
      .returning();

    return newAttendance;
  },

  async checkOut(attendanceId: string) {
    const [updated] = await db
      .update(attendance)
      .set({ checkOut: new Date() })
      .where(eq(attendance.id, attendanceId))
      .returning();

    return updated;
  },

  async getAttendanceByDate(date: Date) {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, date));
  },

  async getAttendanceByOfficer(officerId: string, startDate: Date, endDate: Date) {
    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.officerId, officerId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      );
  },
};
