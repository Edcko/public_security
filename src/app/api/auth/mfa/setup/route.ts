/**
 * MFA Setup API Route
 *
 * Genera el secreto TOTP y código QR para configurar MFA
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { db } from '@/shared/database/connection';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { mfaService } from '@/shared/authentication/mfa/mfa.service';

/**
 * POST /api/auth/mfa/setup
 * Inicia el proceso de configuración de MFA
 */
export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      // Generar secreto y QR code
      const mfaSetup = await mfaService.generateMFASecret(user.email);

      // Guardar temporalmente el secreto (sin habilitar aún)
      // El usuario debe verificar un código antes de habilitar
      await db.update(users)
        .set({
          mfaSecret: mfaSetup.secret,
          mfaBackupCodes: mfaSetup.backupCodes,
          // NO habilitar MFA hasta que el usuario verifique
        })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        success: true,
        data: {
          qrCode: mfaSetup.qrCode,
          secret: mfaSetup.secret,
          backupCodes: mfaSetup.backupCodes,
        },
      });
    } catch (error: any) {
      console.error('Error setting up MFA:', error);
      return NextResponse.json(
        { success: false, error: 'Error al configurar MFA' },
        { status: 500 }
      );
    }
  })(req);
}
