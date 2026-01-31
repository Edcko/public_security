/**
 * Biometrics Integration Controller
 *
 * Endpoints para verificación biométrica usando APIs mexicanas
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import {
  verifyFacialRecognition,
  verifyFingerprint,
  registerBiometricData,
  compareFacialImages,
} from './biometric.service';

/**
 * POST /api/integrations/biometrics/verify-facial
 * Verifica identidad usando reconocimiento facial
 */
export async function POST_FACIAL(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { facialImage, curp } = body;

      if (!facialImage || !curp) {
        return NextResponse.json(
          { success: false, error: 'facialImage and curp are required' },
          { status: 400 }
        );
      }

      const result = await verifyFacialRecognition(facialImage, curp);

      return NextResponse.json({
        success: result.match,
        data: {
          confidence: result.confidence,
          biometricType: result.biometricType,
        },
        error: result.error,
      });
    } catch (error: any) {
      console.error('Facial verification error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/biometrics/verify-fingerprint
 * Verifica identidad usando huella digital
 */
export async function POST_FINGERPRINT(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { fingerprint, curp } = body;

      if (!fingerprint || !curp) {
        return NextResponse.json(
          { success: false, error: 'fingerprint and curp are required' },
          { status: 400 }
        );
      }

      const result = await verifyFingerprint(fingerprint, curp);

      return NextResponse.json({
        success: result.match,
        data: {
          confidence: result.confidence,
          biometricType: result.biometricType,
        },
        error: result.error,
      });
    } catch (error: any) {
      console.error('Fingerprint verification error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/biometrics/register
 * Registra datos biométricos de una persona
 */
export async function POST_REGISTER(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { curp, biometricType, data } = body;

      if (!curp || !biometricType || !data) {
        return NextResponse.json(
          { success: false, error: 'curp, biometricType, and data are required' },
          { status: 400 }
        );
      }

      const result = await registerBiometricData(curp, biometricType, data);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Biometric data registered successfully',
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/biometrics/compare
 * Compara dos imágenes faciales
 */
export async function POST_COMPARE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { image1, image2 } = body;

      if (!image1 || !image2) {
        return NextResponse.json(
          { success: false, error: 'image1 and image2 are required' },
          { status: 400 }
        );
      }

      const result = await compareFacialImages(image1, image2);

      return NextResponse.json({
        success: result.match,
        data: {
          confidence: result.confidence,
        },
        error: result.error,
      });
    } catch (error: any) {
      console.error('Facial comparison error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
