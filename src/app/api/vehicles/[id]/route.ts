/**
 * Vehicle by ID API Routes
 */

import {
  GET,
  PATCH,
  DELETE,
} from '@/modules/vehicles/controllers/vehicles.id.controller';

// Obtener vehículo por ID
export { GET };

// Actualizar vehículo
export { PATCH };

// Eliminar vehículo
export { DELETE };
