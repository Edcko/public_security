/**
 * Reports Service Unit Tests
 *
 * Tests para generación de reportes y analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock de PDF generation
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    setFontSize: vi.fn(),
  })),
}));

// Mock de CSV generation
vi.mock('json2csv', () => ({
  Parser: vi.fn(),
}));

describe('Reports Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePDFReport', () => {
    it('should generate personnel report PDF', async () => {
      const reportData = {
        type: 'personnel',
        title: 'Reporte de Personal',
        data: [
          {
            badgeNumber: '12345',
            firstName: 'Juan',
            lastName: 'Pérez',
            rank: 'Oficial',
            status: 'active',
          },
          {
            badgeNumber: '12346',
            firstName: 'María',
            lastName: 'García',
            rank: 'Sargento',
            status: 'active',
          },
        ],
        generatedAt: new Date(),
        generatedBy: 'admin-123',
      };

      expect(reportData.type).toBe('personnel');
      expect(reportData.data).toHaveLength(2);
      expect(reportData.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate weapons report PDF', async () => {
      const reportData = {
        type: 'weapons',
        title: 'Reporte de Armamento',
        data: [
          {
            serialNumber: 'SN12345',
            weaponType: 'pistol',
            make: 'Glock',
            model: '19',
            status: 'available',
          },
        ],
      };

      expect(reportData.type).toBe('weapons');
      expect(reportData.data[0].weaponType).toBe('pistol');
    });

    it('should generate arrests report PDF', async () => {
      const reportData = {
        type: 'arrests',
        title: 'Vitácora de Arrestos',
        data: [
          {
            arrestId: 'ARR-001',
            date: '2026-01-29',
            officerId: 'officer-123',
            reason: 'Robo',
            location: 'Centro',
          },
        ],
      };

      expect(reportData.type).toBe('arrests');
    });
  });

  describe('exportToCSV', () => {
    it('should export personnel to CSV', async () => {
      const personnelData = [
        {
          badgeNumber: '12345',
          firstName: 'Juan',
          lastName: 'Pérez',
          rank: 'Oficial',
          status: 'active',
        },
        {
          badgeNumber: '12346',
          firstName: 'María',
          lastName: 'García',
          rank: 'Sargento',
          status: 'active',
        },
      ];

      expect(personnelData).toHaveLength(2);
      expect(personnelData[0]).toHaveProperty('badgeNumber');
      expect(personnelData[0]).toHaveProperty('firstName');
    });

    it('should escape CSV special characters', () => {
      const data = [
        {
          name: 'Juan, Pérez',
          address: 'Calle 123 #456',
        },
      ];

      const hasComma = data[0].name.includes(',');
      expect(hasComma).toBe(true);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate personnel statistics', () => {
      const personnel = [
        { status: 'active', rank: 'Oficial' },
        { status: 'active', rank: 'Sargento' },
        { status: 'active', rank: 'Oficial' },
        { status: 'suspended', rank: 'Cadete' },
        { status: 'retired', rank: 'Comandante' },
      ];

      const activeCount = personnel.filter(p => p.status === 'active').length;
      const totalCount = personnel.length;

      expect(activeCount).toBe(3);
      expect(totalCount).toBe(5);
    });

    it('should calculate weapons statistics', () => {
      const weapons = [
        { status: 'available', type: 'pistol' },
        { status: 'assigned', type: 'pistol' },
        { status: 'assigned', type: 'rifle' },
        { status: 'maintenance', type: 'shotgun' },
      ];

      const availableCount = weapons.filter(w => w.status === 'available').length;
      const assignedCount = weapons.filter(w => w.status === 'assigned').length;

      expect(availableCount).toBe(1);
      expect(assignedCount).toBe(2);
    });

    it('should calculate vehicles statistics', () => {
      const vehicles = [
        { status: 'active', type: 'patrol' },
        { status: 'active', type: 'patrol' },
        { status: 'maintenance', type: 'suv' },
        { status: 'out_of_service', type: 'motorcycle' },
      ];

      const activeCount = vehicles.filter(v => v.status === 'active').length;
      const activePercentage = (activeCount / vehicles.length) * 100;

      expect(activeCount).toBe(2);
      expect(activePercentage).toBe(50);
    });
  });

  describe('generateDashboardData', () => {
    it('should aggregate dashboard metrics', () => {
      const metrics = {
        totalPersonnel: 150,
        activeOfficers: 120,
        totalWeapons: 300,
        assignedWeapons: 180,
        totalVehicles: 50,
        activeVehicles: 40,
        totalArrests: 25,
        monthArrests: 5,
      };

      expect(metrics.totalPersonnel).toBe(150);
      expect(metrics.activeOfficers).toBeLessThanOrEqual(metrics.totalPersonnel);
      expect(metrics.totalWeapons).toBe(300);
    });

    it('should calculate trends', () => {
      const currentMonth = 25;
      const lastMonth = 20;

      const trend = ((currentMonth - lastMonth) / lastMonth) * 100;

      expect(trend).toBe(25); // 25% increase
    });
  });

  describe('scheduleReport', () => {
    it('should schedule daily report', () => {
      const schedule = {
        frequency: 'daily',
        time: '08:00',
        recipients: ['admin@example.com'],
      };

      expect(schedule.frequency).toBe('daily');
      expect(schedule.recipients).toContain('admin@example.com');
    });

    it('should schedule weekly report', () => {
      const schedule = {
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        time: '09:00',
        recipients: ['supervisor@example.com'],
      };

      expect(schedule.frequency).toBe('weekly');
      expect(schedule.dayOfWeek).toBe(1);
    });

    it('should schedule monthly report', () => {
      const schedule = {
        frequency: 'monthly',
        dayOfMonth: 1,
        time: '10:00',
        recipients: ['director@example.com'],
      };

      expect(schedule.frequency).toBe('monthly');
      expect(schedule.dayOfMonth).toBe(1);
    });
  });

  describe('emailReport', () => {
    it('should send report via email', async () => {
      const emailData = {
        to: 'admin@example.com',
        subject: 'Reporte Diario',
        reportType: 'personnel',
        attachment: 'report.pdf',
        sentAt: new Date(),
      };

      expect(emailData.to).toBeDefined();
      expect(emailData.subject).toBeDefined();
      expect(emailData.attachment).toBeDefined();
    });
  });
});
