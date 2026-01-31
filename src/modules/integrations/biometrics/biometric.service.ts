/**
 * Biometrics Integration Service
 *
 * Integración con servicios biométricos mexicanos
 * APIs: Llave MX, Verificamex Biometrics, etc.
 */

/**
 * Datos biométricos de una persona
 */
export interface BiometricData {
  curp: string;
  facialImage?: string; // Base64 o URL
  fingerprint?: string; // Template de huella digital
  irisScan?: string; // Template de iris
  voicePrint?: string; // Template de voz
}

/**
 * Respuesta de verificación biométrica
 */
export interface BiometricVerificationResponse {
  match: boolean;
  confidence: number; // 0-100
  biometricType: 'facial' | 'fingerprint' | 'iris' | 'voice';
  error?: string;
}

/**
 * Valida que una imagen facial cumpla con los requisitos
 */
export function validateFacialImage(imageData: string): boolean {
  // Validar que sea base64 válido
  if (!imageData || typeof imageData !== 'string') {
    return false;
  }

  // Validar formato (debe ser base64)
  const base64Pattern = /^data:image\/(jpeg|jpg|png);base64,/;
  if (!base64Pattern.test(imageData)) {
    return false;
  }

  // Validar tamaño (máximo 5MB)
  const base64Data = imageData.split(',')[1];
  const sizeInBytes = (base64Data.length * 3) / 4;
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (sizeInBytes > maxSize) {
    return false;
  }

  return true;
}

/**
 * Valida datos de huella digital
 */
export function validateFingerprintData(fingerprintData: string): boolean {
  if (!fingerprintData || typeof fingerprintData !== 'string') {
    return false;
  }

  // El formato depende del proveedor (generalmente WSQ, ISO 19794-2, etc.)
  // Validación básica
  return fingerprintData.length > 0 && fingerprintData.length < 4096;
}

/**
 * Verifica identidad usando reconocimiento facial
 *
 * NOTA: En producción necesitas:
 * 1. Contratar servicio (Llave MX, Verificamex, etc.)
 * 2. Obtener API key
 * 3. Configurar en .env.local
 */
export async function verifyFacialRecognition(
  facialImage: string,
  curp: string
): Promise<BiometricVerificationResponse> {
  // Validar imagen
  if (!validateFacialImage(facialImage)) {
    return {
      match: false,
      confidence: 0,
      biometricType: 'facial',
      error: 'Imagen facial inválida',
    };
  }

  // En desarrollo, simulamos verificación
  if (process.env.NODE_ENV === 'development') {
    // Simular match si el CURP existe en la base de datos
    const { findPersonByCURP } = await import('../curp/curp.service');
    const existingPerson = await findPersonByCURP(curp);

    if (existingPerson) {
      return {
        match: true,
        confidence: 95,
        biometricType: 'facial',
      };
    } else {
      return {
        match: false,
        confidence: 0,
        biometricType: 'facial',
        error: 'Persona no encontrada en base de datos',
      };
    }
  }

  // En producción, llamar API real
  const API_KEY = process.env.LLAVE_MX_API_KEY;
  const API_URL = process.env.LLAVE_MX_API_URL || 'https://api.gob.mx/llavemx/biometric';

  if (!API_KEY) {
    return {
      match: false,
      confidence: 0,
      biometricType: 'facial',
      error: 'Servicio de biometría no configurado',
    };
  }

  try {
    const response = await fetch(`${API_URL}/facial/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        facialImage,
        curp: curp.toUpperCase(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Biometric API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      match: data.match || false,
      confidence: data.confidence || 0,
      biometricType: 'facial',
      error: data.error,
    };
  } catch (error: any) {
    console.error('Facial recognition error:', error);
    return {
      match: false,
      confidence: 0,
      biometricType: 'facial',
      error: 'Error al conectar con servicio biométrico',
    };
  }
}

/**
 * Verifica identidad usando huella digital
 */
export async function verifyFingerprint(
  fingerprintData: string,
  curp: string
): Promise<BiometricVerificationResponse> {
  if (!validateFingerprintData(fingerprintData)) {
    return {
      match: false,
      confidence: 0,
      biometricType: 'fingerprint',
      error: 'Datos de huella digital inválidos',
    };
  }

  // En desarrollo, simulamos verificación
  if (process.env.NODE_ENV === 'development') {
    return {
      match: true,
      confidence: 90,
      biometricType: 'fingerprint',
    };
  }

  // En producción, llamar API real
  const API_KEY = process.env.BIOMETRIC_API_KEY;
  const API_URL = process.env.BIOMETRIC_API_URL || 'https://api.biometric.service.com/verify';

  if (!API_KEY) {
    return {
      match: false,
      confidence: 0,
      biometricType: 'fingerprint',
      error: 'Servicio biométrico no configurado',
    };
  }

  try {
    const response = await fetch(`${API_URL}/fingerprint/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        fingerprint: fingerprintData,
        curp: curp.toUpperCase(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Biometric API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      match: data.match || false,
      confidence: data.confidence || 0,
      biometricType: 'fingerprint',
      error: data.error,
    };
  } catch (error: any) {
    console.error('Fingerprint verification error:', error);
    return {
      match: false,
      confidence: 0,
      biometricType: 'fingerprint',
      error: 'Error al conectar con servicio biométrico',
    };
  }
}

/**
 * Registra datos biométricos de una persona
 */
export async function registerBiometricData(
  curp: string,
  biometricType: 'facial' | 'fingerprint' | 'iris' | 'voice',
  data: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar datos según el tipo
    if (biometricType === 'facial' && !validateFacialImage(data)) {
      return {
        success: false,
        error: 'Imagen facial inválida',
      };
    }

    if (biometricType === 'fingerprint' && !validateFingerprintData(data)) {
      return {
        success: false,
        error: 'Datos de huella digital inválidos',
      };
    }

    // TODO: En producción, aquí se llamaría a la API para registrar
    // Por ahora, simulamos éxito
    console.log(`Registrando biometría tipo ${biometricType} para CURP ${curp}`);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error registering biometric data:', error);
    return {
      success: false,
      error: 'Error al registrar datos biométricos',
    };
  }
}

/**
 * Compara dos imágenes faciales para verificar si son la misma persona
 */
export async function compareFacialImages(
  image1: string,
  image2: string
): Promise<{ match: boolean; confidence: number; error?: string }> {
  // Validar ambas imágenes
  if (!validateFacialImage(image1) || !validateFacialImage(image2)) {
    return {
      match: false,
      confidence: 0,
      error: 'Una o ambas imágenes son inválidas',
    };
  }

  // En desarrollo, simulamos comparación
  if (process.env.NODE_ENV === 'development') {
    // Simular match aleatorio para testing
    const match = Math.random() > 0.5;
    const confidence = match ? 85 + Math.random() * 10 : Math.random() * 30;

    return {
      match,
      confidence,
    };
  }

  // En producción, llamar API real de reconocimiento facial
  const API_KEY = process.env.FACIAL_RECOGNITION_API_KEY;

  if (!API_KEY) {
    return {
      match: false,
      confidence: 0,
      error: 'Servicio de reconocimiento facial no configurado',
    };
  }

  try {
    const response = await fetch('https://api.facial-recognition.com/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        image1,
        image2,
      }),
    });

    if (!response.ok) {
      throw new Error(`Facial comparison API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      match: data.match || false,
      confidence: data.confidence || 0,
    };
  } catch (error: any) {
    console.error('Facial comparison error:', error);
    return {
      match: false,
      confidence: 0,
      error: 'Error al comparar imágenes faciales',
    };
  }
}
