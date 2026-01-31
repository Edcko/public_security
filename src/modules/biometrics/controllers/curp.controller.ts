/**
 * CURP Integration Controller
 *
 * Endpoints para validación y consulta de CURP
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { auditLogger } from '@/shared/authentication/audit.logger';
import { curpService } from '../services/curp.service';
import { z } from 'zod';

/**
 * POST /api/biometrics/curp/validate
 * Valida un CURP con APIs mexicanas
 */
export async function POST_VALIDATE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      const schema = z.object({
        curp: z.string().length(18),
      });

      const { curp } = schema.parse(body);

      // Validar formato primero
      if (!curpService.isValidCURPFormat(curp)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid CURP format',
            details: 'CURP must be 18 characters in correct format',
          },
          { status: 400 }
        );
      }

      // Validar con APIs externas
      const result = await curpService.validateCURP(curp);

      // Log de auditoría (consultas a datos personales)
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'curp-validation',
        undefined,
        {
          ipAddress: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json({
        success: result.valid,
        data: result.data,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      console.error('CURP validation error:', error);

      await auditLogger.logFailure(
        (req as any).user?.userId,
        (req as any).user?.corporationId,
        'CREATE',
        'curp-validation',
        error.message
      );

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/biometrics/curp/parse
 * Parsea un CURP sin consultar APIs externas
 */
export async function POST_PARSE(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const body = await req.json();

      const schema = z.object({
        curp: z.string().length(18),
      });

      const { curp } = schema.parse(body);

      const parsed = curpService.parseCURP(curp);

      if (!parsed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid CURP format',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: parsed,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      console.error('CURP parse error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/biometrics/curp/fetch
 * Busca persona por CURP (DB + APIs externas)
 */
export async function POST_FETCH(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      const schema = z.object({
        curp: z.string().length(18),
      });

      const { curp } = schema.parse(body);

      const result = await curpService.fetchPersonByCURP(curp);

      // Log de auditoría
      await auditLogger.logSuccess(
        user.userId,
        user.corporationId,
        'READ',
        'curp-fetch',
        undefined
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      console.error('CURP fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
