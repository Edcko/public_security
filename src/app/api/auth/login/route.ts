/**
 * Login API Route
 * Endpoint de autenticación
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

// Secret para JWT (en producción usar variable de entorno)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Buscar usuario en la base de datos
    const { db } = await import('@/shared/database/connection');
    const { users } = await import('@/shared/database/schema');
    const { eq } = await import('drizzle-orm');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Si el usuario tiene MFA habilitado, solicitar código
    if (user.mfaEnabled) {
      return NextResponse.json({
        success: true,
        message: 'MFA requerido',
        data: {
          mfaEnabled: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            corporationId: user.corporationId,
          },
        },
      });
    }

    // Generar tokens JWT
    const accessToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      corporationId: user.corporationId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // 15 minutos
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT({
      userId: user.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 días
      .sign(JWT_SECRET);

    // Retornar tokens
    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: {
        mfaEnabled: false,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          corporationId: user.corporationId,
        },
      },
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
