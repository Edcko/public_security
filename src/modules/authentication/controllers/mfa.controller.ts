/**
 * MFA Controller
 *
 * Endpoints para gestionar autenticación de dos factores
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMFASecret,
  enableMFA,
  disableMFA,
  verifyMFAToken,
  requiresMFA,
  mustHaveMFA,
  generateBackupCodes,
} from '../services/mfa.service';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { z } from 'zod';

// Schema para verificar token MFA
const verifyTokenSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

// Schema para desactivar MFA
const disableMFASchema = z.object({
  password: z.string().min(8),
});

/**
 * GET /api/auth/mfa/status
 * Verifica si el usuario requiere MFA
 */
export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;

      const required = await requiresMFA(user.userId);
      const mandatory = await mustHaveMFA(user.userId);

      return NextResponse.json({
        success: true,
        data: {
          mfaEnabled: user.mfaEnabled,
          mfaRequired: required,
          mfaMandatory: mandatory,
        },
      });
    } catch (error: any) {
      console.error('MFA status error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/auth/mfa/setup
 * Inicia el setup de MFA (genera secreto y QR)
 */
export async function POST(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;

      // Solo administradores pueden configurar MFA
      if (!user.role.includes('admin')) {
        return NextResponse.json(
          { success: false, error: 'MFA is only available for administrators' },
          { status: 403 }
        );
      }

      const { secret, qrCodeUrl, message } = await generateMFASecret(user.userId);

      return NextResponse.json({
        success: true,
        data: {
          secret,
          qrCodeUrl,
          message,
        },
      });
    } catch (error: any) {
      console.error('MFA setup error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PUT /api/auth/mfa/enable
 * Activa MFA después de escanear el QR
 */
export async function PUT(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      const { token } = verifyTokenSchema.parse(body);

      const result = await enableMFA(user.userId, token);

      return NextResponse.json(result);
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

      console.error('MFA enable error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/auth/mfa/disable
 * Desactiva MFA (requiere contraseña)
 */
export async function DELETE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      const { password } = disableMFASchema.parse(body);

      const result = await disableMFA(user.userId, password, req);

      return NextResponse.json(result);
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

      console.error('MFA disable error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/auth/mfa/verify
 * Verifica un token TOTP (durante login)
 */
export async function POST_VERIFY(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      const { token } = verifyTokenSchema.parse(body);

      const isValid = await verifyMFAToken(user.userId, token);

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'MFA verified successfully',
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

      console.error('MFA verify error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/auth/mfa/backup-codes
 * Genera códigos de recuperación
 */
export async function POST_BACKUP_CODES(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;

      if (!user.mfaEnabled) {
        return NextResponse.json(
          { success: false, error: 'MFA is not enabled' },
          { status: 400 }
        );
      }

      const { backupCodes, message } = await generateBackupCodes(user.userId);

      return NextResponse.json({
        success: true,
        data: {
          backupCodes,
          message,
        },
      });
    } catch (error: any) {
      console.error('Backup codes error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
