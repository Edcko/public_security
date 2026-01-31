/**
 * Personnel Module Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/shared/database/connection';
import { personnel, corporations } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';

describe('Personnel Integration Tests', () => {
  let testCorporationId: string;
  let testOfficerId: string;

  beforeAll(async () => {
    // Crear corporación de test
    const [corp] = await db
      .insert(corporations)
      .values({
        name: 'Test Police Department',
        type: 'municipal',
      })
      .returning();

    testCorporationId = corp.id;
  });

  afterAll(async () => {
    // Limpiar datos
    await db.delete(personnel).where(eq(personnel.id, testOfficerId));
    await db.delete(corporations).where(eq(corporations.id, testCorporationId));
  });

  describe('Officer Lifecycle', () => {
    it('should create new officer', async () => {
      const newOfficer = {
        corporationId: testCorporationId,
        badgeNumber: 'BP-TEST-001',
        curp: 'TEST800101HXXXNN00',
        firstName: 'Juan',
        lastName: 'Pérez',
        rank: 'oficial',
        status: 'active' as const,
      };

      const [officer] = await db.insert(personnel).values(newOfficer).returning();

      testOfficerId = officer.id;

      expect(officer.badgeNumber).toBe('BP-TEST-001');
      expect(officer.firstName).toBe('Juan');
      expect(officer.status).toBe('active');
    });

    it('should read officer by ID', async () => {
      const [officer] = await db
        .select()
        .from(personnel)
        .where(eq(personnel.id, testOfficerId))
        .limit(1);

      expect(officer).toBeDefined();
      expect(officer.badgeNumber).toBe('BP-TEST-001');
    });

    it('should update officer information', async () => {
      await db
        .update(personnel)
        .set({ rank: 'sargento' })
        .where(eq(personnel.id, testOfficerId));

      const [officer] = await db
        .select()
        .from(personnel)
        .where(eq(personnel.id, testOfficerId))
        .limit(1);

      expect(officer.rank).toBe('sargento');
    });

    it('should search officers by name', async () => {
      const results = await db
        .select()
        .from(personnel)
        .where(eq(personnel.firstName, 'Juan'));

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].firstName).toBe('Juan');
    });

    it('should get officers by corporation', async () => {
      const results = await db
        .select()
        .from(personnel)
        .where(eq(personnel.corporationId, testCorporationId));

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].corporationId).toBe(testCorporationId);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should only return officers from same corporation', async () => {
      // Crear otra corporación
      const [otherCorp] = await db
        .insert(corporations)
        .values({
          name: 'Other Police Department',
          type: 'municipal',
        })
        .returning();

      // Crear oficial en otra corporación
      await db.insert(personnel).values({
        corporationId: otherCorp.id,
        badgeNumber: 'BP-OTHER-001',
        firstName: 'Carlos',
        lastName: 'Gómez',
        rank: 'oficial',
        status: 'active',
      });

      // Buscar oficiales de la corporación original
      const results = await db
        .select()
        .from(personnel)
        .where(eq(personnel.corporationId, testCorporationId));

      // Verificar que no incluye el oficial de otra corporación
      const otherCorpOfficer = results.find(
        (officer) => officer.badgeNumber === 'BP-OTHER-001'
      );

      expect(otherCorpOfficer).toBeUndefined();

      // Limpiar
      await db.delete(corporations).where(eq(corporations.id, otherCorp.id));
    });
  });

  describe('Statistics', () => {
    it('should calculate personnel statistics correctly', async () => {
      const allOfficers = await db
        .select()
        .from(personnel)
        .where(eq(personnel.corporationId, testCorporationId));

      const activeOfficers = allOfficers.filter(
        (officer) => officer.status === 'active'
      );

      expect(activeOfficers.length).toBeGreaterThan(0);
    });
  });
});
