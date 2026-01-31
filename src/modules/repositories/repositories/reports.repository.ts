/**
 * Reports Repository
 */

import { db } from '@/shared/database/connection';
import { personnel, weapons, vehicles, arrests } from '@/shared/database/schema';
import { and, gte, lte, count } from 'drizzle-orm';

export const reportsRepository = {
  // Personnel Stats
  async getPersonnelStats() {
    const all = await db.select().from(personnel);

    return {
      total: all.length,
      active: all.filter((p) => p.status === 'active').length,
      byRank: all.reduce((acc, p) => {
        acc[p.rank] = (acc[p.rank] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  // Weapons Stats
  async getWeaponsStats() {
    const all = await db.select().from(weapons);

    return {
      total: all.length,
      assigned: all.filter((w) => w.status === 'assigned').length,
      available: all.filter((w) => w.status === 'available').length,
      maintenance: all.filter((w) => w.status === 'maintenance').length,
      byType: all.reduce((acc, w) => {
        acc[w.weaponType] = (acc[w.weaponType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  // Vehicles Stats
  async getVehiclesStats() {
    const all = await db.select().from(vehicles);

    return {
      total: all.length,
      active: all.filter((v) => v.status === 'active').length,
      maintenance: all.filter((v) => v.status === 'maintenance').length,
      byType: all.reduce((acc, v) => {
        acc[v.vehicleType] = (acc[v.vehicleType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  // Arrests Stats by Date Range
  async getArrestsStats(startDate: Date, endDate: Date) {
    const all = await db
      .select()
      .from(arrests)
      .where(and(gte(arrests.arrestDate, startDate), lte(arrests.arrestDate, endDate)));

    return {
      total: all.length,
      byOfficer: all.reduce((acc, a) => {
        acc[a.officerId] = (acc[a.officerId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byLocation: all.reduce((acc, a) => {
        const loc = a.location || 'unknown';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  // General Dashboard Stats
  async getDashboardStats() {
    const [personnelCount, weaponsCount, vehiclesCount, arrestsCount] = await Promise.all([
      db.select({ count: count() }).from(personnel),
      db.select({ count: count() }).from(weapons),
      db.select({ count: count() }).from(vehicles),
      db.select({ count: count() }).from(arrests),
    ]);

    return {
      personnel: personnelCount[0]?.count || 0,
      weapons: weaponsCount[0]?.count || 0,
      vehicles: vehiclesCount[0]?.count || 0,
      arrests: arrestsCount[0]?.count || 0,
    };
  },
};
