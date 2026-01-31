/**
 * Weapons Repository
 *
 * Gestión de armamento y municiones
 */

import { db } from '@/shared/database/connection';
import { weapons } from '@/shared/database/schema';
import { eq, ilike, and } from 'drizzle-orm';
import type { CreateWeaponInput } from '@/shared/validation/validators';

export const weaponsRepository = {
  async findAll() {
    return await db.select().from(weapons);
  },

  async findById(id: string) {
    const [weapon] = await db.select().from(weapons).where(eq(weapons.id, id));
    return weapon;
  },

  async findBySerialNumber(serialNumber: string) {
    const [weapon] = await db
      .select()
      .from(weapons)
      .where(eq(weapons.serialNumber, serialNumber));
    return weapon;
  },

  async findByOfficer(officerId: string) {
    return await db
      .select()
      .from(weapons)
      .where(eq(weapons.assignedTo, officerId));
  },

  async findAvailable() {
    return await db
      .select()
      .from(weapons)
      .where(eq(weapons.status, 'available'));
  },

  async search(filters: {
    weaponType?: string;
    status?: string;
    make?: string;
    model?: string;
  }) {
    const conditions = [];

    if (filters.weaponType) conditions.push(eq(weapons.weaponType, filters.weaponType));
    if (filters.status) conditions.push(eq(weapons.status, filters.status));
    if (filters.make) conditions.push(ilike(weapons.make, `%${filters.make}%`));
    if (filters.model) conditions.push(ilike(weapons.model, `%${filters.model}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.select().from(weapons).where(whereClause);
  },

  async create(data: CreateWeaponInput) {
    const [newWeapon] = await db.insert(weapons).values(data).returning();
    return newWeapon;
  },

  async update(id: string, data: Partial<CreateWeaponInput>) {
    const [updated] = await db
      .update(weapons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(weapons.id, id))
      .returning();

    return updated;
  },

  async assignToOfficer(weaponId: string, officerId: string) {
    const [updated] = await db
      .update(weapons)
      .set({
        assignedTo: officerId,
        status: 'assigned',
        updatedAt: new Date(),
      })
      .where(eq(weapons.id, weaponId))
      .returning();

    return updated;
  },

  async unassign(weaponId: string) {
    const [updated] = await db
      .update(weapons)
      .set({
        assignedTo: null,
        status: 'available',
        updatedAt: new Date(),
      })
      .where(eq(weapons.id, weaponId))
      .returning();

    return updated;
  },

  async delete(id: string) {
    await db.delete(weapons).where(eq(weapons.id, id));
  },

  async getStats() {
    const all = await this.findAll();

    return {
      total: all.length,
      available: all.filter((w) => w.status === 'available').length,
      assigned: all.filter((w) => w.status === 'assigned').length,
      maintenance: all.filter((w) => w.status === 'maintenance').length,
      decommissioned: all.filter((w) => w.status === 'decommissioned').length,
      byType: all.reduce((acc, w) => {
        acc[w.weaponType] = (acc[w.weaponType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
};
