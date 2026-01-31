/**
 * MFA Disable API Route
 *
 * Deshabilita MFA para el usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { db } from '@/shared/database/connection';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { mfaService } from '@/shared/authentication/mfa/mfa.service';

/**
 * POST /api/auth/mfa/disable
 * Verifica el código TOTP y deshabilita MFA
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
        .select({ mfaSecret: users.mfaSecret })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!userRecord[0]?.mfaSecret) {
        return NextResponse.json(
          { success: false, error: 'MFA no configurado' },
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

      // Deshabilitar MFA y eliminar datos
      await db.update(users)
        .set({
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: [],
        })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        success: true,
        message: 'MFA deshabilitado correctamente',
      });
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      return NextResponse.json(
        { success: false, error: 'Error al deshabilitar MFA' },
        { status: 500 }
      );
    }
  })(req);
}
