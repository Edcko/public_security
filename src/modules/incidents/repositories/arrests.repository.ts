/**
 * Arrests Repository
 */

import { db } from '@/shared/database/connection';
import { arrests } from '@/shared/database/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { CreateArrestInput } from '@/shared/validation/validators';

export const arrestsRepository = {
  async findAll() {
    return await db.select().from(arrests);
  },

  async findById(id: string) {
    const [arrest] = await db.select().from(arrests).where(eq(arrests.id, id));
    return arrest;
  },

  async findByOfficer(officerId: string) {
    return await db.select().from(arrests).where(eq(arrests.officerId, officerId));
  },

  async findByDateRange(startDate: Date, endDate: Date) {
    return await db
      .select()
      .from(arrests)
      .where(and(gte(arrests.arrestDate, startDate), lte(arrests.arrestDate, endDate)));
  },

  async create(data: CreateArrestInput) {
    const [newArrest] = await db.insert(arrests).values(data).returning();
    return newArrest;
  },

  async update(id: string, data: Partial<CreateArrestInput>) {
    const [updated] = await db
      .update(arrests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(arrests.id, id))
      .returning();

    return updated;
  },

  async delete(id: string) {
    await db.delete(arrests).where(eq(arrests.id, id));
  },

  async getStats() {
    const all = await this.findAll();

    return {
      total: all.length,
      thisMonth: all.filter((a) => {
        const date = new Date(a.arrestDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
      byOfficer: all.reduce((acc, a) => {
        acc[a.officerId] = (acc[a.officerId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
};
