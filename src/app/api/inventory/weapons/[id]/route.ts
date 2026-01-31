/**
 * Weapon by ID API Routes
 */

import {
  GET,
  PATCH,
  DELETE,
} from '@/modules/inventory/controllers/weapons.id.controller';

// Obtener arma por ID
export { GET };

// Actualizar arma
export { PATCH };

// Eliminar arma
export { DELETE };
