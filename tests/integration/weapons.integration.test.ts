/**
 * Weapons/Inventory Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/shared/database/connection';
import { weapons, personnel, corporations } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';

describe('Weapons Integration Tests', () => {
  let testCorporationId: string;
  let testOfficerId: string;
  let testWeaponId: string;

  beforeAll(async () => {
    // Crear corporación
    const [corp] = await db
      .insert(corporations)
      .values({
        name: 'Test PD',
        type: 'municipal',
      })
      .returning();

    testCorporationId = corp.id;

    // Crear oficial
    const [officer] = await db
      .insert(personnel)
      .values({
        corporationId: testCorporationId,
        badgeNumber: 'BP-TEST-WEAPONS',
        firstName: 'Test',
        lastName: 'Officer',
        rank: 'oficial',
        status: 'active',
      })
      .returning();

    testOfficerId = officer.id;
  });

  afterAll(async () => {
    await db.delete(weapons).where(eq(weapons.id, testWeaponId));
    await db.delete(personnel).where(eq(personnel.id, testOfficerId));
    await db.delete(corporations).where(eq(corporations.id, testCorporationId));
  });

  describe('Weapon Lifecycle', () => {
    it('should create new weapon', async () => {
      const newWeapon = {
        corporationId: testCorporationId,
        serialNumber: 'SN-TEST-001',
        weaponType: 'pistol',
        make: 'Glock',
        model: '19',
        caliber: '9mm',
        status: 'available' as const,
      };

      const [weapon] = await db.insert(weapons).values(newWeapon).returning();

      testWeaponId = weapon.id;

      expect(weapon.serialNumber).toBe('SN-TEST-001');
      expect(weapon.status).toBe('available');
      expect(weapon.assignedTo).toBeNull();
    });

    it('should assign weapon to officer', async () => {
      await db
        .update(weapons)
        .set({
          status: 'assigned',
          assignedTo: testOfficerId,
        })
        .where(eq(weapons.id, testWeaponId));

      const [weapon] = await db
        .select()
        .from(weapons)
        .where(eq(weapons.id, testWeaponId))
        .limit(1);

      expect(weapon.status).toBe('assigned');
      expect(weapon.assignedTo).toBe(testOfficerId);
    });

    it('should unassign weapon from officer', async () => {
      await db
        .update(weapons)
        .set({
          status: 'available',
          assignedTo: null,
        })
        .where(eq(weapons.id, testWeaponId));

      const [weapon] = await db
        .select()
        .from(weapons)
        .where(eq(weapons.id, testWeaponId))
        .limit(1);

      expect(weapon.status).toBe('available');
      expect(weapon.assignedTo).toBeNull();
    });

    it('should update weapon status to maintenance', async () => {
      await db
        .update(weapons)
        .set({ status: 'maintenance' })
        .where(eq(weapons.id, testWeaponId));

      const [weapon] = await db
        .select()
        .from(weapons)
        .where(eq(weapons.id, testWeaponId))
        .limit(1);

      expect(weapon.status).toBe('maintenance');
    });
  });

  describe('Weapon Tracking', () => {
    it('should find all assigned weapons for corporation', async () => {
      // Crear arma adicional asignada
      await db.insert(weapons).values({
        corporationId: testCorporationId,
        serialNumber: 'SN-TEST-002',
        weaponType: 'rifle',
        make: 'AR-15',
        model: 'Sport',
        caliber: '5.56mm',
        status: 'assigned',
        assignedTo: testOfficerId,
      });

      const [assignedWeapons] = await db
        .select()
        .from(weapons)
        .where(eq(weapons.status, 'assigned'));

      expect(assignedWeapons.status).toBe('assigned');
    });

    it('should find all available weapons', async () => {
      const [availableWeapon] = await db
        .select()
        .from(weapons)
        .where(eq(weapons.status, 'available'))
        .limit(1);

      if (availableWeapon) {
        expect(availableWeapon.status).toBe('available');
        expect(availableWeapon.assignedTo).toBeNull();
      }
    });
  });

  describe('Multi-Tenancy', () => {
    it('should not show weapons from other corporations', async () => {
      // Crear otra corporación
      const [otherCorp] = await db
        .insert(corporations)
        .values({
          name: 'Other PD',
          type: 'municipal',
        })
        .returning();

      // Crear arma en otra corporación
      await db.insert(weapons).values({
        corporationId: otherCorp.id,
        serialNumber: 'SN-OTHER-001',
        weaponType: 'pistol',
        make: 'Glock',
        model: '17',
        caliber: '9mm',
        status: 'available',
      });

      // Buscar armas de la corporación original
      const results = await db
        .select()
        .from(weapons)
        .where(eq(weapons.corporationId, testCorporationId));

      // Verificar que no incluye el arma de otra corporación
      const otherCorpWeapon = results.find(
        (weapon) => weapon.serialNumber === 'SN-OTHER-001'
      );

      expect(otherCorpWeapon).toBeUndefined();

      // Limpiar
      await db.delete(corporations).where(eq(corporations.id, otherCorp.id));
    });
  });
});
