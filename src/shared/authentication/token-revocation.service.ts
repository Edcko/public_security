/**
 * Token Revocation Service
 *
 * Gestiona revocación de tokens JWT usando Redis
 */

import { Redis } from 'ioredis';

/**
 * Configuración de Redis
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TOKEN_BLACKLIST_TTL = 3600; // 1 hora en segundos

/**
 * Cliente de Redis
 */
let redisClient: Redis | null = null;

/**
 * Inicializa el cliente de Redis
 */
function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('[Token Revocation] Redis not configured. Token revocation disabled.');
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redisClient.on('error', (err) => {
        console.error('[Token Revocation] Redis Client Error:', err);
      });

      console.log('[Token Revocation] Redis client initialized');
    } catch (error) {
      console.error('[Token Revocation] Failed to initialize Redis:', error);
      return null;
    }
  }

  return redisClient;
}

/**
 * Revoca un token (agrega a blacklist)
 */
export async function revokeToken(token: string, reason?: string): Promise<boolean> {
  const client = getRedisClient();

  if (!client) {
    console.warn('[Token Revocation] Cannot revoke token: Redis not configured');
    return false;
  }

  try {
    // Extraer jti (JWT ID) del token si existe
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[Token Revocation] Invalid token format');
      return false;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const jti = payload.jti;
    const exp = payload.exp;

    if (!jti) {
      console.warn('[Token Revocation] Token has no jti (JWT ID). Cannot revoke.');
      return false;
    }

    // Calcular TTL basado en expiración del token
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp ? exp - now : TOKEN_BLACKLIST_TTL;

    if (ttl <= 0) {
      console.warn('[Token Revocation] Token already expired');
      return true; // Ya expirado, consideramos revocado
    }

    // Agregar a blacklist con TTL igual a la expiración del token
    const key = `token:blacklist:${jti}`;
    const value = JSON.stringify({
      revokedAt: now,
      reason,
      exp,
    });

    await client.setex(key, ttl, value);

    console.log(`[Token Revocation] Token revoked: ${jti}`);
    return true;
  } catch (error: any) {
    console.error('[Token Revocation] Error revoking token:', error);
    return false;
  }
}

/**
 * Verifica si un token está revocado
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const client = getRedisClient();

  if (!client) {
    // Si Redis no está configurado, no se pueden revocar tokens
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const jti = payload.jti;

    if (!jti) return false;

    const key = `token:blacklist:${jti}`;
    const exists = await client.exists(key);

    return exists === 1;
  } catch (error) {
    console.error('[Token Revocation] Error checking token:', error);
    return false;
  }
}

/**
 * Limpia tokens revocados expirados (para mantenimiento)
 */
export async function cleanExpiredTokens(): Promise<number> {
  const client = getRedisClient();

  if (!client) return 0;

  try {
    let cleaned = 0;

    // Buscar todas las keys de blacklist
    const keys = await client.keys('token:blacklist:*');

    for (const key of keys) {
      const ttl = await client.ttl(key);

      // Si TTL es -1 (sin expiración) o 0 (expirada), eliminar
      if (ttl === -1 || ttl === -2) {
        await client.del(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Token Revocation] Cleaned ${cleaned} expired tokens`);
    }

    return cleaned;
  } catch (error: any) {
    console.error('[Token Revocation] Error cleaning tokens:', error);
    return 0;
  }
}

/**
 * Revoca todos los tokens de un usuario
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  const client = getRedisClient();

  if (!client) {
    console.warn('[Token Revocation] Cannot revoke tokens: Redis not configured');
    return 0;
  }

  try {
    // Buscar todos los tokens del usuario en Redis
    // Nota: Esto requiere que al generar el token se guarde en Redis
    const pattern = `token:user:${userId}:*`;
    const keys = await client.keys(pattern);

    let revoked = 0;

    for (const key of keys) {
      await client.del(key);
      revoked++;
    }

    console.log(`[Token Revocation] Revoked ${revoked} tokens for user ${userId}`);
    return revoked;
  } catch (error: any) {
    console.error('[Token Revocation] Error revoking user tokens:', error);
    return 0;
  }
}

/**
 * Servicio de revocación de tokens
 */
export const tokenRevocationService = {
  revokeToken,
  isTokenRevoked,
  cleanExpiredTokens,
  revokeAllUserTokens,
};
