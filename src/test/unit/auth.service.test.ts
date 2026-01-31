/**
 * Auth Service Unit Tests
 * Tests para el servicio de autenticación
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { comparePassword, hashPassword, generateToken, verifyToken } from '@/shared/authentication/auth.service';

describe('AuthService', () => {
  describe('Password Hashing', () => {
    it('should hash a password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should compare correct password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        corporationId: 'corp-456',
        role: 'officer',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT tiene 3 partes
    });

    it('should verify a valid token successfully', () => {
      const payload = {
        userId: 'user-123',
        corporationId: 'corp-456',
        role: 'officer',
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('user-123');
      expect(decoded.corporationId).toBe('corp-456');
      expect(decoded.role).toBe('officer');
    });

    it('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });
  });
});
