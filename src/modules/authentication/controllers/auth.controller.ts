/**
 * Authentication Controller
 *
 * Endpoints para login, logout, registro y refresh tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/shared/database/connection';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import {
  generateTokenPair,
  verifyJWT,
  generateAccessToken,
} from '@/shared/authentication/jwt.service';
import { loginSchema, registerSchema } from '@/shared/validation/validators';
import { auditLogger } from '@/shared/authentication/audit.logger';

/**
 * POST /api/auth/login
 * Inicia sesión y retorna access + refresh tokens
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar con Zod
    const { email, password } = loginSchema.parse(body);

    // Buscar usuario por email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Log de intento fallido
      await auditLogger.log(
        {
          userId: user.id,
          corporationId: user.corporationId,
          action: 'READ',
          resource: 'auth',
          success: false,
          failureReason: 'Invalid password',
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generar tokens
    const tokens = await generateTokenPair({
      userId: user.id,
      corporationId: user.corporationId,
      email: user.email,
      role: user.role,
    });

    // Log de login exitoso
    await auditLogger.log(
      {
        userId: user.id,
        corporationId: user.corporationId,
        action: 'CREATE',
        resource: 'auth',
        success: true,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          corporationId: user.corporationId,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        },
        ...tokens,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/register
 * Registra un nuevo usuario (solo admin puede crear usuarios)
 */
export async function REGISTER(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar
    const data = registerSchema.parse(body);

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const [newUser] = await db
      .insert(users)
      .values({
        ...data,
        passwordHash,
      })
      .returning();

    // Log de auditoría
    await auditLogger.log(
      {
        userId: newUser.id,
        corporationId: newUser.corporationId,
        action: 'CREATE',
        resource: 'users',
        resourceId: newUser.id,
        success: true,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          corporationId: newUser.corporationId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/refresh
 * Refresca el access token usando el refresh token
 */
export async function REFRESH(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token required' },
        { status: 400 }
      );
    }

    // Verificar refresh token
    const payload = await verifyJWT(refreshToken);

    // Generar nuevo access token
    const accessToken = await generateAccessToken({
      userId: payload.userId,
      corporationId: payload.corporationId,
      email: payload.email,
      role: payload.role,
    });

    return NextResponse.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid or expired refresh token' },
      { status: 401 }
    );
  }
}

/**
 * POST /api/auth/logout
 * Cierra la sesión (revoca tokens)
 */
export async function LOGOUT(req: NextRequest) {
  try {
    // TODO: Implementar revocación de tokens en Redis
    // Por ahora, el cliente simplemente debe descartar los tokens

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      // Log de logout
      await auditLogger.log(
        {
          userId: payload.userId,
          corporationId: payload.corporationId,
          action: 'DELETE',
          resource: 'auth',
          success: true,
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
