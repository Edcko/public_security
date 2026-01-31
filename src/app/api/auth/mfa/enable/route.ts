/**
 * MFA Enable API Route
 *
 * Verifica el código TOTP y habilita MFA para el usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { db } from '@/shared/database/connection';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { mfaService } from '@/shared/authentication/mfa/mfa.service';

/**
 * POST /api/auth/mfa/enable
 * Verifica el código TOTP y habilita MFA
 */
export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { token } = await req.json();

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Se requiere el código TOTP' },
          { status: 400 }
        );
      }

      // Obtener el secreto MFA del usuario
      const userRecord = await db
        .select({ mfaSecret: users.mfaSecret, mfaBackupCodes: users.mfaBackupCodes })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!userRecord[0]?.mfaSecret) {
        return NextResponse.json(
          { success: false, error: 'MFA no configurado. Inicia el setup primero.' },
          { status: 400 }
        );
      }

      // Verificar el código TOTP
      const verification = mfaService.verifyMFA(token, userRecord[0].mfaSecret);

      if (!verification.valid) {
        return NextResponse.json(
          { success: false, error: verification.error || 'Código inválido' },
          { status: 400 }
        );
      }

      // Habilitar MFA
      await db.update(users)
        .set({ mfaEnabled: true })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        success: true,
        data: {
          enabled: true,
          backupCodes: userRecord[0].mfaBackupCodes,
        },
        message: 'MFA habilitado correctamente. Guarda tus códigos de respaldo.',
      });
    } catch (error: any) {
      console.error('Error enabling MFA:', error);
      return NextResponse.json(
        { success: false, error: 'Error al habilitar MFA' },
        { status: 500 }
      );
    }
  })(req);
}
