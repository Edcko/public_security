/**
 * Corporations API Routes
 */

import {
  GET,
  POST,
} from '@/modules/corporations/controllers/corporations.controller';

// Listar corporaciones (con filtros por RLS)
export { GET };

// Crear nueva corporación (solo national_admin)
export { POST };
