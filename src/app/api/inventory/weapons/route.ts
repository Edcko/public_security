/**
 * Weapons/Inventory API Routes
 */

import {
  GET,
  POST,
} from '@/modules/inventory/controllers/weapons.controller';

// Listar todas las armas (con filtros por RLS)
export { GET };

// Crear nueva arma
export { POST };
