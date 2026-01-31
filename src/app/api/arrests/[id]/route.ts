/**
 * Arrest by ID API Routes
 */

import {
  GET,
  PATCH,
  DELETE,
} from '@/modules/incidents/controllers/arrests.id.controller';

// Obtener arresto por ID
export { GET };

// Actualizar arresto
export { PATCH };

// Eliminar arresto
export { DELETE };
