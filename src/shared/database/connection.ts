/**
 * Database Connection with Row-Level Security (RLS) Support
 *
 * This module handles the PostgreSQL connection and provides utilities
 * for setting the corporation context in multi-tenant scenarios.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/public_security';

// Cliente PostgreSQL con connection pooling
export const client = postgres(connectionString, {
  max: 10, // Máximo de conexiones en el pool
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);

/**
 * Setea el contexto de RLS para una request específica.
 * Esto permite que PostgreSQL filtre automáticamente las filas
 * según la corporación del usuario autenticado.
 *
 * @param corporationId - UUID de la corporación
 */
export async function setCorporationContext(corporationId: string) {
  await client`SELECT set_config('app.current_corporation_id', ${corporationId}, true)`;
}

/**
 * Limpia el contexto de RLS después de una request.
 * Importante para evitar contaminación entre requests.
 */
export async function clearCorporationContext() {
  await client`SELECT set_config('app.current_corporation_id', NULL, true)`;
}

/**
 * Ejecuta una función dentro de un contexto de corporación específico.
 * Automáticamente setea y limpia el contexto de RLS.
 *
 * @param corporationId - UUID de la corporación
 * @param callback - Función a ejecutar dentro del contexto
 */
export async function withCorporationContext<T>(
  corporationId: string,
  callback: () => Promise<T>
): Promise<T> {
  await setCorporationContext(corporationId);
  try {
    return await callback();
  } finally {
    await clearCorporationContext();
  }
}
