/**
 * Audit Logger Unit Tests (LFPDPPP Compliance)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditLogger } from '@/shared/authentication/audit.logger';

vi.mock('@/shared/database/connection', () => {
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      catch: vi.fn().mockImplementation((fn) => fn()),
    }),
  });

  return {
    db: {
      insert: mockInsert,
    },
  };
});

import { db } from '@/shared/database/connection';

vi.mock('@/shared/database/schema', () => ({
  auditLogs: {},
}));

describe('Audit Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should log CREATE action', async () => {
      const logEntry = {
        userId: 'user-123',
        corporationId: 'corp-456',
        action: 'CREATE',
        resource: 'personnel',
        resourceId: 'person-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        success: true,
      };

      await auditLogger.log(logEntry);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log READ action on personal data', async () => {
      const logEntry = {
        userId: 'user-123',
        corporationId: 'corp-456',
        action: 'READ',
        resource: 'personnel',
        resourceId: 'person-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        success: true,
      };

      await auditLogger.log(logEntry);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log failed authentication attempt', async () => {
      const logEntry = {
        userId: 'unknown',
        corporationId: 'corp-456',
        action: 'AUTHENTICATE',
        resource: 'auth',
        resourceId: null,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        success: false,
        failureReason: 'Invalid credentials',
      };

      await auditLogger.log(logEntry);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log UPDATE action on weapons', async () => {
      const logEntry = {
        userId: 'user-123',
        corporationId: 'corp-456',
        action: 'UPDATE',
        resource: 'weapons',
        resourceId: 'weapon-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        success: true,
      };

      await auditLogger.log(logEntry);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log DELETE action', async () => {
      const logEntry = {
        userId: 'user-123',
        corporationId: 'corp-456',
        action: 'DELETE',
        resource: 'personnel',
        resourceId: 'person-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        success: true,
      };

      await auditLogger.log(logEntry);

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('logSuccess', () => {
    it('should log successful login', async () => {
      await auditLogger.logSuccess(
        'user-123',
        'corp-456',
        'AUTHENTICATE',
        'auth',
        'session-123',
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log successful data access', async () => {
      await auditLogger.logSuccess(
        'user-123',
        'corp-456',
        'READ',
        'personnel',
        'person-789',
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
      );

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('logFailure', () => {
    it('should log failed authentication', async () => {
      await auditLogger.logFailure(
        'unknown',
        'corp-456',
        'AUTHENTICATE',
        'auth',
        'Invalid credentials',
        { ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0...' }
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log failed data access', async () => {
      await auditLogger.logFailure(
        'user-123',
        'corp-456',
        'READ',
        'personnel',
        'Access denied',
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
      );

      expect(db.insert).toHaveBeenCalled();
    });
  });
});
