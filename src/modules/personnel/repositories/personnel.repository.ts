/**
 * Personnel Repository
 *
 * Acceso a datos para el módulo de personal policial.
 * Todas las queries están automáticamente filtradas por RLS.
 */

import { db } from '@/shared/database/connection';
import { personnel } from '@/shared/database/schema';
import { eq, ilike, and, or } from 'drizzle-orm';
import type { CreateOfficerInput, UpdateOfficerInput } from '@/shared/validation/validators';

export const personnelRepository = {
  /**
   * Obtiene TODO el personal de la corporación del usuario.
   * RLS filtra automáticamente por corporation_id.
   */
  async findAll() {
    return await db.select().from(personnel);
  },

  /**
   * Busca personal por ID (solo de la misma corporación por RLS)
   */
  async findById(id: string) {
    const [officer] = await db.select().from(personnel).where(eq(personnel.id, id));
    return officer;
  },

  /**
   * Busca por número de placa (badge number)
   */
  async findByBadgeNumber(badgeNumber: string) {
    const [officer] = await db
      .select()
      .from(personnel)
      .where(eq(personnel.badgeNumber, badgeNumber));
    return officer;
  },

  /**
   * Busca por CURP
   */
  async findByCURP(curp: string) {
    const [officer] = await db.select().from(personnel).where(eq(personnel.curp, curp));
    return officer;
  },

  /**
   * Búsqueda avanzada con filtros
   */
  async search(filters: {
    name?: string;
    badgeNumber?: string;
    rank?: string;
    status?: string;
  }) {
    const conditions = [];

    if (filters.name) {
      conditions.push(
        or(
          ilike(personnel.firstName, `%${filters.name}%`),
          ilike(personnel.lastName, `%${filters.name}%`)
        )
      );
    }

    if (filters.badgeNumber) {
      conditions.push(eq(personnel.badgeNumber, filters.badgeNumber));
    }

    if (filters.rank) {
      conditions.push(eq(personnel.rank, filters.rank));
    }

    if (filters.status) {
      conditions.push(eq(personnel.status, filters.status));
    }

    // Si hay condiciones, agregar AND, sino retornar todo
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.select().from(personnel).where(whereClause);
  },

  /**
   * Crea un nuevo oficial
   */
  async create(data: CreateOfficerInput) {
    const [newOfficer] = await db.insert(personnel).values(data).returning();
    return newOfficer;
  },

  /**
   * Actualiza un oficial existente
   */
  async update(id: string, data: UpdateOfficerInput) {
    const [updated] = await db
      .update(personnel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(personnel.id, id))
      .returning();

    return updated;
  },

  /**
   * Cambia el status de un oficial (active/suspended/retired)
   */
  async updateStatus(id: string, status: 'active' | 'suspended' | 'retired') {
    const [updated] = await db
      .update(personnel)
      .set({ status, updatedAt: new Date() })
      .where(eq(personnel.id, id))
      .returning();

    return updated;
  },

  /**
   * Elimina un oficial (soft delete recomendado, cambiar status a 'retired')
   */
  async delete(id: string) {
    await db.delete(personnel).where(eq(personnel.id, id));
  },

  /**
   * Estadísticas de personal
   */
  async getStats() {
    const all = await db.select().from(personnel);

    return {
      total: all.length,
      active: all.filter((p) => p.status === 'active').length,
      suspended: all.filter((p) => p.status === 'suspended').length,
      retired: all.filter((p) => p.status === 'retired').length,
      byRank: all.reduce((acc, p) => {
        acc[p.rank] = (acc[p.rank] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
};
