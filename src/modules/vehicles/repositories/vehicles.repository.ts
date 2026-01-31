/**
 * Vehicles Repository
 */

import { db } from '@/shared/database/connection';
import { vehicles } from '@/shared/database/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateVehicleInput } from '@/shared/validation/validators';

export const vehiclesRepository = {
  async findAll() {
    return await db.select().from(vehicles);
  },

  async findById(id: string) {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  },

  async search(filters: any) {
    const conditions = [];

    if (filters.vehicleType) conditions.push(eq(vehicles.vehicleType, filters.vehicleType));
    if (filters.status) conditions.push(eq(vehicles.status, filters.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return await db.select().from(vehicles).where(whereClause);
  },

  async create(data: CreateVehicleInput) {
    const [newVehicle] = await db.insert(vehicles).values(data).returning();
    return newVehicle;
  },

  async update(id: string, data: Partial<CreateVehicleInput>) {
    const [updated] = await db
      .update(vehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();

    return updated;
  },

  async delete(id: string) {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  },
};
