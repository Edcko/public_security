/**
 * Validate CURP API Route
 *
 * Valida una CURP y retorna información extraída
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCURP } from '@/shared/utils/curp.validator';

// Schema para validación de request
const validateCURPSchema = z.object({
  curp: z.string().min(18).max(18),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar request
    const { curp } = validateCURPSchema.parse(body);

    // Validar CURP
    const result = validateCURP(curp);

    return NextResponse.json({
      success: result.isValid,
      data: result.info,
      error: result.error,
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
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
