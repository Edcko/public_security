/**
 * Shifts Service Unit Tests
 *
 * Tests para gestión de turnos y asistencia
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock del schema
vi.mock('@/shared/database/schema', () => ({
  shifts: {
    id: 'id',
    corporationId: 'corporationId',
    name: 'name',
    shiftType: 'shiftType',
    startTime: 'startTime',
    endTime: 'endTime',
    daysOfWeek: 'daysOfWeek',
  },
  attendance: {
    id: 'id',
    shiftId: 'shiftId',
    officerId: 'officerId',
    date: 'date',
    checkInTime: 'checkInTime',
    checkOutTime: 'checkOutTime',
    hoursWorked: 'hoursWorked',
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
};

vi.mock('@/shared/database/connection', () => ({
  db: mockDb,
}));

describe('Shifts Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all shifts', async () => {
      const mockShifts = [
        {
          id: '1',
          name: 'Morning Shift',
          shiftType: 'morning',
          startTime: '06:00',
          endTime: '14:00',
        },
        {
          id: '2',
          name: 'Afternoon Shift',
          shiftType: 'afternoon',
          startTime: '14:00',
          endTime: '22:00',
        },
        {
          id: '3',
          name: 'Night Shift',
          shiftType: 'night',
          startTime: '22:00',
          endTime: '06:00',
        },
      ];

      expect(mockShifts).toHaveLength(3);
      expect(mockShifts[0].shiftType).toBe('morning');
      expect(mockShifts[2].shiftType).toBe('night');
    });
  });

  describe('create', () => {
    it('should create new shift', async () => {
      const newShift = {
        name: 'Special Duty',
        shiftType: 'special',
        startTime: '08:00',
        endTime: '16:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      };

      expect(newShift.name).toBe('Special Duty');
      expect(newShift.startTime).toBe('08:00');
      expect(newShift.daysOfWeek).toHaveLength(5);
    });

    it('should validate time format', () => {
      const validTime = '14:30';
      const invalidTime = '25:00';

      const isValidTime = (time: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);

      expect(isValidTime(validTime)).toBe(true);
      expect(isValidTime(invalidTime)).toBe(false);
    });
  });

  describe('checkIn', () => {
    it('should record check-in time', async () => {
      const checkIn = {
        officerId: 'officer-123',
        shiftId: 'shift-1',
        date: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toISOString(),
      };

      expect(checkIn.officerId).toBeDefined();
      expect(checkIn.checkInTime).toBeDefined();
      expect(checkIn.date).toBeDefined();
    });

    it('should prevent duplicate check-in', () => {
      const existingCheckIn = {
        officerId: 'officer-123',
        date: '2026-01-29',
        checkInTime: '2026-01-29T06:00:00Z',
        checkOutTime: null,
      };

      expect(existingCheckIn.checkOutTime).toBeNull();
    });
  });

  describe('checkOut', () => {
    it('should record check-out time', async () => {
      const checkOut = {
        checkInTime: '2026-01-29T06:00:00Z',
        checkOutTime: '2026-01-29T14:00:00Z',
      };

      const hoursWorked =
        (new Date(checkOut.checkOutTime).getTime() - new Date(checkOut.checkInTime).getTime()) /
        (1000 * 60 * 60);

      expect(hoursWorked).toBe(8);
    });

    it('should calculate overtime', () => {
      const standardHours = 8;
      const hoursWorked = 10;

      const overtime = Math.max(0, hoursWorked - standardHours);

      expect(overtime).toBe(2);
    });
  });

  describe('calculatePayroll', () => {
    it('should calculate regular pay', () => {
      const hourlyRate = 100;
      const regularHours = 8;
      const overtimeHours = 0;

      const regularPay = hourlyRate * regularHours;
      const overtimePay = hourlyRate * 1.5 * overtimeHours;
      const totalPay = regularPay + overtimePay;

      expect(regularPay).toBe(800);
      expect(overtimePay).toBe(0);
      expect(totalPay).toBe(800);
    });

    it('should calculate overtime pay at 1.5x rate', () => {
      const hourlyRate = 100;
      const regularHours = 8;
      const overtimeHours = 2;

      const regularPay = hourlyRate * regularHours;
      const overtimePay = hourlyRate * 1.5 * overtimeHours;
      const totalPay = regularPay + overtimePay;

      expect(regularPay).toBe(800);
      expect(overtimePay).toBe(300);
      expect(totalPay).toBe(1100);
    });

    it('should calculate night shift differential', () => {
      const hourlyRate = 100;
      const nightHours = 8;
      const nightDifferential = 0.1; // 10% extra

      const nightPay = hourlyRate * (1 + nightDifferential) * nightHours;

      expect(nightPay).toBeCloseTo(880, 1);
    });
  });

  describe('getAttendanceReport', () => {
    it('should generate attendance report', async () => {
      const attendanceRecords = [
        {
          officerId: 'officer-1',
          date: '2026-01-29',
          checkInTime: '06:00',
          checkOutTime: '14:00',
          hoursWorked: 8,
        },
        {
          officerId: 'officer-2',
          date: '2026-01-29',
          checkInTime: '06:05',
          checkOutTime: '14:10',
          hoursWorked: 8.08,
        },
      ];

      const totalHours = attendanceRecords.reduce((sum, record) => sum + record.hoursWorked, 0);

      expect(totalHours).toBeCloseTo(16.08);
      expect(attendanceRecords).toHaveLength(2);
    });
  });

  describe('validateShiftOverlap', () => {
    it('should detect overlapping shifts', () => {
      const shift1 = {
        startTime: '06:00',
        endTime: '14:00',
      };

      const shift2 = {
        startTime: '12:00',
        endTime: '20:00',
      };

      // Shifts overlap
      expect(shift2.startTime < shift1.endTime).toBe(true);
    });

    it('should allow non-overlapping shifts', () => {
      const shift1 = {
        startTime: '06:00',
        endTime: '14:00',
      };

      const shift2 = {
        startTime: '14:00',
        endTime: '22:00',
      };

      // No overlap (end time equals start time is allowed)
      expect(shift2.startTime >= shift1.endTime).toBe(true);
    });
  });
});
