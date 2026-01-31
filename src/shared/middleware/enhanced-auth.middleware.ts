/**
 * Enhanced Auth Middleware with Casbin RBAC
 *
 * Verifica autenticación JWT Y autorización con Casbin
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractTokenFromHeader } from '@/shared/authentication/jwt.service';
import { checkPermission, isAdmin, hasRole } from '@/shared/authentication/rbac.service';
import { tokenRevocationService } from '@/shared/authentication/token-revocation.service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    corporationId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware que verifica JWT y añade info del usuario
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
    const payload = await verifyJWT(token);

    // Añadir info del usuario a los headers para siguientes middlewares
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
      // Verificar si el token está revocado
      const isRevoked = await tokenRevocationService.isTokenRevoked(token);
      if (isRevoked) {
        return NextResponse.json(
          { error: 'Unauthorized - Token has been revoked' },
          { status: 401 }
        );
      }

      const payload = await verifyJWT(token);
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
 * Wrapper que verifica permisos específicos con Casbin
 */
export function withPermission<T extends any[]>(
  resource: string,
  action: string,
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, ...args: T) => {
    const user = (req as any).user;

    const hasPermission = await checkPermission(
      user.userId,
      user.corporationId,
      resource,
      action
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return await handler(req, ...args);
  });
}

/**
 * Wrapper que verifica roles específicos
 */
export function withRoles<T extends any[]>(
  allowedRoles: string[],
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, ...args: T) => {
    const user = (req as any).user;

    const hasRequiredRole = await hasRole(user.userId, allowedRoles);

    if (!hasRequiredRole) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient role permissions' },
        { status: 403 }
      );
    }

    return await handler(req, ...args);
  });
}

/**
 * Wrapper que verifica si es administrador
 */
export function withAdmin<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, ...args: T) => {
    const user = (req as any).user;

    const admin = await isAdmin(user.userId);

    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    return await handler(req, ...args);
  });
}

/**
 * Helper para verificar si el usuario tiene uno de los roles
 */
export async function hasUserRole(userId: string, allowedRoles: string[]): Promise<boolean> {
  return await hasRole(userId, allowedRoles);
}
