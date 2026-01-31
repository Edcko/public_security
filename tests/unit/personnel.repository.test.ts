/**
 * Personnel Repository Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { personnelRepository } from '@/modules/personnel/repositories/personnel.repository';

// Mock del database - hoisted before imports
vi.mock('@/shared/database/connection', () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    db: mockDb,
  };
});

import { db } from '@/shared/database/connection';

describe('Personnel Repository', () => {
  describe('findAll', () => {
    it('should return all personnel for the corporation', async () => {
      const mockPersonnel = [
        { id: '1', firstName: 'Juan', lastName: 'Pérez' },
        { id: '2', firstName: 'Carlos', lastName: 'Gómez' },
      ];

      const mockFrom = vi.fn().mockResolvedValue(mockPersonnel);
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await personnelRepository.findAll();

      expect(result).toEqual(mockPersonnel);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new officer', async () => {
      const newOfficer = {
        corporationId: 'corp-1',
        badgeNumber: 'BP-1234',
        firstName: 'Juan',
        lastName: 'Pérez',
        rank: 'oficial',
        status: 'active',
      };

      const created = { id: '123', ...newOfficer };

      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([created]),
      });
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

      const result = await personnelRepository.create(newOfficer as any);

      expect(result).toEqual(created);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search by name', async () => {
      const mockPersonnel = [
        { id: '1', firstName: 'Juan', lastName: 'Pérez' },
      ];

      const mockWhere = vi.fn().mockResolvedValue(mockPersonnel);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await personnelRepository.search({ name: 'Juan' });

      expect(result).toHaveLength(1);
    });

    it('should search by badge number', async () => {
      const mockPersonnel = [
        { id: '1', badgeNumber: 'BP-1234' },
      ];

      const mockWhere = vi.fn().mockResolvedValue(mockPersonnel);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const result = await personnelRepository.search({ badgeNumber: 'BP-1234' });

      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const mockPersonnel = [
        { id: '1', rank: 'oficial', status: 'active' },
        { id: '2', rank: 'oficial', status: 'active' },
        { id: '3', rank: 'comandante', status: 'active' },
        { id: '4', rank: 'oficial', status: 'suspended' },
      ];

      const mockFrom = vi.fn().mockResolvedValue(mockPersonnel);
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const stats = await personnelRepository.getStats();

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(3);
      expect(stats.byRank).toEqual({
        oficial: 3,
        comandante: 1,
      });
    });
  });
});
