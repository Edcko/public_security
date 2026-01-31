/**
 * AWS Rekognition Search Faces API Route
 *
 * Busca rostros coincidentes en una colección
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { awsRekognitionService } from '@/modules/biometrics/services/aws-rekognition.service';

/**
 * POST /api/biometrics/rekognition/search
 * Busca rostros coincidentes
 */
export async function POST(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { image, collectionId, faceMatchThreshold } = body;

      if (!image || !collectionId) {
        return NextResponse.json(
          { success: false, error: 'image and collectionId are required' },
          { status: 400 }
        );
      }

      const results = await awsRekognitionService.searchFaces(
        image,
        collectionId,
        faceMatchThreshold || 80
      );

      return NextResponse.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error: any) {
      console.error('AWS Rekognition search error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
