/**
 * Corporations Repository
 *
 * Gestión de corporaciones policiales (federal, estatal, municipal)
 */

import { db } from '@/shared/database/connection';
import { corporations } from '@/shared/database/schema';
import { eq, ilike } from 'drizzle-orm';
import type { CreateCorporationInput, UpdateCorporationInput } from '@/shared/validation/validators';

export const corporationsRepository = {
  /**
   * Obtiene todas las corporaciones
   * NOTA: National admins pueden ver TODAS, otros solo la suya
   */
  async findAll() {
    // RLS filtra automáticamente si está activado
    return await db.select().from(corporations);
  },

  /**
   * Busca corporación por ID
   */
  async findById(id: string) {
    const [corporation] = await db
      .select()
      .from(corporations)
      .where(eq(corporations.id, id));
    return corporation;
  },

  /**
   * Busca por tipo (federal, estatal, municipal)
   */
  async findByType(type: 'federal' | 'estatal' | 'municipal') {
    return await db
      .select()
      .from(corporations)
      .where(eq(corporations.type, type));
  },

  /**
   * Busca por parent (hijas de una corporación)
   */
  async findByParentId(parentId: string) {
    return await db
      .select()
      .from(corporations)
      .where(eq(corporations.parentId, parentId));
  },

  /**
   * Búsqueda por nombre
   */
  async searchByName(name: string) {
    return await db
      .select()
      .from(corporations)
      .where(ilike(corporations.name, `%${name}%`));
  },

  /**
   * Obtiene jerarquía completa (árbol)
   */
  async getHierarchy() {
    const all = await this.findAll();

    // Construir árbol
    // @ts-ignore - Recursive function type
    const buildTree = (parentId: string | null = null): any[] => {
      return all
        .filter((c) => {
          if (parentId === null) {
            return c.parentId === null || c.parentId === undefined;
          }
          return c.parentId === parentId;
        })
        .map((c) => ({
          ...c,
          children: buildTree(c.id),
        }));
    };

    return buildTree();
  },

  /**
   * Crea nueva corporación
   */
  async create(data: CreateCorporationInput) {
    const [newCorporation] = await db
      .insert(corporations)
      .values(data)
      .returning();

    return newCorporation;
  },

  /**
   * Actualiza corporación existente
   */
  async update(id: string, data: UpdateCorporationInput) {
    const [updated] = await db
      .update(corporations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(corporations.id, id))
      .returning();

    return updated;
  },

  /**
   * Elimina corporación
   */
  async delete(id: string) {
    await db.delete(corporations).where(eq(corporations.id, id));
  },

  /**
   * Estadísticas de corporaciones
   */
  async getStats() {
    const all = await this.findAll();

    return {
      total: all.length,
      federal: all.filter((c) => c.type === 'federal').length,
      estatal: all.filter((c) => c.type === 'estatal').length,
      municipal: all.filter((c) => c.type === 'municipal').length,
      withParent: all.filter((c) => c.parentId).length,
      topLevel: all.filter((c) => !c.parentId).length,
    };
  },
};
