#!/usr/bin/env ts-node
/**
 * Migration Runner
 * Ejecuta las migraciones de la base de datos en orden
 *
 * Uso:
 *   npm run migrate           # Ejecutar todas las migraciones pendientes
 *   npm run migrate:status    # Ver estado de migraciones
 */

import postgres from 'postgres';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Set it in .env or export it before running migrations');
  process.exit(1);
}
const MIGRATIONS_DIR = join(__dirname, '../migrations');

interface Migration {
  filename: string;
  version: string;
  path: string;
}

/**
 * Lee las migraciones del directorio y las ordena
 */
function getMigrations(): Migration[] {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log('❌ Directorio de migraciones no encontrado:', MIGRATIONS_DIR);
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((filename) => ({
    filename,
    version: filename.split('_')[0],
    path: join(MIGRATIONS_DIR, filename),
  }));
}

/**
 * Crea la tabla de tracking de migraciones si no existe
 */
async function createMigrationsTable(sql: ReturnType<typeof postgres>) {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT NOW(),
      filename VARCHAR(255) NOT NULL
    )
  `;
}

/**
 * Obtiene las migraciones ya ejecutadas
 */
async function getExecutedMigrations(sql: ReturnType<typeof postgres>): Promise<Set<string>> {
  const result = await sql`SELECT version FROM schema_migrations`;
  return new Set(result.map((r: any) => r.version));
}

/**
 * Ejecuta una migración
 */
async function runMigration(sql: ReturnType<typeof postgres>, migration: Migration) {
  console.log(`\n📄 Ejecutando: ${migration.filename}`);

  const sqlContent = readFileSync(migration.path, 'utf-8');

  try {
    // Ejecutar cada statement por separado
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }

    // Registrar la migración como ejecutada
    await sql`
      INSERT INTO schema_migrations (version, filename)
      VALUES (${migration.version}, ${migration.filename})
    `;

    console.log(`✅ ${migration.filename} - COMPLETADO`);
    return true;
  } catch (error: any) {
    console.error(`❌ ${migration.filename} - ERROR`);
    console.error('   ', error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Migration Runner - Sistema Nacional de Seguridad Pública');
  console.log('📦 Database:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  const sql = postgres(DATABASE_URL);

  try {
    // Crear tabla de tracking
    await createMigrationsTable(sql);
    console.log('✅ Tabla de migraciones verificada');

    // Obtener migraciones ejecutadas
    const executed = await getExecutedMigrations(sql);
    console.log(`📊 Migraciones ya ejecutadas: ${executed.size}`);

    // Obtener todas las migraciones
    const allMigrations = getMigrations();
    const pendingMigrations = allMigrations.filter((m) => !executed.has(m.version));

    if (pendingMigrations.length === 0) {
      console.log('\n✨ Todo está actualizado! No hay migraciones pendientes.');
      return;
    }

    console.log(`\n📋 Migraciones pendientes: ${pendingMigrations.length}`);

    // Ejecutar migraciones pendientes
    let successCount = 0;
    let failCount = 0;

    for (const migration of pendingMigrations) {
      const success = await runMigration(sql, migration);
      if (success) {
        successCount++;
      } else {
        failCount++;
        console.error('\n❌ Error al ejecutar migración. Deteniendo...');
        break;
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Ejecutadas correctamente: ${successCount}`);
    if (failCount > 0) {
      console.log(`❌ Fallidas: ${failCount}`);
      process.exit(1);
    } else {
      console.log('\n✨ Todas las migraciones se ejecutaron correctamente!');
    }
  } catch (error: any) {
    console.error('\n❌ Error fatal:', error.message);
    console.error('\n💡 Asegúrate de que Docker esté corriendo:');
    console.error('   docker-compose up -d');
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Ejecutar
main().catch((error) => {
  console.error('Error no manejado:', error);
  process.exit(1);
});
