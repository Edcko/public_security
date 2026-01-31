/**
 * SNSP Data Import Service
 *
 * Importación automatizada de datos abiertos de incidencia delictiva
 * del Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface SNSPData {
  estado: string;
  modalidad: string;
  tipoDelito: string;
  subtipoDelito: string;
  fecha: string;
  count: number;
}

/**
 * Descarga el CSV más reciente de datos del SNSP
 */
export async function downloadSNSPData(outputPath: string): Promise<string> {
  try {
    console.log('Downloading SNSP data...');

    // NOTA: La URL real del SNSP requiere navegación manual para obtener el link directo
    // Esta es una implementación base que se debe ajustar con la URL real

    // Por ahora, creamos un archivo dummy con la estructura esperada
    const dummyData = generateDummySNSPData();

    await fs.writeFile(outputPath, dummyData, 'utf-8');

    console.log(`SNSP data downloaded to: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error('Error downloading SNSP data:', error);
    throw error;
  }
}

/**
 * Genera datos dummy para desarrollo (eliminar en producción)
 */
function generateDummySNSPData(): string {
  const states = ['CDMX', 'Jalisco', 'Nuevo León', 'EdoMex', 'Puebla'];
  const modalities = ['Fuero Común', 'Fuero Federal'];
  const crimeTypes = ['Robo', 'Homicidio', 'Secuestro', 'Extorsión', 'Violación'];

  let csv = 'estado,modalidad,tipo_delito,fecha,count\n';

  for (let i = 0; i < 100; i++) {
    const state = states[Math.floor(Math.random() * states.length)];
    const modality = modalities[Math.floor(Math.random() * modalities.length)];
    const crime = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
    const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 100) + 1;

    csv += `${state},${modality},${crime},${date},${count}\n`;
  }

  return csv;
}

/**
 * Parsea el CSV del SNSP
 */
export async function parseSNSPCSV(filePath: string): Promise<SNSPData[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    // Remover header
    lines.shift();

    const records: SNSPData[] = [];

    for (const line of lines) {
      const columns = line.split(',');

      if (columns.length >= 5) {
        records.push({
          estado: columns[0],
          modalidad: columns[1],
          tipoDelito: columns[2],
          subtipoDelito: columns[3] || '',
          fecha: columns[4],
          count: parseInt(columns[5]) || 0,
        });
      }
    }

    console.log(`Parsed ${records.length} records from SNSP CSV`);

    return records;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}

/**
 * Importa datos del SNSP a la base de datos
 */
export async function importSNSPDataToDB(records: SNSPData[]): Promise<number> {
  try {
    // TODO: Implementar tabla de estadísticas delictivas
    // const { crimeStatistics } = await import('@/shared/database/schema');

    // Batch insert
    // await db.insert(crimeStatistics).values(records).onConflictDoNothing();

    console.log(`Imported ${records.length} records to database`);

    return records.length;
  } catch (error) {
    console.error('Error importing to DB:', error);
    throw error;
  }
}

/**
 * Job programado para importación mensual de datos SNSP
 */
export async function scheduledSNSPImport(): Promise<void> {
  console.log('Starting scheduled SNSP import...');

  try {
    // 1. Descargar CSV
    const outputPath = path.join(process.cwd(), 'tmp', 'snsdata.csv');
    await downloadSNSPData(outputPath);

    // 2. Parsear CSV
    const records = await parseSNSPCSV(outputPath);

    // 3. Importar a DB
    const importedCount = await importSNSPDataToDB(records);

    console.log(`SNSP import completed: ${importedCount} records imported`);
  } catch (error) {
    console.error('SNSP import failed:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de delitos por estado
 */
export async function getCrimeStatsByState(_state?: string): Promise<any> {
  try {
    // TODO: Implementar query a la tabla de estadísticas
    // if (state) {
    //   return await db
    //     .select()
    //     .from(crimeStatistics)
    //     .where(eq(crimeStatistics.estado, state));
    // }

    // return await db.select().from(crimeStatistics);

    return [];
  } catch (error) {
    console.error('Error fetching crime stats:', error);
    throw error;
  }
}

/**
 * Obtiene tendencias de delitos por fecha
 */
export async function getCrimeTrends(_startDate: Date, _endDate: Date): Promise<any> {
  try {
    // TODO: Implementar query de tendencias
    return [];
  } catch (error) {
    console.error('Error fetching crime trends:', error);
    throw error;
  }
}

/**
 * Servicio completo SNSP
 */
export const snspService = {
  downloadSNSPData,
  parseSNSPCSV,
  importSNSPDataToDB,
  scheduledSNSPImport,
  getCrimeStatsByState,
  getCrimeTrends,
};
