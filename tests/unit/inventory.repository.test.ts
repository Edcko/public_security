/**
 * Weapons Repository Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { weaponsRepository } from '@/modules/inventory/repositories/weapons.repository';

vi.mock('@/shared/database/connection', () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };
  return {
    db: mockDb,
  };
});

import { db } from '@/shared/database/connection';

describe('Weapons Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all weapons for the corporation', async () => {
      const mockWeapons = [
        {
          id: '1',
          serialNumber: 'SN12345',
          weaponType: 'pistol',
          make: 'Glock',
          model: '19',
          status: 'available',
        },
        {
          id: '2',
          serialNumber: 'SN67890',
          weaponType: 'rifle',
          make: 'AR-15',
          model: 'Sport',
          status: 'assigned',
        },
      ];

      const mockFrom = vi.fn().mockResolvedValue(mockWeapons);
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await weaponsRepository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].serialNumber).toBe('SN12345');
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('assignToOfficer', () => {
    it('should assign weapon to officer', async () => {
      const mockWeapon = {
        id: '1',
        serialNumber: 'SN12345',
        status: 'available',
        assignedTo: null,
      };

      const mockUpdated = {
        ...mockWeapon,
        status: 'assigned',
        assignedTo: 'officer-123',
      };

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([mockUpdated]),
      } as any);

      const result = await weaponsRepository.assignToOfficer('1', 'officer-123');

      expect(result.status).toBe('assigned');
      expect(result.assignedTo).toBe('officer-123');
    });
  });

  describe('unassign', () => {
    it('should unassign weapon from officer', async () => {
      const mockWeapon = {
        id: '1',
        serialNumber: 'SN12345',
        status: 'assigned',
        assignedTo: 'officer-123',
      };

      const mockUpdated = {
        ...mockWeapon,
        status: 'available',
        assignedTo: null,
      };

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([mockUpdated]),
      } as any);

      const result = await weaponsRepository.unassign('1');

      expect(result.status).toBe('available');
      expect(result.assignedTo).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return weapons statistics', async () => {
      const mockWeapons = [
        { id: '1', status: 'available', weaponType: 'pistol' },
        { id: '2', status: 'assigned', weaponType: 'pistol' },
        { id: '3', status: 'assigned', weaponType: 'rifle' },
        { id: '4', status: 'maintenance', weaponType: 'shotgun' },
      ];

      const mockFrom = vi.fn().mockResolvedValue(mockWeapons);
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const stats = await weaponsRepository.getStats();

      expect(stats.total).toBe(4);
      expect(stats.available).toBe(1);
      expect(stats.assigned).toBe(2);
      expect(stats.maintenance).toBe(1);
      expect(stats.byType).toEqual({
        pistol: 2,
        rifle: 1,
        shotgun: 1,
      });
    });
  });
});
