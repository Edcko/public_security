/**
 * CURP Integration API Routes
 */

import {
  POST,
  GET,
} from '@/modules/integrations/curp/curp.controller';

// Validar CURP (completo con API externa y DB)
export { POST };

// Obtener lista de estados de México
export { GET };
