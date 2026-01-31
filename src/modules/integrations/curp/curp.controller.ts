/**
 * CURP Integration Controller
 *
 * Endpoints para validación de CURP usando APIs mexicanas
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import {
  fullCURPValidation,
} from './curp.service';

/**
 * POST /api/integrations/curp/validate
 * Valida completamente un CURP (sintaxis, checksum, API externa, DB local)
 */
export async function POST(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { curp } = body;

      if (!curp) {
        return NextResponse.json(
          { success: false, error: 'CURP is required' },
          { status: 400 }
        );
      }

      // Validación completa
      const result = await fullCURPValidation(curp);

      return NextResponse.json({
        success: result.apiValid,
        data: {
          curp: curp.toUpperCase(),
          syntaxValid: result.syntaxValid,
          checksumValid: result.checksumValid,
          existsInDB: result.existsInDB,
          apiData: result.data,
          error: result.error,
        },
      });
    } catch (error: any) {
      console.error('CURP validation error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/integrations/curp/states
 * Retorna la lista de estados de México con sus códigos
 */
export async function GET(_req: NextRequest) {
  const states = [
    { code: 'AS', name: 'Aguascalientes' },
    { code: 'BC', name: 'Baja California' },
    { code: 'BS', name: 'Baja California Sur' },
    { code: 'CC', name: 'Campeche' },
    { code: 'CL', name: 'Coahuila' },
    { code: 'CM', name: 'Colima' },
    { code: 'CS', name: 'Chiapas' },
    { code: 'CH', name: 'Chihuahua' },
    { code: 'DF', name: 'Ciudad de México' },
    { code: 'DG', name: 'Durango' },
    { code: 'GT', name: 'Guanajuato' },
    { code: 'GR', name: 'Guerrero' },
    { code: 'HG', name: 'Jalisco' },
    { code: 'MC', name: 'México' },
    { code: 'MN', name: 'Michoacán' },
    { code: 'MS', name: 'Morelos' },
    { code: 'NT', name: 'Nayarit' },
    { code: 'NL', name: 'Nuevo León' },
    { code: 'OC', name: 'Oaxaca' },
    { code: 'PL', name: 'Puebla' },
    { code: 'QT', name: 'Querétaro' },
    { code: 'QR', name: 'Quintana Roo' },
    { code: 'SP', name: 'San Luis Potosí' },
    { code: 'SL', name: 'Sinaloa' },
    { code: 'TJ', name: 'Tlaxcala' }, // Nota: Puede variar
    { code: 'TM', name: 'Tamaulipas' },
    { code: 'TL', name: 'Tlaxcala' },
    { code: 'VZ', name: 'Veracruz' },
    { code: 'YN', name: 'Yucatán' },
    { code: 'ZS', name: 'Zacatecas' },
  ];

  return NextResponse.json({
    success: true,
    data: states,
  });
}
