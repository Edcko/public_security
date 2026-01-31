/**
 * JWT Service Unit Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateTokenPair, verifyJWT, generateAccessToken } from '@/shared/authentication/jwt.service';

const TEST_SECRET = new TextEncoder().encode('test-secret-key-for-jwt');

describe('JWT Service', () => {
  beforeAll(() => {
    // Override secret para testing
    process.env.JWT_SECRET = TEST_SECRET.toString();
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', async () => {
      const payload = {
        userId: 'user-123',
        corporationId: 'corp-456',
        email: 'test@example.com',
        role: 'officer',
      };

      const tokens = await generateTokenPair(payload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });
  });

  describe('verifyJWT', () => {
    it('should verify valid token', async () => {
      const payload = {
        userId: 'user-123',
        corporationId: 'corp-456',
        email: 'test@example.com',
        role: 'officer',
      };

      const token = await generateAccessToken(payload);

      const decoded = await verifyJWT(token);

      expect(decoded).toEqual(payload);
    });

    it('should reject invalid token', async () => {
      await expect(verifyJWT('invalid-token')).rejects.toThrow();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate short-lived access token', async () => {
      const payload = {
        userId: 'user-123',
        corporationId: 'corp-456',
        email: 'test@example.com',
        role: 'officer',
      };

      const token = await generateAccessToken(payload);

      expect(token).toBeTruthy();
      // JWT decodificación debería funcionar
      const decoded = await verifyJWT(token);
      expect(decoded.userId).toBe('user-123');
    });
  });
});
