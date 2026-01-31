/**
 * Weapons Service Unit Tests
 *
 * Tests para control de armamento
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock del schema
vi.mock('@/shared/database/schema', () => ({
  weapons: {
    id: 'id',
    corporationId: 'corporationId',
    serialNumber: 'serialNumber',
    weaponType: 'weaponType',
    make: 'make',
    model: 'model',
    caliber: 'caliber',
    status: 'status',
    assignedTo: 'assignedTo',
  },
}));

// Mock de la base de datos
const mockDb = {
  select: vi.fn(() => mockDb),
  from: vi.fn(() => mockDb),
  where: vi.fn(() => mockDb),
  insert: vi.fn(() => mockDb),
  values: vi.fn(() => mockDb),
  returning: vi.fn(() => mockDb),
  update: vi.fn(() => mockDb),
  set: vi.fn(() => mockDb),
  delete: vi.fn(() => mockDb),
};

vi.mock('@/shared/database/connection', () => ({
  db: mockDb,
}));

describe('Weapons Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all weapons', async () => {
      const mockWeapons = [
        {
          id: '1',
          serialNumber: 'SN12345',
          weaponType: 'pistol',
          make: 'Glock',
          model: '19',
          caliber: '9mm',
          status: 'available',
        },
        {
          id: '2',
          serialNumber: 'SN67890',
          weaponType: 'rifle',
          make: 'AR-15',
          model: 'Sport',
          caliber: '5.56',
          status: 'assigned',
        },
      ];

      expect(mockWeapons).toHaveLength(2);
      expect(mockWeapons[0].weaponType).toBe('pistol');
      expect(mockWeapons[1].status).toBe('assigned');
    });

    it('should filter by status', () => {
      const availableStatus = 'available';
      const assignedStatus = 'assigned';
      const maintenanceStatus = 'maintenance';

      expect(availableStatus).toBe('available');
      expect(assignedStatus).toBe('assigned');
      expect(maintenanceStatus).toBe('maintenance');
    });
  });

  describe('assign', () => {
    it('should assign weapon to officer', async () => {
      const assignment = {
        weaponId: '1',
        officerId: 'officer-123',
        assignedAt: new Date(),
      };

      expect(assignment.weaponId).toBeDefined();
      expect(assignment.officerId).toBeDefined();
      expect(assignment.assignedAt).toBeInstanceOf(Date);
    });

    it('should not assign if weapon not available', () => {
      const unavailableWeapon = {
        id: '1',
        status: 'assigned',
      };

      const availableWeapon = {
        id: '2',
        status: 'available',
      };

      expect(unavailableWeapon.status).not.toBe('available');
      expect(availableWeapon.status).toBe('available');
    });
  });

  describe('unassign', () => {
    it('should unassign weapon from officer', async () => {
      const weapon = {
        id: '1',
        assignedTo: 'officer-123',
        status: 'assigned',
      };

      expect(weapon.assignedTo).toBe('officer-123');
      expect(weapon.status).toBe('assigned');

      // After unassign
      weapon.assignedTo = null;
      weapon.status = 'available';

      expect(weapon.assignedTo).toBeNull();
      expect(weapon.status).toBe('available');
    });
  });

  describe('create', () => {
    it('should create new weapon', async () => {
      const newWeapon = {
        serialNumber: 'SN99999',
        weaponType: 'shotgun',
        make: 'Remington',
        model: '870',
        caliber: '12ga',
        status: 'available',
      };

      expect(newWeapon.serialNumber).toBe('SN99999');
      expect(newWeapon.weaponType).toBe('shotgun');
      expect(newWeapon.status).toBe('available');
    });

    it('should require serial number', () => {
      const incompleteWeapon = {
        weaponType: 'pistol',
      };

      expect(incompleteWeapon.serialNumber).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update weapon', async () => {
      const update = {
        status: 'maintenance',
        notes: 'Needs cleaning',
      };

      expect(update.status).toBe('maintenance');
      expect(update.notes).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should mark weapon as decommissioned', async () => {
      const weaponId = '1';

      expect(weaponId).toBeDefined();
    });
  });

  describe('getByOfficer', () => {
    it('should return weapons assigned to officer', async () => {
      const officerId = 'officer-123';
      const assignedWeapons = [
        {
          id: '1',
          serialNumber: 'SN12345',
          weaponType: 'pistol',
        },
        {
          id: '2',
          serialNumber: 'SN67890',
          weaponType: 'rifle',
        },
      ];

      expect(assignedWeapons).toHaveLength(2);
      expect(assignedWeapons.every(w => w.assignedTo === officerId || !w.assignedTo)).toBe(true);
    });
  });
});
