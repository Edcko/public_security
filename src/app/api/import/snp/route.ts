/**
 * SNP Import API Route
 *
 * Procesa importaciones de datos desde el Sistema Nacional de Seguridad Pública
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';

/**
 * POST /api/import/snp
 * Importa datos desde un archivo CSV/XML del SNSP
 */
export async function POST(req: NextRequest) {
  return withAuth(async () => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;
      const mappingJson = formData.get('mapping') as string;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No se proporcionó archivo' },
          { status: 400 }
        );
      }

      if (!type || !['personnel', 'vehicles', 'weapons'].includes(type)) {
        return NextResponse.json(
          { success: false, error: 'Tipo de importación inválido' },
          { status: 400 }
        );
      }

      let mapping: any[] = [];
      if (mappingJson) {
        try {
          mapping = JSON.parse(mappingJson);
        } catch (e) {
          return NextResponse.json(
            { success: false, error: 'Mapeo inválido' },
            { status: 400 }
          );
        }
      }

      // Leer contenido del archivo
      const text = await file.text();

      let data: any[] = [];

      if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else if (file.name.endsWith('.xml')) {
        // TODO: Implementar parser XML
        return NextResponse.json(
          { success: false, error: 'Parsing XML aún no implementado' },
          { status: 501 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: 'Formato de archivo no soportado' },
          { status: 400 }
        );
      }

      // Importar datos según el tipo
      const result = await importData(type, data, mapping);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('SNP import error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Error al importar' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * Parsea un archivo CSV
 */
function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Simple CSV parser (asume comas como separador)
  const headers = parseCSVLine(lines[0]);
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, j) => {
        row[header] = values[j];
      });
      result.push(row);
    }
  }

  return result;
}

/**
 * Parsea una línea CSV manejando comillas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Importa datos según el tipo
 */
async function importData(type: string, data: any[], mapping: any[]): Promise<{
  imported: number;
  errors: number;
  message: string;
}> {
  const { db } = await import('@/shared/database/connection');
  const { personnel, vehicles, weapons, corporations } = await import('@/shared/database/schema');

  let imported = 0;
  let errors = 0;

  for (const row of data) {
    try {
      if (type === 'personnel') {
        await importPersonnel(row, mapping, db, personnel, corporations);
      } else if (type === 'vehicles') {
        await importVehicle(row, mapping, db, vehicles, corporations);
      } else if (type === 'weapons') {
        await importWeapon(row, mapping, db, weapons, corporations);
      }
      imported++;
    } catch (error: any) {
      console.error('Error importing row:', row, error);
      errors++;
    }
  }

  return {
    imported,
    errors,
    message: `Importación completada: ${imported} registros exitosos, ${errors} errores`,
  };
}

/**
 * Importa un registro de personal
 */
async function importPersonnel(
  row: any,
  mapping: any[],
  db: any,
  personnel: any,
  corporations: any
) {
  const data = mapFields(row, mapping);

  // Buscar o crear corporación
  let corporationId = data.corporationId;

  if (!corporationId && data.corporation) {
    const [corp] = await db
      .select()
      .from(corporations)
      .where((corps: any) => corps.name === data.corporacion)
      .limit(1);

    if (corp) {
      corporationId = corp.id;
    } else {
      // Crear corporación
      const [newCorp] = await db
        .insert(corporations)
        .values({
          name: data.corporacion,
          type: 'estatal',
          jurisdiction: 'Desconocido',
        })
        .returning();
      corporationId = newCorp.id;
    }
  }

  // Insertar personal
  await db.insert(personnel).values({
    badgeNumber: data.badgeNumber || data.numero_placa,
    curp: data.curp,
    firstName: data.firstName || data.nombre || '',
    lastName: `${data.apellido_paterno || ''} ${data.apellido_materno || ''}`.trim(),
    rank: data.rank || data.rango || 'oficial',
    status: 'active',
    corporationId,
    createdAt: data.fecha_ingreso ? new Date(data.fecha_ingreso) : undefined,
  });
}

/**
 * Importa un registro de vehículo
 */
async function importVehicle(
  row: any,
  mapping: any[],
  db: any,
  vehicles: any,
  corporations: any
) {
  const data = mapFields(row, mapping);

  // Buscar o crear corporación
  let corporationId = data.corporationId;

  if (!corporationId && data.corporacion) {
    const [corp] = await db
      .select()
      .from(corporations)
      .where((corps: any) => corps.name === data.corporacion)
      .limit(1);

    corporationId = corp?.id;
  }

  await db.insert(vehicles).values({
    plateNumber: data.plateNumber || data.numero_placa,
    vehicleType: data.vehicleType || data.tipo_vehiculo || 'patrol',
    make: data.make || data.marca,
    model: data.model || data.modelo,
    year: data.year || data.anio ? parseInt(data.year || data.anio) : undefined,
    corporationId,
    status: 'active',
  });
}

/**
 * Importa un registro de arma
 */
async function importWeapon(
  row: any,
  mapping: any[],
  db: any,
  weapons: any,
  corporations: any
) {
  const data = mapFields(row, mapping);

  // Buscar o crear corporación
  let corporationId = data.corporationId;

  if (!corporationId && data.corporacion) {
    const [corp] = await db
      .select()
      .from(corporations)
      .where((corps: any) => corps.name === data.corporacion)
      .limit(1);

    corporationId = corp?.id;
  }

  await db.insert(weapons).values({
    serialNumber: data.serialNumber || data.numero_serie,
    weaponType: data.weaponType || data.tipo_arma || 'pistol',
    make: data.make || data.marca,
    model: data.model || data.modelo,
    caliber: data.caliber || data.calibre,
    corporationId,
    status: 'available',
  });
}

/**
 * Mapea campos según el mapeo definido
 */
function mapFields(row: any, mapping: any[]): any {
  const result: any = {};

  for (const map of mapping) {
    if (map.snsField && map.localField) {
      result[map.localField] = row[map.snsField];
    }
  }

  return result;
}
