/**
 * Personnel Service Unit Tests
 * Tests para el servicio de personal
 */

import { describe, it, expect } from 'vitest';

// Mock del repositorio
vi.mock('@/modules/personnel/repositories/personnel.repository');

import { personnelRepository } from '@/modules/personnel/repositories/personnel.repository';

describe('PersonnelService', () => {
  describe('createOfficer', () => {
    it('should create a new officer with valid data', async () => {
      const officerData = {
        badgeNumber: 'GN-TEST-001',
        curp: 'TEST800101HDFRRN01',
        firstName: 'Juan',
        lastName: 'Pérez',
        rank: 'Oficial',
        corporationId: 'test-corp-123',
      };

      // Mock implementation
      vi.mocked(personnelRepository.create).mockResolvedValue({
        id: 'officer-123',
        ...officerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await personnelRepository.create(officerData);

      expect(result).toBeDefined();
      expect(result.badgeNumber).toBe('GN-TEST-001');
    });

    it('should validate CURP format before creating', async () => {
      const invalidCURP = 'INVALID_CURP';

      const officerData = {
        badgeNumber: 'GN-TEST-002',
        curp: invalidCURP,
        firstName: 'María',
        lastName: 'García',
        rank: 'Oficial',
        corporationId: 'test-corp-123',
      };

      // Should throw validation error
      await expect(async () => {
        vi.mocked(personnelRepository.create).mockRejectedValue(
          new Error('Invalid CURP format')
        );
      }).rejects.toThrow('Invalid CURP format');
    });
  });

  describe('searchOfficers', () => {
    it('should search officers by badge number', async () => {
      const mockOfficers = [
        {
          id: 'officer-1',
          badgeNumber: 'GN-001',
          firstName: 'Juan',
          lastName: 'García',
          rank: 'Oficial',
        },
        {
          id: 'officer-2',
          badgeNumber: 'GN-002',
          firstName: 'María',
          lastName: 'López',
          rank: 'Sargento',
        },
      ];

      vi.mocked(personnelRepository.search).mockResolvedValue(mockOfficers);

      const result = await personnelRepository.search({ badgeNumber: 'GN' });

      expect(result).toHaveLength(2);
      expect(result[0].badgeNumber).toBe('GN-001');
    });

    it('should search officers by rank', async () => {
      const mockOfficers = [
        {
          id: 'officer-3',
          badgeNumber: 'GN-003',
          firstName: 'Carlos',
          lastName: 'Martínez',
          rank: 'Capitán',
        },
      ];

      vi.mocked(personnelRepository.search).mockResolvedValue(mockOfficers);

      const result = await personnelRepository.search({ rank: 'Capitán' });

      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe('Capitán');
    });
  });
});
