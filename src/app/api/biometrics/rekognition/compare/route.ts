/**
 * AWS Rekognition API Routes
 *
 * Endpoints para reconocimiento facial usando AWS Rekognition
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { awsRekognitionService } from '@/modules/biometrics/services/aws-rekognition.service';

/**
 * POST /api/biometrics/rekognition/compare
 * Compara dos imágenes faciales
 */
export async function POST(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { sourceImage, targetImage, similarityThreshold } = body;

      if (!sourceImage || !targetImage) {
        return NextResponse.json(
          { success: false, error: 'sourceImage and targetImage are required' },
          { status: 400 }
        );
      }

      const result = await awsRekognitionService.compareFaces(
        sourceImage,
        targetImage,
        similarityThreshold || 80
      );

      return NextResponse.json({
        success: result.match,
        data: result,
      });
    } catch (error: any) {
      console.error('AWS Rekognition compare error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
