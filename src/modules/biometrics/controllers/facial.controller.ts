/**
 * Advanced Biometrics Controller
 *
 * Endpoints para reconocimiento facial y biometría avanzada
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/shared/middleware/enhanced-auth.middleware';
import { biometricService } from '../services/facial.service';

/**
 * POST /api/biometrics/face/compare
 * Compara foto facial con base de datos SAFR
 */
export async function POST_COMPARE(req: NextRequest) {
  return withPermission('biometrics', 'create', async (req) => {
    try {
      const formData = await req.formData();

      const faceImage = formData.get('faceImage') as File;
      const galleryId = formData.get('galleryId') as string;

      if (!faceImage) {
        return NextResponse.json(
          { success: false, error: 'Face image is required' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await faceImage.arrayBuffer());
      const result = await biometricService.compareFace(buffer, galleryId);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Face comparison error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/biometrics/face/enroll
 * Registra rostro en sistema SAFR
 */
export async function POST_ENROLL(req: NextRequest) {
  return withPermission('biometrics', 'create', async (req) => {
    try {
      const formData = await req.formData();

      const personnelId = formData.get('personnelId') as string;
      const faceImage = formData.get('faceImage') as File;

      if (!personnelId || !faceImage) {
        return NextResponse.json(
          { success: false, error: 'personnelId and faceImage are required' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await faceImage.arrayBuffer());
      const success = await biometricService.enrollFace(personnelId, buffer);

      return NextResponse.json({
        success,
        message: success ? 'Face enrolled successfully' : 'Failed to enroll face',
      });
    } catch (error) {
      console.error('Face enrollment error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
