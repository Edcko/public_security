/**
 * Personnel API Routes
 */

import {
  GET,
  POST,
} from '@/modules/personnel/controllers/personnel.controller';

// Listar todo el personal (con filtros por RLS)
export { GET };

// Crear nuevo oficial
export { POST };
