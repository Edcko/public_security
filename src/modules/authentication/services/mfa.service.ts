/**
 * MFA (Multi-Factor Authentication) Service
 *
 * Implementa autenticación de dos factores para administradores
 * usando TOTP (Time-based One-Time Password) compatible con Google Authenticator
 */

import { TOTP, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { generateMnemonic } from 'ethers';

const authenticator = new TOTP();
import { db } from '@/shared/database/connection';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { NextRequest } from 'next/server';

/**
 * Genera un secreto TOTP para un usuario
 */
export async function generateMFASecret(userId: string) {
  try {
    // Buscar usuario
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    // Verificar que sea administrador
    if (!user.role.includes('admin')) {
      throw new Error('MFA is only available for administrators');
    }

    // Generar secreto único
    const secret = authenticator.generateSecret();

    // Generar código QR (data URL para mostrar en UI)
    const qrCodeUrl = generateURI({
      issuer: 'Sistema Nacional de Seguridad Pública',
      label: user.email,
      secret,
      strategy: 'totp',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

    // Generar códigos de respaldo
    const backupCodes = generateBackupCodesArray();

    // Guardar secreto y códigos temporalmente en DB
    await db.update(users)
      .set({
        mfaSecret: secret,
        mfaBackupCodes: backupCodes,
      })
      .where(eq(users.id, userId));

    return {
      secret,
      qrCodeUrl,
      qrCodeDataUrl,
      backupCodes,
      message: 'Escanea este código QR con Google Authenticator',
    };
  } catch (error: any) {
    console.error('Error generating MFA secret:', error);
    throw error;
  }
}

/**
 * Activa MFA para un usuario después de verificar el código
 */
export async function enableMFA(userId: string, token: string) {
  try {
    // Buscar usuario con secreto temporal
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.mfaSecret) {
      throw new Error('MFA secret not found. Please generate a new secret.');
    }

    // Verificar que el token sea válido
    const isValid = await authenticator.verify(token, {
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new Error('Invalid token');
    }

    // Activar MFA
    await db
      .update(users)
      .set({ mfaEnabled: true })
      .where(eq(users.id, userId));

    // Log de auditoría
    await auditLogger.log({
      userId,
      corporationId: user.corporationId,
      action: 'UPDATE',
      resource: 'users',
      resourceId: userId,
      success: true,
    });

    return {
      success: true,
      message: 'MFA enabled successfully',
    };
  } catch (error: any) {
    console.error('Error enabling MFA:', error);
    throw error;
  }
}

/**
 * Desactiva MFA para un usuario (requiere contraseña)
 */
export async function disableMFA(userId: string, password: string, req?: NextRequest) {
  try {
    // Buscar usuario
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    // Verificar contraseña
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Desactivar MFA y eliminar datos
    await db
      .update(users)
      .set({ mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] })
      .where(eq(users.id, userId));

    // Log de auditoría
    await auditLogger.log({
      userId,
      corporationId: user.corporationId,
      action: 'UPDATE',
      resource: 'users',
      resourceId: userId,
      success: true,
      ipAddress: req?.headers.get('x-forwarded-for') || undefined,
      userAgent: req?.headers.get('user-agent') || undefined,
    });

    return {
      success: true,
      message: 'MFA disabled successfully',
    };
  } catch (error: any) {
    console.error('Error disabling MFA:', error);
    throw error;
  }
}

/**
 * Verifica un código TOTP durante el login
 */
export async function verifyMFAToken(userId: string, token: string, backupCode?: string): Promise<any> {
  try {
    // Buscar usuario
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    // Si no tiene MFA activado, retornar true (no requerir token)
    if (!user.mfaEnabled || !user.mfaSecret) {
      return true;
    }

    // Si se proporciona código de respaldo, verificarlo
    if (backupCode) {
      const backupCodes = user.mfaBackupCodes || [];
      const codeIndex = backupCodes.indexOf(backupCode.toUpperCase());

      if (codeIndex === -1) {
        return false;
      }

      // Remover el código usado
      backupCodes.splice(codeIndex, 1);

      await db.update(users)
        .set({ mfaBackupCodes: backupCodes })
        .where(eq(users.id, userId));

      return true;
    }

    // Verificar token TOTP
    const result = await authenticator.verify({
      token,
      secret: user.mfaSecret,
      window: 2, // Permitir 2 ventanas de tiempo
    });

    return result;
  } catch (error) {
    console.error('Error verifying MFA token:', error);
    return false;
  }
}

/**
 * Genera códigos de recuperación (backup codes)
 */
export async function generateBackupCodes(userId: string, count: number = 10) {
  try {
    // Buscar usuario
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfaEnabled) {
      throw new Error('MFA is not enabled for this user');
    }

    // Generar nuevos códigos de respaldo
    const backupCodes = generateBackupCodesArray(count);

    // Guardar en base de datos
    await db.update(users)
      .set({ mfaBackupCodes: backupCodes })
      .where(eq(users.id, userId));

    // Log de auditoría
    await auditLogger.log({
      userId,
      corporationId: user.corporationId,
      action: 'UPDATE',
      resource: 'users',
      resourceId: userId,
      success: true,
    });

    return {
      backupCodes,
      message: 'Guarda estos códigos en un lugar seguro. Solo se mostrarán una vez.',
    };
  } catch (error: any) {
    console.error('Error generating backup codes:', error);
    throw error;
  }
}

/**
 * Genera array de códigos de respaldo
 */
function generateBackupCodesArray(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generar código de 8 caracteres alfanuméricos
    const code = generateMnemonic()
      .split(' ')
      .slice(0, 4) // Tomar primeras 4 palabras
      .join(' ')
      .toUpperCase()
      .substring(0, 8); // Asegurar 8 caracteres
    codes.push(code);
  }

  return codes;
}

/**
 * Verifica si un usuario necesita MFA
 */
export async function requiresMFA(userId: string): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    // Solo administradores requieren MFA obligatoriamente
    const isAdmin = user.role.includes('admin');
    const hasMFAEnabled = user.mfaEnabled === true;

    return isAdmin && hasMFAEnabled;
  } catch (error) {
    console.error('Error checking MFA requirement:', error);
    return false;
  }
}

/**
 * Verifica si un usuario DEBE tener MFA (política de seguridad)
 */
export async function mustHaveMFA(userId: string): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    // Admins nacionales y estatales DEBEN tener MFA
    return user.role === 'national_admin' || user.role === 'state_admin';
  } catch (error) {
    console.error('Error checking MFA requirement:', error);
    return false;
  }
}
