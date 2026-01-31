/**
 * AWS Rekognition Service
 *
 * Integración con Amazon Rekognition para reconocimiento facial
 * Documentación: https://docs.aws.amazon.com/rekognition/
 */

import {
  RekognitionClient,
  CompareFacesCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand,
  CompareFacesCommandInput,
  IndexFacesCommandInput,
  SearchFacesByImageCommandInput,
  DetectFacesCommandInput,
} from '@aws-sdk/client-rekognition';

// Configuración del cliente de Rekognition
const getRekognitionClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.warn('AWS credentials not configured');
    return null;
  }

  return new RekognitionClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

/**
 * Resultado de comparación facial
 */
export interface FaceComparisonResult {
  match: boolean;
  confidence: number; // 0-100
  similarity: number; // 0-100
  boundingBox?: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
  error?: string;
}

/**
 * Resultado de detección facial
 */
export interface FaceDetectionResult {
  facesDetected: number;
  confidence: number;
  emotions?: string[];
  ageRange?: { low: number; high: number };
  gender?: { value: string; confidence: number };
  smile?: { value: boolean; confidence: number };
  error?: string;
}

/**
 * Resultado de registro facial
 */
export interface FaceEnrollmentResult {
  success: boolean;
  faceId?: string;
  confidence: number;
  error?: string;
}

/**
 * Compara dos imágenes faciales para determinar si son la misma persona
 *
 * @param sourceImage - Imagen fuente (Buffer o base64)
 * @param targetImage - Imagen objetivo a comparar (Buffer o base64)
 * @param similarityThreshold - Umbral de similitud (default: 80)
 */
export async function compareFaces(
  sourceImage: Buffer | string,
  targetImage: Buffer | string,
  similarityThreshold: number = 80
): Promise<FaceComparisonResult> {
  const client = getRekognitionClient();

  if (!client) {
    return {
      match: false,
      confidence: 0,
      similarity: 0,
      error: 'AWS Rekognition no configurado',
    };
  }

  try {
    // Convertir imágenes a formato AWS
    const sourceBytes = typeof sourceImage === 'string'
      ? Buffer.from(sourceImage.split(',')[1] || sourceImage, 'base64')
      : sourceImage;

    const targetBytes = typeof targetImage === 'string'
      ? Buffer.from(targetImage.split(',')[1] || targetImage, 'base64')
      : targetImage;

    const params: CompareFacesCommandInput = {
      SourceImage: {
        Bytes: sourceBytes,
      },
      TargetImage: {
        Bytes: targetBytes,
      },
      SimilarityThreshold: similarityThreshold,
    };

    const command = new CompareFacesCommand(params);
    const response = await client.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return {
        match: false,
        confidence: 0,
        similarity: 0,
      };
    }

    const bestMatch = response.FaceMatches[0];

    return {
      match: true,
      confidence: bestMatch.Similarity?.confidence || 0,
      similarity: bestMatch.Similarity?.value || 0,
      boundingBox: bestMatch.Similarity?.boundingBox
        ? {
            width: bestMatch.Similarity.boundingBox.width || 0,
            height: bestMatch.Similarity.boundingBox.height || 0,
            left: bestMatch.Similarity.boundingBox.left || 0,
            top: bestMatch.Similarity.boundingBox.top || 0,
          }
        : undefined,
    };
  } catch (error: any) {
    console.error('AWS Rekognition compareFaces error:', error);

    // Manejar errores específicos
    if (error.name === 'InvalidParameterException') {
      return {
        match: false,
        confidence: 0,
        similarity: 0,
        error: 'No se detectó ningún rostro en una o ambas imágenes',
      };
    }

    return {
      match: false,
      confidence: 0,
      similarity: 0,
      error: error.message || 'Error al comparar rostros',
    };
  }
}

/**
 * Detecta rostros en una imagen y extrae información
 *
 * @param image - Imagen a analizar (Buffer o base64)
 * @param attributes - Atributos a detectar (default: ALL)
 */
