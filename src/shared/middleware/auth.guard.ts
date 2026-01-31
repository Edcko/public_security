/**
 * Authentication Guard Middleware
 *
 * Verifica el JWT token y extrae la información del usuario.
 * DEBE ejecutarse ANTES de corporationContextMiddleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractTokenFromHeader } from '@/shared/authentication/jwt.service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    corporationId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware que verifica el JWT y añade la info del usuario a la request
 */
export async function authMiddleware(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  try {
    // Verificar token
    const payload = await verifyJWT(token);

    // Añadir info del usuario a los headers para los siguientes middlewares
    const response = NextResponse.next();
    response.headers.set('X-User-ID', payload.userId);
    response.headers.set('X-Corporation-ID', payload.corporationId);
    response.headers.set('X-User-Email', payload.email);
    response.headers.set('X-User-Role', payload.role);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired token' },
      { status: 401 }
    );
  }
}

/**
 * Wrapper para handlers que requieren autenticación
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    try {
      const payload = await verifyJWT(token);

      // Añadir payload a la request
      (req as any).user = payload;

      return await handler(req, ...args);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Verifica si el usuario tiene uno de los roles requeridos
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Wrapper para handlers que requieren roles específicos
 */
export function withRoles<T extends any[]>(
  allowedRoles: string[],
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, ...args: T) => {
    const user = (req as any).user;

    if (!hasRole(user.role, allowedRoles)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return await handler(req, ...args);
  });
}
