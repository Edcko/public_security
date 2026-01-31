/**
 * JWT Service
 *
 * Maneja la creación y verificación de JSON Web Tokens
 * para autenticación de usuarios.
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

export interface JWTPayload {
  userId: string;
  corporationId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Genera un access token JWT de corta duración
 */
export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * Genera un refresh token de larga duración
 */
export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * Genera un par de tokens (access + refresh)
 */
export async function generateTokenPair(payload: JWTPayload): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Verifica un JWT y retorna el payload
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as string,
      corporationId: payload.corporationId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extrae el token del header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
