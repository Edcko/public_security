/**
 * SNSP Data Import Service
 *
 * Importación de datos de incidencia delictiva del SNSP (Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública)
 * Fuente: https://www.gob.mx/sesnsp/acciones-y-programas/datos-abiertos-de-incidencia-delictiva
 */

/**
 * Estadística delictiva
 */
export interface CrimeStatistic {
  id?: string;
  year: number;
  month: number;
  stateCode: string;
  stateName: string;
  crimeType: string;
  crimeSubtype?: string;
  count: number;
  modalities?: { [key: string]: number };
  corporationId: string; // Para multi-tenancy
}

/**
 * Respuesta de importación
 */
export interface ImportResponse {
  success: boolean;
  imported: number;
  errors: string[];
  error?: string;
}

/**
 * Mapeo de códigos de estados a nombres
 */
const STATE_CODES: { [key: string]: string } = {
  'AS': 'Aguascalientes',
  'BC': 'Baja California',
  'BS': 'Baja California Sur',
  'CC': 'Campeche',
  'CL': 'Coahuila',
  'CM': 'Colima',
  'CS': 'Chiapas',
  'CH': 'Chihuahua',
  'DF': 'Ciudad de México',
  'DG': 'Durango',
  'GT': 'Guanajuato',
  'GR': 'Guerrero',
  'HG': 'Jalisco',
  'MC': 'México',
  'MN': 'Michoacán',
  'MS': 'Morelos',
  'NT': 'Nayarit',
  'NL': 'Nuevo León',
  'OC': 'Oaxaca',
  'PL': 'Puebla',
  'QT': 'Querétaro',
  'QR': 'Quintana Roo',
  'SP': 'San Luis Potosí',
  'SL': 'Sinaloa',
  'TJ': 'Tlaxcala',
  'TM': 'Tamaulipas',
  'TL': 'Tlaxcala',
  'VZ': 'Veracruz',
  'YN': 'Yucatán',
  'ZS': 'Zacatecas',
};

/**
 * Tipos de delitos principales del SNSP
 */
const CRIME_TYPES = [
  'Homicidio doloso',
  'Homicidio culposo',
  'Lesiones dolosas',
  'Lesiones culposas',
  'Feminicidio',
  'Robo a transeúnte en vía pública',
  'Robo a transeúnte en espacio abierto al público',
  'Robo a negocio',
  'Robo de vehículo',
  'Robo de autopartes',
  'Robo de maquinaria',
  'Secuestro',
  'Extorsión',
  'Fraude',
  'Violación',
  'Abuso sexual',
  'Narcomenudeo',
];

/**
 * Descarga el CSV más reciente de datos del SNSP
 *
 * NOTA: En producción, esto descargaría el archivo CSV desde la URL oficial del SNSP
 * Por ahora, es una simulación para desarrollo
 */
export async function downloadLatestSNSPData(): Promise<Buffer> {
  const SNSP_URL = process.env.SNSP_DATA_URL || 'https://www.gob.mx/sesnsp';

  try {
    // En desarrollo, retornamos datos simulados
    if (process.env.NODE_ENV === 'development') {
      console.log('Modo desarrollo: usando datos simulados del SNSP');
      return generateMockSNSPData();
    }

    // En producción, descargar el CSV real
    const response = await fetch(SNSP_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al descargar datos del SNSP: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error('Error descargando datos del SNSP:', error);
    throw error;
  }
}

/**
 * Genera datos simulados del SNSP para desarrollo
 */
function generateMockSNSPData(): Buffer {
  const headers = [
    'Año',
    'Mes',
    'Código Entidad',
    'Entidad Federativa',
    'Tipo de delito',
    'Subtipo de delito',
    'Modalidad',
    'Total',
  ];

  const rows: string[][] = [headers];

  // Generar datos simulados para los últimos 3 meses
  const currentDate = new Date();
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Generar datos para cada estado
    Object.entries(STATE_CODES).forEach(([code, name]) => {
      // Generar datos para cada tipo de delito
      CRIME_TYPES.forEach((crimeType) => {
        const count = Math.floor(Math.random() * 50); // 0-50 delitos aleatorios

        if (count > 0) {
          rows.push([
            year.toString(),
            month.toString().padStart(2, '0'),
            code,
            name,
            crimeType,
            '', // Subtipo vacío por defecto
            '', // Modalidad vacía por defecto
            count.toString(),
          ]);
        }
      });
    });
  }

  // Convertir a CSV
  const csvContent = rows.map((row) => row.join(',')).join('\n');
  return Buffer.from(csvContent, 'utf-8');
}

