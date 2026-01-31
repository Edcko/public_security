/**
 * MFA (Multi-Factor Authentication) Service
 *
 * Implementa autenticación de dos factores usando TOTP
 * Compatible con Google Authenticator, Authy, etc.
 */

import authenticator from 'otplib/authenticator';
import { generateMnemonic } from 'ethers';
import QRCode from 'qrcode';

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  uri: string;
}

export interface MFAVerification {
  valid: boolean;
  error?: string;
}

/**
 * Generar secreto TOTP para un usuario
 */
export async function generateMFASecret(userEmail: string): Promise<MFASetup> {
  // Generar secreto aleatorio (base32)
  const secret = authenticator.generateSecret();

  // Generar nombre del issuer para la app
  const issuer = 'Sistema de Gestión Policial';
  const serviceName = 'SGP-MFA';

  // Generar URI para apps de autenticación
  const uri = authenticator.keyuri(userEmail, issuer, secret);

  // Generar QR code
  const qrCode = await new Promise<string>((resolve, reject) => {
    QRCode.toDataURL(uri, (err, url) => {
      if (err) reject(err);
      resolve(url);
    });
  });

  // Generar códigos de respaldo (10 códigos)
  const backupCodes = generateBackupCodes();

  return {
    secret: secret.base32,
    qrCode,
    uri,
    backupCodes,
  };
}

/**
 * Verificar código TOTP
 */
export function verifyMFA(token: string, secret: string): MFAVerification {
  try {
    const isValid = authenticator.verify({
      token,
      secret,
      window: 2, // Permitir 2 ventanas de tiempo (para sincronización de relojes)
    });

    if (!isValid) {
      return {
        valid: false,
        error: 'Código inválido',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Error al verificar código',
    };
  }
}

/**
 * Generar códigos de respaldo (backup codes)
 * Son códigos de un solo uso que se pueden usar si se pierde acceso al authenticator
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];

  for (let i = 0; i < 10; i++) {
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
 * Servicio completo de MFA
 */
export const mfaService = {
  generateMFASecret,
  verifyMFA,
};
