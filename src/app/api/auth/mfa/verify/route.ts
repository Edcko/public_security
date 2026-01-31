/**
 * MFA Verify Route
 *
 * Verifica MFA durante el login (sin autenticación previa)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/database/connection';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { mfaService } from '@/shared/authentication/mfa/mfa.service';
import { generateAccessToken, generateRefreshToken } from '@/shared/authentication/jwt.service';

/**
 * POST /api/auth/mfa/verify
 * Verifica credenciales + código MFA y genera tokens
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, token, backupCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    if (!token && !backupCode) {
      return NextResponse.json(
        { success: false, error: 'Se requiere código TOTP o código de respaldo' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userRecords[0]) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const user = userRecords[0];

    // Verificar contraseña
    const bcrypt = await import('bcrypt');
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar que MFA esté habilitado
    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { success: false, error: 'MFA no habilitado para este usuario' },
        { status: 400 }
      );
    }

    // Verificar TOTP o backup code
    let verification;

    if (backupCode) {
      // Buscar en códigos de respaldo
      const backupCodes = user.mfaBackupCodes || [];
      const codeIndex = backupCodes.indexOf(backupCode.toUpperCase());

      if (codeIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Código de respaldo inválido' },
          { status: 401 }
        );
      }

      // Remover el código usado
      backupCodes.splice(codeIndex, 1);

      await db.update(users)
        .set({ mfaBackupCodes: backupCodes })
        .where(eq(users.id, user.id));

      verification = { valid: true };
    } else {
      // Verificar TOTP
      verification = mfaService.verifyMFA(token, user.mfaSecret);
    }

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Código inválido' },
        { status: 401 }
      );
    }

    // Generar tokens JWT
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      corporationId: user.corporationId,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      corporationId: user.corporationId,
      email: user.email,
      role: user.role,
    });

    // Guardar refresh token en DB
    await db.update(users)
      .set({ refreshToken })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        },
      },
    });
  } catch (error: any) {
    console.error('Error verifying MFA:', error);
    return NextResponse.json(
      { success: false, error: 'Error al verificar MFA' },
      { status: 500 }
    );
  }
}
