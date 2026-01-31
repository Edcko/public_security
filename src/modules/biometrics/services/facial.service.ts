/**
 * Advanced Biometrics Service
 *
 * Integración opcional con SAFR para reconocimiento facial
 * NOTA: Requiere licencia y acceso restringido
 */

import axios from 'axios';

const SAFR_API_URL = 'https://api.safr.ai/v1'; // URL ficticia, usar la real

export interface SAFRFaceMatchResult {
  match: boolean;
  confidence: number; // 0-1
  subjectId?: string;
  faceImage?: string;
}

/**
 * Compara foto facial con base de datos SAFR
 */
export async function compareFace(
  faceImage: Buffer,
  galleryId: string
): Promise<SAFRFaceMatchResult> {
  try {
    const apiKey = process.env.SAFR_API_KEY;

    if (!apiKey) {
      console.warn('SAFR_API_KEY not set, skipping facial recognition');
      return { match: false, confidence: 0 };
    }

    const response = await axios.post(
      `${SAFR_API_URL}/recognize`,
      {
        image: faceImage.toString('base64'),
        galleryId,
        minScore: 0.7,
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
      match: response.data.match,
      confidence: response.data.confidence,
      subjectId: response.data.subjectId,
    };
  } catch (error) {
    console.error('SAFR facial recognition error:', error);
    return { match: false, confidence: 0 };
  }
}

/**
 * Registra rostro en base de datos SAFR
 */
export async function enrollFace(
  personnelId: string,
  faceImage: Buffer
): Promise<boolean> {
  try {
    const apiKey = process.env.SAFR_API_KEY;

    if (!apiKey) {
      console.warn('SAFR_API_KEY not set');
      return false;
    }

    const response = await axios.post(
      `${SAFR_API_URL}/enroll`,
      {
        subjectId: personnelId,
        image: faceImage.toString('base64'),
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.success || false;
  } catch (error) {
    console.error('SAFR face enrollment error:', error);
    return false;
  }
}

/**
 * Servicio de biometría avanzada
 */
export const biometricService = {
  compareFace,
  enrollFace,
};
