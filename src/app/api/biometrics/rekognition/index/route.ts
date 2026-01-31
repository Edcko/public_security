/**
 * AWS Rekognition Index Face API Route
 *
 * Registra un rostro en una colección
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { awsRekognitionService } from '@/modules/biometrics/services/aws-rekognition.service';

/**
 * POST /api/biometrics/rekognition/index
 * Indexa un rostro en una colección
 */
export async function POST(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { image, collectionId, externalImageId } = body;

      if (!image || !collectionId || !externalImageId) {
        return NextResponse.json(
          { success: false, error: 'image, collectionId, and externalImageId are required' },
          { status: 400 }
        );
      }

      const result = await awsRekognitionService.indexFace(
        image,
        collectionId,
        externalImageId
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result,
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('AWS Rekognition index error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
