/**
 * AWS Rekognition Detect Faces API Route
 *
 * Detecta rostros en una imagen y extrae información
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { awsRekognitionService } from '@/modules/biometrics/services/aws-rekognition.service';

/**
 * POST /api/biometrics/rekognition/detect
 * Detecta rostros en una imagen
 */
export async function POST(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { image, attributes } = body;

      if (!image) {
        return NextResponse.json(
          { success: false, error: 'image is required' },
          { status: 400 }
        );
      }

      const result = await awsRekognitionService.detectFaces(
        image,
        attributes || 'ALL'
      );

      return NextResponse.json({
        success: result.facesDetected > 0,
        data: result,
      });
    } catch (error: any) {
      console.error('AWS Rekognition detect error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
