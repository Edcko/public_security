/**
 * CURP Validator
 *
 * Validación y extracción de información de la CURP mexicana
 * La CURP tiene 18 caracteres con la siguiente estructura:
 *
 * Posición 1: Primera letra del apellido paterno
 * Posición 2: Primera vocal interna del apellido paterno
 * Posición 3: Primera letra del apellido materno
 * Posición 4: Primera letra del nombre
 * Posición 5-6: Año de nacimiento (últimos 2 dígitos)
 * Posición 7-8: Mes de nacimiento
 * Posición 9-10: Día de nacimiento
 * Posición 11: Género (H = Hombre, M = Mujer)
 * Posición 12-13: Código de estado de nacimiento
 * Posición 14-16: Primera consonancia interna del apellido paterno + materno + nombre
 * Posición 17-18: Dígito verificador (homoclave)
 */

export interface CURPInfo {
  valid: boolean;
  error?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  gender?: 'H' | 'M';
  stateCode?: string;
  stateName?: string;
}

export interface CURPValidationResult {
  isValid: boolean;
  error?: string;
  info?: CURPInfo;
}

/**
 * Códigos de estado mexicano según la CURP
 */
const STATE_CODES: Record<string, string> = {
  AS: 'Aguascalientes',
  BC: 'Baja California',
  BS: 'Baja California Sur',
  CC: 'Campeche',
  CL: 'Coahuila',
  CM: 'Colima',
  CS: 'Chiapas',
  CH: 'Chihuahua',
  DF: 'Distrito Federal',
  DG: 'Durango',
  GT: 'Guanajuato',
  GR: 'Guerrero',
  HG: 'Hidalgo',
  JC: 'Jalisco',
  MC: 'México',
  MN: 'Michoacán',
  MS: 'Morelos',
  NT: 'Nayarit',
  NL: 'Nuevo León',
  OC: 'Oaxaca',
  PL: 'Puebla',
  QT: 'Querétaro',
  QR: 'Quintana Roo',
  SP: 'San Luis Potosí',
  SL: 'Sinaloa',
  GR: 'Guerrero',
  SG: 'Tabasco',
  TS: 'Tamaulipas',
  TL: 'Tlaxcala',
  TM: 'Tamaulipas',
  VZ: 'Veracruz',
  YN: 'Yucatán',
  ZS: 'Zacatecas',
  NE: 'Nacido en el Extranjero',
};

/**
 * Vocales válidas para la CURP
 */
const VOWELS = ['A', 'E', 'I', 'O', 'U'];

/**
 * Consonantes válidas para la CURP
 */
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];

/**
 * Caracteres inválidos comunes que se usan para reemplazar
 */
const INVALID_CHARS = ['Ñ', 'Ü'];

/**
 * Validar formato básico de la CURP
 */
