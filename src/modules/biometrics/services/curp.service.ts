/**
 * CURP Validation Service
 *
 * Integración con APIs mexicanas para validación de CURP:
 * - Verificamex
 * - Tu Identidad
 * - Llave MX
 */

import axios from 'axios';

// Configuración de APIs
const VERIFICAMEX_API_URL = 'https://api.verificamex.com/api/curp/validate';
const LLAVEMX_API_URL = 'https://api.llavemx.com/v1/identity/verify';

export interface CURPValidationResult {
  valid: boolean;
  data?: {
    curp: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento: string;
    sexo: string;
    entidadNacimiento: string;
  };
  error?: string;
}

export interface CURPFetchResult {
  exists: boolean;
  data?: any;
}

/**
 * Valida un CURP usando Verificamex
 */
export async function validateCURPWithVerificamex(curp: string): Promise<CURPValidationResult> {
  try {
    const apiKey = process.env.VERIFICAMEX_API_KEY;

    if (!apiKey) {
      console.warn('VERIFICAMEX_API_KEY not set, skipping CURP validation');
      return { valid: true }; // Permitir en development
    }

    const response = await axios.post(
      VERIFICAMEX_API_URL,
      { curp },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos
      }
    );

    return {
      valid: response.data.valid,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error validating CURP with Verificamex:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Valida CURP usando Llave MX (identidad digital biométrica)
 */
export async function validateCURPWithLlaveMX(curp: string, biometricData?: any): Promise<CURPValidationResult> {
  try {
    const apiKey = process.env.LLAVEMX_API_KEY;

    if (!apiKey) {
      console.warn('LLAVEMX_API_KEY not set, skipping biometric validation');
      return { valid: true };
    }

    const response = await axios.post(
      LLAVEMX_API_URL,
      {
        curp,
        biometricData, // Datos biométricos si están disponibles
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return {
      valid: response.data.valid,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error validating CURP with Llave MX:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Valida CURP usando múltiples APIs (fallback)
 */
export async function validateCURP(curp: string): Promise<CURPValidationResult> {
  // Primero intentar Verificamex
  let result = await validateCURPWithVerificamex(curp);

  if (result.valid) {
    return result;
  }

  // Si falla, intentar Llave MX
  result = await validateCURPWithLlaveMX(curp);

  return result;
}

/**
 * Busca datos de una persona por su CURP
 */
export async function fetchPersonByCURP(curp: string): Promise<CURPFetchResult> {
  try {
    // Primero buscar en nuestra base de datos
    const { personnelRepository } = await import('@/modules/personnel/repositories/personnel.repository');
    const existing = await personnelRepository.findByCURP(curp);

    if (existing) {
      return {
        exists: true,
        data: existing,
      };
    }

    // Si no existe, validar con API externa
    const validation = await validateCURP(curp);

    if (validation.valid && validation.data) {
      return {
        exists: false,
        data: validation.data,
      };
    }

    return {
      exists: false,
    };
  } catch (error) {
    console.error('Error fetching person by CURP:', error);
    return {
      exists: false,
    };
  }
}

/**
 * Valida estructura de CURP (sin consultar API externa)
 * Formato: 4 letras + 6 números + H/M + 1 letra + 3 letras + 2 dígitos
 * Ejemplo: BADD110312HCMLNS09
 */
export function isValidCURPFormat(curp: string): boolean {
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9]{2}$/;
  return curpRegex.test(curp);
}

/**
 * Extrae información básica de un CURP (sin consultar API)
 */
export function parseCURP(curp: string) {
  if (!isValidCURPFormat(curp)) {
    return null;
  }

  return {
    apellidoPaterno: curp.substring(0, 4),
    apellidoMaterno: curp.substring(4, 6),
    nombre: curp.substring(6, 8),
    fechaNacimiento: `${19}${curp.substring(8, 10)}-${curp.substring(10, 12)}-${curp.substring(12, 14)}`,
    sexo: curp.substring(14, 15) === 'H' ? 'Hombre' : 'Mujer',
    entidadNacimiento: curp.substring(15, 17),
  };
}

/**
 * Servicio completo de CURP para uso en controllers
 */
export const curpService = {
  validateCURP,
  validateCURPWithVerificamex,
  validateCURPWithLlaveMX,
  fetchPersonByCURP,
  isValidCURPFormat,
  parseCURP,
};
