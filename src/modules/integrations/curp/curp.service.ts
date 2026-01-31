/**
 * CURP Validation Service
 *
 * Integración con APIs mexicanas para validación de CURP
 * APIs soportadas: Verificamex, Tu Identidad, o API oficial del gobierno
 */

import { z } from 'zod';

// Esquema para validación de CURP
export const curpSchema = z.string()
  .length(18, 'CURP debe tener 18 caracteres')
  .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}\d{2}$/, 'Formato de CURP inválido');

/**
 * Valida la estructura de un CURP sin consultar API externa
 */
export function validateCURPSyntax(curp: string): boolean {
  try {
    curpSchema.parse(curp.toUpperCase());
    return true;
  } catch {
    return false;
  }
}

/**
 * Calcula la dígita verificador del CURP
 */
export function calculateCURPDigit(curp: string): string {
  const CURP = curp.toUpperCase();

  // Diccionario CORREGIDO para calcular dígito verificador del CURP
  // Según el estándar del CURP mexicano
  const dictionary: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
    'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'Ñ': 24, 'O': 25, 'P': 26, 'Q': 27,
    'R': 28, 'S': 29, 'T': 30, 'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35, 'Z': 36,
  };

  // Algoritmo estándar del CURP
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = CURP[i];
    const value = dictionary[char] || 0;
    sum += value * (18 - i);
  }

  const remainder = sum % 10;
  const digit = (10 - remainder) % 10;

  return digit.toString();
}

/**
 * Valida que el dígito verificador del CURP sea correcto
 */
export function validateCURPChecksum(curp: string): boolean {
  const providedDigit = curp[17];
  const calculatedDigit = calculateCURPDigit(curp.substring(0, 17));
  return providedDigit === calculatedDigit;
}

/**
 * Respuesta de validación de CURP
 */
export interface CURPValidationResponse {
  valid: boolean;
  curp?: string;
  data?: {
    name: string;
    firstSurname: string;
    secondSurname?: string;
    birthDate: string;
    gender: 'H' | 'M';
    stateCode: string;
  };
  error?: string;
}

/**
 * Valida un CURP usando Verificamex (o API similar)
 *
 * NOTA: En producción, necesitas:
 * 1. Contratar servicio (Verificamex.com, TuIdentidad.com, etc.)
 * 2. Obtener API key
 * 3. Configurar API key en .env.local
 */
