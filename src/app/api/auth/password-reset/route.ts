/**
 * Password Reset Routes
 */

import {
  POST,
  PUT,
  PATCH,
} from '@/modules/authentication/controllers/password-reset.controller';

// Solicitar reset de contraseña
export { POST };

// Confirmar reset con nueva contraseña
export { PUT as PUT_RESET };

// Validar token sin usarlo
export { PATCH };
