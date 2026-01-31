/**
 * Password Reset Controller
 *
 * Flujo completo de reseteo de contraseña:
 * 1. Solicitar reset (envía email con token)
 * 2. Validar token
 * 3. Nueva contraseña
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { db } from '@/shared/database/connection';
import { users, passwordResets } from '@/shared/database/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { z } from 'zod';
import { emailService } from '@/shared/email/email.service';

// Schema para solicitud de reset
const requestResetSchema = z.object({
  email: z.string().email(),
});

// Schema para confirmar reset
const confirmResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Must contain at least one uppercase letter').regex(/[a-z]/, 'Must contain at least one lowercase letter').regex(/[0-9]/, 'Must contain at least one number'),
});

// Schema para validar token
const validateTokenSchema = z.object({
  token: z.string(),
});

/**
 * POST /api/auth/password-reset
 * Inicia el flujo de reseteo de contraseña
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar
    const { email } = requestResetSchema.parse(body);

    // Buscar usuario
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      // Por seguridad, no revelamos si el email existe
      return NextResponse.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones',
      });
    }

    // Generar token de reset (válido por 1 hora)
    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en base de datos
    // Primero eliminamos tokens anteriores no usados del mismo usuario
    await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Enviar email con el token
    const emailSent = await emailService.sendPasswordReset(
      email,
      resetToken,
      user.email // Usamos email como nombre por ahora, podría ser user.firstName
    );

    if (!emailSent && process.env.NODE_ENV === 'production') {
      console.warn('[Password Reset] Email failed to send, but token was generated');
    }

    // Log de auditoría
    await auditLogger.log(
      {
        userId: user.id,
        corporationId: user.corporationId,
        action: 'CREATE',
        resource: 'password_reset',
        success: true,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones',
      // Solo en desarrollo:
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
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

    console.error('Password reset request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/password-reset
 * Confirma el reseteo con el token y nueva contraseña
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar
    const { token, newPassword } = confirmResetSchema.parse(body);

    // Hashear el token para comparar
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Buscar token en base de datos y verificar que no haya expirado
    const [resetRequest] = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.tokenHash, tokenHash),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, new Date())
        )
      );

    if (!resetRequest) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Hash nueva contraseña
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar usuario
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetRequest.userId));

    // Marcar token como usado
    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.id, resetRequest.id));

    // Log de auditoría
    await auditLogger.log(
      {
        userId: resetRequest.userId,
        action: 'UPDATE',
        resource: 'password',
        success: true,
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Error de validación',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/password-reset
 * Valida si un token es válido sin usarlo
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = validateTokenSchema.parse(body);

    // Hashear el token para comparar
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Buscar token en base de datos y verificar que no haya expirado
    const [resetRequest] = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.tokenHash, tokenHash),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, new Date())
        )
      );

    const isValid = !!resetRequest;

    return NextResponse.json({
      success: true,
      valid: isValid,
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

    console.error('Password reset validate error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