export async function validateCURPWithAPI(
  curp: string
): Promise<CURPValidationResponse> {
  // Validación sintáctica primero
  if (!validateCURPSyntax(curp)) {
    return {
      valid: false,
      error: 'Formato de CURP inválido',
    };
  }

  // Validación de dígito verificador
  if (!validateCURPChecksum(curp)) {
    return {
      valid: false,
      error: 'Dígito verificador inválido',
    };
  }

  // En desarrollo, simulamos la validación exitosa
  // En producción, aquí haríamos la llamada real a la API
  const API_KEY = process.env.VERIFICAMEX_API_KEY;
  const API_URL = process.env.VERIFICAMEX_API_URL || 'https://api.verificamex.com/api/v1';

  if (!API_KEY || process.env.NODE_ENV === 'development') {
    // Simulación en desarrollo
    return {
      valid: true,
      curp: curp.toUpperCase(),
      data: {
        name: extractNameFromCURP(curp),
        firstSurname: extractFirstSurnameFromCURP(curp),
        secondSurname: extractSecondSurnameFromCURP(curp),
        birthDate: extractBirthDateFromCURP(curp),
        gender: curp[16] as 'H' | 'M',
        stateCode: curp.substring(11, 13),
      },
    };
  }

  try {
    const response = await fetch(`${API_URL}/curp/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ curp: curp.toUpperCase() }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      valid: data.valid || false,
      curp: curp.toUpperCase(),
      data: data.valid ? {
        name: data.nombre || '',
        firstSurname: data.apellidoPaterno || '',
        secondSurname: data.apellidoMaterno || '',
        birthDate: data.fechaNacimiento || '',
        gender: data.sexo === 'M' ? 'M' : 'H',
        stateCode: data.estado || '',
      } : undefined,
      error: data.error || undefined,
    };
  } catch (error: any) {
    console.error('CURP validation API error:', error);
    return {
      valid: false,
      error: 'Error al validar CURP con servicio externo',
    };
  }
}

/**
 * Extrae el nombre (letras 4-10) del CURP
 * NOTA: Esta es una aproximación, no el nombre real
 */
function extractNameFromCURP(_curp: string): string {
  // En producción, esto vendría de la API
  return '[Nombre]';
}

/**
 * Extrae el primer apellido (letras 0-4) del CURP
 */
function extractFirstSurnameFromCURP(_curp: string): string {
  // En producción, esto vendría de la API
  return '[Apellido Paterno]';
}

/**
 * Extrae el segundo apellido (letras 10-13) del CURP
 */
function extractSecondSurnameFromCURP(_curp: string): string {
  // En producción, esto vendría de la API
  return '[Apellido Materno]';
}

/**
 * Extrae la fecha de nacimiento (letras 4-10) del CURP
 */
function extractBirthDateFromCURP(curp: string): string {
  const yy = curp.substring(4, 6);
  const mm = curp.substring(6, 8);
  const dd = curp.substring(8, 10);

  // Determinar el siglo
  const year = parseInt(yy);
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;

  return `${fullYear}-${mm}-${dd}`;
}

/**
 * Obtiene el nombre del estado a partir del código del CURP
 */
export function getStateNameFromCode(stateCode: string): string {
  const states: { [key: string]: string } = {
    'AS': 'Aguascalientes',
    'BC': 'Baja California',
    'BS': 'Baja California Sur',
    'CC': 'Campeche',
    'CL': 'Coahuila',
    'CM': 'Colima',
    'CS': 'Chiapas',
    'CH': 'Chihuahua',
    'DF': 'Distrito Federal',
    'DG': 'Durango',
    'GT': 'Guanajuato',
    'GR': 'Guerrero',
    'HG': 'Jalisco',
    'JAL': 'Jalisco', // Alias para compatibilidad
    'MC': 'México',
    'MN': 'Michoacán',
    'MS': 'Morelos',
    'NT': 'Nayarit',
    'NL': 'Nuevo León',
    'OC': 'Oaxaca',
    'PL': 'Puebla',
    'QT': 'Querétaro',
    'QR': 'Quintana Roo',
    'SP': 'San Luis Potosí',
    'SL': 'Sinaloa',
    'TJ': 'Tlaxcala',
    'TM': 'Tamaulipas',
    'TL': 'Tlaxcala',
    'VZ': 'Veracruz',
    'YN': 'Yucatán',
    'ZS': 'Zacatecas',
  };

  return states[stateCode] || 'Desconocido';
}

/**
 * Busca una persona por CURP en la base de datos local
 */
export async function findPersonByCURP(curp: string) {
  const { db } = await import('@/shared/database/connection');
  const { personnel } = await import('@/shared/database/schema');
  const { eq } = await import('drizzle-orm');

  const [person] = await db
    .select()
    .from(personnel)
    .where(eq(personnel.curp, curp.toUpperCase()));

  return person || null;
}

/**
 * Servicio completo de validación de CURP
 * 1. Valida sintaxis
 * 2. Valida checksum
 * 3. Consulta API externa (si está configurada)
 * 4. Busca en base de datos local
 */
export async function fullCURPValidation(
  curp: string
): Promise<{
  syntaxValid: boolean;
  checksumValid: boolean;
  apiValid: boolean;
  existsInDB: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // 1. Validar sintaxis
    const syntaxValid = validateCURPSyntax(curp);
    if (!syntaxValid) {
      return {
        syntaxValid: false,
        checksumValid: false,
        apiValid: false,
        existsInDB: false,
        error: 'Formato de CURP inválido',
      };
    }

    // 2. Validar checksum
    const checksumValid = validateCURPChecksum(curp);
    if (!checksumValid) {
      return {
        syntaxValid: true,
        checksumValid: false,
        apiValid: false,
        existsInDB: false,
        error: 'Dígito verificador inválido',
      };
    }

    // 3. Buscar en base de datos local
    const existingPerson = await findPersonByCURP(curp);

    // 4. Consultar API externa (si está configurada)
    const apiResponse = await validateCURPWithAPI(curp);

    return {
      syntaxValid: true,
      checksumValid: true,
      apiValid: apiResponse.valid,
      existsInDB: !!existingPerson,
      data: apiResponse.data,
      error: apiResponse.error,
    };
  } catch (error: any) {
    console.error('Error in full CURP validation:', error);
    return {
      syntaxValid: false,
      checksumValid: false,
      apiValid: false,
      existsInDB: false,
      error: error.message,
    };
  }
}
