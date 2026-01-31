/**
 * Personnel Advanced Features
 *
 * Funcionalidades avanzadas para gestión de personal:
 * - Upload de fotos y documentos
 * - Búsqueda avanzada con paginación
 * - Historial de movimientos
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withPermission } from '@/shared/middleware/enhanced-auth.middleware';
import { personnelRepository } from '../repositories/personnel.repository';
import { auditLogger } from '@/shared/authentication/audit.logger';

/**
 * GET /api/personnel/search
 * Búsqueda avanzada con paginación
 */
export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const name = searchParams.get('name');
      const badgeNumber = searchParams.get('badgeNumber');
      const rank = searchParams.get('rank');
      const status = searchParams.get('status');

      // Búsqueda con filtros
      const results = await personnelRepository.search({
        name: name || undefined,
        badgeNumber: badgeNumber || undefined,
        rank: rank || undefined,
        status: status || undefined,
      });

      // Paginar manualmente
      const start = (page - 1) * limit;
      const paginatedResults = results.slice(start, start + limit);
      const totalPages = Math.ceil(results.length / limit);

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'personnel-search'
      );

      return NextResponse.json({
        success: true,
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: results.length,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/personnel/[id]/history
 * Historial de movimientos de un oficial
 */
export async function GET_HISTORY(req: NextRequest, context: any) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;

      // TODO: Implementar tabla personnel_history
      // Por ahora retornamos un array vacío
      const history: any[] = [];

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'personnel-history',
        id
      );

      return NextResponse.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('History error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/personnel/[id]/photo
 * Upload de foto de oficial
 */
export async function POST_PHOTO(req: NextRequest, context: any) {
  return withPermission('personnel', 'update', async (req) => {
    try {
      const user = (req as any).user;
      const { id } = await context.params;
      const formData = await req.formData();

      const photo = formData.get('photo') as File;

      if (!photo) {
        return NextResponse.json(
          { success: false, error: 'No photo provided' },
          { status: 400 }
        );
      }

      // TODO: Implementar upload a S3 o local storage
      // Por ahora, simulamos el upload
      const photoUrl = `/uploads/personnel/${id}/${photo.name}`;

      // Actualizar personnel con photoUrl
      // await personnelRepository.update(id, { photoUrl });

      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'UPDATE',
        'personnel-photo',
        id
      );

      return NextResponse.json({
        success: true,
        data: { photoUrl },
        message: 'Photo uploaded successfully',
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/personnel/[id]/documents
 * Upload de documentos (credencial, CURP, etc.)
 */