/**
 * Parsea un CSV del SNSP y extrae las estadísticas delictivas
 */
export function parseSNSPCSV(csvContent: Buffer): CrimeStatistic[] {
  const lines = csvContent.toString('utf-8').split('\n');
  const statistics: CrimeStatistic[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (manejar comas dentro de comillas)
    const values = parseCSVLine(line);

    if (values.length < 8) continue;

    const [
      yearStr,
      monthStr,
      stateCode,
      stateName,
      crimeType,
      crimeSubtype,
      _modality,
      countStr,
    ] = values;

    const statistic: CrimeStatistic = {
      year: parseInt(yearStr),
      month: parseInt(monthStr),
      stateCode: stateCode.trim(),
      stateName: stateName.trim(),
      crimeType: crimeType.trim(),
      crimeSubtype: crimeSubtype?.trim() || undefined,
      count: parseInt(countStr) || 0,
      corporationId: 'default', // Se asignará durante la importación
    };

    if (statistic.count > 0) {
      statistics.push(statistic);
    }
  }

  return statistics;
}

/**
 * Parsea una línea de CSV manejando comillas
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());

  return values;
}

/**
 * Importa estadísticas delictivas a la base de datos
 *
 * NOTA: Requiere tabla crime_statistics en la base de datos
 * CREATE TABLE crime_statistics (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   year INTEGER NOT NULL,
 *   month INTEGER NOT NULL,
 *   state_code VARCHAR(2) NOT NULL,
 *   state_name VARCHAR(100) NOT NULL,
 *   crime_type VARCHAR(255) NOT NULL,
 *   crime_subtype VARCHAR(255),
 *   count INTEGER NOT NULL,
 *   modalities JSONB,
 *   corporation_id UUID NOT NULL REFERENCES corporations(id),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 */
export async function importCrimeStatistics(
  statistics: CrimeStatistic[],
  corporationId: string
): Promise<ImportResponse> {
  try {
    let imported = 0;
    const errors: string[] = [];

    // En desarrollo, solo simulamos la importación
    if (process.env.NODE_ENV === 'development') {
      console.log(`Modo desarrollo: simulando importación de ${statistics.length} registros`);

      // Agrupar por estado y tipo de delito
      const summary: { [key: string]: number } = {};
      statistics.forEach((stat) => {
        const key = `${stat.stateName} - ${stat.crimeType}`;
        summary[key] = (summary[key] || 0) + stat.count;
        imported++;
      });

      console.log('Resumen de importación:');
      Object.entries(summary)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([key, count]) => {
          console.log(`  ${key}: ${count}`);
        });

      return {
        success: true,
        imported,
        errors,
      };
    }

    // En producción, insertar en la base de datos
    // Esto requiere configuración de base de datos
    // const { db } = await import('@/shared/database/connection');

    for (const stat of statistics) {
      try {
        // Asignar corporation_id
        stat.corporationId = corporationId;

        // Insertar en base de datos
        // await db.insert(crimeStatistics).values(stat);

        imported++;
      } catch (error: any) {
        errors.push(`Error importando ${stat.stateName} - ${stat.crimeType}: ${error.message}`);
      }
    }

    return {
      success: true,
      imported,
      errors,
    };
  } catch (error: any) {
    console.error('Error importando estadísticas delictivas:', error);
    return {
      success: false,
      imported: 0,
      errors: [error.message],
      error: error.message,
    };
  }
}

/**
 * Job programado para importación mensual de datos del SNSP
 *
 * Este job debería ejecutarse el primer día de cada mes
 * para importar los datos del mes anterior
 */