export async function detectFaces(
  image: Buffer | string,
  attributes: 'DEFAULT' | 'ALL' = 'ALL'
): Promise<FaceDetectionResult> {
  const client = getRekognitionClient();

  if (!client) {
    return {
      facesDetected: 0,
      confidence: 0,
      error: 'AWS Rekognition no configurado',
    };
  }

  try {
    const imageBytes = typeof image === 'string'
      ? Buffer.from(image.split(',')[1] || image, 'base64')
      : image;

    const params: DetectFacesCommandInput = {
      Image: {
        Bytes: imageBytes,
      },
      Attributes: [attributes],
    };

    const command = new DetectFacesCommand(params);
    const response = await client.send(command);

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return {
        facesDetected: 0,
        confidence: 0,
        error: 'No se detectaron rostros en la imagen',
      };
    }

    // Usar el rostro con mayor confianza
    const mainFace = response.FaceDetails.reduce((prev, current) =>
      (current.Confidence || 0) > (prev.Confidence || 0) ? current : prev
    );

    return {
      facesDetected: response.FaceDetails.length,
      confidence: mainFace.Confidence || 0,
      emotions: mainFace.Emotions?.map((e: any) => e.Type).slice(0, 3),
      ageRange: mainFace.AgeRange
        ? {
            low: mainFace.AgeRange.Low || 0,
            high: mainFace.AgeRange.High || 0,
          }
        : undefined,
      gender: mainFace.Gender
        ? {
            value: mainFace.Gender.Value || 'Unknown',
            confidence: mainFace.Gender.Confidence || 0,
          }
        : undefined,
      smile: mainFace.Smile
        ? {
            value: mainFace.Smile.Value || false,
            confidence: mainFace.Smile.Confidence || 0,
          }
        : undefined,
    };
  } catch (error: any) {
    console.error('AWS Rekognition detectFaces error:', error);

    return {
      facesDetected: 0,
      confidence: 0,
      error: error.message || 'Error al detectar rostros',
    };
  }
}

/**
 * Registra un rostro en una colección de AWS Rekognition
 *
 * @param image - Imagen del rostro (Buffer o base64)
 * @param collectionId - ID de la colección
 * @param externalImageId - ID externo (ej: personnel ID)
 */
export async function indexFace(
  image: Buffer | string,
  collectionId: string,
  externalImageId: string
): Promise<FaceEnrollmentResult> {
  const client = getRekognitionClient();

  if (!client) {
    return {
      success: false,
      confidence: 0,
      error: 'AWS Rekognition no configurado',
    };
  }

  try {
    const imageBytes = typeof image === 'string'
      ? Buffer.from(image.split(',')[1] || image, 'base64')
      : image;

    const params: IndexFacesCommandInput = {
      CollectionId: collectionId,
      Image: {
        Bytes: imageBytes,
      },
      ExternalImageId: externalImageId,
      DetectionAttributes: ['DEFAULT'],
    };

    const command = new IndexFacesCommand(params);
    const response = await client.send(command);

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      return {
        success: false,
        confidence: 0,
        error: 'No se detectó ningún rostro para indexar',
      };
    }

    const faceRecord = response.FaceRecords[0];

    return {
      success: true,
      faceId: faceRecord.Face?.FaceId,
      confidence: faceRecord.Face?.Confidence || 0,
    };
  } catch (error: any) {
    console.error('AWS Rekognition indexFace error:', error);

    return {
      success: false,
      confidence: 0,
      error: error.message || 'Error al indexar rostro',
    };
  }
}

/**
 * Busca rostros en una colección que coincidan con la imagen proporcionada
 *
 * @param image - Imagen a buscar (Buffer o base64)
 * @param collectionId - ID de la colección
 * @param faceMatchThreshold - Umbral de coincidencia (default: 80)
 */
export async function searchFaces(
  image: Buffer | string,
  collectionId: string,
  faceMatchThreshold: number = 80
): Promise<FaceComparisonResult[]> {
  const client = getRekognitionClient();

  if (!client) {
    return [{
      match: false,
      confidence: 0,
      similarity: 0,
      error: 'AWS Rekognition no configurado',
    }];
  }

  try {
    const imageBytes = typeof image === 'string'
      ? Buffer.from(image.split(',')[1] || image, 'base64')
      : image;

    const params: SearchFacesByImageCommandInput = {
      CollectionId: collectionId,
      Image: {
        Bytes: imageBytes,
      },
      FaceMatchThreshold: faceMatchThreshold,
      MaxFaces: 10, // Retornar máximo 10 coincidencias
    };

    const command = new SearchFacesByImageCommand(params);
    const response = await client.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return [];
    }

    return response.FaceMatches.map((match: any) => ({
      match: true,
      confidence: match.Face?.Confidence || 0,
      similarity: match.Similarity || 0,
      faceId: match.Face?.FaceId,
      externalImageId: match.Face?.ExternalImageId,
    }));
  } catch (error: any) {
    console.error('AWS Rekognition searchFaces error:', error);

    return [{
      match: false,
      confidence: 0,
      similarity: 0,
      error: error.message || 'Error al buscar rostros',
    }];
  }
}

/**
 * Servicio de AWS Rekognition
 */
export const awsRekognitionService = {
  compareFaces,
  detectFaces,
  indexFace,
  searchFaces,
};
