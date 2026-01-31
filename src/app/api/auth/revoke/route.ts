/**
 * Token Revocation API Routes
 *
 * Revocación de tokens JWT
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { tokenRevocationService } from '@/shared/authentication/token-revocation.service';

/**
 * POST /api/auth/revoke
 * Revoca el token actual del usuario
 */
export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      // Obtener token del header Authorization
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json(
          { success: false, error: 'No authorization header' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');

      const revoked = await tokenRevocationService.revokeToken(
        token,
        'User-initiated revocation'
      );

      if (!revoked) {
        return NextResponse.json(
          { success: false, error: 'Failed to revoke token' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Token revoked successfully',
      });
    } catch (error: any) {
      console.error('Error revoking token:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/auth/revoke-all
 * Revoca todos los tokens del usuario actual
 */
export async function POST_ALL(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const count = await tokenRevocationService.revokeAllUserTokens(user.id);

      return NextResponse.json({
        success: true,
        message: `${count} tokens revoked`,
        count,
      });
    } catch (error: any) {
      console.error('Error revoking all tokens:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