export async function scheduledSNSPImport(corporationId: string): Promise<ImportResponse> {
  console.log('Iniciando importación programada del SNSP...');

  try {
    // 1. Descargar datos más recientes
    const csvData = await downloadLatestSNSPData();

    // 2. Parsear CSV
    const statistics = parseSNSPCSV(csvData);

    console.log(`Parseados ${statistics.length} registros del CSV`);

    // 3. Importar a base de datos
    const result = await importCrimeStatistics(statistics, corporationId);

    if (result.success) {
      console.log(`Importación exitosa: ${result.imported} registros importados`);
    } else {
      console.error('Error en importación:', result.error);
    }

    return result;
  } catch (error: any) {
    console.error('Error en importación programada del SNSP:', error);
    return {
      success: false,
      imported: 0,
      errors: [error.message],
      error: error.message,
    };
  }
}

/**
 * Consulta estadísticas delictivas por filtros
 */
export async function getCrimeStatistics(filters: {
  year?: number;
  month?: number;
  stateCode?: string;
  crimeType?: string;
  corporationId: string;
}): Promise<CrimeStatistic[]> {
  try {
    // En desarrollo, retornar datos simulados
    if (process.env.NODE_ENV === 'development') {
      const mockData = generateMockCrimeStatistics(filters);
      return mockData;
    }

    // En producción, consultar la base de datos
    // const { db } = await import('@/shared/database/connection');
    // let query = db.select().from(crimeStatistics);

    // if (filters.year) {
    //   query = query.where(eq(crimeStatistics.year, filters.year));
    // }
    // ... más filtros

    return [];
  } catch (error: any) {
    console.error('Error consultando estadísticas delictivas:', error);
    throw error;
  }
}

/**
 * Genera estadísticas delictivas simuladas para desarrollo
 */
function generateMockCrimeStatistics(filters: {
  year?: number;
  month?: number;
  stateCode?: string;
  crimeType?: string;
  corporationId: string;
}): CrimeStatistic[] {
  const statistics: CrimeStatistic[] = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const year = filters.year || currentYear;
  const month = filters.month || currentMonth;

  Object.entries(STATE_CODES).forEach(([code, name]) => {
    if (filters.stateCode && filters.stateCode !== code) return;

    CRIME_TYPES.forEach((crimeType) => {
      if (filters.crimeType && !crimeType.includes(filters.crimeType)) return;

      const count = Math.floor(Math.random() * 50);

      if (count > 0) {
        statistics.push({
          year,
          month,
          stateCode: code,
          stateName: name,
          crimeType,
          count,
          corporationId: filters.corporationId,
        });
      }
    });
  });

  return statistics;
}

/**
 * Calcula tendencias delictivas (comparación con período anterior)
 */
export async function getCrimeTrends(filters: {
  stateCode?: string;
  crimeType?: string;
  months: number; // Número de meses a comparar
  corporationId: string;
}): Promise<{
  current: CrimeStatistic[];
  previous: CrimeStatistic[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}> {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Calcular fecha del período anterior
    const previousDate = new Date(currentYear, currentMonth - filters.months, 1);
    const previousMonth = previousDate.getMonth() + 1;
    const previousYear = previousDate.getFullYear();

    // Obtener datos de ambos períodos
    const current = await getCrimeStatistics({
      year: currentYear,
      month: currentMonth,
      stateCode: filters.stateCode,
      crimeType: filters.crimeType,
      corporationId: filters.corporationId,
    });

    const previous = await getCrimeStatistics({
      year: previousYear,
      month: previousMonth,
      stateCode: filters.stateCode,
      crimeType: filters.crimeType,
      corporationId: filters.corporationId,
    });

    // Calcular totales
    const currentTotal = current.reduce((sum, stat) => sum + stat.count, 0);
    const previousTotal = previous.reduce((sum, stat) => sum + stat.count, 0);

    // Calcular tendencia
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let changePercentage = 0;

    if (previousTotal > 0) {
      changePercentage = ((currentTotal - previousTotal) / previousTotal) * 100;

      if (changePercentage > 5) {
        trend = 'increasing';
      } else if (changePercentage < -5) {
        trend = 'decreasing';
      }
    }

    return {
      current,
      previous,
      trend,
      changePercentage,
    };
  } catch (error: any) {
    console.error('Error calculando tendencias delictivas:', error);
    throw error;
  }
}