function validateFormat(curp: string): { valid: boolean; error?: string } {
  // Eliminar espacios y convertir a mayúsculas
  const cleanCURP = curp.toUpperCase().trim().replace(/\s/g, '');

  // Verificar longitud
  if (cleanCURP.length !== 18) {
    return {
      valid: false,
      error: `La CURP debe tener 18 caracteres (tiene ${cleanCURP.length})`,
    };
  }

  // Verificar que todos los caracteres sean válidos
  for (let i = 0; i < cleanCURP.length; i++) {
    const char = cleanCURP[i];

    // Posiciones 0-3: Letras del nombre
    if (i < 4) {
      if (!CONSONANTS.includes(char) && !VOWELS.includes(char)) {
        return {
          valid: false,
          error: `Posición ${i + 1}: Se espera una letra`,
        };
      }
    }
    // Posiciones 4-9: Fecha (dígitos)
    else if (i >= 4 && i < 10) {
      if (!/[0-9]/.test(char)) {
        return {
          valid: false,
          error: `Posición ${i + 1}: Se espera un dígito (fecha)`,
        };
      }
    }
    // Posición 10: Género
    else if (i === 10) {
      if (char !== 'H' && char !== 'M') {
        return {
          valid: false,
          error: `Posición 11: Género inválido (debe ser H o M)`,
        };
      }
    }
    // Posiciones 11-12: Código de estado
    else if (i >= 11 && i < 13) {
      if (!CONSONANTS.includes(char) && !VOWELS.includes(char)) {
        return {
          valid: false,
          error: `Posición ${i + 1}: Código de estado inválido`,
        };
      }
    }
    // Posiciones 13-16: Consonantes internas
    else if (i >= 13 && i < 17) {
      if (!CONSONANTS.includes(char)) {
        return {
          valid: false,
          error: `Posición ${i + 1}: Se espera una consonante`,
        };
      }
    }
    // Posiciones 17-18: Dígito verificador
    else {
      if (!/[0-9A-Z]/.test(char)) {
        return {
          valid: false,
          error: `Posición ${i + 1}: Caracter inválido en dígito verificador`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validar fecha de nacimiento contenida en la CURP
 */
function validateBirthDate(curp: string): { valid: boolean; date?: Date; error?: string } {
  const year = curp.substring(4, 6);
  const month = curp.substring(6, 8);
  const day = curp.substring(8, 10);

  // Determinar el siglo (para personas nacidas antes de 2000 vs después)
  // El gobierno usa una regla compleja, aquí simplificamos
  let fullYear = parseInt(year);
  if (fullYear > 30) {
    fullYear += 1900;
  } else {
    fullYear += 2000;
  }

  const monthInt = parseInt(month);
  const dayInt = parseInt(day);

  if (monthInt < 1 || monthInt > 12) {
    return {
      valid: false,
      error: 'Mes inválido en la CURP',
    };
  }

  // Validar día según el mes
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDay = daysInMonth[monthInt - 1];

  // Ajustar por año bisiesto
  if (monthInt === 2 && ((fullYear % 4 === 0 && fullYear % 100 !== 0) || fullYear % 400 === 0)) {
    maxDay = 29;
  }

  if (dayInt < 1 || dayInt > maxDay) {
    return {
      valid: false,
      error: 'Día inválido en la CURP',
    };
  }

  // Verificar que la fecha no sea futura
  const birthDate = new Date(fullYear, monthInt - 1, dayInt);
  if (birthDate > new Date()) {
    return {
      valid: false,
      error: 'La fecha de nacimiento no puede ser futura',
    };
  }

  // Verificar que la persona no sea demasiado vieja (antes de 1900)
  if (fullYear < 1900) {
    return {
      valid: false,
      error: 'La fecha de nacimiento es demasiado antigua',
    };
  }

  return {
    valid: true,
    date: birthDate,
  };
}

/**
 * Calcular el dígito verificador de la CURP
 * Algoritmo oficial del RENAPO
 */
function calculateCheckDigit(curp17: string): string {
  const curp = curp17.toUpperCase();

  // Tabla de caracteres para el cálculo
  const chars = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  const lni = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = curp[i];
    const index = chars.indexOf(char);
    sum += lni[index] * (18 - i);
  }

  const remainder = sum % 10;
  const checkDigit = (10 - remainder) % 10;

  return checkDigit.toString();
}

/**
 * Validar el dígito verificador de la CURP
 */
function validateCheckDigit(curp: string): { valid: boolean; error?: string } {
  const curp17 = curp.substring(0, 17);
  const expectedDigit = calculateCheckDigit(curp17);
  const actualDigit = curp[17];

  if (actualDigit !== expectedDigit) {
    return {
      valid: false,
      error: `Dígito verificador inválido (se espera ${expectedDigit}, tiene ${actualDigit})`,
    };
  }

  return { valid: true };
}

/**
 * Extraer información de la CURP
 */
function extractInfo(curp: string): CURPInfo {
  const year = curp.substring(4, 6);
  const month = curp.substring(6, 8);
  const day = curp.substring(8, 10);

  let fullYear = parseInt(year);
  if (fullYear > 30) {
    fullYear += 1900;
  } else {
    fullYear += 2000;
  }

  const birthDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
  const gender = curp[10] as 'H' | 'M';
  const stateCode = curp.substring(11, 13);

  return {
    firstName: '', // No se puede extraer el nombre completo de la CURP
    lastName: '', // No se pueden extraer los apellidos completos
    birthDate,
    gender,
    stateCode,
    stateName: STATE_CODES[stateCode] || 'Desconocido',
  };
}

/**
 * Validación completa de la CURP
 */
export function validateCURP(curp: string): CURPValidationResult {
  // Limpiar la CURP
  const cleanCURP = curp.toUpperCase().trim().replace(/\s/g, '');

  // Validar formato
  const formatValidation = validateFormat(cleanCURP);
  if (!formatValidation.valid) {
    return {
      isValid: false,
      error: formatValidation.error,
    };
  }

  // Validar fecha
  const dateValidation = validateBirthDate(cleanCURP);
  if (!dateValidation.valid) {
    return {
      isValid: false,
      error: dateValidation.error,
    };
  }

  // Validar dígito verificador
  const checkValidation = validateCheckDigit(cleanCURP);
  if (!checkValidation.valid) {
    return {
      isValid: false,
      error: checkValidation.error,
    };
  }

  // Extraer información
  const info = extractInfo(cleanCURP);

  return {
    isValid: true,
    info: {
      valid: true,
      ...info,
    },
  };
}

/**
 * Validar formato básico (sin verificar dígito verificador)
 */
export function validateCURPBasic(curp: string): CURPValidationResult {
  const cleanCURP = curp.toUpperCase().trim().replace(/\s/g, '');

  const formatValidation = validateFormat(cleanCURP);
  if (!formatValidation.valid) {
    return {
      isValid: false,
      error: formatValidation.error,
    };
  }

  const dateValidation = validateBirthDate(cleanCURP);
  if (!dateValidation.valid) {
    return {
      isValid: false,
      error: dateValidation.error,
    };
  }

  const info = extractInfo(cleanCURP);

  return {
    isValid: true,
    info: {
      valid: true,
      ...info,
    },
  };
}

/**
 * Generar una CURP aleatoria para testing (NO usar en producción)
 */
export function generateMockCURP(): string {
  const randomChar = (chars: string[]) => chars[Math.floor(Math.random() * chars.length)];
  const randomDigit = () => Math.floor(Math.random() * 10).toString();

  // 4 letras del nombre
  let curp = '';
  for (let i = 0; i < 4; i++) {
    curp += randomChar([...CONSONANTS, ...VOWELS]);
  }

  // Fecha aleatoria (entre 18 y 60 años)
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - 18 - Math.floor(Math.random() * 42);
  const year = birthYear.toString().slice(-2);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  curp += year + month + day;

  // Género
  curp += Math.random() > 0.5 ? 'H' : 'M';

  // Estado (código aleatorio)
  const stateCodes = Object.keys(STATE_CODES);
  curp += stateCodes[Math.floor(Math.random() * stateCodes.length)];

  // 3 consonantes internas
  for (let i = 0; i < 4; i++) {
    curp += randomChar(CONSONANTS);
  }

  // Agregar '0' al final para tener 18 caracteres
  curp += '00';

  return curp;
}
